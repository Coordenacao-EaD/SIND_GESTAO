import type { Pool, PoolClient } from "pg";

import type { QueryExecutor } from "../../database/transaction.js";
import { withTransaction } from "../../database/transaction.js";
import {
  normalizeBannerContent,
  normalizeContactsContent,
  normalizeSocialContent,
  type BannerFunctionalContent,
  type ContactsFunctionalContent,
  type SocialFunctionalContent,
} from "./content-integrity.js";
import {
  BannerRepository,
  ContactsRepository,
  HomeVersionRepository,
  SocialConfigurationRepository,
} from "./site-home.repository.js";
import type {
  BannerDraftInput,
  ContactsDraftInput,
  CreateHomeVersionInput,
  SiteHomeBanner,
  SiteHomeVersion,
  SitePublicContacts,
  SiteSocialConfiguration,
  SiteSocialLink,
  SocialLinkReplacementInput,
} from "./site-home.repository.types.js";

export interface BannerSnapshot {
  title: string;
  subtitle: string | null;
  bodyText: string;
  imageUrl: string | null;
  imageAlt: string | null;
  ctaEnabled: boolean;
  ctaLabel: string | null;
  ctaLinkType: "internal" | "external" | null;
  ctaLinkValue: string | null;
}

export interface ContactsSnapshot {
  phone: string | null;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  businessHours: string | null;
}

export interface SocialLinkSnapshot {
  platform: "facebook" | "instagram" | "youtube" | "linkedin" | "x";
  url: string;
  displayOrder: number;
  isActive: boolean;
}

export interface SocialConfigurationSnapshot {
  links: SocialLinkSnapshot[];
}

export interface SiteHomeSnapshot {
  schemaVersion: 1;
  banner: BannerSnapshot;
  contacts: ContactsSnapshot;
  socialConfiguration: SocialConfigurationSnapshot | null;
}

export interface BuildSnapshotInput {
  banner: BannerFunctionalContent;
  contacts: ContactsFunctionalContent;
  socialConfiguration: SocialFunctionalContent | null;
}

export interface CreateVersionInput
  extends Omit<CreateHomeVersionInput, "snapshotJson"> {
  snapshot: SiteHomeSnapshot;
}

export type RestoreContentType = "banner" | "contacts" | "social_configuration";

export interface RestoreToDraftInput {
  versionId: string;
  contentType: RestoreContentType;
  actorId: string;
}

export type RestoreToDraftResult =
  | { contentType: "banner"; draft: SiteHomeBanner; sourceVersion: SiteHomeVersion }
  | { contentType: "contacts"; draft: SitePublicContacts; sourceVersion: SiteHomeVersion }
  | {
      contentType: "social_configuration";
      draft: SiteSocialConfiguration;
      links: SiteSocialLink[];
      sourceVersion: SiteHomeVersion;
    };

export class HomeVersionNotFoundError extends Error {
  constructor(versionId: string) {
    super(`Home version '${versionId}' was not found.`);
    this.name = "HomeVersionNotFoundError";
  }
}

export class InvalidHomeSnapshotError extends Error {
  constructor(path: string) {
    super(`Home snapshot is invalid at '${path}'.`);
    this.name = "InvalidHomeSnapshotError";
  }
}

function bannerSnapshot(content: BannerFunctionalContent): BannerSnapshot {
  const normalized = normalizeBannerContent(content);
  return {
    title: normalized.title,
    subtitle: normalized.subtitle,
    bodyText: normalized.bodyText,
    imageUrl: normalized.imageUrl,
    imageAlt: normalized.imageAlt,
    ctaEnabled: normalized.ctaEnabled,
    ctaLabel: normalized.ctaLabel,
    ctaLinkType: normalized.ctaLinkType,
    ctaLinkValue: normalized.ctaLinkValue,
  };
}

function contactsSnapshot(content: ContactsFunctionalContent): ContactsSnapshot {
  const normalized = normalizeContactsContent(content);
  return {
    phone: normalized.phone,
    email: normalized.email,
    address: normalized.address,
    city: normalized.city,
    state: normalized.state,
    postalCode: normalized.postalCode,
    businessHours: normalized.businessHours,
  };
}

