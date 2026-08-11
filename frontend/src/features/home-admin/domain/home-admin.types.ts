import type { SelectablePublicRouteKey } from "../contracts/public-route-catalog";

export const ADMIN_RESOURCE_TYPES = [
  "banner",
  "footer_contacts",
  "footer_social_links",
] as const;

export type AdminResourceType = (typeof ADMIN_RESOURCE_TYPES)[number];

export const EDITORIAL_STATES = [
  "draft",
  "review",
  "approved",
  "published",
  "archived",
] as const;

export type EditorialState = (typeof EDITORIAL_STATES)[number];

export const REVIEW_DECISIONS = [
  "pending",
  "approved",
  "changes_requested",
  "cancelled",
  "invalidated",
] as const;

export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

export type EditorialVersionNumber = number;
export type PublicVersionNumber = number;
export type ConcurrencyRevision = number;
export type ContentHash = string;

export interface VersionMetadata {
  editorialVersion: EditorialVersionNumber;
  publicVersion: PublicVersionNumber | null;
  revision: ConcurrencyRevision;
  contentHash: ContentHash;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  submittedAt: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  publishedBy?: string | null;
}

export type BannerCta =
  | { enabled: false }
  | {
      enabled: true;
      kind: "internal";
      label: string;
      route: SelectablePublicRouteKey;
    }
  | {
      enabled: true;
      kind: "external";
      label: string;
      url: string;
    };

export interface ReviewCycle {
  cycleId: string;
  resourceType: AdminResourceType;
  resourceId: string;
  submittedVersion: EditorialVersionNumber;
  submittedHash: ContentHash;
  submittedBy: string;
  reviewerId: string | null;
  submittedAt: string;
  decidedAt: string | null;
  decision: ReviewDecision;
  opinion: string | null;
  cancellationReason: string | null;
  invalidationReason: string | null;
}

interface AdminResourceBase<TType extends AdminResourceType> {
  resourceType: TType;
  id: string;
  state: EditorialState;
  previousState: EditorialState | null;
  version: VersionMetadata;
  review: ReviewCycle | null;
}

export interface AdminImageReference {
  kind: "existing_asset";
  assetId: string;
  accessibleName: string;
}

export interface AdminBanner extends AdminResourceBase<"banner"> {
  title: string;
  description: string;
  altText: string;
  image: AdminImageReference;
  cta: BannerCta;
}

export interface AdminFooterContacts extends AdminResourceBase<"footer_contacts"> {
  phone: string;
  email: string;
  address: string;
  municipality: string;
  stateCode: BrazilianStateCode;
  postalCode: string;
  businessHours: string;
}

export const BRAZILIAN_STATE_CODES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export type BrazilianStateCode = (typeof BRAZILIAN_STATE_CODES)[number];

export const SOCIAL_PLATFORMS = ["Facebook", "Instagram", "YouTube", "LinkedIn", "X"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface AdminSocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  accessibleLabel: string;
  order: number;
  active: boolean;
}

export interface AdminSocialConfiguration extends AdminResourceBase<"footer_social_links"> {
  links: AdminSocialLink[];
}

export type HomeAdminResource =
  | AdminBanner
  | AdminFooterContacts
  | AdminSocialConfiguration;

export interface VersionHistoryEntry {
  versionId: string;
  resource: HomeAdminResource;
  authorId: string;
  reviewerId: string | null;
  reviewDecision: ReviewDecision | null;
  publishedBy: string | null;
  isCurrentPublic: boolean;
}

export interface PublishResourceResult {
  published: HomeAdminResource;
  archived: VersionHistoryEntry | null;
  historyEntry: VersionHistoryEntry;
}

export interface RestoreVersionResult {
  source: VersionHistoryEntry;
  draft: HomeAdminResource;
}

export interface AdminResourceSummary {
  resourceType: AdminResourceType;
  id: string;
  state: EditorialState;
  editorialVersion: EditorialVersionNumber;
  updatedAt: string;
  updatedBy: string;
}

export type AdminError =
  | { kind: "unauthenticated"; status: 401; message: string }
  | { kind: "forbidden"; status: 403; message: string; requiredCapability: string }
  | {
      kind: "conflict";
      status: 409;
      message: string;
      expectedRevision: ConcurrencyRevision;
      actualRevision: ConcurrencyRevision;
    }
  | { kind: "validation"; status: 422; message: string; fields: Record<string, string[]> }
  | { kind: "unavailable"; message: string; retryable: true }
  | { kind: "unexpected"; message: string; retryable: false };

export type AdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AdminError };

export type AdminLoadState<T> =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; data: T }
  | { status: "error"; error: AdminError };

export interface ReviewDecisionCommand {
  cycle: ReviewCycle;
  reviewerId: string;
  decision: Exclude<ReviewDecision, "pending">;
  opinion?: string;
  reason?: string;
  currentVersion: EditorialVersionNumber;
  currentHash: ContentHash;
  /**
   * Autor do conteúdo, quando difere de `cycle.submittedBy`. Permite bloquear a autoaprovação também
   * pelo autor; quando omitido, apenas o responsável pelo envio é verificado.
   */
  authorId?: string;
}
