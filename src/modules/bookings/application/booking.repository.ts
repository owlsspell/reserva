import { Booking, BookingStatus } from '../domain/booking';

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
  findById(id: string): Promise<Booking | null>;
  findList(params: {
    userId: string;
    limit: number;
    cursor?: string;
    filters: {
      status?: BookingStatus;
      from?: Date;
      to?: Date;
    };
  }): Promise<{ data: Booking[]; nextCursor: string | null }>;
  cancel(
    bookingId: string,
    userId: string,
    isAdmin: boolean,
    outboxEvent: {
      aggregateType: string;
      aggregateId: string;
      type: string;
      payload: unknown;
    },
  ): Promise<Booking | null>;
}

export const BOOKING_REPOSITORY = Symbol('BOOKING_REPOSITORY');
