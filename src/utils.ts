/**
 * Normalizes an Ethiopian phone number into standard format (e.g. 251911234567 or 251712345678).
 * Strips spaces, dashes, plus signs, and formats leading 0s or 9/7 numbers.
 */
export function normalizeETPhone(phone: string): string {
  if (!phone) return '';
  
  // Strip everything that is not a digit
  const cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 0 (e.g., 0911234567 or 0712345678)
  if (cleaned.startsWith('0')) {
    return '251' + cleaned.slice(1);
  }
  
  // If it starts with 251
  if (cleaned.startsWith('251')) {
    return cleaned;
  }
  
  // If it starts with 9 or 7 and is 9 digits long (e.g., 911234567)
  if ((cleaned.startsWith('9') || cleaned.startsWith('7')) && cleaned.length === 9) {
    return '251' + cleaned;
  }
  
  return cleaned;
}

/**
 * Formats a normalized Ethiopian phone number into a readable international string (+251 91 123 4567).
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizeETPhone(phone);
  if (normalized.startsWith('251') && normalized.length === 12) {
    const code = normalized.slice(0, 3);
    const prefix = normalized.slice(3, 5);
    const mid = normalized.slice(5, 8);
    const end = normalized.slice(8);
    return `+${code} ${prefix} ${mid} ${end}`;
  }
  return phone;
}

/**
 * Converts a phone number (local Ethiopian or E.164) into international E.164 format (+251911234567).
 */
export function formatToE164(phone: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) return trimmed;
  
  const normalized = normalizeETPhone(trimmed);
  if (!normalized) return '';
  return `+${normalized}`;
}

/**
 * Formats currency in Ethiopian Birr (ETB).
 */
export function formatETB(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ETB';
}

/**
 * Calculates days overdue from a nextBillingDate string (YYYY-MM-DD).
 * Returns 0 if not past due or invalid.
 */
export function calculateDaysOverdue(nextBillingDate: string): number {
  if (!nextBillingDate) return 0;
  const billingDate = new Date(nextBillingDate);
  const today = new Date();
  
  billingDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - billingDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}
