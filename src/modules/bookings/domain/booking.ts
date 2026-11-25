import { TimeRange } from './time-range';
import { Money } from './money';
import { PricingPolicy } from './pricing-policy';
import { Clock } from '../../../common/time/clock';
import { InvalidStateTransitionError, StartInPastError } from './booking-errors';

export type BookingStatus = 'held' | 'confirmed' | 'cancelled' | 'expired';

export interface BookingProps {
  id: string;
  resourceId: string;
  userId: string;
  range: TimeRange;
  status: BookingStatus;
  amount: Money;
  holdExpiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHoldInput {
  id: string;
  resourceId: string;
  userId: string;
  startsAt: Date;
  endsAt: Date;
  pricePerHourMinor: number;
  currency?: string;
  holdTtlSeconds?: number;
}

export class Booking {
  private constructor(private props: BookingProps) {}

  get id(): string {
    return this.props.id;
  }

  get resourceId(): string {
    return this.props.resourceId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get range(): TimeRange {
    return this.props.range;
  }

  get status(): BookingStatus {
    return this.props.status;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get holdExpiresAt(): Date {
    return this.props.holdExpiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static createHold(input: CreateHoldInput, clock: Clock, pricingPolicy: PricingPolicy): Booking {
    const range = TimeRange.of(input.startsAt, input.endsAt);
    const now = clock.now();

    if (range.start.getTime() <= now.getTime()) {
      throw new StartInPastError('Booking start time must be in the future');
    }

    const currency = input.currency ?? 'UAH';
    const amount = pricingPolicy.calculatePrice(range, input.pricePerHourMinor, currency);
    const ttlSeconds = input.holdTtlSeconds ?? 600; // default 10 min (600s)
    const holdExpiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    return new Booking({
      id: input.id,
      resourceId: input.resourceId,
      userId: input.userId,
      range,
      status: 'held',
      amount,
      holdExpiresAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: BookingProps): Booking {
    return new Booking(props);
  }

  confirm(clock: Clock): void {
    if (this.props.status !== 'held') {
      throw new InvalidStateTransitionError(this.props.status, 'confirmed');
    }
    if (clock.now().getTime() > this.props.holdExpiresAt.getTime()) {
      throw new InvalidStateTransitionError('expired', 'confirmed');
    }
    this.props.status = 'confirmed';
    this.props.updatedAt = clock.now();
  }

  cancel(clock: Clock): void {
    if (this.props.status !== 'held' && this.props.status !== 'confirmed') {
      throw new InvalidStateTransitionError(this.props.status, 'cancelled');
    }
    this.props.status = 'cancelled';
    this.props.updatedAt = clock.now();
  }

  expire(clock: Clock): void {
    if (this.props.status !== 'held') {
      throw new InvalidStateTransitionError(this.props.status, 'expired');
    }
    this.props.status = 'expired';
    this.props.updatedAt = clock.now();
  }
}
