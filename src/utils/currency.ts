/**
 * Currency utility for Indian Rupee formats (Lakhs and Crores)
 * 1 Crore = 100 Lakhs = 10,000,000 INR
 * 1 Lakh = 100,000 INR
 */

export function getBidIncrement(currentPriceLakhs: number): number {
  if (currentPriceLakhs < 100) {
    // 20L to < 1Cr: 5 Lakhs increment per click
    return 5;
  } else if (currentPriceLakhs < 1000) {
    // 1Cr to < 10Cr: 25 Lakhs increment per click
    return 25;
  } else {
    // 10Cr onwards: 50 Lakhs increment per click
    return 50;
  }
}

export function formatLakhsToDisplay(lakhs: number, showDecimalsIfZero = false): string {
  if (lakhs === 0) return '₹0';
  
  if (lakhs >= 100) {
    const crores = lakhs / 100;
    const formatted = crores.toFixed(2).replace(/\.?0+$/, (m) => (showDecimalsIfZero ? m : ''));
    // If it ends with .0, make it clean
    const cleanCrores = crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(2).replace(/0$/, '');
    return `₹${cleanCrores} Cr`;
  }
  
  return `₹${lakhs} L`;
}

export function formatCroresOnly(lakhs: number): string {
  const crores = lakhs / 100;
  return `₹${crores.toFixed(2)} Cr`;
}

export function formatFullINR(lakhs: number): string {
  const inr = lakhs * 100000;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(inr);
}

export function parsePriceToLakhs(input: string | number): number {
  if (typeof input === 'number') return input;
  const cleaned = input.trim().toLowerCase().replace(/₹|,/g, '');
  if (cleaned.endsWith('cr') || cleaned.endsWith('crore') || cleaned.endsWith('crores')) {
    const val = parseFloat(cleaned.replace(/cr|crore|crores/g, '').trim());
    return isNaN(val) ? 20 : Math.round(val * 100);
  }
  if (cleaned.endsWith('l') || cleaned.endsWith('lakh') || cleaned.endsWith('lakhs')) {
    const val = parseFloat(cleaned.replace(/l|lakh|lakhs/g, '').trim());
    return isNaN(val) ? 20 : Math.round(val);
  }
  const numeric = parseFloat(cleaned);
  if (isNaN(numeric)) return 20;
  // If user entered a value > 10000, probably entered raw INR, convert to lakhs
  if (numeric >= 100000) {
    return Math.round(numeric / 100000);
  }
  return numeric;
}
