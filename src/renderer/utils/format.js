export function formatCurrency(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '₹0.00';
  return `₹${value.toFixed(2)}`;
}
