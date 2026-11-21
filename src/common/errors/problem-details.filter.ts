import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from './domain.error';
import { ErrorCode } from './error-codes.enum';

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  instance: string;
  traceId: string;
  errors?: { field: string; message: string }[];
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const headerRequestId = request.headers['x-request-id'];
    const reqWithId = request as Request & { id?: string };
    const traceId =
      (typeof headerRequestId === 'string' ? headerRequestId : undefined) ||
      reqWithId.id ||
      'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCode.INTERNAL_ERROR;
    let title = 'Internal Server Error';
    let detail = 'An unexpected error occurred.';
    let validationErrors: { field: string; message: string }[] | undefined = undefined;

    if (exception instanceof DomainError) {
      status = exception.status;
      code = exception.code;
      title = this.getTitleForCode(exception.code);
      detail = exception.message;
      validationErrors = exception.errors;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      detail = exception.message;
      title = exception.name;
      code = this.getCodeForStatus(status);

      if (typeof res === 'object' && res !== null) {
        const errorObj = res as Record<string, unknown>;
        if (typeof errorObj.message === 'string') {
          detail = errorObj.message;
        } else if (Array.isArray(errorObj.message)) {
          code = ErrorCode.VALIDATION_FAILED;
          title = 'Validation Failed';
          status = HttpStatus.BAD_REQUEST;
          validationErrors = (errorObj.message as unknown[]).map((msg) => ({
            field: 'unknown',
            message: String(msg),
          }));
        }
      }
    } else {
      this.logger.error(
        `Unhandled exception: ${exception instanceof Error ? exception.stack : String(exception)}`,
      );
    }

    const typeSlug = code.toLowerCase().replace(/_/g, '-');
    const problem: ProblemDetails = {
      type: `https://reserva.dev/problems/${typeSlug}`,
      title,
      status,
      code,
      detail,
      instance: request.url,
      traceId,
    };

    if (validationErrors && validationErrors.length > 0) {
      problem.errors = validationErrors;
    }

    response.setHeader('Content-Type', 'application/problem+json');
    response.status(status).json(problem);
  }

  private getTitleForCode(code: ErrorCode): string {
    switch (code) {
      case ErrorCode.VALIDATION_FAILED:
        return 'Validation Failed';
      case ErrorCode.OUTSIDE_OPENING_HOURS:
        return 'Outside Opening Hours';
      case ErrorCode.INVALID_DURATION:
        return 'Invalid Duration';
      case ErrorCode.IDEMPOTENCY_KEY_MISSING:
        return 'Idempotency Key Missing';
      case ErrorCode.UNAUTHENTICATED:
      case ErrorCode.TOKEN_EXPIRED:
      case ErrorCode.REFRESH_TOKEN_REUSED:
        return 'Unauthenticated';
      case ErrorCode.FORBIDDEN:
        return 'Forbidden';
      case ErrorCode.NOT_FOUND:
        return 'Not Found';
      case ErrorCode.SLOT_UNAVAILABLE:
        return 'Slot Unavailable';
      case ErrorCode.INVALID_STATE_TRANSITION:
        return 'Invalid State Transition';
      case ErrorCode.REQUEST_IN_PROGRESS:
        return 'Request In Progress';
      case ErrorCode.EMAIL_TAKEN:
        return 'Email Taken';
      case ErrorCode.HOLD_EXPIRED:
        return 'Hold Expired';
      case ErrorCode.IDEMPOTENCY_KEY_REUSED:
        return 'Idempotency Key Reused';
      case ErrorCode.HOLD_LIMIT_REACHED:
        return 'Hold Limit Reached';
      case ErrorCode.RATE_LIMITED:
        return 'Rate Limited';
      case ErrorCode.PAYMENT_PROVIDER_ERROR:
        return 'Payment Provider Error';
      default:
        return 'Internal Server Error';
    }
  }

  private getCodeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_FAILED;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHENTICATED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.SLOT_UNAVAILABLE;
      case HttpStatus.GONE:
        return ErrorCode.HOLD_EXPIRED;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.IDEMPOTENCY_KEY_REUSED;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMITED;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
