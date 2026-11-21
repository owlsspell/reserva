import { ErrorCode } from './error-codes.enum';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly errors?: ValidationErrorDetail[];

  constructor(
    message: string,
    code: ErrorCode,
    status: number = 400,
    errors?: ValidationErrorDetail[],
  ) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.status = status;
    this.errors = errors;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}
