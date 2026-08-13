import type { PoolClient } from "pg";

import type { QueryExecutor } from "../../database/transaction.js";
import type {
  BannerDraftInput,
  BannerDraftUpdateInput,
  ContactsDraftInput,
  ContactsDraftUpdateInput,
  CreateHomeVersionInput,
  CreateReviewCycleInput,
  ReviewContentType,
  SiteHomeBanner,
  SiteHomeReview,
  SiteHomeVersion,
  SitePublicContacts,
  SiteSocialConfiguration,
  SiteSocialLink,
  SocialConfigurationDraftInput,
  SocialConfigurationDraftUpdateInput,
  SocialLinkReplacementInput,
} from "./site-home.repository.types.js";

interface BannerRow {
  id: string;
  title: string;
  subtitle: string | null;
  body_text: string;
  image_url: string | null;
  image_alt: string | null;
  cta_enabled: boolean;
  cta_label: string | null;
  cta_link_type: "internal" | "external" | null;
  cta_link_value: string | null;
  status: SiteHomeBanner["status"];
  version_number: number;
  published_at: Date | null;
  created_by: string;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

interface ContactsRow {
  id: string;
  phone: string | null;
  email: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  business_hours: string | null;
  status: SitePublicContacts["status"];
  version_number: number;
  published_at: Date | null;
  created_by: string;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

interface SocialConfigurationRow {
  id: string;
  status: SiteSocialConfiguration["status"];
  version_number: number;
  submitted_at: Date | null;
  published_at: Date | null;
  archived_at: Date | null;
  created_by: string;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

interface SocialLinkRow {
  id: string;
  social_configuration_id: string;
  platform: SiteSocialLink["platform"];
  url: string;
  display_order: number;
  is_active: boolean;
  created_by: string;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

interface ReviewRow {
  id: string;
  content_type: SiteHomeReview["contentType"];
  banner_id: string | null;
  contacts_id: string | null;
  social_configuration_id: string | null;
  content_id: string;
  cycle_number: number;
  content_version: number;
  submitted_content_hash: string;
  decision: SiteHomeReview["decision"];
  submitted_by: string;
  submitted_at: Date;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  review_notes: string | null;
  invalidated_by: string | null;
  invalidated_at: Date | null;
  invalidation_reason: string | null;
}

interface HomeVersionRow {
  id: string;
  banner_id: string;
  contacts_id: string;
  social_configuration_id: string | null;
  version_number: number;
  snapshot_json: Record<string, unknown>;
  change_summary: string;
  published_at: Date;
  is_current: boolean;
  created_by: string;
}

const BANNER_COLUMNS = `id, title, subtitle, body_text, image_url, image_alt,
  cta_enabled, cta_label, cta_link_type, cta_link_value, status, version_number,
  published_at, created_by, updated_by, created_at, updated_at`;
const CONTACTS_COLUMNS = `id, phone, email, address, city, state, postal_code,
  business_hours, status, version_number, published_at, created_by, updated_by,
  created_at, updated_at`;
const SOCIAL_CONFIGURATION_COLUMNS = `id, status, version_number, submitted_at,
  published_at, archived_at, created_by, updated_by, created_at, updated_at`;
const SOCIAL_LINK_COLUMNS = `id, social_configuration_id, platform, url, display_order,
  is_active, created_by, updated_by, created_at, updated_at`;
const REVIEW_COLUMNS = `id, content_type, banner_id, contacts_id, social_configuration_id,
  content_id, cycle_number, content_version, submitted_content_hash, decision,
  submitted_by, submitted_at, reviewed_by, reviewed_at, review_notes,
  invalidated_by, invalidated_at, invalidation_reason`;
const HOME_VERSION_COLUMNS = `id, banner_id, contacts_id, social_configuration_id,
  version_number, snapshot_json, change_summary, published_at, is_current, created_by`;

function mapBanner(row: BannerRow): SiteHomeBanner {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    bodyText: row.body_text,
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
    ctaEnabled: row.cta_enabled,
    ctaLabel: row.cta_label,
    ctaLinkType: row.cta_link_type,
    ctaLinkValue: row.cta_link_value,
    status: row.status,
    versionNumber: row.version_number,
    publishedAt: row.published_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapContacts(row: ContactsRow): SitePublicContacts {
  return {
    id: row.id,
    phone: row.phone,
    email: row.email,
    address: row.address,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    businessHours: row.business_hours,
    status: row.status,
    versionNumber: row.version_number,
    publishedAt: row.published_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSocialConfiguration(row: SocialConfigurationRow): SiteSocialConfiguration {
  return {
    id: row.id,
    status: row.status,
    versionNumber: row.version_number,
    submittedAt: row.submitted_at,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSocialLink(row: SocialLinkRow): SiteSocialLink {
  return {
    id: row.id,
    socialConfigurationId: row.social_configuration_id,
    platform: row.platform,
    url: row.url,
    displayOrder: row.display_order,
    isActive: row.is_active,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReview(row: ReviewRow): SiteHomeReview {
  return {
    id: row.id,
    contentType: row.content_type,
    bannerId: row.banner_id,
    contactsId: row.contacts_id,
    socialConfigurationId: row.social_configuration_id,
    contentId: row.content_id,
    cycleNumber: row.cycle_number,
    contentVersion: row.content_version,
    submittedContentHash: row.submitted_content_hash,
    decision: row.decision,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_notes,
    invalidatedBy: row.invalidated_by,
    invalidatedAt: row.invalidated_at,
    invalidationReason: row.invalidation_reason,
  };
}

function mapHomeVersion(row: HomeVersionRow): SiteHomeVersion {
  return {
    id: row.id,
    bannerId: row.banner_id,
    contactsId: row.contacts_id,
    socialConfigurationId: row.social_configuration_id,
    versionNumber: row.version_number,
    snapshotJson: row.snapshot_json,
    changeSummary: row.change_summary,
    publishedAt: row.published_at,
    isCurrent: row.is_current,
    createdBy: row.created_by,
  };
}

class RepositoryBase {
  constructor(protected readonly defaultExecutor: QueryExecutor) {}

  protected executor(executor: QueryExecutor | undefined): QueryExecutor {
    return executor ?? this.defaultExecutor;
  }
}

export class BannerRepository extends RepositoryBase {
  async getNextBannerVersionNumber(executor: PoolClient): Promise<number> {
    await executor.query("SELECT pg_advisory_xact_lock($1::bigint)", [32_001]);
    const result = await executor.query<{ next_version: number }>(
      "SELECT COALESCE(MAX(version_number), 0)::int + 1 AS next_version FROM site_home_banners",
    );
    return result.rows[0]!.next_version;
  }

  async findBannerById(id: string, executor?: QueryExecutor): Promise<SiteHomeBanner | null> {
    const result = await this.executor(executor).query<BannerRow>(
      `SELECT ${BANNER_COLUMNS} FROM site_home_banners WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? mapBanner(result.rows[0]) : null;
  }

  async findBannerByVersion(
    versionNumber: number,
    executor?: QueryExecutor,
  ): Promise<SiteHomeBanner | null> {
    const result = await this.executor(executor).query<BannerRow>(
      `SELECT ${BANNER_COLUMNS} FROM site_home_banners WHERE version_number = $1`,
      [versionNumber],
    );
    return result.rows[0] ? mapBanner(result.rows[0]) : null;
  }

  async findCurrentPublishedBanner(executor?: QueryExecutor): Promise<SiteHomeBanner | null> {
    const result = await this.executor(executor).query<BannerRow>(
      `SELECT ${BANNER_COLUMNS} FROM site_home_banners WHERE status = 'published'`,
    );
    return result.rows[0] ? mapBanner(result.rows[0]) : null;
  }

  async insertBannerDraft(
    input: BannerDraftInput,
    executor?: QueryExecutor,
  ): Promise<SiteHomeBanner> {
    const result = await this.executor(executor).query<BannerRow>(
      `INSERT INTO site_home_banners
        (title, subtitle, body_text, image_url, image_alt, cta_enabled, cta_label,
         cta_link_type, cta_link_value, status, version_number, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10, $11)
       RETURNING ${BANNER_COLUMNS}`,
      [
        input.title,
        input.subtitle,
        input.bodyText,
        input.imageUrl,
        input.imageAlt,
        input.ctaEnabled,
        input.ctaLabel,
        input.ctaLinkType,
        input.ctaLinkValue,
        input.versionNumber,
        input.createdBy,
      ],
    );
    return mapBanner(result.rows[0]!);
  }

  async updateBannerDraft(
    id: string,
    input: BannerDraftUpdateInput,
    executor?: QueryExecutor,
  ): Promise<SiteHomeBanner | null> {
    const result = await this.executor(executor).query<BannerRow>(
      `UPDATE site_home_banners
          SET title = $2, subtitle = $3, body_text = $4, image_url = $5, image_alt = $6,
              cta_enabled = $7, cta_label = $8, cta_link_type = $9, cta_link_value = $10,
              version_number = $11, updated_by = $12, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING ${BANNER_COLUMNS}`,
      [
        id,
        input.title,
        input.subtitle,
        input.bodyText,
        input.imageUrl,
        input.imageAlt,
        input.ctaEnabled,
        input.ctaLabel,
        input.ctaLinkType,
        input.ctaLinkValue,
        input.versionNumber,
        input.updatedBy,
      ],
    );
    return result.rows[0] ? mapBanner(result.rows[0]) : null;
  }
}

export class ContactsRepository extends RepositoryBase {
  async getNextContactsVersionNumber(executor: PoolClient): Promise<number> {
    await executor.query("SELECT pg_advisory_xact_lock($1::bigint)", [32_002]);
    const result = await executor.query<{ next_version: number }>(
      "SELECT COALESCE(MAX(version_number), 0)::int + 1 AS next_version FROM site_public_contacts",
    );
    return result.rows[0]!.next_version;
  }

  async findContactsById(id: string, executor?: QueryExecutor): Promise<SitePublicContacts | null> {
    const result = await this.executor(executor).query<ContactsRow>(
      `SELECT ${CONTACTS_COLUMNS} FROM site_public_contacts WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? mapContacts(result.rows[0]) : null;
  }

  async findContactsByVersion(
    versionNumber: number,
    executor?: QueryExecutor,
  ): Promise<SitePublicContacts | null> {
    const result = await this.executor(executor).query<ContactsRow>(
      `SELECT ${CONTACTS_COLUMNS} FROM site_public_contacts WHERE version_number = $1`,
      [versionNumber],
    );
    return result.rows[0] ? mapContacts(result.rows[0]) : null;
  }

  async findCurrentPublishedContacts(executor?: QueryExecutor): Promise<SitePublicContacts | null> {
    const result = await this.executor(executor).query<ContactsRow>(
      `SELECT ${CONTACTS_COLUMNS} FROM site_public_contacts WHERE status = 'published'`,
    );
    return result.rows[0] ? mapContacts(result.rows[0]) : null;
  }

  async insertContactsDraft(
    input: ContactsDraftInput,
    executor?: QueryExecutor,
  ): Promise<SitePublicContacts> {
    const result = await this.executor(executor).query<ContactsRow>(
      `INSERT INTO site_public_contacts
        (phone, email, address, city, state, postal_code, business_hours,
         status, version_number, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8, $9)
       RETURNING ${CONTACTS_COLUMNS}`,
      [
        input.phone,
        input.email,
        input.address,
        input.city,
        input.state,
        input.postalCode,
        input.businessHours,
        input.versionNumber,
        input.createdBy,
      ],
    );
    return mapContacts(result.rows[0]!);
  }

  async updateContactsDraft(
    id: string,
    input: ContactsDraftUpdateInput,
    executor?: QueryExecutor,
  ): Promise<SitePublicContacts | null> {
    const result = await this.executor(executor).query<ContactsRow>(
      `UPDATE site_public_contacts
          SET phone = $2, email = $3, address = $4, city = $5, state = $6,
              postal_code = $7, business_hours = $8, version_number = $9,
              updated_by = $10, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING ${CONTACTS_COLUMNS}`,
      [
        id,
        input.phone,
        input.email,
        input.address,
        input.city,
        input.state,
        input.postalCode,
        input.businessHours,
        input.versionNumber,
        input.updatedBy,
      ],
    );
    return result.rows[0] ? mapContacts(result.rows[0]) : null;
  }
}

export class SocialConfigurationRepository extends RepositoryBase {
  async getNextSocialConfigurationVersionNumber(executor: PoolClient): Promise<number> {
    await executor.query("SELECT pg_advisory_xact_lock($1::bigint)", [32_003]);
    const result = await executor.query<{ next_version: number }>(
      "SELECT COALESCE(MAX(version_number), 0)::int + 1 AS next_version FROM site_social_configurations",
    );
    return result.rows[0]!.next_version;
  }

  async findSocialConfigurationById(
    id: string,
    executor?: QueryExecutor,
  ): Promise<SiteSocialConfiguration | null> {
    const result = await this.executor(executor).query<SocialConfigurationRow>(
      `SELECT ${SOCIAL_CONFIGURATION_COLUMNS} FROM site_social_configurations WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? mapSocialConfiguration(result.rows[0]) : null;
  }

  async findSocialConfigurationByVersion(
    versionNumber: number,
    executor?: QueryExecutor,
  ): Promise<SiteSocialConfiguration | null> {
    const result = await this.executor(executor).query<SocialConfigurationRow>(
      `SELECT ${SOCIAL_CONFIGURATION_COLUMNS}
         FROM site_social_configurations WHERE version_number = $1`,
      [versionNumber],
    );
    return result.rows[0] ? mapSocialConfiguration(result.rows[0]) : null;
  }

  async findCurrentPublishedSocialConfiguration(
    executor?: QueryExecutor,
  ): Promise<SiteSocialConfiguration | null> {
    const result = await this.executor(executor).query<SocialConfigurationRow>(
      `SELECT ${SOCIAL_CONFIGURATION_COLUMNS}
         FROM site_social_configurations WHERE status = 'published'`,
    );
    return result.rows[0] ? mapSocialConfiguration(result.rows[0]) : null;
  }

  async insertSocialConfigurationDraft(
    input: SocialConfigurationDraftInput,
    executor?: QueryExecutor,
  ): Promise<SiteSocialConfiguration> {
    const result = await this.executor(executor).query<SocialConfigurationRow>(
      `INSERT INTO site_social_configurations (status, version_number, created_by)
       VALUES ('draft', $1, $2)
       RETURNING ${SOCIAL_CONFIGURATION_COLUMNS}`,
      [input.versionNumber, input.createdBy],
    );
    return mapSocialConfiguration(result.rows[0]!);
  }

  async updateSocialConfigurationDraft(
    id: string,
    input: SocialConfigurationDraftUpdateInput,
    executor?: QueryExecutor,
  ): Promise<SiteSocialConfiguration | null> {
    const result = await this.executor(executor).query<SocialConfigurationRow>(
      `UPDATE site_social_configurations
          SET version_number = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING ${SOCIAL_CONFIGURATION_COLUMNS}`,
      [id, input.versionNumber, input.updatedBy],
    );
    return result.rows[0] ? mapSocialConfiguration(result.rows[0]) : null;
  }

  async listSocialLinks(
    configurationId: string,
    executor?: QueryExecutor,
  ): Promise<SiteSocialLink[]> {
    const result = await this.executor(executor).query<SocialLinkRow>(
      `SELECT ${SOCIAL_LINK_COLUMNS}
         FROM site_social_links
        WHERE social_configuration_id = $1
        ORDER BY display_order ASC, platform ASC, id ASC`,
      [configurationId],
    );
    return result.rows.map(mapSocialLink);
  }

  async replaceSocialLinks(
    configurationId: string,
    links: readonly SocialLinkReplacementInput[],
    executor?: QueryExecutor,
  ): Promise<SiteSocialLink[]> {
    const database = this.executor(executor);
    await database.query("DELETE FROM site_social_links WHERE social_configuration_id = $1", [
      configurationId,
    ]);
    const inserted: SiteSocialLink[] = [];
    for (const link of links) {
      const result = await database.query<SocialLinkRow>(
        `INSERT INTO site_social_links
          (social_configuration_id, platform, url, display_order, is_active,
           created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING ${SOCIAL_LINK_COLUMNS}`,
        [
          configurationId,
          link.platform,
          link.url,
          link.displayOrder,
          link.isActive,
          link.createdBy,
          link.updatedBy ?? null,
        ],
      );
      inserted.push(mapSocialLink(result.rows[0]!));
    }
    return inserted.sort(
      (left, right) =>
        left.displayOrder - right.displayOrder || left.platform.localeCompare(right.platform, "en"),
    );
  }
}

export class ReviewRepository extends RepositoryBase {
  async findReviewById(id: string, executor?: QueryExecutor): Promise<SiteHomeReview | null> {
    const result = await this.executor(executor).query<ReviewRow>(
      `SELECT ${REVIEW_COLUMNS} FROM site_home_reviews WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? mapReview(result.rows[0]) : null;
  }

  async findPendingReviewForContent(
    contentType: ReviewContentType,
    contentId: string,
    executor?: QueryExecutor,
  ): Promise<SiteHomeReview | null> {
    const result = await this.executor(executor).query<ReviewRow>(
      `SELECT ${REVIEW_COLUMNS}
         FROM site_home_reviews
        WHERE content_type = $1 AND content_id = $2 AND decision = 'pending'`,
      [contentType, contentId],
    );
    return result.rows[0] ? mapReview(result.rows[0]) : null;
  }

  async listPendingReviews(executor?: QueryExecutor): Promise<SiteHomeReview[]> {
    const result = await this.executor(executor).query<ReviewRow>(
      `SELECT ${REVIEW_COLUMNS}
         FROM site_home_reviews
        WHERE decision = 'pending'
        ORDER BY submitted_at ASC, content_type ASC, id ASC`,
    );
    return result.rows.map(mapReview);
  }

  async listReviewsForContent(
    contentType: ReviewContentType,
    contentId: string,
    executor?: QueryExecutor,
  ): Promise<SiteHomeReview[]> {
    const result = await this.executor(executor).query<ReviewRow>(
      `SELECT ${REVIEW_COLUMNS}
         FROM site_home_reviews
        WHERE content_type = $1 AND content_id = $2
        ORDER BY cycle_number DESC, submitted_at DESC`,
      [contentType, contentId],
    );
    return result.rows.map(mapReview);
  }

  async createReviewCycle(
    input: CreateReviewCycleInput,
    executor?: QueryExecutor,
  ): Promise<SiteHomeReview> {
    const bannerId = input.contentType === "banner" ? input.bannerId : null;
    const contactsId = input.contentType === "contacts" ? input.contactsId : null;
    const socialConfigurationId =
      input.contentType === "social_configuration" ? input.socialConfigurationId : null;
    const result = await this.executor(executor).query<ReviewRow>(
      `INSERT INTO site_home_reviews
        (content_type, banner_id, contacts_id, social_configuration_id, cycle_number,
         content_version, submitted_content_hash, decision, submitted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
       RETURNING ${REVIEW_COLUMNS}`,
      [
        input.contentType,
        bannerId,
        contactsId,
        socialConfigurationId,
        input.cycleNumber,
        input.contentVersion,
        input.submittedContentHash,
        input.submittedBy,
      ],
    );
    return mapReview(result.rows[0]!);
  }
}

export class HomeVersionRepository extends RepositoryBase {
  async insertHomeVersion(
    input: CreateHomeVersionInput,
    executor?: QueryExecutor,
  ): Promise<SiteHomeVersion> {
    const result = await this.executor(executor).query<HomeVersionRow>(
      `INSERT INTO site_home_versions
        (banner_id, contacts_id, social_configuration_id, version_number,
         snapshot_json, change_summary, is_current, created_by)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
       RETURNING ${HOME_VERSION_COLUMNS}`,
      [
        input.bannerId,
        input.contactsId,
        input.socialConfigurationId,
        input.versionNumber,
        JSON.stringify(input.snapshotJson),
        input.changeSummary,
        input.isCurrent,
        input.createdBy,
      ],
    );
    return mapHomeVersion(result.rows[0]!);
  }

  async findHomeVersionById(id: string, executor?: QueryExecutor): Promise<SiteHomeVersion | null> {
    const result = await this.executor(executor).query<HomeVersionRow>(
      `SELECT ${HOME_VERSION_COLUMNS} FROM site_home_versions WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? mapHomeVersion(result.rows[0]) : null;
  }

  async findHomeVersionByNumber(
    versionNumber: number,
    executor?: QueryExecutor,
  ): Promise<SiteHomeVersion | null> {
    const result = await this.executor(executor).query<HomeVersionRow>(
      `SELECT ${HOME_VERSION_COLUMNS} FROM site_home_versions WHERE version_number = $1`,
      [versionNumber],
    );
    return result.rows[0] ? mapHomeVersion(result.rows[0]) : null;
  }

  async findCurrentHomeVersion(executor?: QueryExecutor): Promise<SiteHomeVersion | null> {
    const result = await this.executor(executor).query<HomeVersionRow>(
      `SELECT ${HOME_VERSION_COLUMNS} FROM site_home_versions WHERE is_current = true`,
    );
    return result.rows[0] ? mapHomeVersion(result.rows[0]) : null;
  }

  async listHomeVersions(limit = 50, executor?: QueryExecutor): Promise<SiteHomeVersion[]> {
    const result = await this.executor(executor).query<HomeVersionRow>(
      `SELECT ${HOME_VERSION_COLUMNS}
         FROM site_home_versions
        ORDER BY version_number DESC
        LIMIT $1`,
      [limit],
    );
    return result.rows.map(mapHomeVersion);
  }
}
