export interface SafeDatabaseContext {
  protocol: "postgres:" | "postgresql:";
  host: string;
  port: string;
  database: string;
}

export function createSafeDatabaseContext(connectionString: string): SafeDatabaseContext {
  const parsed = new URL(connectionString);
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("Only PostgreSQL connection strings are supported.");
  }

  return {
    protocol: parsed.protocol,
    host: parsed.hostname,
    port: parsed.port || "5432",
    database: parsed.pathname.replace(/^\//, ""),
  };
}
