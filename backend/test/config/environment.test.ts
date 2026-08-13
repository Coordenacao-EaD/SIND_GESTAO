import { describe, expect, it } from "vitest";

import { readDatabaseEnvironment } from "../../src/config/environment.js";

describe("database environment", () => {
  it("validates configuration only when a connection is requested", () => {
    expect(() => readDatabaseEnvironment({ NODE_ENV: "test" })).toThrow("DATABASE_URL is required");
  });

  it("accepts a PostgreSQL URL without exposing it in an error", () => {
    const databaseUrl = "postgresql://example:example@127.0.0.1:5432/example";
    expect(readDatabaseEnvironment({ NODE_ENV: "test", DATABASE_URL: databaseUrl })).toEqual({
      nodeEnvironment: "test",
      databaseUrl,
    });
  });

  it("rejects unsupported protocols", () => {
    expect(() =>
      readDatabaseEnvironment({ NODE_ENV: "test", DATABASE_URL: "https://example.invalid/database" }),
    ).toThrow("PostgreSQL protocol");
  });
});
