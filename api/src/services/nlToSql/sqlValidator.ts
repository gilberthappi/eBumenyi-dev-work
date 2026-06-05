/**
 * Validates that a generated SQL string is read-only and safe to run.
 * Only allows a single SELECT statement.
 */
const FORBIDDEN_WORDS = [
  "insert",
  "update",
  "delete",
  "drop",
  "truncate",
  "create",
  "alter",
  "grant",
  "revoke",
  "execute",
  "exec",
];

export type ValidateResult = { ok: true } | { ok: false; error: string };

export function validateReadOnlySql(sql: string): ValidateResult {
  const trimmed = sql.trim();
  if (!trimmed) return { ok: false, error: "Empty query" };
  const upper = trimmed.toUpperCase();
  if (!upper.startsWith("SELECT") && !upper.startsWith("WITH")) {
    return { ok: false, error: "Only SELECT (or WITH) queries are allowed" };
  }
  const lower = trimmed.toLowerCase();
  for (const w of FORBIDDEN_WORDS) {
    if (lower.includes(w))
      return { ok: false, error: "Query contains forbidden keywords" };
  }
  const semi = trimmed.indexOf(";");
  if (semi >= 0 && trimmed.slice(semi + 1).trim().length > 0) {
    return { ok: false, error: "Multiple statements not allowed" };
  }
  return { ok: true };
}
