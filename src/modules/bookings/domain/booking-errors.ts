import { DomainError } from '../../../common/errors/domain.error';
import { ErrorCode } from '../../../common/errors/error-codes.enum';

export class InvalidStateTransitionError extends DomainError {
  constructor(currentState: string, targetState: string) {
    super(
      `Cannot transition booking from '${currentState}' to '${targetState}'`,
      ErrorCode.INVALID_STATE_TRANSITION,
      400,
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
    super(message, ErrorCode.HOLD_EXPIRED, 400);
    this.name = 'HoldExpiredError';
    Object.setPrototypeOf(this, HoldExpiredError.prototype);
  }
}
