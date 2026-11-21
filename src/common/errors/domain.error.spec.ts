import { DomainError } from './domain.error';
import { ErrorCode } from './error-codes.enum';

describe('DomainError', () => {
  it('should create a domain error with correct properties', () => {
    const error = new DomainError('Slot is unavailable', ErrorCode.SLOT_UNAVAILABLE, 409, [
      { field: 'startsAt', message: 'Already booked' },
    ]);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Slot is unavailable');
    expect(error.code).toBe(ErrorCode.SLOT_UNAVAILABLE);
    expect(error.status).toBe(409);
    expect(error.errors).toEqual([{ field: 'startsAt', message: 'Already booked' }]);
  });
});
