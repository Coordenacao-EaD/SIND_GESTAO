import type { Pool, PoolClient } from "pg";

export type QueryExecutor = Pick<Pool, "query">;

export async function withTransaction<T>(
  pool: Pool,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // The operation error is the caller-relevant failure and must not be replaced.
    }
    throw error;
  } finally {
    client.release();
  }
}
