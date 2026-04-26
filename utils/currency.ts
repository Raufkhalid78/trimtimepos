/**
 * utils/currency.ts
 *
 * Centralized currency formatting using Intl.NumberFormat.
 * Use this everywhere instead of hardcoding '$' or template strings.
 *
 * Usage:
 *   import { formatCurrency } from '../utils/currency';
 *   formatCurrency(42.5, '$')  → "$42.50"
 *   formatCurrency(4200, '₹') → "₹4,200.00"
 */

interface CurrencyConfig {
  locale: string;
  code: string;
}

const SYMBOL_MAP: Record<string, CurrencyConfig> = {
  '$':   { locale: 'en-US', code: 'USD' },
  'USD': { locale: 'en-US', code: 'USD' },
  '£':   { locale: 'en-GB', code: 'GBP' },
  'GBP': { locale: 'en-GB', code: 'GBP' },
  '€':   { locale: 'de-DE', code: 'EUR' },
  'EUR': { locale: 'de-DE', code: 'EUR' },
  '₹':   { locale: 'en-IN', code: 'INR' },
  'INR': { locale: 'en-IN', code: 'INR' },
  '₨':   { locale: 'ur-PK', code: 'PKR' },
  'Rs':  { locale: 'ur-PK', code: 'PKR' },
  'PKR': { locale: 'ur-PK', code: 'PKR' },
  'AED': { locale: 'ar-AE', code: 'AED' },
  'SAR': { locale: 'ar-SA', code: 'SAR' },
  'QAR': { locale: 'ar-QA', code: 'QAR' },
  'ر.س': { locale: 'ar-SA', code: 'SAR' },
  'د.إ': { locale: 'ar-AE', code: 'AED' },
};

/**
 * Format a numeric amount using the shop's currency symbol.
 * Falls back gracefully if the symbol is not in the map.
 */
export function formatCurrency(amount: number, currencySymbol: string): string {
  const config = SYMBOL_MAP[currencySymbol];
  if (config) {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  // Fallback: symbol + fixed decimal
  return `${currencySymbol}${amount.toFixed(2)}`;
}

/**
 * Format without the currency symbol — useful for inputs and tables.
 * e.g. formatAmount(1234.5) → "1,234.50"
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse a currency string back to a number safely.
 * Strips all non-numeric characters except `.`.
 */
export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}
