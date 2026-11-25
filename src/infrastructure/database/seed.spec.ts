import {
  seed,
  SEED_USERS,
  SEED_RESOURCES,
  SeedUser,
  SeedResource,
  SeedResourceSchedule,
} from '../../../prisma/seed-data';

describe('Seed Data & Logic', () => {
  it('should define 1 admin and 2 customer seed users', () => {
    expect(SEED_USERS.length).toBe(3);
    const admin = SEED_USERS.find((u: SeedUser) => u.role === 'admin');
    const customers = SEED_USERS.filter((u: SeedUser) => u.role === 'customer');

    expect(admin).toBeDefined();
    expect(admin?.email).toBe('admin@reserva.com');
    expect(customers.length).toBe(2);
    expect(customers.map((c: SeedUser) => c.email)).toContain('customer1@reserva.com');
    expect(customers.map((c: SeedUser) => c.email)).toContain('customer2@reserva.com');
  });

  it('should define resources including active, archived, and midnight-crossing schedule', () => {
    expect(SEED_RESOURCES.length).toBe(6);

    const nightLounge = SEED_RESOURCES.find((r: SeedResource) => r.name === 'Kyiv Night Lounge');
    expect(nightLounge).toBeDefined();
    expect(
      nightLounge?.schedules.some(
        (s: SeedResourceSchedule) => s.opensAt === '20:00' && s.closesAt === '04:00',
      ),
    ).toBe(true);

    const archived = SEED_RESOURCES.find((r: SeedResource) => r.archivedAt !== null);
    expect(archived).toBeDefined();
    expect(archived?.name).toBe('Archived Workshop Room');
  });

  it('should execute seed against mock prisma client idempotently', async () => {
    const mockPrisma = {
      user: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      resource: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      resourceSchedule: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 5 }),
      },
      resourceBlackout: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    await seed(mockPrisma as unknown as Parameters<typeof seed>[0]);

    expect(mockPrisma.user.upsert).toHaveBeenCalledTimes(3);
    expect(mockPrisma.resource.upsert).toHaveBeenCalledTimes(6);
    expect(mockPrisma.resourceSchedule.deleteMany).toHaveBeenCalledTimes(6);
    expect(mockPrisma.resourceSchedule.createMany).toHaveBeenCalledTimes(5);
  });
});
