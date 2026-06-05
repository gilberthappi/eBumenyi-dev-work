import { prisma } from "../../utils/client";

const MAX_ROWS = 200;

/**
 * Runs a validated read-only SQL query and returns rows as JSON-serializable array.
 */
export async function runReadOnlyQuery(sql: string): Promise<string> {
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(sql);
  const arr = Array.isArray(rows) ? rows.slice(0, MAX_ROWS) : [];
  const out = arr.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      obj[k] = v instanceof Date ? v.toISOString() : v;
    }
    return obj;
  });
  return JSON.stringify(out);
}
