import { execFile } from "node:child_process";
import { copyFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const DBMATE_EXECUTABLE = require.resolve(
  `@dbmate/${process.platform}-${process.arch}/bin/dbmate${process.platform === "win32" ? ".exe" : ""}`,
);
const B2_MIGRATION = "20260812170941_create_editorial_home_tables.sql";
const B3_MIGRATION = "20260813163735_create_home_reviews_and_versions.sql";
const POSTGRES_IMAGE = "postgres:18.4-bookworm";
const SUBMITTER_ID = "10000000-0000-4000-8000-000000000011";
const REVIEWER_ID = "10000000-0000-4000-8000-000000000012";
const OTHER_ACTOR_ID = "10000000-0000-4000-8000-000000000013";
const UNKNOWN_ID = "10000000-0000-4000-8000-000000000099";
const BANNER_ID = "20000000-0000-4000-8000-000000000011";
const CONTACTS_ID = "30000000-0000-4000-8000-000000000011";
const SOCIAL_ID = "40000000-0000-4000-8000-000000000011";
const REVIEW_ID = "50000000-0000-4000-8000-000000000011";
const VERSION_ID = "60000000-0000-4000-8000-000000000011";
const INVALID_VERSION_ID = "60000000-0000-4000-8000-000000000099";
const HASH = "sha512:0123456789abcdef";

let container: StartedPostgreSqlContainer | undefined;
let client: Client | undefined;
let databaseUrl: string;
let b2MigrationsDirectory: string | undefined;

async function runDbmate(
  command: "status" | "up" | "down",
  migrationsDirectory = "db/migrations",
): Promise<string> {
  const { stdout, stderr } = await execFileAsync(
    DBMATE_EXECUTABLE,
    [
      "--migrations-dir",
      migrationsDirectory,
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
}

async function expectCode(
  text: string,
  values: readonly unknown[],
  code: string,
): Promise<void> {
  expect(await captureDatabaseError(text, values)).toMatchObject({ code });
}

async function seedB2(): Promise<void> {
  await client!.query(
    "INSERT INTO app_users (id) VALUES ($1), ($2), ($3)",
    [SUBMITTER_ID, REVIEWER_ID, OTHER_ACTOR_ID],
  );
  await client!.query(
    `INSERT INTO site_home_banners
       (id, title, body_text, version_number, created_by)
     VALUES ($1, 'Banner sentinela', 'Conteúdo sentinela válido', 1, $2)`,
    [BANNER_ID, SUBMITTER_ID],
  );
  await client!.query(
    `INSERT INTO site_public_contacts
       (id, email, address, city, postal_code, version_number, created_by)
     VALUES ($1, 'sentinela@example.test', 'Rua Sentinela, 1', 'Cuiabá', '78000000', 1, $2)`,
    [CONTACTS_ID, SUBMITTER_ID],
  );
  await client!.query(
    `INSERT INTO site_social_configurations (id, version_number, created_by)
     VALUES ($1, 1, $2)`,
    [SOCIAL_ID, SUBMITTER_ID],
  );
  await client!.query(
    `INSERT INTO site_social_links
       (social_configuration_id, platform, url, created_by)
     VALUES ($1, 'instagram', 'https://example.test/sentinela', $2)`,
    [SOCIAL_ID, SUBMITTER_ID],
  );
}

describe("F3.1B3 reviews and consolidated versions migrations", () => {
  beforeAll(async () => {
    delete process.env.DATABASE_URL;
    b2MigrationsDirectory = await mkdtemp(join(tmpdir(), "sind-gestao-b2-"));
    await copyFile(
      resolve("db/migrations", B2_MIGRATION),
      join(b2MigrationsDirectory, B2_MIGRATION),
    );

    container = await new PostgreSqlContainer(POSTGRES_IMAGE)
      .withDatabase("sind_gestao_b3_test")
      .withUsername("sind_gestao_b3_user")
      .withPassword("testcontainer_b3_only")
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
    if (b2MigrationsDirectory) {
      await rm(b2MigrationsDirectory, { recursive: true });
      b2MigrationsDirectory = undefined;
    }
  });

  it("MIG-B3-001: dbmate applies B2 and B3 separately from the isolated DATABASE_URL", async () => {
    expect(process.env.DATABASE_URL).toBeUndefined();
    const initialStatus = await runDbmate("status");
    expect(initialStatus).toContain(B2_MIGRATION);
    expect(initialStatus).toContain(B3_MIGRATION);
    expect(initialStatus).toContain("Applied: 0");
    expect(initialStatus).toContain("Pending: 2");

    const b2Up = await runDbmate("up", b2MigrationsDirectory!);
    expect(b2Up).toContain(B2_MIGRATION);
    const afterB2 = await runDbmate("status");
    expect(afterB2).toContain("Applied: 1");
    expect(afterB2).toContain("Pending: 1");
    await seedB2();

    const b3Up = await runDbmate("up");
    expect(b3Up).toContain(B3_MIGRATION);
    const afterB3 = await runDbmate("status");
    expect(afterB3).toContain("Applied: 2");
    expect(afterB3).toContain("Pending: 0");
  });

  it("MIG-B3-002: creates reviews with UUID PK, real FKs, generated content_id and required indexes", async () => {
    const columns = await client!.query<{
      column_name: string;
      data_type: string;
      is_generated: string;
      generation_expression: string | null;
      column_default: string | null;
    }>(
      `SELECT column_name, data_type, is_generated, generation_expression, column_default
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'site_home_reviews'
          AND column_name IN ('id', 'content_id')
        ORDER BY column_name`,
    );
    expect(columns.rows).toEqual([
      {
        column_name: "content_id",
        data_type: "uuid",
        is_generated: "ALWAYS",
        generation_expression: "COALESCE(banner_id, contacts_id, social_configuration_id)",
        column_default: null,
      },
      {
        column_name: "id",
        data_type: "uuid",
        is_generated: "NEVER",
        generation_expression: null,
        column_default: "gen_random_uuid()",
      },
    ]);

    const constraints = await client!.query<{ conname: string }>(
      `SELECT conname FROM pg_constraint
        WHERE conrelid = 'public.site_home_reviews'::regclass`,
    );
    expect(constraints.rows.map((row) => row.conname)).toEqual(
      expect.arrayContaining([
        "ck_site_home_reviews__one_content_target",
        "ck_site_home_reviews__content_type_target",
        "ck_site_home_reviews__decision_consistency",
      ]),
    );

    const foreignKeys = await client!.query<{ constraint_name: string; delete_rule: string }>(
      `SELECT rc.constraint_name, rc.delete_rule
         FROM information_schema.referential_constraints rc
         JOIN information_schema.table_constraints tc
           ON tc.constraint_schema = rc.constraint_schema
          AND tc.constraint_name = rc.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'site_home_reviews'
        ORDER BY rc.constraint_name`,
    );
    expect(foreignKeys.rows).toHaveLength(6);
    expect(foreignKeys.rows.every((row) => row.delete_rule === "RESTRICT")).toBe(true);

    const indexes = await client!.query<{ indexname: string }>(
      "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'site_home_reviews'",
    );
    expect(indexes.rows.map((row) => row.indexname)).toEqual(
      expect.arrayContaining([
        "uq_site_home_reviews__content_cycle",
        "ux_site_home_reviews__pending",
        "ix_site_home_reviews__decision_submitted_type",
        "ix_site_home_reviews__content_cycle_desc",
        "ix_site_home_reviews__reviewer_reviewed_at",
      ]),
    );
  });

  it("MIG-B3-003: reviews reject orphan and incoherent content references", async () => {
    const base = `(id, content_type, banner_id, cycle_number, content_version,
      submitted_content_hash, submitted_by)`;
    await expectConstraint(
      `INSERT INTO site_home_reviews ${base} VALUES ($1, 'banner', $2, 1, 1, $3, $4)`,
      [REVIEW_ID, BANNER_ID, HASH, UNKNOWN_ID],
      "fk_site_home_reviews__app_users__submitted_by",
    );
    await expectConstraint(
      `INSERT INTO site_home_reviews
         (content_type, banner_id, cycle_number, content_version, submitted_content_hash, submitted_by)
       VALUES ('banner', $1, 1, 1, $2, $3)`,
      [UNKNOWN_ID, HASH, SUBMITTER_ID],
      "fk_site_home_reviews__banners__banner_id",
    );
    await expectConstraint(
      `INSERT INTO site_home_reviews
         (content_type, contacts_id, cycle_number, content_version, submitted_content_hash, submitted_by)
       VALUES ('contacts', $1, 1, 1, $2, $3)`,
      [UNKNOWN_ID, HASH, SUBMITTER_ID],
      "fk_site_home_reviews__contacts__contacts_id",
    );
    await expectConstraint(
      `INSERT INTO site_home_reviews
         (content_type, social_configuration_id, cycle_number, content_version, submitted_content_hash, submitted_by)
       VALUES ('social_configuration', $1, 1, 1, $2, $3)`,
      [UNKNOWN_ID, HASH, SUBMITTER_ID],
      "fk_site_home_reviews__social_config__social_config_id",
    );
    await expectConstraint(
      `INSERT INTO site_home_reviews
         (content_type, cycle_number, content_version, submitted_content_hash, submitted_by)
       VALUES ('banner', 1, 1, $1, $2)`,
      [HASH, SUBMITTER_ID],
      "ck_site_home_reviews__content_type_target",
    );
    await expectConstraint(
      `INSERT INTO site_home_reviews
         (content_type, banner_id, contacts_id, cycle_number, content_version,
          submitted_content_hash, submitted_by)
       VALUES ('banner', $1, $2, 1, 1, $3, $4)`,
      [BANNER_ID, CONTACTS_ID, HASH, SUBMITTER_ID],
      "ck_site_home_reviews__content_type_target",
    );
    await expectConstraint(
      `INSERT INTO site_home_reviews
         (content_type, banner_id, contacts_id, social_configuration_id, cycle_number,
          content_version, submitted_content_hash, submitted_by)
       VALUES ('banner', $1, $2, $3, 1, 1, $4, $5)`,
      [BANNER_ID, CONTACTS_ID, SOCIAL_ID, HASH, SUBMITTER_ID],
      "ck_site_home_reviews__content_type_target",
    );
    await expectConstraint(
      `INSERT INTO site_home_reviews
         (content_type, social_configuration_id, cycle_number, content_version,
          submitted_content_hash, submitted_by)
       VALUES ('banner', $1, 1, 1, $2, $3)`,
      [SOCIAL_ID, HASH, SUBMITTER_ID],
      "ck_site_home_reviews__content_type_target",
    );
  });

  it("MIG-B3-004: generated content_id, cycle rules and pending uniqueness are enforced", async () => {
    const review = await client!.query<{ id: string; content_id: string }>(
      `INSERT INTO site_home_reviews
         (id, content_type, banner_id, cycle_number, content_version,
          submitted_content_hash, submitted_by)
       VALUES ($1, 'banner', $2, 1, 1, $3, $4)
       RETURNING id, content_id`,
      [REVIEW_ID, BANNER_ID, HASH, SUBMITTER_ID],
    );
    expect(review.rows).toEqual([{ id: REVIEW_ID, content_id: BANNER_ID }]);
    await expectCode(
      `INSERT INTO site_home_reviews
         (content_type, banner_id, content_id, cycle_number, content_version,
          submitted_content_hash, submitted_by)
       VALUES ('banner', $1, $2, 2, 1, $3, $4)`,
      [BANNER_ID, CONTACTS_ID, HASH, SUBMITTER_ID],
      "428C9",
    );
    await expectConstraint(
      `INSERT INTO site_home_reviews
         (content_type, contacts_id, cycle_number, content_version, submitted_content_hash, submitted_by)
       VALUES ('contacts', $1, 0, 1, $2, $3)`,
      [CONTACTS_ID, HASH, SUBMITTER_ID],
      "ck_site_home_reviews__cycle_number",
    );
    await expectConstraint(
      `INSERT INTO site_home_reviews
         (content_type, contacts_id, cycle_number, content_version, submitted_content_hash, submitted_by)
       VALUES ('contacts', $1, 1, 0, $2, $3)`,
      [CONTACTS_ID, HASH, SUBMITTER_ID],
      "ck_site_home_reviews__content_version",
    );
    await expectConstraint(
      `INSERT INTO site_home_reviews
         (content_type, contacts_id, cycle_number, content_version, submitted_content_hash,
          decision, reviewed_by, reviewed_at, submitted_by)
       VALUES ('contacts', $1, 1, 1, $2, 'not_valid', $3, CURRENT_TIMESTAMP, $4)`,
      [CONTACTS_ID, HASH, REVIEWER_ID, SUBMITTER_ID],
      "ck_site_home_reviews__decision",
    );
    await expectConstraint(
      `INSERT INTO site_home_reviews
         (content_type, contacts_id, cycle_number, content_version, submitted_content_hash, submitted_by)
       VALUES ('contacts', $1, 1, 1, '   ', $2)`,
      [CONTACTS_ID, SUBMITTER_ID],
      "ck_site_home_reviews__submitted_content_hash",
    );

    await client!.query(
      `INSERT INTO site_home_reviews
         (content_type, contacts_id, cycle_number, content_version, submitted_content_hash,
          decision, reviewed_by, reviewed_at, submitted_by)
       VALUES ('contacts', $1, 1, 1, $2, 'approved', $3, CURRENT_TIMESTAMP, $4)`,
      [CONTACTS_ID, HASH, REVIEWER_ID, SUBMITTER_ID],
    );
    await expectConstraint(
      `INSERT INTO site_home_reviews
         (content_type, contacts_id, cycle_number, content_version, submitted_content_hash,
          decision, reviewed_by, reviewed_at, submitted_by)
       VALUES ('contacts', $1, 1, 1, $2, 'approved', $3, CURRENT_TIMESTAMP, $4)`,
      [CONTACTS_ID, HASH, REVIEWER_ID, SUBMITTER_ID],
      "uq_site_home_reviews__content_cycle",
    );
    await expectConstraint(
      `INSERT INTO site_home_reviews
         (content_type, banner_id, cycle_number, content_version, submitted_content_hash, submitted_by)
       VALUES ('banner', $1, 2, 1, $2, $3)`,
      [BANNER_ID, HASH, SUBMITTER_ID],
      "ux_site_home_reviews__pending",
    );
    const pending = await client!.query<{ id: string }>(
      `SELECT id FROM site_home_reviews
        WHERE content_type = 'banner' AND content_id = $1 AND decision = 'pending'`,
      [BANNER_ID],
    );
    expect(pending.rows).toEqual([{ id: REVIEW_ID }]);
  });

  it("MIG-B3-005: review decision consistency is enforced and automatic invalidation is allowed", async () => {
    const insertDecision = `INSERT INTO site_home_reviews
      (content_type, social_configuration_id, cycle_number, content_version,
       submitted_content_hash, decision, reviewed_by, reviewed_at, review_notes,
       invalidated_by, invalidated_at, invalidation_reason, submitted_by)
      VALUES ('social_configuration', $1, $2, 1, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

    await expectConstraint(
      insertDecision,
      [SOCIAL_ID, 1, HASH, "approved", null, null, null, null, null, null, SUBMITTER_ID],
      "ck_site_home_reviews__decision_consistency",
    );
    await expectConstraint(
      insertDecision,
      [
        SOCIAL_ID,
        2,
        HASH,
        "approved",
        SUBMITTER_ID,
        new Date(),
        null,
        null,
        null,
        null,
        SUBMITTER_ID,
      ],
      "ck_site_home_reviews__decision_consistency",
    );
    await expectConstraint(
      insertDecision,
      [
        SOCIAL_ID,
        3,
        HASH,
        "changes_requested",
        REVIEWER_ID,
        new Date(),
        null,
        null,
        null,
        null,
        SUBMITTER_ID,
      ],
      "ck_site_home_reviews__decision_consistency",
    );
    await expectConstraint(
      insertDecision,
      [
        SOCIAL_ID,
        4,
        HASH,
        "changes_requested",
        REVIEWER_ID,
        new Date(),
        "curta",
        null,
        null,
        null,
        SUBMITTER_ID,
      ],
      "ck_site_home_reviews__decision_consistency",
    );
    await expectConstraint(
      insertDecision,
      [
        SOCIAL_ID,
        5,
        HASH,
        "cancelled",
        REVIEWER_ID,
        new Date(),
        null,
        null,
        null,
        null,
        SUBMITTER_ID,
      ],
      "ck_site_home_reviews__decision_consistency",
    );
    await expectConstraint(
      insertDecision,
      [SOCIAL_ID, 6, HASH, "invalidated", null, null, null, null, null, "obsoleto", SUBMITTER_ID],
      "ck_site_home_reviews__decision_consistency",
    );
    await expectConstraint(
      insertDecision,
      [SOCIAL_ID, 7, HASH, "invalidated", null, null, null, null, new Date(), null, SUBMITTER_ID],
      "ck_site_home_reviews__decision_consistency",
    );
    await client!.query(insertDecision, [
      SOCIAL_ID,
      8,
      HASH,
      "invalidated",
      null,
      null,
      null,
      null,
      new Date(),
      "Conteúdo alterado automaticamente",
      SUBMITTER_ID,
    ]);
    const automatic = await client!.query<{ invalidated_by: string | null }>(
      "SELECT invalidated_by FROM site_home_reviews WHERE content_type = 'social_configuration' AND cycle_number = 8",
    );
    expect(automatic.rows).toEqual([{ invalidated_by: null }]);
  });

  it("MIG-B3-006: versions enforce FKs, JSON object, numbering, summaries and one current row", async () => {
    const columns = await client!.query<{
      column_name: string;
      data_type: string;
      column_default: string | null;
    }>(
      `SELECT column_name, data_type, column_default FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'site_home_versions'
          AND column_name IN ('id', 'snapshot_json') ORDER BY column_name`,
    );
    expect(columns.rows).toEqual([
      { column_name: "id", data_type: "uuid", column_default: "gen_random_uuid()" },
      { column_name: "snapshot_json", data_type: "jsonb", column_default: null },
    ]);

    const insertVersion = `INSERT INTO site_home_versions
      (id, banner_id, contacts_id, social_configuration_id, version_number,
       snapshot_json, change_summary, is_current, created_by)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)`;
    await expectConstraint(
      insertVersion,
      [INVALID_VERSION_ID, UNKNOWN_ID, CONTACTS_ID, SOCIAL_ID, 10, "{}", "Referência inválida", false, SUBMITTER_ID],
      "fk_site_home_versions__banners__banner_id",
    );
    await expectConstraint(
      insertVersion,
      [INVALID_VERSION_ID, BANNER_ID, UNKNOWN_ID, SOCIAL_ID, 10, "{}", "Referência inválida", false, SUBMITTER_ID],
      "fk_site_home_versions__contacts__contacts_id",
    );
    await expectConstraint(
      insertVersion,
      [INVALID_VERSION_ID, BANNER_ID, CONTACTS_ID, UNKNOWN_ID, 10, "{}", "Referência inválida", false, SUBMITTER_ID],
      "fk_site_home_versions__social_config__social_config_id",
    );
    await expectConstraint(
      insertVersion,
      [INVALID_VERSION_ID, BANNER_ID, CONTACTS_ID, SOCIAL_ID, 0, "{}", "Versão inválida", false, SUBMITTER_ID],
      "ck_site_home_versions__version_number",
    );
    await expectCode(
      insertVersion,
      [INVALID_VERSION_ID, BANNER_ID, CONTACTS_ID, SOCIAL_ID, 10, null, "Snapshot ausente", false, SUBMITTER_ID],
      "23502",
    );
    await expectConstraint(
      insertVersion,
      [INVALID_VERSION_ID, BANNER_ID, CONTACTS_ID, SOCIAL_ID, 10, "[]", "Snapshot em array", false, SUBMITTER_ID],
      "ck_site_home_versions__snapshot_object",
    );
    await expectConstraint(
      insertVersion,
      [INVALID_VERSION_ID, BANNER_ID, CONTACTS_ID, SOCIAL_ID, 10, "{}", "curta", false, SUBMITTER_ID],
      "ck_site_home_versions__change_summary",
    );

    await client!.query(insertVersion, [
      VERSION_ID,
      BANNER_ID,
      CONTACTS_ID,
      SOCIAL_ID,
      1,
      JSON.stringify({ banner: BANNER_ID, contacts: CONTACTS_ID, social: SOCIAL_ID }),
      "Publicação consolidada inicial",
      true,
      SUBMITTER_ID,
    ]);
    await expectConstraint(
      insertVersion,
      [INVALID_VERSION_ID, BANNER_ID, CONTACTS_ID, SOCIAL_ID, 1, "{}", "Versão duplicada válida", false, SUBMITTER_ID],
      "uq_site_home_versions__version_number",
    );
    await expectConstraint(
      insertVersion,
      [INVALID_VERSION_ID, BANNER_ID, CONTACTS_ID, SOCIAL_ID, 2, "{}", "Segunda versão vigente", true, SUBMITTER_ID],
      "ux_site_home_versions__current",
    );
    const current = await client!.query<{ id: string }>(
      "SELECT id FROM site_home_versions WHERE is_current = true",
    );
    expect(current.rows).toEqual([{ id: VERSION_ID }]);
  });

  it("MIG-B3-007: consolidated versions are append-only except for true to false", async () => {
    for (const update of [
      ["snapshot_json = $1::jsonb", JSON.stringify({ changed: true })],
      ["banner_id = $1", UNKNOWN_ID],
      ["contacts_id = $1", UNKNOWN_ID],
      ["social_configuration_id = $1", null],
      ["version_number = $1", 2],
      ["change_summary = $1", "Resumo modificado posteriormente"],
      ["created_by = $1", OTHER_ACTOR_ID],
      ["published_at = $1", new Date("2030-01-01T00:00:00.000Z")],
    ] as const) {
      await expectConstraint(
        `UPDATE site_home_versions SET ${update[0]} WHERE id = $2`,
        [update[1], VERSION_ID],
        "ck_site_home_versions__immutable",
      );
    }

    const deactivated = await client!.query<{ is_current: boolean }>(
      "UPDATE site_home_versions SET is_current = false WHERE id = $1 RETURNING is_current",
      [VERSION_ID],
    );
    expect(deactivated.rows).toEqual([{ is_current: false }]);
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
  });

  it("MIG-B3-008: down removes only B3, preserves B2 sentinels, and re-up recreates B3", async () => {
    const down = await runDbmate("down");
    expect(down).toContain(B3_MIGRATION);
    const b3Tables = await client!.query<{ review_table: string | null; version_table: string | null }>(
      `SELECT to_regclass('public.site_home_reviews')::text AS review_table,
              to_regclass('public.site_home_versions')::text AS version_table`,
    );
    expect(b3Tables.rows).toEqual([{ review_table: null, version_table: null }]);

    const b2Tables = await client!.query<{ count: string }>(
      `SELECT count(*) FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])`,
      [[
        "app_users",
        "site_home_banners",
        "site_public_contacts",
        "site_social_configurations",
        "site_social_links",
      ]],
    );
    expect(b2Tables.rows).toEqual([{ count: "5" }]);
    expect((await client!.query("SELECT id FROM site_home_banners WHERE id = $1", [BANNER_ID])).rows).toHaveLength(1);
    expect((await client!.query("SELECT id FROM site_public_contacts WHERE id = $1", [CONTACTS_ID])).rows).toHaveLength(1);
    expect((await client!.query("SELECT id FROM site_social_configurations WHERE id = $1", [SOCIAL_ID])).rows).toHaveLength(1);
    expect((await client!.query("SELECT id FROM site_social_links WHERE social_configuration_id = $1", [SOCIAL_ID])).rows).toHaveLength(1);
    expect((await client!.query("SELECT id FROM app_users WHERE id = $1", [SUBMITTER_ID])).rows).toHaveLength(1);

    const migrationRows = await client!.query<{ version: string }>(
      "SELECT version FROM schema_migrations ORDER BY version",
    );
    expect(migrationRows.rows).toEqual([{ version: "20260812170941" }]);
    const afterDown = await runDbmate("status");
    expect(afterDown).toContain("Applied: 1");
    expect(afterDown).toContain("Pending: 1");

    const reUp = await runDbmate("up");
    expect(reUp).toContain(B3_MIGRATION);
    const afterReUp = await runDbmate("status");
    expect(afterReUp).toContain("Applied: 2");
    expect(afterReUp).toContain("Pending: 0");
    const recreated = await client!.query<{ review_table: string; version_table: string }>(
      `SELECT to_regclass('public.site_home_reviews')::text AS review_table,
              to_regclass('public.site_home_versions')::text AS version_table`,
    );
    expect(recreated.rows).toEqual([
      { review_table: "site_home_reviews", version_table: "site_home_versions" },
    ]);
  });
});