export function buildSnapshot(input: BuildSnapshotInput): SiteHomeSnapshot {
  return {
    schemaVersion: 1,
    banner: bannerSnapshot(input.banner),
    contacts: contactsSnapshot(input.contacts),
    socialConfiguration: input.socialConfiguration
      ? { links: normalizeSocialContent(input.socialConfiguration).links }
      : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) throw new InvalidHomeSnapshotError(path);
  return value;
}

function readString(value: unknown, path: string): string {
  if (typeof value !== "string") throw new InvalidHomeSnapshotError(path);
  return value;
}

function readNullableString(value: unknown, path: string): string | null {
  if (value === null) return null;
  return readString(value, path);
}

function readBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") throw new InvalidHomeSnapshotError(path);
  return value;
}

function readNonNegativeInteger(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new InvalidHomeSnapshotError(path);
  }
  return value;
}

function parseBanner(value: unknown): BannerSnapshot {
  const banner = readRecord(value, "banner");
  const ctaEnabled = readBoolean(banner.ctaEnabled, "banner.ctaEnabled");
  const ctaLabel = readNullableString(banner.ctaLabel, "banner.ctaLabel");
  const rawLinkType = readNullableString(banner.ctaLinkType, "banner.ctaLinkType");
  if (rawLinkType !== null && rawLinkType !== "internal" && rawLinkType !== "external") {
    throw new InvalidHomeSnapshotError("banner.ctaLinkType");
  }
  const ctaLinkValue = readNullableString(banner.ctaLinkValue, "banner.ctaLinkValue");
  if (
    (ctaEnabled && (ctaLabel === null || rawLinkType === null || ctaLinkValue === null))
    || (!ctaEnabled && (ctaLabel !== null || rawLinkType !== null || ctaLinkValue !== null))
  ) {
    throw new InvalidHomeSnapshotError("banner.cta");
  }
  return {
    title: readString(banner.title, "banner.title"),
    subtitle: readNullableString(banner.subtitle, "banner.subtitle"),
    bodyText: readString(banner.bodyText, "banner.bodyText"),
    imageUrl: readNullableString(banner.imageUrl, "banner.imageUrl"),
    imageAlt: readNullableString(banner.imageAlt, "banner.imageAlt"),
    ctaEnabled,
    ctaLabel,
    ctaLinkType: rawLinkType,
    ctaLinkValue,
  };
}

function parseContacts(value: unknown): ContactsSnapshot {
  const contacts = readRecord(value, "contacts");
  return {
    phone: readNullableString(contacts.phone, "contacts.phone"),
    email: readString(contacts.email, "contacts.email"),
    address: readString(contacts.address, "contacts.address"),
    city: readString(contacts.city, "contacts.city"),
    state: readString(contacts.state, "contacts.state"),
    postalCode: readString(contacts.postalCode, "contacts.postalCode"),
    businessHours: readNullableString(contacts.businessHours, "contacts.businessHours"),
  };
}

const SOCIAL_PLATFORMS = new Set(["facebook", "instagram", "youtube", "linkedin", "x"]);

function parseSocialLink(value: unknown, index: number): SocialLinkSnapshot {
  const path = `socialConfiguration.links[${index}]`;
  const link = readRecord(value, path);
  const platform = readString(link.platform, `${path}.platform`);
  if (!SOCIAL_PLATFORMS.has(platform)) throw new InvalidHomeSnapshotError(`${path}.platform`);
  return {
    platform: platform as SocialLinkSnapshot["platform"],
    url: readString(link.url, `${path}.url`),
    displayOrder: readNonNegativeInteger(link.displayOrder, `${path}.displayOrder`),
    isActive: readBoolean(link.isActive, `${path}.isActive`),
  };
}

function parseSocialConfiguration(value: unknown): SocialConfigurationSnapshot | null {
  if (value === null) return null;
  const social = readRecord(value, "socialConfiguration");
  if (!Array.isArray(social.links)) {
    throw new InvalidHomeSnapshotError("socialConfiguration.links");
  }
  const links = social.links.map(parseSocialLink).sort(
    (left, right) =>
      left.displayOrder - right.displayOrder || left.platform.localeCompare(right.platform, "en"),
  );
  return { links };
}

