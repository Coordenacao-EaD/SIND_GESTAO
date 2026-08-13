import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { promisify } from "node:util";

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const DBMATE_EXECUTABLE = require.resolve(
  `@dbmate/${process.platform}-${process.arch}/bin/dbmate${process.platform === "win32" ? ".exe" : ""}`,
);
const MIGRATION_FILE = "20260812170941_create_editorial_home_tables.sql";
const POSTGRES_IMAGE = "postgres:18.4-bookworm";
const ACTOR_ID = "10000000-0000-4000-8000-000000000001";
const UNKNOWN_ACTOR_ID = "10000000-0000-4000-8000-000000000099";
const SOCIAL_CONFIGURATION_ID = "20000000-0000-4000-8000-000000000001";
const UNKNOWN_CONFIGURATION_ID = "20000000-0000-4000-8000-000000000099";
const EDITORIAL_TABLES = [
  "app_users",
  "site_home_banners",
  "site_public_contacts",
  "site_social_configurations",
  "site_social_links",
] as const;

let container: StartedPostgreSqlContainer | undefined;
let client: Client | undefined;
let databaseUrl: string;

async function runDbmate(command: "status" | "up" | "down"): Promise<string> {
  const { stdout, stderr } = await execFileAsync(
    DBMATE_EXECUTABLE,
    [
      "--migrations-dir",
      "db/migrations",
      "--schema-file",
      "db/schema.sql",
      "--no-dump-schema",
      command,
    ],
    {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      windowsHide: true,
    },
  );
  return `${stdout}\n${stderr}`;
}

async function expectDatabaseConstraint(
  text: string,
  values: readonly unknown[],
  constraint: string,
): Promise<void> {
  let databaseError: unknown;
  try {
    await client!.query(text, [...values]);
  } catch (error) {
    databaseError = error;
  }
  expect(databaseError).toMatchObject({ constraint });
}

