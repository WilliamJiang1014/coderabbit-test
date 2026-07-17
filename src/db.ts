import { createPool, Pool } from 'mysql2/promise';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'users_db',
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

/** Required options for every database query. */
export interface QueryOptions {
  /** Caller-provided timeout in milliseconds. */
  timeoutMs: number;
  /** Logical name of the caller for tracing. */
  caller: string;
}

/**
 * Execute a parameterized SQL query.
 * Breaking change: `options` is now required (was previously optional/absent).
 */
export async function query<T>(
  sql: string,
  params: unknown[] | undefined,
  options: QueryOptions
): Promise<T[]> {
  if (!options || typeof options.timeoutMs !== 'number' || !options.caller) {
    throw new Error('query() requires options: { timeoutMs, caller }');
  }

  const conn = await getPool().getConnection();
  try {
    const [rows] = await conn.execute(sql, params);
    return rows as T[];
  } finally {
    conn.release();
  }
}
