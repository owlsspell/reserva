import { TimeRange } from './time-range';
import { Money } from './money';

export interface PricingPolicy {
  calculatePrice(range: TimeRange, pricePerHourMinor: number, currency: string): Money;
}

export class StandardPricingPolicy implements PricingPolicy {
  calculatePrice(range: TimeRange, pricePerHourMinor: number, currency = 'UAH'): Money {
    if (pricePerHourMinor < 0) {
      throw new Error('Price per hour cannot be negative');
    }
    const durationMinutes = range.durationMinutes();
    const amountMinor = Math.ceil((durationMinutes / 60) * pricePerHourMinor);
    return Money.of(amountMinor, currency);
  }
}
