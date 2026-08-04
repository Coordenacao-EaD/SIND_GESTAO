import type {
  AdminBanner,
  AdminFooterContacts,
  AdminSocialConfiguration,
  ReviewCycle,
  VersionMetadata,
} from "../domain/home-admin.types";

export const MOCK_CREATED_AT = "2026-08-01T12:00:00.000Z";
export const MOCK_UPDATED_AT = "2026-08-02T12:00:00.000Z";

export function createMockVersion(
  contentHash: string,
  overrides: Partial<VersionMetadata> = {},
): VersionMetadata {
  return {
    editorialVersion: 1,
    publicVersion: null,
    revision: 0,
    contentHash,
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_UPDATED_AT,
    createdBy: "actor-editor-1",
    updatedBy: "actor-editor-1",
    submittedAt: null,
    approvedAt: null,
    publishedAt: null,
    archivedAt: null,
    ...overrides,
  };
}

export function createPendingReview(
  resourceType: ReviewCycle["resourceType"] = "banner",
  resourceId = "home-banner",
): ReviewCycle {
  return {
    cycleId: `review-${resourceType}-1`,
    resourceType,
    resourceId,
    submittedVersion: 1,
    submittedHash: `sha256:${resourceType}:v1`,
    submittedBy: "actor-editor-1",
    reviewerId: null,
    submittedAt: "2026-08-02T13:00:00.000Z",
    decidedAt: null,
    decision: "pending",
    opinion: null,
    cancellationReason: null,
    invalidationReason: null,
  };
}

export const adminBannerMock: AdminBanner = {
  resourceType: "banner",
  id: "home-banner",
  state: "draft",
  previousState: null,
  version: createMockVersion("sha256:banner:v1"),
  review: null,
  title: "Juntos somos mais fortes.",
  description: "Defendemos os direitos e valorizamos o servidor público.",
  altText: "Mãos de servidores unidas",
  image: {
    kind: "existing_asset",
    assetId: "hero-union-1672",
    accessibleName: "Mãos de servidores unidas",
  },
  cta: { enabled: true, kind: "internal", label: "Filie-se", route: "membership" },
};

export const adminFooterContactsMock: AdminFooterContacts = {
  resourceType: "footer_contacts",
  id: "footer-contacts",
  state: "draft",
  previousState: null,
  version: createMockVersion("sha256:contacts:v1"),
  review: null,
  phone: "(11) 1234-5678",
  email: "contato@sindgestao.org.br",
  address: "Rua dos Servidores, 123 — Centro, São Paulo/SP",
};

export const adminSocialConfigurationMock: AdminSocialConfiguration = {
  resourceType: "footer_social_links",
  id: "footer-social-links",
  state: "draft",
  previousState: null,
  version: createMockVersion("sha256:social:v1"),
  review: null,
  links: [
    { id: "facebook", platform: "Facebook", url: "https://facebook.com", accessibleLabel: "Facebook", order: 0, active: true },
    { id: "instagram", platform: "Instagram", url: "https://instagram.com", accessibleLabel: "Instagram", order: 1, active: true },
    { id: "youtube", platform: "YouTube", url: "https://youtube.com", accessibleLabel: "YouTube", order: 2, active: true },
  ],
};

