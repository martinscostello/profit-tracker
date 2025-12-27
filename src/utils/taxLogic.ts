import type { Sale, Expense, TaxSettings } from "../types";

// Official VAT Exempt Items (Finance Act 2020/2026 consideration)
// Broad categories: Basic Food Items, Medical and Pharmaceutical Products, Books and Educational Materials, Baby Products, Fertilizer and Farming.
const EXEMPT_KEYWORDS = [
    // Basic Food
    "rice", "garri", "yam", "cassava", "beans", "flour", "bread", "milk", "vegetable", "fruit",
    "meat", "fish", "poultry", "water", "honey", "salt", "sugar", "egg", "tomato", "pepper", "onion",
    // Agricultural
    "fertilizer", "seed", "farming", "feed",
    // Medical
    "drug", "medicine", "pharmacy", "medical", "health", "doctor", "consultation", "hospital",
    // Education
    "book", "paper", "pen", "pencil", "school", "education",
    // Baby
    "baby", "diaper", "infant", "formula"
];

export function isProductExempt(productName: string): boolean {
    const lowerName = (productName || "").toLowerCase();
    return EXEMPT_KEYWORDS.some(keyword => lowerName.includes(keyword));
}

export interface TaxResult {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    exemptSales: number;
    taxableSales: number;
    vatAmount: number;
    incomeTaxAmount: number;
    taxType: 'PIT' | 'CIT';
    isVatExemptByTurnover: boolean;
    isCitExemptByTurnover: boolean;
    turnoverStatus: 'MICRO' | 'SMALL' | 'MEDIUM';
    taxSavings: number;
    exemptItems: { name: string; amount: number; reason: string }[];
    taxableItems: { name: string; amount: number; reason: string }[];
    // New fields for messaging
    taxPayableNow: number;
    taxAccumulated: number;
    message: string;
}

export function calculateTax(
    sales: Sale[],
    expenses: Expense[],
    settings: TaxSettings | undefined,
    annualTurnover: number = 0
): TaxResult {
    const formatSettings = settings || {
        businessType: 'SOLO',
        hasExemptItems: 'IDK'
    };

    const isLimited = formatSettings.businessType === 'LIMITED';

    // Thresholds
    const THRESHOLD_VAT = 25000000; // 25 Million
    const THRESHOLD_CIT = 50000000; // 50 Million

    // 1. Calculate Period Totals
    const totalRevenue = sales.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    // 2. Identify Turnover Status
    let turnoverStatus: 'MICRO' | 'SMALL' | 'MEDIUM' = 'MICRO';
    if (annualTurnover >= THRESHOLD_CIT) turnoverStatus = 'MEDIUM';
    else if (annualTurnover >= THRESHOLD_VAT) turnoverStatus = 'SMALL';

    const isVatExemptByTurnover = annualTurnover < THRESHOLD_VAT;
    // CIT exemption only applies to Limited Companies under 25M (Finance Act) or 50M? 
    // Small Companies (<25M) = 0% CIT. Medium (25-100) = 20%. Large (>100) = 30%.
    // We will use 25M as the 0% CIT threshold for consistency with "Small Company".
    // Actually Finance Act says <25M turnover is exempt from CIT.
    const isCitExemptByTurnover = annualTurnover < 25000000;

    // 3. Determine Exempt/Taxable Sales (Product-based)
    let exemptSales = 0;
    let taxableSales = 0;
    const exemptItems: { name: string; amount: number; reason: string }[] = [];
    const taxableItems: { name: string; amount: number; reason: string }[] = [];

    if (formatSettings.hasExemptItems === 'YES') {
        sales.forEach(sale => {
            if (isProductExempt(sale.productName)) {
                exemptSales += sale.revenue;
                exemptItems.push({
                    name: sale.productName,
                    amount: sale.revenue,
                    reason: 'Matches exempt category (Food/Medical)'
                });
            } else {
                taxableSales += sale.revenue;
                taxableItems.push({
                    name: sale.productName,
                    amount: sale.revenue,
                    reason: 'Standard Taxable Item'
                });
            }
        });
    } else {
        taxableSales = totalRevenue;
        sales.forEach(sale => {
            taxableItems.push({
                name: sale.productName,
                amount: sale.revenue,
                reason: 'Standard Taxable Item'
            });
        });
    }

    // 4. VAT Calculation (7.5%)
    // If exempt by turnover, VAT is 0.
    let vatAmount = 0;
    if (!isVatExemptByTurnover) {
        vatAmount = taxableSales * 0.075;
    }

    // 5. Income Tax (CIT/PIT)
    const taxType = isLimited ? 'CIT' : 'PIT';
    let incomeTaxAmount = 0;
    let effectiveTaxRate = 0;
    let taxPayableNow = 0;
    let taxAccumulated = 0;
    let message = '';

    if (isLimited) {
        // LIMITED COMPANY (LLC)
        if (isCitExemptByTurnover) {
            // Case 1: LLC < 25M -> 0% CIT
            incomeTaxAmount = 0;
            taxPayableNow = vatAmount; // Only VAT if applicable (likely 0 too if <25M)
            message = "You are likely exempt from Company Income Tax as a small company.";
        } else {
            // Case: LLC > 25M -> 20% CIT estimated
            effectiveTaxRate = 0.20;
            incomeTaxAmount = Math.max(0, netProfit * effectiveTaxRate);
            taxPayableNow = vatAmount; // VAT is monthly
            taxAccumulated = incomeTaxAmount; // CIT is annual
            message = "CIT accumulates annually. VAT is due monthly.";
        }
    } else {
        // BUSINESS NAME / SOLE TRADER
        // Case 2 & 3: PIT applies regardless of turnover size, based on table.
        // Simplified estimate: 5% of profit seems fair for "cumulative estimate"
        effectiveTaxRate = 0.05; // Conservative low estimate
        incomeTaxAmount = Math.max(0, netProfit * effectiveTaxRate);

        taxPayableNow = vatAmount; // VAT if applicable
        taxAccumulated = incomeTaxAmount; // PIT is annual/assessed
        message = "Personal Income Tax accumulates annually. VAT is due monthly.";
    }

    // 6. Calculate Tax Savings
    const taxSavings = totalExpenses * effectiveTaxRate;

    return {
        totalRevenue,
        totalExpenses,
        netProfit,
        exemptSales,
        taxableSales,
        vatAmount,
        incomeTaxAmount,
        taxType,
        isVatExemptByTurnover,
        isCitExemptByTurnover,
        turnoverStatus,
        taxSavings,
        exemptItems,
        taxableItems,
        taxPayableNow,
        taxAccumulated,
        message
    };
}
