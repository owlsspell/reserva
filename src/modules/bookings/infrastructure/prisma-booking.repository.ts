import { Injectable } from '@nestjs/common';
import { BookingRepository } from '../application/booking.repository';
import { Booking, BookingStatus } from '../domain/booking';
import { TimeRange } from '../domain/time-range';
import { Money } from '../domain/money';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { SlotUnavailableError } from '../domain/booking-errors';
import {
  decodeCursor,
  processPaginatedRecords,
} from '../../../infrastructure/database/cursor-pagination.helper';
import { Prisma, Booking as PrismaBookingModel } from '@prisma/client';

@Injectable()
export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: PrismaBookingModel): Booking {
    return Booking.reconstitute({
      id: record.id,
      userId: record.userId,
      resourceId: record.resourceId,
      range: TimeRange.of(record.startsAt, record.endsAt),
      status: record.status as BookingStatus,
      amount: Money.of(record.amountMinor, record.currency),
      holdExpiresAt: record.holdExpiresAt ?? record.createdAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async countActiveHolds(userId: string): Promise<number> {
    const now = new Date();
    return this.prisma.booking.count({
      where: {
        userId,
        status: 'held',
        holdExpiresAt: { gt: now },
      },
    });
  }

  async findById(id: string): Promise<Booking | null> {
    const record = await this.prisma.booking.findUnique({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findList(params: {
    userId: string;
    limit: number;
    cursor?: string;
    filters: {
      status?: BookingStatus;
      from?: Date;
      to?: Date;
    };
  }): Promise<{ data: Booking[]; nextCursor: string | null }> {
    const { userId, limit, cursor, filters } = params;
    const decodedCursor = decodeCursor(cursor);

    const where: Prisma.BookingWhereInput = {
      userId,
      status: filters.status,
      startsAt: filters.from ? { gte: filters.from } : undefined,
      endsAt: filters.to ? { lte: filters.to } : undefined,
      id: decodedCursor ? { lt: decodedCursor.id } : undefined,
    };

    const records = await this.prisma.booking.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit + 1,
    });

    return processPaginatedRecords(records, limit, (r) => this.toDomain(r));
  }

  async cancel(
    bookingId: string,
    userId: string,
    isAdmin: boolean,
    _outboxEvent: {
      aggregateType: string;
      aggregateId: string;
      type: string;
      payload: unknown;
    },
  ): Promise<Booking | null> {
    return this.prisma.$transaction(async (tx) => {
      const where: Prisma.BookingWhereUniqueInput & Prisma.BookingWhereInput = {
        id: bookingId,
        status: { in: ['held', 'confirmed'] },
        ...(isAdmin ? {} : { userId }),
      };

      const record = await tx.booking.findFirst({
        where,
      });

      if (!record) {
        return null;
      }

      const updatedRecord = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'cancelled',
          updatedAt: new Date(),
        },
      });

      return this.toDomain(updatedRecord);
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
