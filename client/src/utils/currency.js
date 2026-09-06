/**
 * Formats a numeric value into Indian Rupee currency format (e.g. ₹1,00,000).
 */
export function formatCurrency(amount, includeDecimals = false) {
  const num = Number(amount);
  if (isNaN(num)) return '₹0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(num);
}

/**
 * Formats a plain number with Indian separators without the currency symbol.
 */
export function formatNumber(amount) {
  const num = Number(amount);
  if (isNaN(num)) return '0';

  return new Intl.NumberFormat('en-IN').format(num);
}
