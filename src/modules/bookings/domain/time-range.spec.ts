import { TimeRange } from './time-range';

describe('TimeRange Value Object', () => {
  it('should create valid time range when end > start', () => {
    const start = new Date('2026-12-01T10:00:00Z');
    const end = new Date('2026-12-01T11:00:00Z');
    const range = TimeRange.of(start, end);

    expect(range.start.toISOString()).toBe(start.toISOString());
    expect(range.end.toISOString()).toBe(end.toISOString());
    expect(range.durationMinutes()).toBe(60);
  });

  it('should throw error when end <= start', () => {
    const start = new Date('2026-12-01T11:00:00Z');
    const end = new Date('2026-12-01T10:00:00Z');
    expect(() => TimeRange.of(start, end)).toThrow('strictly after start');

    const same = new Date('2026-12-01T10:00:00Z');
    expect(() => TimeRange.of(same, same)).toThrow('strictly after start');
  });

  it('should correctly detect overlaps for half-open intervals [start, end)', () => {
    const r1 = TimeRange.of(new Date('2026-12-01T10:00:00Z'), new Date('2026-12-01T12:00:00Z'));

    // Overlapping partially
    const r2 = TimeRange.of(new Date('2026-12-01T11:00:00Z'), new Date('2026-12-01T13:00:00Z'));
    expect(r1.overlaps(r2)).toBe(true);
    expect(r2.overlaps(r1)).toBe(true);

    // Touching at 12:00 (half-open [10:00, 12:00) does not overlap [12:00, 14:00))
    const r3 = TimeRange.of(new Date('2026-12-01T12:00:00Z'), new Date('2026-12-01T14:00:00Z'));
    expect(r1.overlaps(r3)).toBe(false);
    expect(r3.overlaps(r1)).toBe(false);

    // Completely disjoint
    const r4 = TimeRange.of(new Date('2026-12-01T13:00:00Z'), new Date('2026-12-01T14:00:00Z'));
    expect(r1.overlaps(r4)).toBe(false);
  });
});
