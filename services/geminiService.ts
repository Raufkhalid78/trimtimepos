
import { GoogleGenAI } from "@google/genai";
import { Sale, Expense, BusinessType } from "../types";

// Use Vite's import.meta.env to access GEMINI_API_KEY
const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function getFinancialInsights(sales: Sale[], expenses: Expense[], businessType?: BusinessType) {
  // Using gemini-2.0-flash for general business analysis tasks
  const model = 'gemini-2.0-flash';
  
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const profit = totalRevenue - totalExpenses;

  const businessLabel = businessType === 'barbershop' 
    ? 'Barber Shop' 
    : businessType === 'beauty_salon' 
    ? 'Beauty Salon' 
    : 'Barber Shop & Beauty Salon';
  
  const prompt = `
    As a business consultant for a ${businessLabel}, analyze the following financial data:
    Total Revenue: $${totalRevenue}
    Total Expenses: $${totalExpenses}
    Net Profit: $${profit}
    
    Number of Sales: ${sales.length}
    Recent Expenses: ${expenses.slice(0, 5).map(e => `${e.category}: $${e.amount}`).join(', ')}
    
    Please provide:
    1. A short summary of the financial health.
    2. Three actionable tips to increase revenue or reduce costs.
    3. An observation on sales volume vs expenses.
    
    Return the response in a clean, professional format.
  `;

  try {
    // Generate content using the recommended structure
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    // Accessing .text as a property, not a method
    return response.text || "No insights could be generated.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Unable to generate insights at this time. Please check your data or try again later.";
  }
}
