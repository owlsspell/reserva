import { DomainError } from '../../../common/errors/domain.error';
import { ErrorCode } from '../../../common/errors/error-codes.enum';

export class InvalidStateTransitionError extends DomainError {
  constructor(currentState: string, targetState: string) {
    super(
      `Cannot transition booking from '${currentState}' to '${targetState}'`,
      ErrorCode.INVALID_STATE_TRANSITION,
      409,
    );
    this.name = 'InvalidStateTransitionError';
    Object.setPrototypeOf(this, InvalidStateTransitionError.prototype);
  }
}

export class StartInPastError extends DomainError {
  constructor(message = 'Booking start time must be in the future') {
    super(message, ErrorCode.VALIDATION_FAILED, 400);
    this.name = 'StartInPastError';
    Object.setPrototypeOf(this, StartInPastError.prototype);
  }
}

export class HoldExpiredError extends DomainError {
  constructor(message = 'Booking hold has expired') {
    super(message, ErrorCode.HOLD_EXPIRED, 410);
    this.name = 'HoldExpiredError';
    Object.setPrototypeOf(this, HoldExpiredError.prototype);
  }
}

export class SlotUnavailableError extends DomainError {
  constructor(message = 'Selected time slot is unavailable') {
    super(message, ErrorCode.SLOT_UNAVAILABLE, 409);
    this.name = 'SlotUnavailableError';
    Object.setPrototypeOf(this, SlotUnavailableError.prototype);
  }
}

export class HoldLimitReachedError extends DomainError {
  constructor(message = 'Maximum active holds limit reached') {
    super(message, ErrorCode.HOLD_LIMIT_REACHED, 400);
    this.name = 'HoldLimitReachedError';
    Object.setPrototypeOf(this, HoldLimitReachedError.prototype);
  }
}
