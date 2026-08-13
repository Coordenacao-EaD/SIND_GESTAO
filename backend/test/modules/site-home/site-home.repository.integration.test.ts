import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { promisify } from "node:util";

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildPoolConfig, closeDatabasePool, createDatabasePool } from "../../../src/database/pool.js";
import { withTransaction } from "../../../src/database/transaction.js";
import {
  BannerRepository,
  ContactsRepository,
  HomeVersionRepository,
  ReviewRepository,
  SocialConfigurationRepository,
} from "../../../src/modules/site-home/site-home.repository.js";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const DBMATE_EXECUTABLE = require.resolve(
  `@dbmate/${process.platform}-${process.arch}/bin/dbmate${process.platform === "win32" ? ".exe" : ""}`,
);
const POSTGRES_IMAGE = "postgres:18.4-bookworm";
const ACTOR_ID = "81000000-0000-4000-8000-000000000001";
const OTHER_ACTOR_ID = "81000000-0000-4000-8000-000000000002";
const REVIEWER_ID = "81000000-0000-4000-8000-000000000003";

let container: StartedPostgreSqlContainer | undefined;
let pool: Pool | undefined;
let databaseUrl: string;
let bannerDraftId: string;
let bannerPublishedId: string;
let contactsDraftId: string;
let contactsPublishedId: string;
let socialDraftId: string;
let socialPublishedId: string;

async function migrateDatabase(): Promise<void> {
  await execFileAsync(
    DBMATE_EXECUTABLE,
    ["--migrations-dir", "db/migrations", "--schema-file", "db/schema.sql", "--no-dump-schema", "up"],
    {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      windowsHide: true,
    },
  );
}

