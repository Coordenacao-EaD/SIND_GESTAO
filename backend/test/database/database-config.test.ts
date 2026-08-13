import { describe, expect, it } from "vitest";

import { buildPoolConfig, DATABASE_TIMEOUTS_MS } from "../../src/database/pool.js";
import { createSafeDatabaseContext } from "../../src/database/safe-database-context.js";

describe("database bootstrap configuration", () => {
  it("defines bounded pool and query timeouts", () => {
    const connectionString = "postgresql://example:secret@localhost:5432/example";
    const config = buildPoolConfig({ nodeEnvironment: "test", databaseUrl: connectionString });

    expect(config).toMatchObject({
      connectionString,
      max: 10,
      connectionTimeoutMillis: DATABASE_TIMEOUTS_MS.connection,
      query_timeout: DATABASE_TIMEOUTS_MS.query,
      statement_timeout: DATABASE_TIMEOUTS_MS.statement,
    });
  });

  it("creates log-safe connection metadata without credentials", () => {
    const context = createSafeDatabaseContext(
      "postgresql://sensitive-user:sensitive-password@localhost:5432/example",
    );
    const serialized = JSON.stringify(context);

    expect(context).toEqual({
      protocol: "postgresql:",
      host: "localhost",
      port: "5432",
      database: "example",
    });
    expect(serialized).not.toContain("sensitive-user");
    expect(serialized).not.toContain("sensitive-password");
  });
});
