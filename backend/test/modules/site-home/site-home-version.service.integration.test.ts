import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { promisify } from "node:util";

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeDatabasePool, createDatabasePool } from "../../../src/database/pool.js";
import { withTransaction } from "../../../src/database/transaction.js";
import {
  HomeVersionNotFoundError,
  InvalidHomeSnapshotError,
  SiteHomeVersionService,
  buildSnapshot,
  type SiteHomeSnapshot,
} from "../../../src/modules/site-home/site-home-version.service.js";
import {
  BannerRepository,
  ContactsRepository,
  HomeVersionRepository,
  SocialConfigurationRepository,
} from "../../../src/modules/site-home/site-home.repository.js";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const DBMATE_EXECUTABLE = require.resolve(
  `@dbmate/${process.platform}-${process.arch}/bin/dbmate${process.platform === "win32" ? ".exe" : ""}`,
);
const POSTGRES_IMAGE = "postgres:18.4-bookworm";
const ACTOR_ID = "82000000-0000-4000-8000-000000000001";
const RESTORER_ID = "82000000-0000-4000-8000-000000000002";
const UNKNOWN_VERSION_ID = "82000000-0000-4000-8000-000000000099";

let container: StartedPostgreSqlContainer | undefined;
let pool: Pool | undefined;
let service: SiteHomeVersionService;
let versionRepository: HomeVersionRepository;
let bannerRepository: BannerRepository;
let contactsRepository: ContactsRepository;
let socialRepository: SocialConfigurationRepository;
let databaseUrl: string;
let publishedBannerId: string;
let publishedContactsId: string;
let publishedSocialId: string;
let currentVersionId: string;
let historicalVersionId: string;

const currentSnapshot = buildSnapshot({
  banner: {
    title: "Banner publicado atual",
    subtitle: "Conteúdo vigente",
    bodyText: "Conteúdo publicado atualmente na página inicial.",
    imageUrl: "/assets/current.webp",
    imageAlt: "Equipe sindical reunida",
    ctaEnabled: true,
    ctaLabel: "Saiba mais",
    ctaLinkType: "internal",
    ctaLinkValue: "/institucional",
  },
  contacts: {
    phone: "(65) 3000-0000",
    email: "atual@example.test",
    address: "Rua Atual, 100",
    city: "Cuiabá",
    state: "MT",
    postalCode: "78000-100",
    businessHours: "Segunda a sexta, 8h às 17h",
  },
  socialConfiguration: {
    links: [
      {
        platform: "facebook",
        url: "https://example.test/current-facebook",
        displayOrder: 1,
        isActive: true,
      },
    ],
  },
});

const historicalSnapshot = buildSnapshot({
  banner: {
    title: "Banner histórico",
    subtitle: null,
    bodyText: "Conteúdo funcional preservado na versão histórica.",
    imageUrl: "/assets/historical.webp",
    imageAlt: "Assembleia histórica",
    ctaEnabled: false,
    ctaLabel: null,
    ctaLinkType: null,
    ctaLinkValue: null,
  },
  contacts: {
    phone: null,
    email: "historico@example.test",
    address: "Avenida Histórica, 20",
    city: "Várzea Grande",
    state: "MT",
    postalCode: "78110-000",
    businessHours: null,
  },
  socialConfiguration: {
    links: [
      {
        platform: "instagram",
        url: "https://example.test/historical-instagram",
        displayOrder: 2,
        isActive: false,
      },
      {
        platform: "youtube",
        url: "https://example.test/historical-youtube",
        displayOrder: 1,
        isActive: true,
      },
    ],
  },
});

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

async function insertVersion(
  versionNumber: number,
  snapshot: SiteHomeSnapshot,
  isCurrent = false,
): Promise<string> {
  const version = await withTransaction(pool!, (client) => service.createVersion({
    bannerId: publishedBannerId,
    contactsId: publishedContactsId,
    socialConfigurationId: publishedSocialId,
    versionNumber,
    snapshot,
    changeSummary: `Versão consolidada número ${versionNumber}`,
    isCurrent,
    createdBy: ACTOR_ID,
  }, client));
  return version.id;
}

