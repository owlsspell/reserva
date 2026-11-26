import { decodeCursor, processPaginatedRecords } from './cursor-pagination.helper';

describe('CursorPaginationHelper', () => {
  describe('decodeCursor', () => {
    it('should return undefined when cursor is not provided', () => {
      expect(decodeCursor(undefined)).toBeUndefined();
      expect(decodeCursor('')).toBeUndefined();
    });

    it('should decode a valid base64 json cursor', () => {
      const encoded = Buffer.from(JSON.stringify({ id: 'item-123' })).toString('base64');
      expect(decodeCursor(encoded)).toEqual({ id: 'item-123' });
    });

    it('should return undefined for invalid cursor payload', () => {
      const invalid = Buffer.from('not-json').toString('base64');
      expect(decodeCursor(invalid)).toBeUndefined();
    });
  });

  describe('processPaginatedRecords', () => {
    it('should return data and null nextCursor when records length <= limit', () => {
      const records = [{ id: '1' }, { id: '2' }];
      const result = processPaginatedRecords(records, 5, (r) => r.id);

      expect(result.data).toEqual(['1', '2']);
      expect(result.nextCursor).toBeNull();
    });

    it('should return sliced data and nextCursor when records length > limit', () => {
      const records = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const result = processPaginatedRecords(records, 2, (r) => r.id);

      expect(result.data).toEqual(['1', '2']);
      expect(result.nextCursor).not.toBeNull();

      const decoded = decodeCursor(result.nextCursor as string);
      expect(decoded).toEqual({ id: '2' });
    });
  });
});
