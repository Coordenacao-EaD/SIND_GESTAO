import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { promisify } from "node:util";

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createSafeDatabaseContext } from "../../src/database/safe-database-context.js";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const DBMATE_EXECUTABLE = require.resolve(
  `@dbmate/${process.platform}-${process.arch}/bin/dbmate${process.platform === "win32" ? ".exe" : ""}`,
);
const POSTGRES_IMAGE = "postgres:18.4-bookworm";

let container: StartedPostgreSqlContainer | undefined;
let client: Client | undefined;
let stopped = false;

async function stopInfrastructure(): Promise<void> {
  if (client) {
    await client.end();
    client = undefined;
  }
  if (container && !stopped) {
    await container.stop();
    stopped = true;
  }
}

describe("PostgreSQL infrastructure", () => {
  beforeAll(async () => {
    delete process.env.DATABASE_URL;
    container = await new PostgreSqlContainer(POSTGRES_IMAGE)
      .withDatabase("sind_gestao_test")
      .withUsername("sind_gestao_user")
      .withPassword("testcontainer_only")
      .start();
    client = new Client({
      host: container.getHost(),
      port: container.getPort(),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getPassword(),
      connectionTimeoutMillis: 10_000,
      statement_timeout: 10_000,
    });
    await client.connect();
  });

  afterAll(async () => {
    await stopInfrastructure();
  });

  it("DB-INF-001: starts PostgreSQL 18 and accepts a connection", async () => {
    expect(container).toBeDefined();
    expect(client).toBeDefined();
    const result = await client!.query<{ server_version: string }>("SHOW server_version");
    expect(result.rows[0]?.server_version).toMatch(/^18\./);
  });

  it("DB-INF-002: SELECT 1 returns the expected result", async () => {
    const result = await client!.query<{ value: number }>("SELECT 1::int AS value");
    expect(result.rows).toEqual([{ value: 1 }]);
  });

  it("DB-INF-003: pg sends dynamic values as PostgreSQL parameters", async () => {
    const dynamicValue = "parameterized-value";
    const result = await client!.query<{ value: string }>("SELECT $1::text AS value", [dynamicValue]);
    expect(result.rows).toEqual([{ value: dynamicValue }]);
  });

  it("DB-INF-005: test database does not require development DATABASE_URL", () => {
    expect(process.env.DATABASE_URL).toBeUndefined();
    expect(container?.getConnectionUri()).toMatch(/^postgres(?:ql)?:\/\//);
  });

  it("DB-INF-006: database diagnostics omit credentials", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const safeContext = createSafeDatabaseContext(container!.getConnectionUri());
    console.log("database-ready", safeContext);
    const output = JSON.stringify(consoleSpy.mock.calls);

    expect(output).not.toContain(container!.getUsername());
    expect(output).not.toContain(container!.getPassword());
    consoleSpy.mockRestore();
  });

  it("DB-INF-007: dbmate status uses the isolated database and project migrations", async () => {
    const databaseUrl = new URL(container!.getConnectionUri());
    databaseUrl.searchParams.set("sslmode", "disable");
    const { stdout, stderr } = await execFileAsync(
      DBMATE_EXECUTABLE,
      ["--migrations-dir", "db/migrations", "--schema-file", "db/schema.sql", "status"],
      {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: databaseUrl.toString() },
        windowsHide: true,
      },
    );
    const output = `${stdout}\n${stderr}`;
    expect(output).toContain("Applied: 0");
    expect(output).toContain("Pending: 1");
    expect(output).toContain("20260812170941_create_editorial_home_tables.sql");
  });

  it("DB-INF-004: closes the connection and stops the container", async () => {
    const activeClient = client!;
    await stopInfrastructure();
    await expect(activeClient.query("SELECT 1")).rejects.toThrow();
    expect(stopped).toBe(true);
  });
});
