import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepository } from './booking.repository';
import { Booking } from '../domain/booking';
import { CLOCK, Clock } from '../../../common/time/clock';
import { HoldExpiredError } from '../domain/booking-errors';

@Injectable()
export class GetBookingByIdUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookingRepository: BookingRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(bookingId: string, userId: string, isAdmin: boolean): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (!isAdmin && booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    // Lazy expiry check for reads
    if (
      booking.status === 'held' &&
      booking.holdExpiresAt.getTime() <= this.clock.now().getTime()
    ) {
      throw new HoldExpiredError('Booking hold has expired');
    }

    return booking;
  }
}
