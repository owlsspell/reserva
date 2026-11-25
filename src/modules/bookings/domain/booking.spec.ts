import { Booking } from './booking';
import { StandardPricingPolicy } from './pricing-policy';
import { Clock } from '../../../common/time/clock';
import { InvalidStateTransitionError, StartInPastError } from './booking-errors';

class FakeClock implements Clock {
  constructor(private currentTime: Date) {}
  now(): Date {
    return this.currentTime;
  }
  set(newTime: Date): void {
    this.currentTime = newTime;
  }
}

describe('Booking Aggregate', () => {
  const baseTime = new Date('2026-12-01T08:00:00Z');
  const clock = new FakeClock(baseTime);
  const pricingPolicy = new StandardPricingPolicy();

  const validHoldInput = {
    id: 'booking-1',
    resourceId: 'resource-1',
    userId: 'user-1',
    startsAt: new Date('2026-12-01T10:00:00Z'),
    endsAt: new Date('2026-12-01T12:00:00Z'), // 2 hours
    pricePerHourMinor: 1000,
    currency: 'UAH',
    holdTtlSeconds: 600,
  };

  it('should create a hold successfully when start is in the future', () => {
    const booking = Booking.createHold(validHoldInput, clock, pricingPolicy);

    expect(booking.id).toBe('booking-1');
    expect(booking.status).toBe('held');
    expect(booking.amount.amountMinor).toBe(2000);
    expect(booking.amount.currency).toBe('UAH');
    expect(booking.holdExpiresAt.toISOString()).toBe('2026-12-01T08:10:00.000Z'); // baseTime + 600s
  });

  it('should throw StartInPastError when startsAt is in the past or present', () => {
    const pastInput = {
      ...validHoldInput,
      startsAt: new Date('2026-12-01T07:59:59Z'),
    };
    expect(() => Booking.createHold(pastInput, clock, pricingPolicy)).toThrow(StartInPastError);
  });

  it('should transition from held to confirmed successfully', () => {
    const booking = Booking.createHold(validHoldInput, clock, pricingPolicy);
    expect(booking.status).toBe('held');

    booking.confirm(clock);
    expect(booking.status).toBe('confirmed');
  });

  it('should throw InvalidStateTransitionError when confirming a non-held booking', () => {
    const booking = Booking.createHold(validHoldInput, clock, pricingPolicy);
    booking.cancel(clock);
    expect(booking.status).toBe('cancelled');

    expect(() => booking.confirm(clock)).toThrow(InvalidStateTransitionError);
  });

  it('should transition from held to cancelled', () => {
    const booking = Booking.createHold(validHoldInput, clock, pricingPolicy);
    booking.cancel(clock);
    expect(booking.status).toBe('cancelled');
  });

  it('should transition from confirmed to cancelled', () => {
    const booking = Booking.createHold(validHoldInput, clock, pricingPolicy);
    booking.confirm(clock);
    booking.cancel(clock);
    expect(booking.status).toBe('cancelled');
  });

  it('should transition from held to expired', () => {
    const booking = Booking.createHold(validHoldInput, clock, pricingPolicy);
    booking.expire(clock);
    expect(booking.status).toBe('expired');
  });
});
