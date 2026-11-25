import { Booking } from '../domain/booking';

export interface BookingRepository {
  createHold(
    booking: Booking,
    outboxEvent: {
      aggregateType: string;
      aggregateId: string;
      type: string;
      payload: unknown;
    },
  ): Promise<void>;
  countActiveHolds(userId: string): Promise<number>;
}

export const BOOKING_REPOSITORY = Symbol('BOOKING_REPOSITORY');
