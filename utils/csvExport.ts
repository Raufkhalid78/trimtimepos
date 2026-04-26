/**
 * utils/csvExport.ts
 *
 * Utility functions for exporting data to CSV files.
 * Works in the browser using Blob + object URLs — no server needed.
 *
 * Usage:
 *   import { exportSalesToCsv, exportExpensesToCsv } from '../utils/csvExport';
 *   exportSalesToCsv(sales, staff, 'my-shop-sales');
 */

import { Sale, Expense, Staff } from '../types';
import { format } from 'date-fns';

// ── Generic CSV engine ────────────────────────────────────────────────────────

function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const escape = (val: unknown) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const csv = [
    headers.map(escape).join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Domain-specific exports ───────────────────────────────────────────────────

/**
 * Export the sales list as a CSV file.
 */
export function exportSalesToCsv(
  sales: Sale[],
  staffList: Staff[],
  shopName = 'trimtime'
): void {
  const staffMap = Object.fromEntries(staffList.map(s => [s.id, s.name]));

  const rows = sales.map(s => ({
    'Date': format(new Date(s.timestamp), 'yyyy-MM-dd'),
    'Time': format(new Date(s.timestamp), 'HH:mm'),
    'Sale ID': s.id,
    'Staff': staffMap[s.staffId] || s.staffName || s.staffId,
    'Customer': s.customerName || 'Walk-in',
    'Items': s.items.map(i => `${i.name} x${i.quantity}`).join('; '),
    'Subtotal': s.subtotal.toFixed(2),
    'Discount': s.discount.toFixed(2),
    'Tax': s.tax.toFixed(2),
    'Total': s.total.toFixed(2),
    'Payment Method': s.paymentMethod,
    'Refunded': s.isRefunded ? 'Yes' : 'No',
  }));

  downloadCsv(`${shopName}-sales-${format(new Date(), 'yyyy-MM-dd')}`, rows);
}

/**
 * Export the expenses list as a CSV file.
 */
export function exportExpensesToCsv(
  expenses: Expense[],
  shopName = 'trimtime'
): void {
  const rows = expenses.map(e => ({
    'Date': e.date,
    'Category': e.category,
    'Description': e.description,
    'Amount': e.amount.toFixed(2),
  }));

  downloadCsv(`${shopName}-expenses-${format(new Date(), 'yyyy-MM-dd')}`, rows);
}

/**
 * Export a generic summary report as CSV.
 * Pass any array of flat objects.
 */
export function exportToCsv(
  filename: string,
  rows: Record<string, unknown>[]
): void {
  downloadCsv(filename, rows);
}
