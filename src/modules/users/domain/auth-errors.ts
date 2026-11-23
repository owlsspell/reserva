import { DomainError } from '../../../common/errors/domain.error';
import { ErrorCode } from '../../../common/errors/error-codes.enum';

export class UnauthenticatedError extends DomainError {
  constructor(message = 'Invalid credentials or unauthenticated') {
    super(message, ErrorCode.UNAUTHENTICATED, 401);
    this.name = 'UnauthenticatedError';
    Object.setPrototypeOf(this, UnauthenticatedError.prototype);
  }
}

export class TokenExpiredError extends DomainError {
  constructor(message = 'Refresh token has expired') {
    super(message, ErrorCode.TOKEN_EXPIRED, 401);
    this.name = 'TokenExpiredError';
    Object.setPrototypeOf(this, TokenExpiredError.prototype);
  }
}

export class RefreshTokenReusedError extends DomainError {
  constructor(message = 'Refresh token reuse detected. Family revoked.') {
    super(message, ErrorCode.REFRESH_TOKEN_REUSED, 401);
    this.name = 'RefreshTokenReusedError';
    Object.setPrototypeOf(this, RefreshTokenReusedError.prototype);
  }
}
