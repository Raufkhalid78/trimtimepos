import { Sale, Expense, BusinessType } from "../types";
import { format, startOfMonth, subMonths } from "date-fns";
import { supabase } from "../supabaseClient";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTopServices(sales: Sale[], topN = 5): string {
  const tally: Record<string, { revenue: number; count: number }> = {};
  sales.forEach(sale => {
    if (sale.isRefunded) return;
    sale.items
      .filter(i => i.type === 'service')
      .forEach(i => {
        if (!tally[i.name]) tally[i.name] = { revenue: 0, count: 0 };
        tally[i.name].revenue += i.price * i.quantity;
        tally[i.name].count += i.quantity;
      });
  });
  return Object.entries(tally)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, topN)
    .map(([name, { revenue, count }]) => `${name} ($${revenue.toFixed(2)}, ${count}x)`)
    .join(', ') || 'No service data';
}

function getTopExpenseCategories(expenses: Expense[], topN = 3): string {
  const tally: Record<string, number> = {};
  expenses.forEach(e => {
    tally[e.category] = (tally[e.category] || 0) + e.amount;
  });
  return Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
    .join(', ') || 'No expense data';
}

function getBusiestDay(sales: Sale[]): string {
  const dayTally: Record<string, number> = {};
  sales.forEach(sale => {
    const day = format(new Date(sale.timestamp), 'EEEE');
    dayTally[day] = (dayTally[day] || 0) + 1;
  });
  const sorted = Object.entries(dayTally).sort((a, b) => b[1] - a[1]);
  return sorted[0] ? `${sorted[0][0]} (${sorted[0][1]} sales)` : 'Not enough data';
}

function getMonthlyTrend(sales: Sale[]): string {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));

  const thisMonth = sales
    .filter(s => !s.isRefunded && new Date(s.timestamp) >= thisMonthStart)
    .reduce((acc, s) => acc + s.total, 0);
  const lastMonth = sales
    .filter(s => {
      const d = new Date(s.timestamp);
      return !s.isRefunded && d >= lastMonthStart && d < thisMonthStart;
    })
    .reduce((acc, s) => acc + s.total, 0);

  const change = lastMonth > 0
    ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1)
    : 'N/A';
  return `This month: $${thisMonth.toFixed(2)} | Last month: $${lastMonth.toFixed(2)} | Change: ${change}%`;
}

// ── Main Export ───────────────────────────────────────────────────────────────

export async function getFinancialInsights(
  sales: Sale[],
  expenses: Expense[],
  businessType?: BusinessType
): Promise<string> {
  const activeSales = sales.filter(s => !s.isRefunded);
  const totalRevenue = activeSales.reduce((acc, s) => acc + s.total, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const profit = totalRevenue - totalExpenses;
  const avgSaleValue = activeSales.length > 0 ? (totalRevenue / activeSales.length) : 0;

  const businessLabel =
    businessType === 'barbershop' ? 'Barber Shop'
      : businessType === 'beauty_salon' ? 'Beauty Salon'
        : 'Barber Shop & Beauty Salon';

  const prompt = `
You are a business consultant specializing in grooming and beauty salons. Analyze the following data for a ${businessLabel} and give actionable, specific advice.

--- FINANCIAL SUMMARY ---
Total Revenue: $${totalRevenue.toFixed(2)}
Total Expenses: $${totalExpenses.toFixed(2)}
Net Profit: $${profit.toFixed(2)}
Profit Margin: ${totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0}%

--- SALES ANALYSIS ---
Total Transactions: ${activeSales.length}
Average Sale Value: $${avgSaleValue.toFixed(2)}
Busiest Day: ${getBusiestDay(activeSales)}
Monthly Trend: ${getMonthlyTrend(sales)}

--- TOP SERVICES BY REVENUE ---
${getTopServices(activeSales)}

--- TOP EXPENSE CATEGORIES ---
${getTopExpenseCategories(expenses)}

--- INSTRUCTIONS ---
Please provide in a clean, professional format:
1. **Financial Health Summary** (2-3 sentences, be specific with the numbers)
2. **3 Actionable Revenue Tips** (specific to a grooming business at this revenue level)
3. **1 Cost Reduction Opportunity** (based on the expense data above)
4. **Key Insight** (one surprising or important observation from the data)

Keep the total response under 350 words. Use markdown formatting with bold headers.
  `.trim();

  try {
    const { data, error } = await supabase.functions.invoke('hyper-responder', {
      body: { prompt }
    });

    if (error) {
      console.error("Supabase Edge Function Error:", error);
      throw error;
    }

    return data.text || "No insights could be generated.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Unable to generate insights at this time. Please check your network or try again later.";
  }
}

/**
 * AI Assistant helper for POS checkout cross-sell suggestions.
 */
export function getPredictiveCrossSell(cartItemsName: string[], businessType?: string): string {
  const lowerNames = cartItemsName.map(n => n.toLowerCase());
  const isBarber = businessType === 'barbershop' || lowerNames.some(n => n.includes('beard') || n.includes('haircut') || n.includes('fade'));

  if (lowerNames.some(n => n.includes('beard') || n.includes('shave'))) {
    return '💡 AI Suggestion: Recommend Organic Beard Oil or Conditioning Balm ($15)';
  }
  if (lowerNames.some(n => n.includes('color') || n.includes('highlight') || n.includes('dye'))) {
    return '💡 AI Suggestion: Recommend Color Protect Shampoo & Treatment Serum ($22)';
  }
  if (lowerNames.some(n => n.includes('haircut') || n.includes('styling') || n.includes('cut'))) {
    return isBarber
      ? '💡 AI Suggestion: Recommend Matte Hair Clay or Styling Pomade ($18)'
      : '💡 AI Suggestion: Recommend Heat Protectant Spray or Argan Hair Oil ($24)';
  }
  return '💡 AI Suggestion: Offer $10 Add-on Hair Scalp Treatment or Hydration Mask';
}

/**
 * Analyzes unbooked customers to identify churning clients.
 */
export function getRetentionRadar(customers: any[], sales: any[]): { count: number; overdueCustomers: any[] } {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const activeCustomerIds = new Set(
    sales
      .filter(s => new Date(s.timestamp) >= sixtyDaysAgo && s.customerId)
      .map(s => s.customerId)
  );

  const overdue = customers.filter(c => !activeCustomerIds.has(c.id));
  return {
    count: overdue.length,
    overdueCustomers: overdue.slice(0, 5)
  };
}


