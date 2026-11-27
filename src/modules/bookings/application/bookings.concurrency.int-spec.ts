import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { CreateHoldUseCase } from './create-hold.use-case';
import { PrismaBookingRepository } from '../infrastructure/prisma-booking.repository';
import { PrismaResourceRepository } from '../../resources/infrastructure/prisma-resource.repository';
import { GetResourceUseCase } from '../../resources/application/get-resource.use-case';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { SystemClock } from '../../../common/time/system-clock';
import { HoldLimitReachedError, SlotUnavailableError } from '../domain/booking-errors';

/**
 * Concurrency integration test for bookings.
 * Requires a REAL separate test database (with applied migrations): DATABASE_URL_TEST.
 *
 * - Locally without DATABASE_URL_TEST -> tests are explicitly skipped (visible in jest report).
 * - In CI without DATABASE_URL_TEST -> fails immediately to prevent false-positive "green" builds.
 */

const RAW_DB_URL = process.env.DATABASE_URL_TEST;

if (!RAW_DB_URL && process.env.CI) {
  throw new Error('DATABASE_URL_TEST is required for integration tests in CI');
}

const describeDb = RAW_DB_URL ? describe : describe.skip;

/** Number of parallel clients to simulate; connection pool must be at least this size. */
const PARALLEL_CLIENTS = 50;
/** Days ahead to book (to avoid "not in the past" validation). */
const DAYS_AHEAD = 7;
/** Number of race repetitions to increase the chance of catching bugs. */
const ROUNDS = 10;

type Outcome = 'success' | 'unavailable' | 'limit' | `error: ${string}`;

/** Safeguard: test performs deleteMany, do not run against dev/prod DB. */
function assertTestDb(raw: string): string {
  const dbName = new URL(raw).pathname.replace('/', '');
  if (!/test/i.test(dbName)) {
    throw new Error(`Refusing to run against DB "${dbName}": name must contain "test"`);
  }
  return raw;
}

