export interface ScheduleRule {
  weekday: number; // 0-6 (0 = Sunday)
  opensAt: string; // "HH:mm"
  closesAt: string; // "HH:mm"
}

export interface BlackoutRule {
  startsAt: Date;
  endsAt: Date;
}

export interface TimeInterval {
  start: Date;
  end: Date;
}

export interface LocalTime {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  minutesSinceMidnight: number;
  weekday: number;
}

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;
const MS_PER_DAY = MINUTES_PER_DAY * 60 * 1000;
const DAYS_PER_WEEK = 7;

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export abstract class OpeningHoursPolicy {
  /**
   * Checks if a given UTC time interval [start, end) is completely within the resource's
   * open hours (weekly schedule) and outside any blackouts, given the resource's IANA timezone.
   *
   * Schedules where closesAt <= opensAt are treated as crossing midnight
   * (e.g. 22:00-02:00 belongs to the weekday it opens on; "00:00" as closing time means 24:00).
   */
  static isWithinOpeningHours(
    interval: TimeInterval,
    timezone: string,
    schedules: ScheduleRule[],
    blackouts: BlackoutRule[],
  ): boolean {
    if (interval.start >= interval.end) {
      return false;
    }

    if (OpeningHoursPolicy.overlapsAnyBlackout(interval, blackouts)) {
      return false;
    }

    if (!schedules || schedules.length === 0) {
      return true;
    }

    const localStart = OpeningHoursPolicy.toLocalTime(interval.start, timezone);
    const localEnd = OpeningHoursPolicy.toLocalTime(interval.end, timezone);

    // Interval boundaries in minutes relative to the local midnight of the start date.
    const startMinutes = localStart.minutesSinceMidnight;
    const endMinutes =
      OpeningHoursPolicy.daysBetween(localStart, localEnd) * MINUTES_PER_DAY +
      localEnd.minutesSinceMidnight;

    const previousWeekday = (localStart.weekday + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK;

    for (const schedule of schedules) {
      const openMinutes = OpeningHoursPolicy.parseTimeToMinutes(schedule.opensAt);
      let closeMinutes = OpeningHoursPolicy.parseTimeToMinutes(schedule.closesAt);

      const crossesMidnight = closeMinutes <= openMinutes;
      if (crossesMidnight) {
        closeMinutes += MINUTES_PER_DAY;
      }

      // Schedule that opens on the same weekday as the interval starts.
      if (schedule.weekday === localStart.weekday) {
        if (startMinutes >= openMinutes && endMinutes <= closeMinutes) {
          return true;
        }
      }

      // Overnight schedule that opened on the previous day and is still open after midnight.
      if (crossesMidnight && schedule.weekday === previousWeekday) {
        const tailEndMinutes = closeMinutes - MINUTES_PER_DAY;
        if (endMinutes <= tailEndMinutes) {
          return true;
        }
      }
    }

    return false;
  }

  static toLocalTime(date: Date, timezone: string): LocalTime {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23', // avoids "24" instead of "00" at midnight
      weekday: 'short',
    });

    const parts = formatter.formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes): string =>
      parts.find((p) => p.type === type)?.value ?? '';

    const hours = parseInt(get('hour'), 10);
    const minutes = parseInt(get('minute'), 10);

    return {
      year: parseInt(get('year'), 10),
      month: parseInt(get('month'), 10),
      day: parseInt(get('day'), 10),
      hours,
      minutes,
      minutesSinceMidnight: hours * MINUTES_PER_HOUR + minutes,
      weekday: WEEKDAY_MAP[get('weekday')] ?? 0,
    };
  }

  /** Converts "HH:mm" into minutes since midnight. */
  private static parseTimeToMinutes(time: string): number {
    const [hours = 0, minutes = 0] = time.split(':').map(Number);
    return hours * MINUTES_PER_HOUR + minutes;
  }

  private static overlapsAnyBlackout(interval: TimeInterval, blackouts: BlackoutRule[]): boolean {
    return blackouts.some(
      (blackout) => interval.start < blackout.endsAt && interval.end > blackout.startsAt,
    );
  }

  /** Number of calendar days between two local dates (0 if the same day). */
  private static daysBetween(from: LocalTime, to: LocalTime): number {
    const fromUtc = Date.UTC(from.year, from.month - 1, from.day);
    const toUtc = Date.UTC(to.year, to.month - 1, to.day);
    return Math.round((toUtc - fromUtc) / MS_PER_DAY);
  }
}
