import { StandardPricingPolicy } from './pricing-policy';
import { TimeRange } from './time-range';

describe('StandardPricingPolicy', () => {
  const policy = new StandardPricingPolicy();

  it('should calculate exact price for full hours', () => {
    const range = TimeRange.of(
      new Date('2026-12-01T10:00:00Z'),
      new Date('2026-12-01T12:00:00Z'), // 2 hours
    );
    const price = policy.calculatePrice(range, 1000, 'UAH'); // 1000 minor units per hour
    expect(price.amountMinor).toBe(2000);
    expect(price.currency).toBe('UAH');
  });

  it('should calculate fractional hours with ceil rounding', () => {
    const range = TimeRange.of(
      new Date('2026-12-01T10:00:00Z'),
      new Date('2026-12-01T10:30:00Z'), // 30 minutes (0.5 hour)
    );
    const price = policy.calculatePrice(range, 1000, 'UAH');
    expect(price.amountMinor).toBe(500); // 0.5 * 1000

    // 45 minutes at 1000 per hour = 750
    const range45 = TimeRange.of(
      new Date('2026-12-01T10:00:00Z'),
      new Date('2026-12-01T10:45:00Z'),
    );
    expect(policy.calculatePrice(range45, 1000, 'UAH').amountMinor).toBe(750);
  });

  it('should throw error on negative price per hour', () => {
    const range = TimeRange.of(new Date('2026-12-01T10:00:00Z'), new Date('2026-12-01T11:00:00Z'));
    expect(() => policy.calculatePrice(range, -100, 'UAH')).toThrow('negative');
  });
});
