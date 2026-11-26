import { CreateHoldUseCase } from './create-hold.use-case';
import { BookingRepository } from './booking.repository';
import { GetResourceUseCase } from '../../resources/application/get-resource.use-case';
import { Clock } from '../../../common/time/clock';
import { HoldLimitReachedError, SlotUnavailableError } from '../domain/booking-errors';
import { Booking } from '../domain/booking';

class FakeClock implements Clock {
  constructor(private currentTime: Date) {}
  now(): Date {
    return this.currentTime;
  }
}

class FakeBookingRepository implements BookingRepository {
  public activeHoldsCount = 0;
  public createdHold: Booking | null = null;

  async countActiveHolds(): Promise<number> {
    return this.activeHoldsCount;
  }

  async createHold(booking: Booking): Promise<void> {
    this.createdHold = booking;
  }

  async findById(): Promise<Booking | null> {
    return null;
  }

  async findList(): Promise<{ data: Booking[]; nextCursor: string | null }> {
    return { data: [], nextCursor: null };
  }

  async cancel(): Promise<Booking | null> {
    return null;
  }
}

class FakeGetResourceUseCase {
  async execute() {
    return {
      id: 'resource-1',
      name: 'Conference Room',
      description: 'Room',
      type: 'room',
      capacity: 10,
      city: 'Kyiv',
      timezone: 'Europe/Kyiv',
      pricePerHour: 1000,
      schedules: [
        { weekday: 2, opensAt: '09:00', closesAt: '18:00' }, // Tuesday
      ],
      blackouts: [],
    };
  }
}

describe('CreateHoldUseCase', () => {
  const baseTime = new Date('2026-12-01T08:00:00Z'); // Monday 2026-12-01
  const clock = new FakeClock(baseTime);
  let bookingRepo: FakeBookingRepository;
  let getResourceUseCase: FakeGetResourceUseCase;
  let useCase: CreateHoldUseCase;

  beforeEach(() => {
    bookingRepo = new FakeBookingRepository();
    getResourceUseCase = new FakeGetResourceUseCase();
    useCase = new CreateHoldUseCase(
      bookingRepo as unknown as BookingRepository,
      getResourceUseCase as unknown as GetResourceUseCase,
      clock,
    );
  });

  it('should successfully create a hold when slot is valid', async () => {
    const command = {
      userId: 'user-1',
      resourceId: 'resource-1',
      startsAt: new Date('2026-12-01T10:00:00Z'),
      endsAt: new Date('2026-12-01T12:00:00Z'),
    };

    const booking = await useCase.execute(command);

    expect(booking).toBeDefined();
    expect(booking.status).toBe('held');
    expect(booking.amount.amountMinor).toBe(2000);
    expect(bookingRepo.createdHold).toBe(booking);
  });

  it('should throw HoldLimitReachedError when user has >= 5 active holds', async () => {
    bookingRepo.activeHoldsCount = 5;

    const command = {
      userId: 'user-1',
      resourceId: 'resource-1',
      startsAt: new Date('2026-12-01T10:00:00Z'),
      endsAt: new Date('2026-12-01T12:00:00Z'),
    };

    await expect(useCase.execute(command)).rejects.toThrow(HoldLimitReachedError);
  });

  it('should throw SlotUnavailableError when slot is outside opening hours', async () => {
    const command = {
      userId: 'user-1',
      resourceId: 'resource-1',
      startsAt: new Date('2026-12-01T20:00:00Z'), // after 18:00
      endsAt: new Date('2026-12-01T22:00:00Z'),
    };

    await expect(useCase.execute(command)).rejects.toThrow(SlotUnavailableError);
  });
});