export function validateSiteHomeSnapshot(value: unknown): SiteHomeSnapshot {
  const snapshot = readRecord(value, "root");
  if (snapshot.schemaVersion !== 1) throw new InvalidHomeSnapshotError("schemaVersion");
  return {
    schemaVersion: 1,
    banner: parseBanner(snapshot.banner),
    contacts: parseContacts(snapshot.contacts),
    socialConfiguration: parseSocialConfiguration(snapshot.socialConfiguration),
  };
}

export function bannerSnapshotToDraftInput(
  snapshot: BannerSnapshot,
  versionNumber: number,
  actorId: string,
): BannerDraftInput {
  return { ...snapshot, versionNumber, createdBy: actorId };
}

export function contactsSnapshotToDraftInput(
  snapshot: ContactsSnapshot,
  versionNumber: number,
  actorId: string,
): ContactsDraftInput {
  return { ...snapshot, versionNumber, createdBy: actorId };
}

export function socialSnapshotToLinkInputs(
  snapshot: SocialConfigurationSnapshot,
  actorId: string,
): SocialLinkReplacementInput[] {
  return snapshot.links.map((link) => ({ ...link, createdBy: actorId }));
}

export class SiteHomeVersionService {
  constructor(
    private readonly pool: Pool,
    private readonly bannerRepository: BannerRepository,
    private readonly contactsRepository: ContactsRepository,
    private readonly socialRepository: SocialConfigurationRepository,
    private readonly versionRepository: HomeVersionRepository,
  ) {}

  async createVersion(input: CreateVersionInput, executor: QueryExecutor): Promise<SiteHomeVersion> {
    return this.versionRepository.insertHomeVersion(
      {
        bannerId: input.bannerId,
        contactsId: input.contactsId,
        socialConfigurationId: input.socialConfigurationId,
        versionNumber: input.versionNumber,
        snapshotJson: input.snapshot,
        changeSummary: input.changeSummary,
        isCurrent: input.isCurrent,
        createdBy: input.createdBy,
      },
      executor,
    );
  }

  async restoreToDraft(input: RestoreToDraftInput): Promise<RestoreToDraftResult> {
    return withTransaction(this.pool, async (client) => {
      const sourceVersion = await this.versionRepository.findHomeVersionById(input.versionId, client);
      if (!sourceVersion) throw new HomeVersionNotFoundError(input.versionId);
      const snapshot = validateSiteHomeSnapshot(sourceVersion.snapshotJson);

      if (input.contentType === "banner") {
        const versionNumber = await this.bannerRepository.getNextBannerVersionNumber(client);
        const draft = await this.bannerRepository.insertBannerDraft(
          bannerSnapshotToDraftInput(snapshot.banner, versionNumber, input.actorId),
          client,
        );
        return { contentType: "banner", draft, sourceVersion };
      }

      if (input.contentType === "contacts") {
        const versionNumber = await this.contactsRepository.getNextContactsVersionNumber(client);
        const draft = await this.contactsRepository.insertContactsDraft(
          contactsSnapshotToDraftInput(snapshot.contacts, versionNumber, input.actorId),
          client,
        );
        return { contentType: "contacts", draft, sourceVersion };
      }

      if (!snapshot.socialConfiguration) {
        throw new InvalidHomeSnapshotError("socialConfiguration");
      }
      return this.restoreSocial(snapshot.socialConfiguration, input.actorId, sourceVersion, client);
    });
  }

  private async restoreSocial(
    snapshot: SocialConfigurationSnapshot,
    actorId: string,
    sourceVersion: SiteHomeVersion,
    client: PoolClient,
  ): Promise<RestoreToDraftResult> {
    const versionNumber = await this.socialRepository.getNextSocialConfigurationVersionNumber(client);
    const draft = await this.socialRepository.insertSocialConfigurationDraft(
      { versionNumber, createdBy: actorId },
      client,
    );
    const links = await this.socialRepository.replaceSocialLinks(
      draft.id,
      socialSnapshotToLinkInputs(snapshot, actorId),
      client,
    );
    return { contentType: "social_configuration", draft, links, sourceVersion };
  }
}
