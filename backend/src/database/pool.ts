import { Pool, type PoolConfig } from "pg";

import type { DatabaseEnvironment } from "../config/environment.js";

export const DATABASE_TIMEOUTS_MS = {
  connection: 5_000,
  idle: 10_000,
  query: 10_000,
  statement: 10_000,
  idleInTransaction: 10_000,
} as const;

export function buildPoolConfig(environment: DatabaseEnvironment): PoolConfig {
  return {
    connectionString: environment.databaseUrl,
    application_name: "sind-gestao-backend",
    max: 10,
    connectionTimeoutMillis: DATABASE_TIMEOUTS_MS.connection,
    idleTimeoutMillis: DATABASE_TIMEOUTS_MS.idle,
    query_timeout: DATABASE_TIMEOUTS_MS.query,
    statement_timeout: DATABASE_TIMEOUTS_MS.statement,
    idle_in_transaction_session_timeout: DATABASE_TIMEOUTS_MS.idleInTransaction,
  };
}

export function createDatabasePool(environment: DatabaseEnvironment): Pool {
  return new Pool(buildPoolConfig(environment));
}

export async function closeDatabasePool(pool: Pool): Promise<void> {
  await pool.end();
}
