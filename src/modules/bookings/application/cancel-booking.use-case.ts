import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepository } from './booking.repository';
import { Booking } from '../domain/booking';
import { CLOCK, Clock } from '../../../common/time/clock';
import { HoldExpiredError, InvalidStateTransitionError } from '../domain/booking-errors';

@Injectable()
export class CancelBookingUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookingRepository: BookingRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(bookingId: string, userId: string, isAdmin: boolean): Promise<Booking> {
    const existing = await this.bookingRepository.findById(bookingId);
    if (!existing) {
      throw new NotFoundException('Booking not found');
    }

    if (!isAdmin && existing.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    if (existing.status === 'expired' || existing.status === 'cancelled') {
      throw new InvalidStateTransitionError(existing.status, 'cancelled');
    }

    if (
      existing.status === 'held' &&
      existing.holdExpiresAt.getTime() <= this.clock.now().getTime()
    ) {
      throw new HoldExpiredError('Booking hold has expired');
    }

    const outboxEvent = {
      aggregateType: 'booking',
      aggregateId: existing.id,
      type: 'booking.cancelled',
      payload: {
        bookingId: existing.id,
        userId: existing.userId,
        resourceId: existing.resourceId,
        cancelledAt: this.clock.now(),
      },
    };

    const cancelledBooking = await this.bookingRepository.cancel(
      bookingId,
      userId,
      isAdmin,
      outboxEvent,
    );

    if (!cancelledBooking) {
      throw new NotFoundException('Booking not found or cannot be cancelled');
    }

    return cancelledBooking;
  }
}