describe("site-home repositories and transactions", () => {
  beforeAll(async () => {
    delete process.env.DATABASE_URL;
    container = await new PostgreSqlContainer(POSTGRES_IMAGE)
      .withDatabase("sind_gestao_repository_test")
      .withUsername("sind_gestao_repository_user")
      .withPassword("testcontainer_repository_only")
      .start();
    const url = new URL(container.getConnectionUri());
    url.searchParams.set("sslmode", "disable");
    databaseUrl = url.toString();
    await migrateDatabase();
    pool = createDatabasePool({ nodeEnvironment: "test", databaseUrl });
    await pool.query("INSERT INTO app_users (id) VALUES ($1), ($2), ($3)", [
      ACTOR_ID,
      OTHER_ACTOR_ID,
      REVIEWER_ID,
    ]);
  });

  afterAll(async () => {
    if (pool) {
      await closeDatabasePool(pool);
      pool = undefined;
    }
    if (container) {
      await container.stop();
      container = undefined;
    }
  });

  it("REPO-001: inserts, finds and updates banners with clear not-found results", async () => {
    const repository = new BannerRepository(pool!);
    const inserted = await repository.insertBannerDraft({
      title: "Banner em rascunho",
      subtitle: "Subtítulo inicial",
      bodyText: "Conteúdo válido do banner em rascunho.",
      imageUrl: "/assets/draft.webp",
      imageAlt: "Descrição acessível",
      ctaEnabled: true,
      ctaLabel: "Conheça",
      ctaLinkType: "internal",
      ctaLinkValue: "/institucional",
      versionNumber: 1,
      createdBy: ACTOR_ID,
    });
    bannerDraftId = inserted.id;
    expect(inserted.status).toBe("draft");
    expect((await repository.findBannerById(inserted.id))?.title).toBe("Banner em rascunho");
    expect((await repository.findBannerByVersion(1))?.id).toBe(inserted.id);

    const updated = await repository.updateBannerDraft(inserted.id, {
      title: "Banner atualizado",
      subtitle: null,
      bodyText: "Conteúdo atualizado e ainda válido do banner.",
      imageUrl: null,
      imageAlt: null,
      ctaEnabled: false,
      ctaLabel: null,
      ctaLinkType: null,
      ctaLinkValue: null,
      versionNumber: 1,
      updatedBy: OTHER_ACTOR_ID,
    });
    expect(updated).toMatchObject({ title: "Banner atualizado", updatedBy: OTHER_ACTOR_ID });
    expect(await repository.updateBannerDraft("00000000-0000-4000-8000-000000000099", {
      title: "Inexistente",
      subtitle: null,
      bodyText: "Conteúdo inexistente válido.",
      imageUrl: null,
      imageAlt: null,
      ctaEnabled: false,
      ctaLabel: null,
      ctaLinkType: null,
      ctaLinkValue: null,
      versionNumber: 99,
      updatedBy: ACTOR_ID,
    })).toBeNull();
    expect(await repository.findBannerById("00000000-0000-4000-8000-000000000099")).toBeNull();

    const published = await pool!.query<{ id: string }>(
      `INSERT INTO site_home_banners
        (title, body_text, status, version_number, published_at, created_by)
       VALUES ($1, $2, 'published', $3, CURRENT_TIMESTAMP, $4)
       RETURNING id`,
      ["Banner publicado", "Conteúdo publicado válido.", 2, ACTOR_ID],
    );
    bannerPublishedId = published.rows[0]!.id;
    expect((await repository.findCurrentPublishedBanner())?.id).toBe(bannerPublishedId);
  });

  it("REPO-002: inserts, finds and updates contacts with current published lookup", async () => {
    const repository = new ContactsRepository(pool!);
    const inserted = await repository.insertContactsDraft({
      phone: "(65) 3000-0000",
      email: "draft@example.test",
      address: "Rua Inicial, 10",
      city: "Cuiabá",
      state: "MT",
      postalCode: "78000-000",
      businessHours: null,
      versionNumber: 1,
      createdBy: ACTOR_ID,
    });
    contactsDraftId = inserted.id;
    expect((await repository.findContactsById(inserted.id))?.email).toBe("draft@example.test");
    expect((await repository.findContactsByVersion(1))?.id).toBe(inserted.id);
    expect(await repository.findContactsById("00000000-0000-4000-8000-000000000099")).toBeNull();

    const updated = await repository.updateContactsDraft(inserted.id, {
      phone: null,
      email: "updated@example.test",
      address: "Rua Atualizada, 20",
      city: "Várzea Grande",
      state: "MT",
      postalCode: "78110000",
      businessHours: "Das 8h às 17h",
      versionNumber: 1,
      updatedBy: OTHER_ACTOR_ID,
    });
    expect(updated).toMatchObject({ email: "updated@example.test", city: "Várzea Grande" });

    const published = await pool!.query<{ id: string }>(
      `INSERT INTO site_public_contacts
        (email, address, city, postal_code, status, version_number, published_at, created_by)
       VALUES ($1, $2, $3, $4, 'published', $5, CURRENT_TIMESTAMP, $6)
       RETURNING id`,
      ["published@example.test", "Rua Publicada, 30", "Cuiabá", "78000001", 2, ACTOR_ID],
    );
    contactsPublishedId = published.rows[0]!.id;
    expect((await repository.findCurrentPublishedContacts())?.id).toBe(contactsPublishedId);
  });

  it("REPO-003: persists social configuration and replaces links in deterministic order", async () => {
    const repository = new SocialConfigurationRepository(pool!);
    const inserted = await repository.insertSocialConfigurationDraft({
      versionNumber: 1,
      createdBy: ACTOR_ID,
    });
    socialDraftId = inserted.id;
    expect((await repository.findSocialConfigurationByVersion(1))?.id).toBe(inserted.id);
    expect((await repository.findSocialConfigurationById(inserted.id))?.status).toBe("draft");
    expect(await repository.findSocialConfigurationById("00000000-0000-4000-8000-000000000099")).toBeNull();
    expect(await repository.updateSocialConfigurationDraft(inserted.id, {
      versionNumber: 1,
      updatedBy: OTHER_ACTOR_ID,
    })).toMatchObject({ updatedBy: OTHER_ACTOR_ID });

    await withTransaction(pool!, (client) =>
      repository.replaceSocialLinks(inserted.id, [
        {
          platform: "instagram",
          url: "https://example.test/instagram",
          displayOrder: 2,
          isActive: true,
          createdBy: ACTOR_ID,
        },
        {
          platform: "facebook",
          url: "https://example.test/facebook",
          displayOrder: 1,
          isActive: false,
          createdBy: ACTOR_ID,
        },
      ], client),
    );
    expect((await repository.listSocialLinks(inserted.id)).map((link) => link.platform)).toEqual([
      "facebook",
      "instagram",
    ]);

    const published = await pool!.query<{ id: string }>(
      `INSERT INTO site_social_configurations
        (status, version_number, published_at, created_by)
       VALUES ('published', $1, CURRENT_TIMESTAMP, $2)
       RETURNING id`,
      [2, ACTOR_ID],
    );
    socialPublishedId = published.rows[0]!.id;
    expect((await repository.findCurrentPublishedSocialConfiguration())?.id).toBe(socialPublishedId);
  });

  it("REPO-004: rolls back replaceSocialLinks without leaving a partial collection", async () => {
    const repository = new SocialConfigurationRepository(pool!);
    const original = await repository.listSocialLinks(socialDraftId);
    let databaseError: unknown;
    try {
      await withTransaction(pool!, (client) =>
        repository.replaceSocialLinks(socialDraftId, [
          {
            platform: "youtube",
            url: "https://example.test/youtube-one",
            displayOrder: 0,
            isActive: true,
            createdBy: ACTOR_ID,
          },
          {
            platform: "youtube",
            url: "https://example.test/youtube-two",
            displayOrder: 1,
            isActive: true,
            createdBy: ACTOR_ID,
          },
        ], client),
      );
    } catch (error) {
      databaseError = error;
    }
    expect(databaseError).toMatchObject({
      constraint: "uq_site_social_links__social_configuration_id_platform",
    });
    expect(await repository.listSocialLinks(socialDraftId)).toEqual(original);
  });

  it("REPO-005: creates and reads pending review primitives and content history", async () => {
    const repository = new ReviewRepository(pool!);
    const created = await repository.createReviewCycle({
      contentType: "banner",
      bannerId: bannerDraftId,
      cycleNumber: 1,
      contentVersion: 1,
      submittedContentHash: "sha256:0123456789abcdef",
      submittedBy: ACTOR_ID,
    });
    expect(created).toMatchObject({
      contentType: "banner",
      contentId: bannerDraftId,
      decision: "pending",
    });
    expect((await repository.findReviewById(created.id))?.id).toBe(created.id);
    expect((await repository.findPendingReviewForContent("banner", bannerDraftId))?.id).toBe(created.id);
    expect((await repository.listPendingReviews()).map((review) => review.id)).toContain(created.id);
    expect((await repository.listReviewsForContent("banner", bannerDraftId)).map((review) => review.id)).toEqual([
      created.id,
    ]);
    expect(await repository.findPendingReviewForContent("contacts", contactsDraftId)).toBeNull();
  });

  it("REPO-006: reads current and historical consolidated home versions", async () => {
    const first = await pool!.query<{ id: string }>(
      `INSERT INTO site_home_versions
        (banner_id, contacts_id, social_configuration_id, version_number,
         snapshot_json, change_summary, is_current, created_by)
       VALUES ($1, $2, $3, 1, $4::jsonb, $5, true, $6)
       RETURNING id`,
      [
        bannerPublishedId,
        contactsPublishedId,
        socialPublishedId,
        JSON.stringify({ banner: bannerPublishedId, contacts: contactsPublishedId }),
        "Primeira versão consolidada",
        ACTOR_ID,
      ],
    );
    const second = await pool!.query<{ id: string }>(
      `INSERT INTO site_home_versions
        (banner_id, contacts_id, social_configuration_id, version_number,
         snapshot_json, change_summary, is_current, created_by)
       VALUES ($1, $2, $3, 2, $4::jsonb, $5, false, $6)
       RETURNING id`,
      [
        bannerPublishedId,
        contactsPublishedId,
        socialPublishedId,
        JSON.stringify({ historical: true }),
        "Segunda versão histórica",
        OTHER_ACTOR_ID,
      ],
    );
    const repository = new HomeVersionRepository(pool!);
    expect((await repository.findCurrentHomeVersion())?.id).toBe(first.rows[0]!.id);
    expect((await repository.findHomeVersionById(second.rows[0]!.id))?.versionNumber).toBe(2);
    expect((await repository.findHomeVersionByNumber(1))?.id).toBe(first.rows[0]!.id);
    expect((await repository.listHomeVersions()).map((version) => version.versionNumber)).toEqual([2, 1]);
    expect(await repository.findHomeVersionById("00000000-0000-4000-8000-000000000099")).toBeNull();
  });

  it("REPO-007: commits multiple repository operations in one explicit transaction", async () => {
    const bannerRepository = new BannerRepository(pool!);
    const contactsRepository = new ContactsRepository(pool!);
    const result = await withTransaction(pool!, async (client) => {
      const committedBanner = await bannerRepository.insertBannerDraft({
        title: "Banner transacional",
        subtitle: null,
        bodyText: "Conteúdo válido inserido na transação.",
        imageUrl: null,
        imageAlt: null,
        ctaEnabled: false,
        ctaLabel: null,
        ctaLinkType: null,
        ctaLinkValue: null,
        versionNumber: 20,
        createdBy: ACTOR_ID,
      }, client);
      const committedContacts = await contactsRepository.insertContactsDraft({
        phone: null,
        email: "transaction@example.test",
        address: "Rua Transacional, 40",
        city: "Cuiabá",
        state: "MT",
        postalCode: "78000040",
        businessHours: null,
        versionNumber: 20,
        createdBy: ACTOR_ID,
      }, client);
      return { bannerId: committedBanner.id, contactsId: committedContacts.id };
    });
    expect(await bannerRepository.findBannerById(result.bannerId)).not.toBeNull();
    expect(await contactsRepository.findContactsById(result.contactsId)).not.toBeNull();
  });

  it("REPO-008: rolls back on the original database error and releases the client", async () => {
    const singleConnectionPool = new Pool({
      ...buildPoolConfig({ nodeEnvironment: "test", databaseUrl }),
      max: 1,
    });
    const repository = new SocialConfigurationRepository(singleConnectionPool);
    let databaseError: unknown;
    try {
      await withTransaction(singleConnectionPool, async (client) => {
        await repository.insertSocialConfigurationDraft(
          { versionNumber: 30, createdBy: ACTOR_ID },
          client,
        );
        await repository.insertSocialConfigurationDraft(
          { versionNumber: 1, createdBy: ACTOR_ID },
          client,
        );
      });
    } catch (error) {
      databaseError = error;
    }
    expect(databaseError).toMatchObject({
      constraint: "uq_site_social_configurations__version_number",
    });
    expect(await repository.findSocialConfigurationByVersion(30)).toBeNull();
    expect((await singleConnectionPool.query("SELECT 1::int AS value")).rows).toEqual([{ value: 1 }]);
    await singleConnectionPool.end();
  });
});