async function tableNames(): Promise<string[]> {
  const result = await client!.query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      ORDER BY table_name`,
    [[...EDITORIAL_TABLES]],
  );
  return result.rows.map((row) => row.table_name);
}

describe("F3.1B2 editorial migrations", () => {
  beforeAll(async () => {
    delete process.env.DATABASE_URL;
    container = await new PostgreSqlContainer(POSTGRES_IMAGE)
      .withDatabase("sind_gestao_migrations_test")
      .withUsername("sind_gestao_migrations_user")
      .withPassword("testcontainer_migrations_only")
      .start();
    const url = new URL(container.getConnectionUri());
    url.searchParams.set("sslmode", "disable");
    databaseUrl = url.toString();
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
    if (client) {
      await client.end();
      client = undefined;
    }
    if (container) {
      await container.stop();
      container = undefined;
    }
  });

  it("MIG-B2-001: starts clean and reports the project migrations as pending", async () => {
    expect(process.env.DATABASE_URL).toBeUndefined();
    expect(await tableNames()).toEqual([]);
    const status = await runDbmate("status");
    expect(status).toContain(MIGRATION_FILE);
    expect(status).toContain("Applied: 0");
    expect(status).toContain("Pending: 2");

    await client!.query("CREATE TABLE migration_scope_sentinel (id integer PRIMARY KEY)");
    await client!.query("INSERT INTO migration_scope_sentinel (id) VALUES (1)");
  });

  it("MIG-B2-002: up creates the five tables with UUIDs, timestamps, FKs, constraints and indexes", async () => {
    const up = await runDbmate("up");
    expect(up).toContain(MIGRATION_FILE);
    expect(await tableNames()).toEqual([...EDITORIAL_TABLES].sort());

    const status = await runDbmate("status");
    expect(status).toContain("Applied: 2");
    expect(status).toContain("Pending: 0");

    const idColumns = await client!.query<{
      table_name: string;
      data_type: string;
      column_default: string;
    }>(
      `SELECT table_name, data_type, column_default
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])
          AND column_name = 'id'
        ORDER BY table_name`,
      [[...EDITORIAL_TABLES]],
    );
    expect(idColumns.rows).toHaveLength(5);
    for (const column of idColumns.rows) {
      expect(column.data_type).toBe("uuid");
      expect(column.column_default).toContain("gen_random_uuid()");
    }

    const timestampColumns = await client!.query<{
      data_type: string;
      datetime_precision: number;
    }>(
      `SELECT data_type, datetime_precision
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])
          AND column_name LIKE '%\\_at' ESCAPE '\\'`,
      [[...EDITORIAL_TABLES]],
    );
    expect(timestampColumns.rows).toHaveLength(15);
    for (const column of timestampColumns.rows) {
      expect(column.data_type).toBe("timestamp with time zone");
      expect(column.datetime_precision).toBe(3);
    }

    const foreignKeys = await client!.query<{ delete_action: string; update_action: string }>(
      `SELECT rc.delete_rule AS delete_action, rc.update_rule AS update_action
         FROM information_schema.referential_constraints rc
        JOIN information_schema.table_constraints tc
          ON tc.constraint_schema = rc.constraint_schema
         AND tc.constraint_name = rc.constraint_name
        WHERE rc.constraint_schema = 'public'
          AND rc.constraint_name LIKE 'fk_%'
          AND tc.table_name = ANY($1::text[])`,
      [[...EDITORIAL_TABLES]],
    );
    expect(foreignKeys.rows).toHaveLength(9);
    expect(foreignKeys.rows).toEqual(
      expect.arrayContaining(
        Array.from({ length: 9 }, () => ({ delete_action: "RESTRICT", update_action: "RESTRICT" })),
      ),
    );

    const objectNames = await client!.query<{ name: string }>(
      `SELECT conname AS name FROM pg_constraint WHERE connamespace = 'public'::regnamespace
       UNION ALL
       SELECT indexname AS name FROM pg_indexes WHERE schemaname = 'public'`,
    );
    const names = objectNames.rows.map((row) => row.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "ck_site_home_banners__cta",
        "uq_site_home_banners__version_number",
        "ux_site_home_banners__published",
        "ck_site_public_contacts__postal_code",
        "uq_site_public_contacts__version_number",
        "ux_site_public_contacts__published",
        "ck_site_social_configurations__published_at",
        "uq_site_social_configurations__version_number",
        "ux_site_social_configurations__published",
        "uq_site_social_links__social_configuration_id_platform",
        "ix_site_social_links__config_active_order_id",
      ]),
    );

    const followUpTables = await client!.query<{ name: string | null }>(
      "SELECT to_regclass('public.site_home_reviews')::text AS name UNION ALL SELECT to_regclass('public.site_home_versions')::text",
    );
    expect(followUpTables.rows).toEqual([
      { name: "site_home_reviews" },
      { name: "site_home_versions" },
    ]);
  });

  it("MIG-B2-003: database constraints reject invalid editorial data", async () => {
    const actor = await client!.query<{ status: string; created_at: Date; updated_at: Date }>(
      "INSERT INTO app_users (id) VALUES ($1) RETURNING status, created_at, updated_at",
      [ACTOR_ID],
    );
    expect(actor.rows[0]?.status).toBe("active");
    expect(actor.rows[0]?.created_at).toBeInstanceOf(Date);
    expect(actor.rows[0]?.updated_at).toBeInstanceOf(Date);

    await client!.query(
      `INSERT INTO site_home_banners
         (title, body_text, status, version_number, created_by)
       VALUES ('Banner principal', 'Conteúdo válido do banner', 'published', 1, $1)`,
      [ACTOR_ID],
    );
    await expectDatabaseConstraint(
      `INSERT INTO site_home_banners (title, body_text, version_number, created_by)
       VALUES ('Ator inválido', 'Conteúdo válido do banner', 2, $1)`,
      [UNKNOWN_ACTOR_ID],
      "fk_site_home_banners__app_users__created_by",
    );
    await expectDatabaseConstraint(
      `INSERT INTO site_home_banners (title, body_text, status, version_number, created_by)
       VALUES ('Status inválido', 'Conteúdo válido do banner', 'invalid', 2, $1)`,
      [ACTOR_ID],
      "ck_site_home_banners__status",
    );
    await expectDatabaseConstraint(
      `INSERT INTO site_home_banners (title, body_text, version_number, created_by)
       VALUES ('Versão inválida', 'Conteúdo válido do banner', 0, $1)`,
      [ACTOR_ID],
      "ck_site_home_banners__version_number",
    );
    await expectDatabaseConstraint(
      `INSERT INTO site_home_banners (title, body_text, version_number, created_by)
       VALUES ('Versão duplicada', 'Conteúdo válido do banner', 1, $1)`,
      [ACTOR_ID],
      "uq_site_home_banners__version_number",
    );
    await expectDatabaseConstraint(
      `INSERT INTO site_home_banners (title, body_text, status, version_number, created_by)
       VALUES ('Segundo publicado', 'Conteúdo válido do banner', 'published', 2, $1)`,
      [ACTOR_ID],
      "ux_site_home_banners__published",
    );
    await expectDatabaseConstraint(
      `INSERT INTO site_home_banners
         (title, body_text, cta_enabled, cta_label, cta_link_type, cta_link_value, version_number, created_by)
       VALUES ('CTA inválido', 'Conteúdo válido do banner', true, 'Saiba mais', NULL, 'https://example.test', 2, $1)`,
      [ACTOR_ID],
      "ck_site_home_banners__cta",
    );

    await client!.query(
      `INSERT INTO site_public_contacts
         (email, address, city, postal_code, status, version_number, created_by)
       VALUES ('contato@example.test', 'Rua Principal, 1', 'Cuiabá', '78000-000', 'published', 1, $1)`,
      [ACTOR_ID],
    );
    await expectDatabaseConstraint(
      `INSERT INTO site_public_contacts
         (email, address, city, postal_code, status, version_number, created_by)
       VALUES ('outro@example.test', 'Rua Dois, 2', 'Cuiabá', '78000001', 'published', 2, $1)`,
      [ACTOR_ID],
      "ux_site_public_contacts__published",
    );
    await expectDatabaseConstraint(
      `INSERT INTO site_public_contacts
         (email, address, city, state, postal_code, version_number, created_by)
       VALUES ('uf@example.test', 'Rua Três, 3', 'Cuiabá', 'XX', '78000002', 2, $1)`,
      [ACTOR_ID],
      "ck_site_public_contacts__state",
    );
    await expectDatabaseConstraint(
      `INSERT INTO site_public_contacts
         (email, address, city, postal_code, version_number, created_by)
       VALUES ('cep@example.test', 'Rua Quatro, 4', 'Cuiabá', '7800-000', 2, $1)`,
      [ACTOR_ID],
      "ck_site_public_contacts__postal_code",
    );

    await client!.query(
      `INSERT INTO site_social_configurations
         (id, status, version_number, published_at, created_by)
       VALUES ($1, 'published', 1, CURRENT_TIMESTAMP, $2)`,
      [SOCIAL_CONFIGURATION_ID, ACTOR_ID],
    );
    await expectDatabaseConstraint(
      `INSERT INTO site_social_configurations
         (status, version_number, published_at, created_by)
       VALUES ('published', 2, CURRENT_TIMESTAMP, $1)`,
      [ACTOR_ID],
      "ux_site_social_configurations__published",
    );
    await expectDatabaseConstraint(
      `INSERT INTO site_social_configurations (status, version_number, created_by)
       VALUES ('published', 2, $1)`,
      [ACTOR_ID],
      "ck_site_social_configurations__published_at",
    );
    await expectDatabaseConstraint(
      `INSERT INTO site_social_configurations (status, version_number, created_by)
       VALUES ('archived', 2, $1)`,
      [ACTOR_ID],
      "ck_site_social_configurations__archived_at",
    );

    await expectDatabaseConstraint(
      `INSERT INTO site_social_links (social_configuration_id, platform, url, created_by)
       VALUES ($1, 'facebook', 'https://example.test/facebook', $2)`,
      [UNKNOWN_CONFIGURATION_ID, ACTOR_ID],
      "fk_site_social_links__social_config__social_config_id",
    );
    await client!.query(
      `INSERT INTO site_social_links (social_configuration_id, platform, url, created_by)
       VALUES ($1, 'instagram', 'https://example.test/instagram', $2)`,
      [SOCIAL_CONFIGURATION_ID, ACTOR_ID],
    );
    await expectDatabaseConstraint(
      `INSERT INTO site_social_links (social_configuration_id, platform, url, created_by)
       VALUES ($1, 'instagram', 'https://example.test/other', $2)`,
      [SOCIAL_CONFIGURATION_ID, ACTOR_ID],
      "uq_site_social_links__social_configuration_id_platform",
    );
    await expectDatabaseConstraint(
      `INSERT INTO site_social_links (social_configuration_id, platform, url, created_by)
       VALUES ($1, 'youtube', 'http://example.test/youtube', $2)`,
      [SOCIAL_CONFIGURATION_ID, ACTOR_ID],
      "ck_site_social_links__url_https",
    );
    await expectDatabaseConstraint(
      `INSERT INTO site_social_links
         (social_configuration_id, platform, url, display_order, created_by)
       VALUES ($1, 'linkedin', 'https://example.test/linkedin', -1, $2)`,
      [SOCIAL_CONFIGURATION_ID, ACTOR_ID],
      "ck_site_social_links__display_order",
    );
    await expectDatabaseConstraint(
      "DELETE FROM app_users WHERE id = $1",
      [ACTOR_ID],
      "fk_site_home_banners__app_users__created_by",
    );
  });

  it("MIG-B2-004: down removes only the migration tables and preserves dbmate and preexisting objects", async () => {
    const b3Down = await runDbmate("down");
    expect(b3Down).toContain("20260813163735_create_home_reviews_and_versions.sql");
    const down = await runDbmate("down");
    expect(down).toContain(MIGRATION_FILE);
    expect(await tableNames()).toEqual([]);

    const sentinel = await client!.query<{ id: number }>("SELECT id FROM migration_scope_sentinel");
    expect(sentinel.rows).toEqual([{ id: 1 }]);
    const migrations = await client!.query<{ count: string }>("SELECT count(*) FROM schema_migrations");
    expect(migrations.rows).toEqual([{ count: "0" }]);

    const status = await runDbmate("status");
    expect(status).toContain("Applied: 0");
    expect(status).toContain("Pending: 2");
  });

  it("MIG-B2-005: re-up succeeds with clean editorial tables", async () => {
    const up = await runDbmate("up");
    expect(up).toContain(MIGRATION_FILE);
    expect(await tableNames()).toEqual([...EDITORIAL_TABLES].sort());
    const actors = await client!.query<{ count: string }>("SELECT count(*) FROM app_users");
    expect(actors.rows).toEqual([{ count: "0" }]);
    const status = await runDbmate("status");
    expect(status).toContain("Applied: 2");
    expect(status).toContain("Pending: 0");
  });
});
