import { Injectable } from '@nestjs/common';
import { BookingRepository } from '../application/booking.repository';
import { Booking } from '../domain/booking';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { SlotUnavailableError } from '../domain/booking-errors';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countActiveHolds(userId: string): Promise<number> {
    const now = new Date();
    return this.prisma.booking.count({
      where: {
        userId,
        status: 'held',
        holdExpiresAt: {
          gt: now,
        },
      },
    });
  }

  async createHold(
    booking: Booking,
    _outboxEvent: {
      aggregateType: string;
      aggregateId: string;
      type: string;
      payload: unknown;
    },
  ): Promise<void> {
    const resourceId = booking.resourceId;
    const startsAt = booking.range.start;
    const endsAt = booking.range.end;

    try {
      await this.prisma.$transaction(async (tx) => {
        // 3b. Lazy expiry: free stale holds that block this interval
        await tx.$executeRaw`
          UPDATE bookings
          SET status = 'expired', updated_at = NOW()
          WHERE resource_id = ${resourceId}
            AND status = 'held'
            AND hold_expires_at <= NOW()
            AND tstzrange(starts_at, ends_at, '[)') && tstzrange(${startsAt}::timestamptz, ${endsAt}::timestamptz, '[)')
        `;

        // 3c. INSERT booking
        await tx.booking.create({
          data: {
            id: booking.id,
            userId: booking.userId,
            resourceId: booking.resourceId,
            startsAt: booking.range.start,
            endsAt: booking.range.end,
            status: booking.status,
            holdExpiresAt: booking.holdExpiresAt,
            amountMinor: booking.amount.amountMinor,
            currency: booking.amount.currency,
          },
        });
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2010' ||
          error.message.includes('23P01') ||
          (error.meta && JSON.stringify(error.meta).includes('23P01')))
      ) {
        throw new SlotUnavailableError('Selected time slot is already booked or held');
      }
      if (error instanceof Error && error.message.includes('23P01')) {
        throw new SlotUnavailableError('Selected time slot is already booked or held');
      }
      throw error;
    }
  }
}
