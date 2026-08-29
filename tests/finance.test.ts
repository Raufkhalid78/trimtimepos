import { describe, it, expect } from 'vitest';

// Pure financial computation helper functions mirroring POS logic
export function computeSaleTotals(
  subtotal: number,
  discount: number,
  taxRate: number,
  taxType: 'included' | 'excluded',
  tip: number = 0
) {
  const discountedSubtotal = Math.max(0, subtotal - discount);
  let tax = 0;
  let finalTotal = discountedSubtotal;

  if (taxType === 'excluded') {
    tax = (discountedSubtotal * taxRate) / 100;
    finalTotal = discountedSubtotal + tax + tip;
  } else {
    // Tax is included in the subtotal
    tax = discountedSubtotal - discountedSubtotal / (1 + taxRate / 100);
    finalTotal = discountedSubtotal + tip;
  }

  return {
    subtotal,
    discount,
    discountedSubtotal: Math.round(discountedSubtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    finalTotal: Math.round(finalTotal * 100) / 100,
    tip,
  };
}

export function computeCommission(
  serviceTotal: number,
  productTotal: number,
  serviceCommissionRate: number,
  productCommissionRate: number,
  deductExpenses: boolean = false,
  shopExpenses: number = 0
) {
  const serviceCommission = (serviceTotal * serviceCommissionRate) / 100;
  const productCommission = (productTotal * productCommissionRate) / 100;
  const totalCommission = serviceCommission + productCommission;

  if (deductExpenses) {
    return Math.max(0, totalCommission - shopExpenses);
  }
  return totalCommission;
}

export function computeLoyaltyPoints(
  totalSpend: number,
  pointsPerDollar: number = 1
): number {
  return Math.floor(totalSpend * pointsPerDollar);
}

describe('Financial Math & POS Calculation Engine', () => {
  describe('Tax & Discounts Computation', () => {
    it('should calculate excluded tax correctly', () => {
      // Subtotal $100, Discount $10 => $90 taxable, 10% tax => $9.00 tax, Total = $99.00
      const result = computeSaleTotals(100, 10, 10, 'excluded');
      expect(result.discountedSubtotal).toBe(90);
      expect(result.tax).toBe(9);
      expect(result.finalTotal).toBe(99);
    });

    it('should calculate included tax correctly without increasing total', () => {
      // Subtotal $110, 10% included tax => Total = $110, Tax = $10
      const result = computeSaleTotals(110, 0, 10, 'included');
      expect(result.tax).toBe(10);
      expect(result.finalTotal).toBe(110);
    });

    it('should include tip in total without taxing tip', () => {
      const result = computeSaleTotals(100, 0, 10, 'excluded', 15);
      expect(result.tax).toBe(10);
      expect(result.finalTotal).toBe(125); // 100 + 10 tax + 15 tip
    });

    it('should prevent negative discounted subtotal when discount exceeds subtotal', () => {
      const result = computeSaleTotals(50, 80, 10, 'excluded');
      expect(result.discountedSubtotal).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.finalTotal).toBe(0);
    });
  });

  describe('Staff Commission Calculation', () => {
    it('should compute split commissions for services and products accurately', () => {
      // Services $200 at 50% = $100, Products $100 at 10% = $10 => Total $110
      const commission = computeCommission(200, 100, 50, 10);
      expect(commission).toBe(110);
    });

    it('should deduct shop expenses when deductExpenses is enabled', () => {
      // Total commission $110 - $30 expenses = $80
      const commission = computeCommission(200, 100, 50, 10, true, 30);
      expect(commission).toBe(80);
    });

    it('should not allow negative commission after expense deduction', () => {
      const commission = computeCommission(50, 0, 10, 0, true, 100);
      expect(commission).toBe(0);
    });
  });

  describe('Loyalty Points Calculation', () => {
    it('should award correct loyalty points rounded down to integer', () => {
      expect(computeLoyaltyPoints(45.75, 1)).toBe(45);
      expect(computeLoyaltyPoints(100, 2)).toBe(200);
    });
  });
});
