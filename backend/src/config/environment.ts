export const NODE_ENVIRONMENTS = ["development", "test", "production"] as const;

export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

export interface DatabaseEnvironment {
  nodeEnvironment: NodeEnvironment;
  databaseUrl: string;
}

function readNodeEnvironment(value: string | undefined): NodeEnvironment {
  const candidate = value ?? "development";
  if (isNodeEnvironment(candidate)) return candidate;
  throw new Error("NODE_ENV must be development, test, or production.");
}

function isNodeEnvironment(value: string): value is NodeEnvironment {
  return NODE_ENVIRONMENTS.some((environment) => environment === value);
}

function validateDatabaseUrl(value: string | undefined): string {
  if (!value) throw new Error("DATABASE_URL is required when a database connection is created.");

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL.");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use the PostgreSQL protocol.");
  }
  if (!parsed.hostname || parsed.pathname === "/" || parsed.pathname === "") {
    throw new Error("DATABASE_URL must identify a host and database.");
  }
  return value;
}

export function readDatabaseEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): DatabaseEnvironment {
  return {
    nodeEnvironment: readNodeEnvironment(environment.NODE_ENV),
    databaseUrl: validateDatabaseUrl(environment.DATABASE_URL),
  };
}
