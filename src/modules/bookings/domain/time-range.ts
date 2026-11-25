export class TimeRange {
  private constructor(
    public readonly start: Date,
    public readonly end: Date,
  ) {
    if (!(start instanceof Date) || isNaN(start.getTime())) {
      throw new Error('Start must be a valid Date');
    }
    if (!(end instanceof Date) || isNaN(end.getTime())) {
      throw new Error('End must be a valid Date');
    }
    if (end.getTime() <= start.getTime()) {
      throw new Error('TimeRange end must be strictly after start');
    }
  }

  static of(start: Date, end: Date): TimeRange {
    return new TimeRange(new Date(start.getTime()), new Date(end.getTime()));
  }

  overlaps(other: TimeRange): boolean {
    // Half-open interval [start, end) overlap condition:
    // This starts before other ends, and other starts before this ends.
    return this.start.getTime() < other.end.getTime() && other.start.getTime() < this.end.getTime();
  }

  durationMinutes(): number {
    return Math.round((this.end.getTime() - this.start.getTime()) / (1000 * 60));
  }

  equals(other: TimeRange): boolean {
    return (
      this.start.getTime() === other.start.getTime() && this.end.getTime() === other.end.getTime()
    );
  }
}
