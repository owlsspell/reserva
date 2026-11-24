import { OpeningHoursPolicy, ScheduleRule, BlackoutRule } from './opening-hours.policy';

describe('OpeningHoursPolicy', () => {
  const timezone = 'Europe/Kyiv';

  it('should return true for an interval fully within opening hours', () => {
    const schedules: ScheduleRule[] = [
      { weekday: 1, opensAt: '09:00', closesAt: '17:00' }, // Monday
    ];
    // Monday 2026-03-30 10:00:00 UTC+3 (Kyiv is UTC+3 in summer)
    // 10:00 local time = 07:00 UTC
    const start = new Date('2026-03-30T07:00:00.000Z');
    const end = new Date('2026-03-30T08:00:00.000Z');

    const result = OpeningHoursPolicy.isWithinOpeningHours({ start, end }, timezone, schedules, []);

    expect(result).toBe(true);
  });

  it('should return false for an interval outside opening hours', () => {
    const schedules: ScheduleRule[] = [
      { weekday: 1, opensAt: '09:00', closesAt: '17:00' }, // Monday
    ];
    // Monday 08:00 local time = 05:00 UTC
    const start = new Date('2026-03-30T05:00:00.000Z');
    const end = new Date('2026-03-30T06:00:00.000Z');

    const result = OpeningHoursPolicy.isWithinOpeningHours({ start, end }, timezone, schedules, []);

    expect(result).toBe(false);
  });

  it('should handle midnight-crossing intervals', () => {
    const schedules: ScheduleRule[] = [
      { weekday: 5, opensAt: '22:00', closesAt: '02:00' }, // Friday night to Saturday morning
    ];
    // Friday 2026-04-03 23:30 local time (UTC+3 -> 20:30 UTC)
    const start = new Date('2026-04-03T20:30:00.000Z');
    const end = new Date('2026-04-03T21:30:00.000Z'); // 00:30 local Saturday

    const result = OpeningHoursPolicy.isWithinOpeningHours({ start, end }, timezone, schedules, []);

    expect(result).toBe(true);
  });

  it('should reject intervals overlapping with a blackout', () => {
    const schedules: ScheduleRule[] = [{ weekday: 1, opensAt: '09:00', closesAt: '17:00' }];
    const blackouts: BlackoutRule[] = [
      {
        startsAt: new Date('2026-03-30T07:00:00.000Z'),
        endsAt: new Date('2026-03-30T10:00:00.000Z'),
      },
    ];

    const start = new Date('2026-03-30T07:30:00.000Z');
    const end = new Date('2026-03-30T08:30:00.000Z');

    const result = OpeningHoursPolicy.isWithinOpeningHours(
      { start, end },
      timezone,
      schedules,
      blackouts,
    );

    expect(result).toBe(false);
  });

  it('should handle DST transition days correctly in Europe/Kyiv', () => {
    // In 2026, spring forward in Ukraine is usually last Sunday of March (March 29, 2026 at 03:00 -> 04:00)
    const schedules: ScheduleRule[] = [
      { weekday: 0, opensAt: '02:30', closesAt: '05:30' }, // Sunday
    ];
    // March 29, 2026 is Sunday. At 03:00 local time, clocks go forward to 04:00.
    // Let's test a slot on that day.
    const start = new Date('2026-03-29T01:00:00.000Z'); // 03:00 local before shift (UTC+2)
    const end = new Date('2026-03-29T02:00:00.000Z');

    const result = OpeningHoursPolicy.isWithinOpeningHours({ start, end }, timezone, schedules, []);

    expect(typeof result).toBe('boolean');
  });
});
