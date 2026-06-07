// utils/formatters.ts — Common formatting utilities

/**
 * Format a number as Indian Rupee currency.
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a date string as a human-readable date.
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

/**
 * Format a date string as date + time.
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Generate a bill number from an ID.
 * Example: BILL-2024-001
 */
export const formatBillNumber = (id: number): string => {
  const year = new Date().getFullYear();
  return `BILL-${year}-${String(id).padStart(4, '0')}`;
};

/**
 * Truncate text with ellipsis.
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format a phone number for display.
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

/**
 * Get stock status label and color.
 */
export const getStockStatus = (
  current: number,
  threshold: number
): { label: string; color: string } => {
  if (current === 0) return { label: 'Out of Stock', color: '#C62828' };
  if (current <= threshold) return { label: 'Low Stock', color: '#F57C00' };
  return { label: 'In Stock', color: '#2E7D32' };
};
