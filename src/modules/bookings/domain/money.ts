export class Money {
  private constructor(
    public readonly amountMinor: number,
    public readonly currency: string,
  ) {
    if (!Number.isInteger(amountMinor)) {
      throw new Error('Money amount in minor units must be an integer');
    }
    if (amountMinor < 0) {
      throw new Error('Money amount cannot be negative');
    }
    if (!currency || currency.trim() === '') {
      throw new Error('Currency must be a valid non-empty string');
    }
  }

  static of(amountMinor: number, currency = 'UAH'): Money {
    return new Money(amountMinor, currency.toUpperCase());
  }

  static zero(currency = 'UAH'): Money {
    return new Money(0, currency.toUpperCase());
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor + other.amountMinor, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.amountMinor - other.amountMinor;
    if (result < 0) {
      throw new Error('Money subtraction cannot result in negative amount');
    }
    return new Money(result, this.currency);
  }

  percent(pct: number): Money {
    if (pct < 0 || pct > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
    const calculated = Math.round((this.amountMinor * pct) / 100);
    return new Money(calculated, this.currency);
  }

  equals(other: Money): boolean {
    return this.amountMinor === other.amountMinor && this.currency === other.currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