async function rowCount(table: string): Promise<number> {
  const result = await pool!.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${table}`);
  return Number(result.rows[0]!.count);
}

describe("site-home versioning and restore service", () => {
  beforeAll(async () => {
    delete process.env.DATABASE_URL;
    container = await new PostgreSqlContainer(POSTGRES_IMAGE)
      .withDatabase("sind_gestao_version_restore_test")
      .withUsername("sind_gestao_version_restore_user")
      .withPassword("testcontainer_version_restore_only")
      .start();
    const url = new URL(container.getConnectionUri());
    url.searchParams.set("sslmode", "disable");
    databaseUrl = url.toString();
    await migrateDatabase();
    pool = createDatabasePool({ nodeEnvironment: "test", databaseUrl });
    await pool.query("INSERT INTO app_users (id) VALUES ($1), ($2)", [ACTOR_ID, RESTORER_ID]);

    const banner = await pool.query<{ id: string }>(
      `INSERT INTO site_home_banners
        (title, subtitle, body_text, image_url, image_alt, cta_enabled, cta_label,
         cta_link_type, cta_link_value, status, version_number, published_at, created_by)
       VALUES ($1, $2, $3, $4, $5, true, $6, 'internal', $7, 'published', 1,
               CURRENT_TIMESTAMP, $8)
       RETURNING id`,
      [
        currentSnapshot.banner.title,
        currentSnapshot.banner.subtitle,
        currentSnapshot.banner.bodyText,
        currentSnapshot.banner.imageUrl,
        currentSnapshot.banner.imageAlt,
        currentSnapshot.banner.ctaLabel,
        currentSnapshot.banner.ctaLinkValue,
        ACTOR_ID,
      ],
    );
    publishedBannerId = banner.rows[0]!.id;

    const contacts = await pool.query<{ id: string }>(
      `INSERT INTO site_public_contacts
        (phone, email, address, city, state, postal_code, business_hours, status,
         version_number, published_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'published', 1, CURRENT_TIMESTAMP, $8)
       RETURNING id`,
      [
        currentSnapshot.contacts.phone,
        currentSnapshot.contacts.email,
        currentSnapshot.contacts.address,
        currentSnapshot.contacts.city,
        currentSnapshot.contacts.state,
        currentSnapshot.contacts.postalCode,
        currentSnapshot.contacts.businessHours,
        ACTOR_ID,
      ],
    );
    publishedContactsId = contacts.rows[0]!.id;

    const social = await pool.query<{ id: string }>(
      `INSERT INTO site_social_configurations
        (status, version_number, published_at, created_by)
       VALUES ('published', 1, CURRENT_TIMESTAMP, $1)
       RETURNING id`,
      [ACTOR_ID],
    );
    publishedSocialId = social.rows[0]!.id;
    await pool.query(
      `INSERT INTO site_social_links
        (social_configuration_id, platform, url, display_order, is_active, created_by)
       VALUES ($1, 'facebook', $2, 1, true, $3)`,
      [publishedSocialId, "https://example.test/current-facebook", ACTOR_ID],
    );

    bannerRepository = new BannerRepository(pool);
    contactsRepository = new ContactsRepository(pool);
    socialRepository = new SocialConfigurationRepository(pool);
    versionRepository = new HomeVersionRepository(pool);
    service = new SiteHomeVersionService(
      pool,
      bannerRepository,
      contactsRepository,
      socialRepository,
      versionRepository,
    );
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

  it("VERSION-DB-001: creates immutable historical/current versions through the repository", async () => {
    currentVersionId = await insertVersion(1, currentSnapshot, true);
    historicalVersionId = await insertVersion(2, historicalSnapshot);
    await pool!.query(
      `INSERT INTO site_home_reviews
        (content_type, banner_id, cycle_number, content_version, submitted_content_hash,
         decision, submitted_by, reviewed_by, reviewed_at)
       VALUES ('banner', $1, 1, 1, $2, 'approved', $3, $4, CURRENT_TIMESTAMP)`,
      [publishedBannerId, "sha256:historical-review", ACTOR_ID, RESTORER_ID],
    );

    expect(await versionRepository.findHomeVersionById(currentVersionId)).toMatchObject({
      versionNumber: 1,
      isCurrent: true,
      snapshotJson: currentSnapshot,
      createdBy: ACTOR_ID,
    });
    expect(await versionRepository.findHomeVersionById(historicalVersionId)).toMatchObject({
      versionNumber: 2,
      isCurrent: false,
      snapshotJson: historicalSnapshot,
    });
    await expect(insertVersion(3, historicalSnapshot, true)).rejects.toMatchObject({
      constraint: "ux_site_home_versions__current",
    });
    expect((await versionRepository.findHomeVersionById(currentVersionId))?.isCurrent).toBe(true);
  });

  it("VERSION-DB-002: restores a historical banner as a new draft without changing editorial state", async () => {
    const sourceBefore = await versionRepository.findHomeVersionById(historicalVersionId);
    const result = await service.restoreToDraft({
      versionId: historicalVersionId,
      contentType: "banner",
      actorId: RESTORER_ID,
    });

    expect(result.contentType).toBe("banner");
    if (result.contentType !== "banner") throw new Error("Unexpected restore result");
    expect(result.draft).toMatchObject({
      ...historicalSnapshot.banner,
      status: "draft",
      versionNumber: 2,
      createdBy: RESTORER_ID,
      updatedBy: null,
      publishedAt: null,
    });
    expect(result.draft.id).not.toBe(publishedBannerId);
    expect((await bannerRepository.findCurrentPublishedBanner())?.id).toBe(publishedBannerId);
    expect((await versionRepository.findHomeVersionById(currentVersionId))?.isCurrent).toBe(true);
    expect(await versionRepository.findHomeVersionById(historicalVersionId)).toEqual(sourceBefore);
    expect(await rowCount("site_home_reviews")).toBe(1);
    expect((await pool!.query(
      "SELECT COUNT(*)::text AS count FROM site_home_reviews WHERE banner_id = $1",
      [result.draft.id],
    )).rows[0]!.count).toBe("0");
  });

  it("VERSION-DB-003: restores historical contacts as a separate draft", async () => {
    const result = await service.restoreToDraft({
      versionId: historicalVersionId,
      contentType: "contacts",
      actorId: RESTORER_ID,
    });

    expect(result.contentType).toBe("contacts");
    if (result.contentType !== "contacts") throw new Error("Unexpected restore result");
    expect(result.draft).toMatchObject({
      ...historicalSnapshot.contacts,
      status: "draft",
      versionNumber: 2,
      createdBy: RESTORER_ID,
      updatedBy: null,
      publishedAt: null,
    });
    expect(result.draft.id).not.toBe(publishedContactsId);
    expect((await contactsRepository.findCurrentPublishedContacts())?.id).toBe(publishedContactsId);
    expect((await versionRepository.findHomeVersionById(currentVersionId))?.isCurrent).toBe(true);
    expect((await versionRepository.findHomeVersionById(historicalVersionId))?.snapshotJson)
      .toEqual(historicalSnapshot);
  });

  it("VERSION-DB-004: restores the complete social configuration with new identities", async () => {
    const sourceLinkIds = (await socialRepository.listSocialLinks(publishedSocialId)).map((link) => link.id);
    const result = await service.restoreToDraft({
      versionId: historicalVersionId,
      contentType: "social_configuration",
      actorId: RESTORER_ID,
    });

    expect(result.contentType).toBe("social_configuration");
    if (result.contentType !== "social_configuration") throw new Error("Unexpected restore result");
    expect(result.draft).toMatchObject({
      status: "draft",
      versionNumber: 2,
      createdBy: RESTORER_ID,
      updatedBy: null,
      publishedAt: null,
    });
    expect(result.draft.id).not.toBe(publishedSocialId);
    expect(result.links.map(({ platform, url, displayOrder, isActive }) => ({
      platform,
      url,
      displayOrder,
      isActive,
    }))).toEqual(historicalSnapshot.socialConfiguration!.links);
    expect(result.links.every((link) => !sourceLinkIds.includes(link.id))).toBe(true);
    expect(result.links.every((link) => link.socialConfigurationId === result.draft.id)).toBe(true);
    expect((await socialRepository.findCurrentPublishedSocialConfiguration())?.id).toBe(publishedSocialId);
    expect((await socialRepository.listSocialLinks(publishedSocialId)).map((link) => link.url))
      .toEqual(["https://example.test/current-facebook"]);
    expect((await versionRepository.findHomeVersionById(currentVersionId))?.isCurrent).toBe(true);
    expect((await versionRepository.findHomeVersionById(historicalVersionId))?.snapshotJson)
      .toEqual(historicalSnapshot);
  });

  it("VERSION-DB-005: allocates unique sequential entity versions under concurrent restores", async () => {
    const results = await Promise.all([
      service.restoreToDraft({
        versionId: historicalVersionId,
        contentType: "banner",
        actorId: RESTORER_ID,
      }),
      service.restoreToDraft({
        versionId: historicalVersionId,
        contentType: "banner",
        actorId: ACTOR_ID,
      }),
    ]);
    const versions = results.map((result) => {
      if (result.contentType !== "banner") throw new Error("Unexpected restore result");
      return result.draft.versionNumber;
    }).sort((left, right) => left - right);

    expect(versions).toEqual([3, 4]);
    expect((await bannerRepository.findCurrentPublishedBanner())?.id).toBe(publishedBannerId);
  });

  it("VERSION-DB-006: supports versions without social content and rejects only social restore", async () => {
    const noSocialSnapshot: SiteHomeSnapshot = {
      ...historicalSnapshot,
      socialConfiguration: null,
    };
    const versionId = await insertVersion(3, noSocialSnapshot);

    await expect(service.restoreToDraft({
      versionId,
      contentType: "banner",
      actorId: RESTORER_ID,
    })).resolves.toMatchObject({ contentType: "banner", draft: { versionNumber: 5 } });
    await expect(service.restoreToDraft({
      versionId,
      contentType: "contacts",
      actorId: RESTORER_ID,
    })).resolves.toMatchObject({ contentType: "contacts", draft: { versionNumber: 3 } });
    await expect(service.restoreToDraft({
      versionId,
      contentType: "social_configuration",
      actorId: RESTORER_ID,
    })).rejects.toBeInstanceOf(InvalidHomeSnapshotError);
  });

  it("VERSION-DB-007: reports missing and malformed snapshots without partial drafts", async () => {
    await expect(service.restoreToDraft({
      versionId: UNKNOWN_VERSION_ID,
      contentType: "banner",
      actorId: RESTORER_ID,
    })).rejects.toBeInstanceOf(HomeVersionNotFoundError);

    const malformed = await pool!.query<{ id: string }>(
      `INSERT INTO site_home_versions
        (banner_id, contacts_id, social_configuration_id, version_number, snapshot_json,
         change_summary, is_current, created_by)
       VALUES ($1, $2, $3, 4, $4::jsonb, $5, false, $6)
       RETURNING id`,
      [
        publishedBannerId,
        publishedContactsId,
        publishedSocialId,
        JSON.stringify({ schemaVersion: 1, banner: null }),
        "Snapshot propositalmente inválido",
        ACTOR_ID,
      ],
    );
    const bannersBefore = await rowCount("site_home_banners");
    await expect(service.restoreToDraft({
      versionId: malformed.rows[0]!.id,
      contentType: "banner",
      actorId: RESTORER_ID,
    })).rejects.toBeInstanceOf(InvalidHomeSnapshotError);
    expect(await rowCount("site_home_banners")).toBe(bannersBefore);
  });

  it("VERSION-DB-008: rolls back a social configuration when replacing its links fails", async () => {
    const duplicateSocialSnapshot = structuredClone(historicalSnapshot);
    duplicateSocialSnapshot.socialConfiguration = {
      links: [
        {
          platform: "facebook",
          url: "https://example.test/first-facebook",
          displayOrder: 1,
          isActive: true,
        },
        {
          platform: "facebook",
          url: "https://example.test/duplicate-facebook",
          displayOrder: 2,
          isActive: false,
        },
      ],
    };
    const versionId = await insertVersion(5, duplicateSocialSnapshot);
    const configurationsBefore = await rowCount("site_social_configurations");
    const linksBefore = await rowCount("site_social_links");

    await expect(service.restoreToDraft({
      versionId,
      contentType: "social_configuration",
      actorId: RESTORER_ID,
    })).rejects.toMatchObject({
      constraint: "uq_site_social_links__social_configuration_id_platform",
    });
    expect(await rowCount("site_social_configurations")).toBe(configurationsBefore);
    expect(await rowCount("site_social_links")).toBe(linksBefore);
    expect((await socialRepository.findCurrentPublishedSocialConfiguration())?.id).toBe(publishedSocialId);
    expect((await versionRepository.findHomeVersionById(currentVersionId))?.isCurrent).toBe(true);
    expect(await rowCount("site_home_reviews")).toBe(1);
  });
});
