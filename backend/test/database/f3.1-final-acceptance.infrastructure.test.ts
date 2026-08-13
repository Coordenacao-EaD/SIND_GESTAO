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
const POSTGRES_IMAGE = "postgres:18.4-bookworm";
const B2_MIGRATION = "20260812170941_create_editorial_home_tables.sql";
const B3_MIGRATION = "20260813163735_create_home_reviews_and_versions.sql";
const ACTOR_ID = "71000000-0000-4000-8000-000000000001";
const OTHER_ACTOR_ID = "71000000-0000-4000-8000-000000000002";
const UNKNOWN_ID = "71000000-0000-4000-8000-000000000099";
const BANNER_ID = "72000000-0000-4000-8000-000000000001";
const CONTACTS_ID = "73000000-0000-4000-8000-000000000001";
const SOCIAL_ID = "74000000-0000-4000-8000-000000000001";
const VERSION_ID = "75000000-0000-4000-8000-000000000001";
const REVIEW_ID = "76000000-0000-4000-8000-000000000001";
const HASH = "sha512:f3.1-final-acceptance";
const MODULE_TABLES = [
  "app_users",
  "site_home_banners",
  "site_public_contacts",
  "site_social_configurations",
  "site_social_links",
  "site_home_reviews",
  "site_home_versions",
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

async function captureDatabaseError(text: string, values: readonly unknown[] = []): Promise<unknown> {
  try {
    await client!.query(text, [...values]);
    return undefined;
  } catch (error) {
    return error;
  }
}

async function expectConstraint(
  text: string,
  values: readonly unknown[],
  constraint: string,
): Promise<void> {
  expect(await captureDatabaseError(text, values)).toMatchObject({ constraint });
  expect((await client!.query<{ value: number }>("SELECT 1::int AS value")).rows).toEqual([
    { value: 1 },
  ]);
}

async function moduleTableNames(): Promise<string[]> {
  const result = await client!.query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      ORDER BY table_name`,
    [[...MODULE_TABLES]],
  );
  return result.rows.map((row) => row.table_name);
}

describe("F3.1B4 final migrations acceptance", () => {
  beforeAll(async () => {
    delete process.env.DATABASE_URL;
    container = await new PostgreSqlContainer(POSTGRES_IMAGE)
      .withDatabase("sind_gestao_f31_acceptance")
      .withUsername("sind_gestao_f31_user")
      .withPassword("testcontainer_f31_only")
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

  it("MIG-B4-001: applies B2 and B3 in order on a clean database with no out-of-scope tables", async () => {
    expect(process.env.DATABASE_URL).toBeUndefined();
    expect(await moduleTableNames()).toEqual([]);
    await client!.query("CREATE TABLE external_acceptance_sentinel (id integer PRIMARY KEY, value text NOT NULL)");
    await client!.query(
      "INSERT INTO external_acceptance_sentinel (id, value) VALUES ($1, $2)",
      [1, "preserve-across-module-rollbacks"],
    );

    const before = await runDbmate("status");
    expect(before).toContain(B2_MIGRATION);
    expect(before).toContain(B3_MIGRATION);
    expect(before.indexOf(B2_MIGRATION)).toBeLessThan(before.indexOf(B3_MIGRATION));
    expect(before).toContain("Applied: 0");
    expect(before).toContain("Pending: 2");

    const up = await runDbmate("up");
    expect(up.indexOf(B2_MIGRATION)).toBeLessThan(up.indexOf(B3_MIGRATION));
    const after = await runDbmate("status");
    expect(after).toContain("Applied: 2");
    expect(after).toContain("Pending: 0");
    expect(await moduleTableNames()).toEqual([...MODULE_TABLES].sort());

    const publicTables = await client!.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name`,
    );
    expect(publicTables.rows.map((row) => row.table_name)).toEqual(
      ["external_acceptance_sentinel", "schema_migrations", ...MODULE_TABLES].sort(),
    );
  });

  it("MIG-B4-002: PostgreSQL catalog contains all critical indexes, checks and non-cascading FKs", async () => {
    const indexes = await client!.query<{ indexname: string; indexdef: string }>(
      `SELECT indexname, indexdef FROM pg_indexes
        WHERE schemaname = 'public' AND indexname = ANY($1::text[])`,
      [[
        "ux_site_home_banners__published",
        "ux_site_public_contacts__published",
        "ux_site_social_configurations__published",
        "uq_site_social_links__social_configuration_id_platform",
        "uq_site_home_reviews__content_cycle",
        "ux_site_home_reviews__pending",
        "uq_site_home_versions__version_number",
        "ux_site_home_versions__current",
      ]],
    );
    expect(indexes.rows).toHaveLength(8);
    expect(indexes.rows.every((row) => row.indexdef.includes("UNIQUE"))).toBe(true);
    const definitions = new Map(indexes.rows.map((row) => [row.indexname, row.indexdef]));
    expect(definitions.get("ux_site_home_banners__published")).toContain("WHERE");
    expect(definitions.get("ux_site_public_contacts__published")).toContain("WHERE");
    expect(definitions.get("ux_site_social_configurations__published")).toContain("WHERE");
    expect(definitions.get("ux_site_home_reviews__pending")).toContain("WHERE");
    expect(definitions.get("ux_site_home_versions__current")).toContain("WHERE");

    const foreignKeys = await client!.query<{
      constraint_name: string;
      delete_rule: string;
      update_rule: string;
    }>(
      `SELECT constraint_name, delete_rule, update_rule
         FROM information_schema.referential_constraints
        WHERE constraint_schema = 'public'
        ORDER BY constraint_name`,
    );
    expect(foreignKeys.rows).toHaveLength(19);
    expect(
      foreignKeys.rows.every(
        (row) => row.delete_rule === "RESTRICT" && row.update_rule === "RESTRICT",
      ),
    ).toBe(true);
    expect(foreignKeys.rows.map((row) => row.constraint_name)).toEqual(
      expect.arrayContaining([
        "fk_site_home_banners__app_users__created_by",
        "fk_site_public_contacts__app_users__created_by",
        "fk_site_social_configurations__app_users__created_by",
        "fk_site_social_links__social_config__social_config_id",
        "fk_site_home_reviews__banners__banner_id",
        "fk_site_home_reviews__contacts__contacts_id",
        "fk_site_home_reviews__social_config__social_config_id",
        "fk_site_home_reviews__app_users__submitted_by",
        "fk_site_home_reviews__app_users__reviewed_by",
        "fk_site_home_reviews__app_users__invalidated_by",
        "fk_site_home_versions__banners__banner_id",
        "fk_site_home_versions__contacts__contacts_id",
        "fk_site_home_versions__social_config__social_config_id",
        "fk_site_home_versions__app_users__created_by",
      ]),
    );

    const checks = await client!.query<{ conname: string }>(
      `SELECT conname FROM pg_constraint
        WHERE connamespace = 'public'::regnamespace AND contype = 'c'`,
    );
    expect(checks.rows.map((row) => row.conname)).toEqual(
      expect.arrayContaining([
        "ck_app_users__status",
        "ck_site_home_banners__status",
        "ck_site_home_banners__version_number",
        "ck_site_home_banners__cta",
        "ck_site_public_contacts__status",
        "ck_site_public_contacts__version_number",
        "ck_site_public_contacts__state",
        "ck_site_social_configurations__status",
        "ck_site_social_configurations__version_number",
        "ck_site_social_links__platform",
        "ck_site_social_links__url_https",
        "ck_site_social_links__display_order",
        "ck_site_home_reviews__one_content_target",
        "ck_site_home_reviews__content_type_target",
        "ck_site_home_reviews__decision_consistency",
        "ck_site_home_versions__snapshot_object",
        "ck_site_home_versions__change_summary",
      ]),
    );
  });

  it("MIG-B4-003: CT-HOM-010 rejects every duplicate and preserves the accepted records", async () => {
    await client!.query("INSERT INTO app_users (id) VALUES ($1), ($2)", [ACTOR_ID, OTHER_ACTOR_ID]);

    await client!.query(
      `INSERT INTO site_home_banners
        (id, title, body_text, status, version_number, published_at, created_by)
       VALUES ($1, 'Banner publicado', 'Conteúdo publicado preservado', 'published', 1,
               CURRENT_TIMESTAMP, $2)`,
      [BANNER_ID, ACTOR_ID],
    );
    await expectConstraint(
      `INSERT INTO site_home_banners
        (title, body_text, status, version_number, published_at, created_by)
       VALUES ('Segundo banner', 'Segundo conteúdo publicado', 'published', 2,
               CURRENT_TIMESTAMP, $1)`,
      [ACTOR_ID],
      "ux_site_home_banners__published",
    );
    expect(
      (await client!.query("SELECT id, title FROM site_home_banners WHERE status = 'published'")).rows,
    ).toEqual([{ id: BANNER_ID, title: "Banner publicado" }]);

    await client!.query(
      `INSERT INTO site_public_contacts
        (id, email, address, city, postal_code, status, version_number, published_at, created_by)
       VALUES ($1, 'publicado@example.test', 'Rua Publicada, 1', 'Cuiabá', '78000000',
               'published', 1, CURRENT_TIMESTAMP, $2)`,
      [CONTACTS_ID, ACTOR_ID],
    );
    await expectConstraint(
      `INSERT INTO site_public_contacts
        (email, address, city, postal_code, status, version_number, published_at, created_by)
       VALUES ('segundo@example.test', 'Rua Segunda, 2', 'Cuiabá', '78000001',
               'published', 2, CURRENT_TIMESTAMP, $1)`,
      [ACTOR_ID],
      "ux_site_public_contacts__published",
    );
    expect(
      (await client!.query("SELECT id, email FROM site_public_contacts WHERE status = 'published'")).rows,
    ).toEqual([{ id: CONTACTS_ID, email: "publicado@example.test" }]);

    await client!.query(
      `INSERT INTO site_social_configurations
        (id, status, version_number, published_at, created_by)
       VALUES ($1, 'published', 1, CURRENT_TIMESTAMP, $2)`,
      [SOCIAL_ID, ACTOR_ID],
    );
    await expectConstraint(
      `INSERT INTO site_social_configurations
        (status, version_number, published_at, created_by)
       VALUES ('published', 2, CURRENT_TIMESTAMP, $1)`,
      [ACTOR_ID],
      "ux_site_social_configurations__published",
    );
    expect(
      (await client!.query("SELECT id, version_number FROM site_social_configurations WHERE status = 'published'")).rows,
    ).toEqual([{ id: SOCIAL_ID, version_number: 1 }]);

    const snapshot = JSON.stringify({ banner_id: BANNER_ID, contacts_id: CONTACTS_ID });
    await client!.query(
      `INSERT INTO site_home_versions
        (id, banner_id, contacts_id, social_configuration_id, version_number,
         snapshot_json, change_summary, is_current, created_by)
       VALUES ($1, $2, $3, $4, 1, $5::jsonb, 'Versão consolidada preservada', true, $6)`,
      [VERSION_ID, BANNER_ID, CONTACTS_ID, SOCIAL_ID, snapshot, ACTOR_ID],
    );
    await expectConstraint(
      `INSERT INTO site_home_versions
        (banner_id, contacts_id, social_configuration_id, version_number,
         snapshot_json, change_summary, is_current, created_by)
       VALUES ($1, $2, $3, 2, '{}'::jsonb, 'Segunda versão consolidada', true, $4)`,
      [BANNER_ID, CONTACTS_ID, SOCIAL_ID, ACTOR_ID],
      "ux_site_home_versions__current",
    );
    expect(
      (await client!.query("SELECT id, snapshot_json FROM site_home_versions WHERE is_current = true")).rows,
    ).toEqual([{ id: VERSION_ID, snapshot_json: JSON.parse(snapshot) }]);

    await client!.query(
      `INSERT INTO site_home_reviews
        (id, content_type, banner_id, cycle_number, content_version,
         submitted_content_hash, submitted_by)
       VALUES ($1, 'banner', $2, 1, 1, $3, $4)`,
      [REVIEW_ID, BANNER_ID, HASH, ACTOR_ID],
    );
    await expectConstraint(
      `INSERT INTO site_home_reviews
        (content_type, banner_id, cycle_number, content_version,
         submitted_content_hash, submitted_by)
       VALUES ('banner', $1, 2, 1, $2, $3)`,
      [BANNER_ID, HASH, ACTOR_ID],
      "ux_site_home_reviews__pending",
    );
    expect(
      (await client!.query(
        "SELECT id, content_id, cycle_number FROM site_home_reviews WHERE decision = 'pending'",
      )).rows,
    ).toEqual([{ id: REVIEW_ID, content_id: BANNER_ID, cycle_number: 1 }]);
  });

  it("MIG-B4-004: closes matrix gaps and reconfirms generated review identity", async () => {
    await expectConstraint(
      `INSERT INTO site_home_banners (title, body_text, version_number, created_by)
       VALUES ('Ator órfão', 'Conteúdo estrutural válido', 2, $1)`,
      [UNKNOWN_ID],
      "fk_site_home_banners__app_users__created_by",
    );
    await expectConstraint(
      `INSERT INTO site_public_contacts
        (email, address, city, postal_code, status, version_number, created_by)
       VALUES ('status@example.test', 'Rua Status, 3', 'Cuiabá', '78000003', 'invalid', 2, $1)`,
      [ACTOR_ID],
      "ck_site_public_contacts__status",
    );
    await expectConstraint(
      `INSERT INTO site_public_contacts
        (email, address, city, postal_code, version_number, created_by)
       VALUES ('zero@example.test', 'Rua Zero, 4', 'Cuiabá', '78000004', 0, $1)`,
      [ACTOR_ID],
      "ck_site_public_contacts__version_number",
    );
    await expectConstraint(
      `INSERT INTO site_public_contacts
        (email, address, city, postal_code, version_number, created_by)
       VALUES ('duplicado@example.test', 'Rua Duplicada, 5', 'Cuiabá', '78000005', 1, $1)`,
      [ACTOR_ID],
      "uq_site_public_contacts__version_number",
    );
    await expectConstraint(
      `INSERT INTO site_social_configurations (status, version_number, created_by)
       VALUES ('invalid', 2, $1)`,
      [ACTOR_ID],
      "ck_site_social_configurations__status",
    );
    await expectConstraint(
      `INSERT INTO site_social_configurations (version_number, created_by)
       VALUES (0, $1)`,
      [ACTOR_ID],
      "ck_site_social_configurations__version_number",
    );
    await expectConstraint(
      `INSERT INTO site_social_configurations (version_number, created_by)
       VALUES (1, $1)`,
      [ACTOR_ID],
      "uq_site_social_configurations__version_number",
    );
    await expectConstraint(
      `INSERT INTO site_social_links
        (social_configuration_id, platform, url, created_by)
       VALUES ($1, 'tiktok', 'https://example.test/tiktok', $2)`,
      [SOCIAL_ID, ACTOR_ID],
      "ck_site_social_links__platform",
    );

    const contentColumn = await client!.query<{
      is_generated: string;
      generation_expression: string;
    }>(
      `SELECT is_generated, generation_expression FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'site_home_reviews'
          AND column_name = 'content_id'`,
    );
    expect(contentColumn.rows).toEqual([
      {
        is_generated: "ALWAYS",
        generation_expression: "COALESCE(banner_id, contacts_id, social_configuration_id)",
      },
    ]);
    expect(
      (await client!.query("SELECT content_type, banner_id, content_id FROM site_home_reviews WHERE id = $1", [REVIEW_ID])).rows,
    ).toEqual([{ content_type: "banner", banner_id: BANNER_ID, content_id: BANNER_ID }]);
    expect(
      await captureDatabaseError(
        `INSERT INTO site_home_reviews
          (content_type, contacts_id, content_id, cycle_number, content_version,
           submitted_content_hash, submitted_by)
         VALUES ('contacts', $1, $2, 1, 1, $3, $4)`,
        [CONTACTS_ID, BANNER_ID, HASH, ACTOR_ID],
      ),
    ).toMatchObject({ code: "428C9" });
    expect((await client!.query("SELECT count(*) FROM site_home_reviews")).rows).toEqual([
      { count: "1" },
    ]);
  });

  it("MIG-B4-005: consolidated versions remain intact after every forbidden mutation", async () => {
    for (const update of [
      ["snapshot_json = $1::jsonb", JSON.stringify({ changed: true })],
      ["banner_id = $1", UNKNOWN_ID],
      ["contacts_id = $1", UNKNOWN_ID],
      ["social_configuration_id = $1", null],
      ["version_number = $1", 2],
      ["change_summary = $1", "Resumo alterado indevidamente"],
      ["published_at = $1", new Date("2031-01-01T00:00:00.000Z")],
      ["created_by = $1", OTHER_ACTOR_ID],
    ] as const) {
      await expectConstraint(
        `UPDATE site_home_versions SET ${update[0]} WHERE id = $2`,
        [update[1], VERSION_ID],
        "ck_site_home_versions__immutable",
      );
    }

    const beforeDeactivate = await client!.query<{
      id: string;
      banner_id: string;
      contacts_id: string;
      social_configuration_id: string;
      version_number: number;
      snapshot_json: object;
      change_summary: string;
      published_at: Date;
      is_current: boolean;
      created_by: string;
    }>("SELECT * FROM site_home_versions WHERE id = $1", [VERSION_ID]);
    expect(beforeDeactivate.rows).toHaveLength(1);
    expect(beforeDeactivate.rows[0]).toMatchObject({
      id: VERSION_ID,
      banner_id: BANNER_ID,
      contacts_id: CONTACTS_ID,
      social_configuration_id: SOCIAL_ID,
      version_number: 1,
      snapshot_json: { banner_id: BANNER_ID, contacts_id: CONTACTS_ID },
      change_summary: "Versão consolidada preservada",
      is_current: true,
      created_by: ACTOR_ID,
    });

    expect(
      (await client!.query<{ is_current: boolean }>(
        "UPDATE site_home_versions SET is_current = false WHERE id = $1 RETURNING is_current",
        [VERSION_ID],
      )).rows,
    ).toEqual([{ is_current: false }]);
    await expectConstraint(
      "UPDATE site_home_versions SET is_current = true WHERE id = $1",
      [VERSION_ID],
      "ck_site_home_versions__immutable",
    );
    await expectConstraint(
      "DELETE FROM site_home_versions WHERE id = $1",
      [VERSION_ID],
      "ck_site_home_versions__append_only",
    );
    const finalVersion = await client!.query("SELECT * FROM site_home_versions WHERE id = $1", [VERSION_ID]);
    expect(finalVersion.rows).toEqual([{ ...beforeDeactivate.rows[0], is_current: false }]);
  });

  it("MIG-B4-006: full rollback preserves the external sentinel and re-up recreates F3.1 cleanly", async () => {
    const b3Down = await runDbmate("down");
    expect(b3Down).toContain(B3_MIGRATION);
    expect(
      (await client!.query(
        `SELECT to_regclass('public.site_home_reviews')::text AS reviews,
                to_regclass('public.site_home_versions')::text AS versions`,
      )).rows,
    ).toEqual([{ reviews: null, versions: null }]);
    expect((await client!.query("SELECT id FROM site_home_banners WHERE id = $1", [BANNER_ID])).rows).toHaveLength(1);
    expect((await client!.query("SELECT id FROM site_public_contacts WHERE id = $1", [CONTACTS_ID])).rows).toHaveLength(1);
    expect((await client!.query("SELECT id FROM site_social_configurations WHERE id = $1", [SOCIAL_ID])).rows).toHaveLength(1);
    expect(
      (await client!.query("SELECT value FROM external_acceptance_sentinel WHERE id = $1", [1])).rows,
    ).toEqual([{ value: "preserve-across-module-rollbacks" }]);
    const afterB3Down = await runDbmate("status");
    expect(afterB3Down).toContain("Applied: 1");
    expect(afterB3Down).toContain("Pending: 1");

    const b2Down = await runDbmate("down");
    expect(b2Down).toContain(B2_MIGRATION);
    expect(await moduleTableNames()).toEqual([]);
    expect(
      (await client!.query("SELECT value FROM external_acceptance_sentinel WHERE id = $1", [1])).rows,
    ).toEqual([{ value: "preserve-across-module-rollbacks" }]);
    expect((await client!.query("SELECT count(*) FROM schema_migrations")).rows).toEqual([
      { count: "0" },
    ]);
    const afterB2Down = await runDbmate("status");
    expect(afterB2Down).toContain("Applied: 0");
    expect(afterB2Down).toContain("Pending: 2");

    const reUp = await runDbmate("up");
    expect(reUp.indexOf(B2_MIGRATION)).toBeLessThan(reUp.indexOf(B3_MIGRATION));
    expect(await moduleTableNames()).toEqual([...MODULE_TABLES].sort());
    const finalStatus = await runDbmate("status");
    expect(finalStatus).toContain("Applied: 2");
    expect(finalStatus).toContain("Pending: 0");
    expect((await client!.query("SELECT count(*) FROM schema_migrations")).rows).toEqual([
      { count: "2" },
    ]);
    for (const table of MODULE_TABLES) {
      expect((await client!.query(`SELECT count(*) FROM ${table}`)).rows).toEqual([{ count: "0" }]);
    }
    expect(
      (await client!.query("SELECT value FROM external_acceptance_sentinel WHERE id = $1", [1])).rows,
    ).toEqual([{ value: "preserve-across-module-rollbacks" }]);
  });
});
