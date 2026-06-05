/**
 * Normalize a Rwanda mobile number to E.164 (+2507XXXXXXXX).
 *
 * Examples:
 * - +250784600762 → +250784600762
 * - 250784600762  → +250784600762
 * - 0784600762    → +250784600762
 * - 784600762     → +250784600762
 */
export function normalizeRwandaPhone(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (digits.startsWith("250") && digits.length >= 12) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length >= 9) {
    return `+250${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `+250${digits}`;
  }
  if (trimmed.startsWith("+")) {
    return trimmed;
  }
  return digits.length > 0 ? `+${digits}` : trimmed;
}
