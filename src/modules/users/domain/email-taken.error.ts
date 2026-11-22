import { DomainError } from '../../../common/errors/domain.error';
import { ErrorCode } from '../../../common/errors/error-codes.enum';

export class EmailTakenError extends DomainError {
  constructor(email: string) {
    super(`Email ${email} is already taken`, ErrorCode.EMAIL_TAKEN, 409);
    this.name = 'EmailTakenError';
    Object.setPrototypeOf(this, EmailTakenError.prototype);
  }
}
