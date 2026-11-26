import { Injectable, Inject } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepository } from './booking.repository';
import { BookingStatus } from '../domain/booking';

export interface GetBookingsQuery {
  userId: string;
  limit?: number;
  cursor?: string;
  status?: BookingStatus;
  from?: Date;
  to?: Date;
}

@Injectable()
export class GetBookingsUseCase {
  constructor(@Inject(BOOKING_REPOSITORY) private readonly bookingRepository: BookingRepository) {}

  async execute(query: GetBookingsQuery) {
    return this.bookingRepository.findList({
      userId: query.userId,
      limit: query.limit ?? 20,
      cursor: query.cursor,
      filters: {
        status: query.status,
        from: query.from,
        to: query.to,
      },
    });
  }
}
