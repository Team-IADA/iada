import { neon, Pool } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;
function getSql() {
  if (!_sql) _sql = neon(process.env.POSTGRES_URL!);
  return _sql;
}

// Typed wrapper so callers can use sql<MyType>`...` as before
export function sql<T extends Record<string, unknown> = Record<string, unknown>>(
  strings: TemplateStringsArray,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...values: any[]
): Promise<T[]> {
  return getSql()(strings, ...values) as Promise<T[]>;
}

export const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
