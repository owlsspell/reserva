import { Injectable, Inject } from '@nestjs/common';
import { BOOKING_REPOSITORY, BookingRepository } from './booking.repository';
import { Booking } from '../domain/booking';
import { StandardPricingPolicy } from '../domain/pricing-policy';
import { CLOCK, Clock } from '../../../common/time/clock';
import { GetResourceUseCase } from '../../resources/application/get-resource.use-case';
import { OpeningHoursPolicy } from '../../resources/domain/opening-hours.policy';
import { HoldLimitReachedError, SlotUnavailableError } from '../domain/booking-errors';
import { randomUUID } from 'crypto';

export interface CreateHoldCommand {
  userId: string;
  resourceId: string;
  startsAt: Date;
  endsAt: Date;
  currency?: string;
  holdTtlSeconds?: number;
}

@Injectable()
export class CreateHoldUseCase {
  private readonly pricingPolicy = new StandardPricingPolicy();
  private readonly maxActiveHolds = 5;

  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly bookingRepository: BookingRepository,
    private readonly getResourceUseCase: GetResourceUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(command: CreateHoldCommand): Promise<Booking> {
    const activeHoldsCount = await this.bookingRepository.countActiveHolds(command.userId);
    if (activeHoldsCount >= this.maxActiveHolds) {
      throw new HoldLimitReachedError('Maximum active holds limit reached');
    }

    const resource = await this.getResourceUseCase.execute(command.resourceId);

    const isWithinHours = OpeningHoursPolicy.isWithinOpeningHours(
      { start: command.startsAt, end: command.endsAt },
      resource.timezone,
      resource.schedules,
      resource.blackouts,
    );

    if (!isWithinHours) {
      throw new SlotUnavailableError('Selected time slot is outside opening hours or blacked out');
    }

    const bookingId = randomUUID();
    const booking = Booking.createHold(
      {
        id: bookingId,
        resourceId: command.resourceId,
        userId: command.userId,
        startsAt: command.startsAt,
        endsAt: command.endsAt,
        pricePerHourMinor: resource.pricePerHour,
        currency: command.currency ?? 'UAH',
        holdTtlSeconds: command.holdTtlSeconds,
      },
      this.clock,
      this.pricingPolicy,
    );

    const outboxEvent = {
      aggregateType: 'booking',
      aggregateId: booking.id,
      type: 'booking.held',
      payload: {
        bookingId: booking.id,
        userId: booking.userId,
        resourceId: booking.resourceId,
        startsAt: booking.range.start,
        endsAt: booking.range.end,
        amountMinor: booking.amount.amountMinor,
        currency: booking.amount.currency,
        holdExpiresAt: booking.holdExpiresAt,
      },
    };

    // The repository re-checks the limit atomically inside the transaction;
    // the pre-check above is only a cheap fast-fail.
    await this.bookingRepository.createHold(booking, outboxEvent, this.maxActiveHolds);

    return booking;
  }
}
