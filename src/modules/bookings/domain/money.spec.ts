import { Money } from './money';

describe('Money Value Object', () => {
  it('should create valid money with integer minor units', () => {
    const money = Money.of(1500, 'UAH');
    expect(money.amountMinor).toBe(1500);
    expect(money.currency).toBe('UAH');
  });

  it('should uppercase currency code', () => {
    const money = Money.of(100, 'usd');
    expect(money.currency).toBe('USD');
  });

  it('should throw error on non-integer amount', () => {
    expect(() => Money.of(15.5, 'UAH')).toThrow('integer');
  });

  it('should throw error on negative amount', () => {
    expect(() => Money.of(-100, 'UAH')).toThrow('negative');
  });

  it('should add money of same currency', () => {
    const m1 = Money.of(1000, 'UAH');
    const m2 = Money.of(500, 'UAH');
    const sum = m1.add(m2);
    expect(sum.amountMinor).toBe(1500);
    expect(sum.currency).toBe('UAH');
  });

  it('should throw error when adding different currencies', () => {
    const m1 = Money.of(1000, 'UAH');
    const m2 = Money.of(500, 'USD');
    expect(() => m1.add(m2)).toThrow('Currency mismatch');
  });

  it('should calculate percentage correctly with rounding', () => {
    const m = Money.of(1000, 'UAH');
    const half = m.percent(50);
    expect(half.amountMinor).toBe(500);

    const third = Money.of(100, 'UAH').percent(33.33);
    expect(third.amountMinor).toBe(33);
  });
});