describeDb('Bookings Concurrency (M3.5)', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaService;
  let createHold: CreateHoldUseCase;

  // Unique IDs per run: tests do not conflict with other files/workers.
  const resourceId = randomUUID();
  const userId = randomUUID();

  beforeAll(async () => {
    const configService = new ConfigService({
      DATABASE_URL: assertTestDb(RAW_DB_URL as string),
      DB_POOL_MAX: PARALLEL_CLIENTS,
    });
    prisma = new PrismaService(configService);
    await prisma.$connect(); // якщо БД недоступна, тест впаде гучно

    createHold = new CreateHoldUseCase(
      new PrismaBookingRepository(prisma),
      new GetResourceUseCase(new PrismaResourceRepository(prisma)),
      new SystemClock(),
    );

    await prisma.user.create({
      data: {
        id: userId,
        name: 'Concurrency Test User',
        email: `${userId}@reserva.test`,
        passwordHash: 'dummy',
        role: 'customer',
      },
    });

    await prisma.resource.create({
      data: {
        id: resourceId,
        name: 'Concurrency Court',
        description: 'Test Court Description',
        type: 'court',
        capacity: 4,
        city: 'Kyiv',
        timezone: 'Europe/Kyiv',
        pricePerHour: 500,
        schedules: {
          create: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
            weekday,
            opensAt: '00:00',
            closesAt: '23:59',
          })),
        },
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    // If schema lacks onDelete: Cascade for schedules, delete them separately here.
    await prisma.booking.deleteMany({ where: { resourceId } });
    await prisma.resource.deleteMany({ where: { id: resourceId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.onModuleDestroy(); // $disconnect + pool.end()
  });

  beforeEach(async () => {
    await prisma.booking.deleteMany({ where: { resourceId } });
  });

  // ---------- helpers ----------

  /** Future date: DAYS_AHEAD + offsetDays from today, in UTC. */
  const futureDate = (offsetDays: number, hours: number, minutes = 0): Date => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + DAYS_AHEAD + offsetDays);
    d.setUTCHours(hours, minutes, 0, 0);
    return d;
  };

  /** Single "client": returns only expected outcomes, any other error is visible in text. */
  const tryHold = async (startsAt: Date, endsAt: Date): Promise<Outcome> => {
    try {
      await createHold.execute({ userId, resourceId, startsAt, endsAt });
      return 'success';
    } catch (e) {
      if (e instanceof SlotUnavailableError) return 'unavailable';
      if (e instanceof HoldLimitReachedError) return 'limit';
      return `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  };

  const errorsOf = (results: Outcome[]) => results.filter((r) => r.startsWith('error'));
  const countOf = (results: Outcome[], kind: Outcome) => results.filter((r) => r === kind).length;

  /** Invariant: no two records in DB overlap in time (touching 10:00-11:00 / 11:00-12:00 is allowed). */
  const expectNoOverlaps = async () => {
    const rows = await prisma.booking.findMany({
      where: { resourceId },
      orderBy: { startsAt: 'asc' },
    });
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1];
      const cur = rows[i];
      if (!prev || !cur) continue;
      expect(cur.startsAt.getTime()).toBeGreaterThanOrEqual(prev.endsAt.getTime());
    }
    return rows;
  };

  // ---------- tests ----------

  it(`1. ${PARALLEL_CLIENTS} parallel holds for one slot -> exactly 1 winner, rest SLOT_UNAVAILABLE, 1 row in DB (x${ROUNDS} rounds)`, async () => {
    for (let round = 0; round < ROUNDS; round++) {
      await prisma.booking.deleteMany({ where: { resourceId } });
      const startsAt = futureDate(round, 10);
      const endsAt = futureDate(round, 11);

      const results = await Promise.all(
        Array.from({ length: PARALLEL_CLIENTS }, () => tryHold(startsAt, endsAt)),
      );

      expect(errorsOf(results)).toEqual([]);
      expect(countOf(results, 'success')).toBe(1);
      expect(countOf(results, 'unavailable')).toBe(PARALLEL_CLIENTS - 1);
      expect(await prisma.booking.count({ where: { resourceId } })).toBe(1);
    }
  });

  it('2a. Pairwise-overlapping intervals (all contain 10:30-10:45) -> exactly 1 winner', async () => {
    for (let round = 0; round < ROUNDS; round++) {
      await prisma.booking.deleteMany({ where: { resourceId } });

      const intervals: [Date, Date][] = [
        [futureDate(round, 10, 0), futureDate(round, 11, 0)],
        [futureDate(round, 10, 30), futureDate(round, 11, 30)],
        [futureDate(round, 10, 15), futureDate(round, 10, 45)],
      ];

      const results = await Promise.all(intervals.map(([s, e]) => tryHold(s, e)));

      expect(errorsOf(results)).toEqual([]);
      expect(countOf(results, 'success')).toBe(1);
      expect(await prisma.booking.count({ where: { resourceId } })).toBe(1);
    }
  });

  it('2b. Mixed intervals (some overlap, some not) -> no overlapping rows, at least one winner', async () => {
    for (let round = 0; round < ROUNDS; round++) {
      await prisma.booking.deleteMany({ where: { resourceId } });

      // D (9:45-10:15) overlaps only with A, so {B, D} or {C, D} are valid (2 winners).
      const intervals: [Date, Date][] = [
        [futureDate(round, 10, 0), futureDate(round, 11, 0)], // A
        [futureDate(round, 10, 30), futureDate(round, 11, 30)], // B
        [futureDate(round, 10, 15), futureDate(round, 10, 45)], // C
        [futureDate(round, 9, 45), futureDate(round, 10, 15)], // D
      ];

      const results = await Promise.all(intervals.map(([s, e]) => tryHold(s, e)));

      expect(errorsOf(results)).toEqual([]);
      expect(countOf(results, 'success')).toBeGreaterThanOrEqual(1);

      const rows = await expectNoOverlaps();
      expect(rows).toHaveLength(countOf(results, 'success'));
    }
  });

  it('3. Adjacent intervals (10-11, 11-12) in parallel -> both succeed', async () => {
    const results = await Promise.all([
      tryHold(futureDate(0, 10), futureDate(0, 11)),
      tryHold(futureDate(0, 11), futureDate(0, 12)),
    ]);

    expect(results).toEqual(['success', 'success']);

    const rows = await expectNoOverlaps();
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.status === 'held')).toBe(true);
  });

  it('4. Different slots in parallel do not block each other', async () => {
    // Max 5: business rule limits active holds per user.
    const hours = [8, 9, 10, 11, 12];
    const results = await Promise.all(
      hours.map((h) => tryHold(futureDate(0, h), futureDate(0, h + 1))),
    );

    expect(errorsOf(results)).toEqual([]);
    expect(countOf(results, 'success')).toBe(hours.length);
    expect(await prisma.booking.count({ where: { resourceId } })).toBe(hours.length);
  });

  it('5. Expired hold frees the slot, parallel attack yields exactly 1 winner', async () => {
    for (let round = 0; round < ROUNDS; round++) {
      await prisma.booking.deleteMany({ where: { resourceId } });
      const startsAt = futureDate(round, 10);
      const endsAt = futureDate(round, 11);

      // Stale hold that still physically blocks slot in DB (lazy expiry will free it).
      const stale = await prisma.booking.create({
        data: {
          id: randomUUID(),
          userId,
          resourceId,
          startsAt,
          endsAt,
          status: 'held',
          holdExpiresAt: new Date(Date.now() - 60_000),
          amountMinor: 500,
          currency: 'UAH',
        },
      });

      const results = await Promise.all(
        Array.from({ length: PARALLEL_CLIENTS }, () => tryHold(startsAt, endsAt)),
      );

      expect(errorsOf(results)).toEqual([]);
      expect(countOf(results, 'success')).toBe(1);
      expect(countOf(results, 'unavailable')).toBe(PARALLEL_CLIENTS - 1);

      const staleAfter = await prisma.booking.findUnique({ where: { id: stale.id } });
      expect(staleAfter?.status).toBe('expired');
      expect(await prisma.booking.count({ where: { resourceId, status: 'held' } })).toBe(1);
    }
  });

  it('6. Per-user hold limit holds under concurrency (10 parallel holds on different slots -> exactly 5 win)', async () => {
    const MAX_ACTIVE_HOLDS = 5; // must match CreateHoldUseCase.maxActiveHolds
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

    for (let round = 0; round < ROUNDS; round++) {
      await prisma.booking.deleteMany({ where: { resourceId } });

      const results = await Promise.all(
        hours.map((h) => tryHold(futureDate(round, h), futureDate(round, h + 1))),
      );

      expect(errorsOf(results)).toEqual([]);
      expect(countOf(results, 'success')).toBe(MAX_ACTIVE_HOLDS);
      expect(countOf(results, 'limit')).toBe(hours.length - MAX_ACTIVE_HOLDS);
      expect(await prisma.booking.count({ where: { resourceId, userId, status: 'held' } })).toBe(
        MAX_ACTIVE_HOLDS,
      );
    }
  });
});
