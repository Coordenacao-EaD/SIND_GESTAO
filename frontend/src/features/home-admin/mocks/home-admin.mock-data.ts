import type {
  AdminBanner,
  AdminFooterContacts,
  AdminSocialConfiguration,
  HomeAdminResource,
  ReviewCycle,
  VersionHistoryEntry,
  VersionMetadata,
} from "../domain/home-admin.types";
import type { ReviewQueueEntry } from "../domain/review-queue.types";

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
  address: "Rua dos Servidores, 123 — Centro",
  municipality: "Cuiabá",
  stateCode: "MT",
  postalCode: "78000-000",
  businessHours: "Segunda a sexta-feira, das 8h às 17h",
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

/**
 * Identidades simuladas da F2.2C. São apenas identificadores estáveis para demonstrar segregação de
 * funções; não existe login, token nem persistência de perfil.
 */
export const SIMULATED_USERS = {
  author: { id: "actor-editor-1", name: "Ana Editora" },
  submitter: { id: "actor-editor-2", name: "Bruno Editor" },
  reviewer: { id: "actor-reviewer-1", name: "Carla Revisora" },
  reader: { id: "actor-reader-1", name: "Diego Leitor" },
} as const;

export const SIMULATED_USER_NAMES: Record<string, string> = Object.fromEntries(
  Object.values(SIMULATED_USERS).map((user) => [user.id, user.name]),
);

export function describeSimulatedUser(actorId: string): string {
  return SIMULATED_USER_NAMES[actorId] ?? actorId;
}

/** Versões públicas vigentes: servem de lado esquerdo da comparação e nunca são alteradas por decisão. */
export const publishedBanner: AdminBanner = {
  ...adminBannerMock,
  state: "published",
  version: createMockVersion("sha256:banner:public-v1", { editorialVersion: 1, publicVersion: 1, publishedAt: MOCK_CREATED_AT }),
  title: "Juntos somos mais fortes.",
  description: "Defendemos os direitos do servidor público municipal.",
  altText: "Servidores reunidos em assembleia",
  image: { kind: "existing_asset", assetId: "hero-union-840", accessibleName: "Servidores reunidos em assembleia" },
  cta: { enabled: true, kind: "internal", label: "Filie-se", route: "membership" },
};

export const publishedContacts: AdminFooterContacts = {
  ...adminFooterContactsMock,
  state: "published",
  version: createMockVersion("sha256:contacts:public-v1", { editorialVersion: 1, publicVersion: 1, publishedAt: MOCK_CREATED_AT }),
  phone: "1112345678",
  email: "contato@sindgestao.org.br",
  address: "Rua dos Servidores, 123 — Centro",
  municipality: "Cuiabá",
  stateCode: "MT",
  postalCode: "78000000",
  businessHours: "Segunda a sexta-feira, das 8h às 17h",
};

export const publishedSocial: AdminSocialConfiguration = {
  ...adminSocialConfigurationMock,
  state: "published",
  version: createMockVersion("sha256:social:public-v1", { editorialVersion: 1, publicVersion: 1, publishedAt: MOCK_CREATED_AT }),
  links: [
    { id: "facebook", platform: "Facebook", url: "https://facebook.com", accessibleLabel: "Facebook", order: 0, active: true },
    { id: "instagram", platform: "Instagram", url: "https://instagram.com", accessibleLabel: "Instagram", order: 1, active: true },
    { id: "youtube", platform: "YouTube", url: "https://youtube.com", accessibleLabel: "YouTube", order: 2, active: true },
  ],
};

/** Conteúdos submetidos: divergem da versão pública em campos conhecidos e determinísticos. */
const submittedBanner: AdminBanner = {
  ...adminBannerMock,
  state: "review",
  previousState: "draft",
  version: createMockVersion("sha256:banner:v2", { editorialVersion: 2, publicVersion: 1, submittedAt: "2026-08-02T13:00:00.000Z" }),
  title: "Servidor valorizado, cidade mais forte.",
  description: "Defendemos os direitos do servidor público municipal.",
  altText: "Servidores reunidos em frente à sede do sindicato",
  image: { kind: "existing_asset", assetId: "hero-union-1672", accessibleName: "Servidores reunidos em frente à sede do sindicato" },
  cta: { enabled: true, kind: "external", label: "Participe da assembleia", url: "https://sindgestao.org.br/assembleia" },
};

const submittedContacts: AdminFooterContacts = {
  ...adminFooterContactsMock,
  state: "review",
  previousState: "draft",
  version: createMockVersion("sha256:contacts:v2", { editorialVersion: 2, publicVersion: 1, submittedAt: "2026-08-02T14:00:00.000Z" }),
  phone: "65999990000",
  email: "atendimento@sindgestao.org.br",
  address: "Avenida Central, 900 — Bairro Novo",
  municipality: "Cuiabá",
  stateCode: "MT",
  postalCode: "78123456",
  businessHours: "",
};

const submittedSocial: AdminSocialConfiguration = {
  ...adminSocialConfigurationMock,
  state: "review",
  previousState: "draft",
  version: createMockVersion("sha256:social:v2", { editorialVersion: 2, publicVersion: 1, submittedAt: "2026-08-02T15:00:00.000Z" }),
  links: [
    { id: "instagram", platform: "Instagram", url: "https://instagram.com/sindgestao", accessibleLabel: "Instagram do SINDGESTÃO", order: 0, active: true },
    { id: "facebook", platform: "Facebook", url: "https://facebook.com", accessibleLabel: "Facebook", order: 1, active: false },
    { id: "linkedin", platform: "LinkedIn", url: "https://linkedin.com/company/sindgestao", accessibleLabel: "LinkedIn do SINDGESTÃO", order: 2, active: true },
  ],
};

function decidedCycle(base: ReviewCycle, overrides: Partial<ReviewCycle>): ReviewCycle {
  return { ...base, ...overrides };
}

function entry(
  cycle: ReviewCycle,
  submitted: HomeAdminResource,
  published: HomeAdminResource | null,
  authorId: string,
): ReviewQueueEntry {
  return {
    cycle,
    submitted,
    published,
    authorId,
    currentVersion: cycle.submittedVersion,
    currentHash: cycle.submittedHash,
  };
}

function cycle(overrides: Partial<ReviewCycle> & Pick<ReviewCycle, "cycleId" | "resourceType" | "resourceId">): ReviewCycle {
  return {
    submittedVersion: 2,
    submittedHash: `sha256:${overrides.resourceType}:v2`,
    submittedBy: SIMULATED_USERS.submitter.id,
    reviewerId: null,
    submittedAt: "2026-08-02T13:00:00.000Z",
    decidedAt: null,
    decision: "pending",
    opinion: null,
    cancellationReason: null,
    invalidationReason: null,
    ...overrides,
  };
}

/**
 * Fila determinística da F2.2C. Cobre os três tipos de conteúdo e todas as decisões possíveis.
 */
export function createReviewQueue(): ReviewQueueEntry[] {
  return [
    entry(
      cycle({ cycleId: "review-banner-1", resourceType: "banner", resourceId: "home-banner" }),
      submittedBanner,
      publishedBanner,
      SIMULATED_USERS.author.id,
    ),
    entry(
      cycle({
        cycleId: "review-contacts-1",
        resourceType: "footer_contacts",
        resourceId: "footer-contacts",
        submittedBy: SIMULATED_USERS.author.id,
        submittedAt: "2026-08-02T14:00:00.000Z",
      }),
      submittedContacts,
      publishedContacts,
      SIMULATED_USERS.author.id,
    ),
    entry(
      cycle({
        cycleId: "review-social-1",
        resourceType: "footer_social_links",
        resourceId: "footer-social-links",
        submittedAt: "2026-08-02T15:00:00.000Z",
      }),
      submittedSocial,
      publishedSocial,
      SIMULATED_USERS.submitter.id,
    ),
    entry(
      decidedCycle(
        cycle({ cycleId: "review-banner-2", resourceType: "banner", resourceId: "home-banner", submittedAt: "2026-07-28T13:00:00.000Z" }),
        {
          decision: "approved",
          reviewerId: SIMULATED_USERS.reviewer.id,
          decidedAt: "2026-07-28T18:00:00.000Z",
          opinion: "Texto revisado e alinhado com a comunicação institucional.",
        },
      ),
      submittedBanner,
      publishedBanner,
      SIMULATED_USERS.author.id,
    ),
    entry(
      decidedCycle(
        cycle({ cycleId: "review-contacts-2", resourceType: "footer_contacts", resourceId: "footer-contacts", submittedAt: "2026-07-29T13:00:00.000Z" }),
        {
          decision: "changes_requested",
          reviewerId: SIMULATED_USERS.reviewer.id,
          decidedAt: "2026-07-29T17:00:00.000Z",
          opinion: "Informe o horário de atendimento antes de reenviar para revisão.",
        },
      ),
      submittedContacts,
      publishedContacts,
      SIMULATED_USERS.author.id,
    ),
    entry(
      decidedCycle(
        cycle({ cycleId: "review-social-2", resourceType: "footer_social_links", resourceId: "footer-social-links", submittedAt: "2026-07-30T13:00:00.000Z" }),
        {
          decision: "cancelled",
          decidedAt: "2026-07-30T15:00:00.000Z",
          cancellationReason: "Corrigir o rótulo acessível antes de reenviar.",
        },
      ),
      submittedSocial,
      publishedSocial,
      SIMULATED_USERS.submitter.id,
    ),
    entry(
      decidedCycle(
        cycle({ cycleId: "review-banner-3", resourceType: "banner", resourceId: "home-banner", submittedAt: "2026-07-31T13:00:00.000Z" }),
        {
          decision: "invalidated",
          decidedAt: "2026-07-31T16:00:00.000Z",
          invalidationReason: "O conteúdo foi alterado após o envio e o ciclo perdeu validade.",
        },
      ),
      submittedBanner,
      publishedBanner,
      SIMULATED_USERS.author.id,
    ),
  ];
}

export const MOCK_APPROVED_AT = "2026-08-04T12:00:00.000Z";
export const MOCK_PUBLISHED_AT = "2026-08-05T12:00:00.000Z";

function approvedResource<T extends HomeAdminResource>(resource: T): T {
  const review = cycle({
    cycleId: `review-${resource.resourceType}-publish`,
    resourceType: resource.resourceType,
    resourceId: resource.id,
    submittedVersion: resource.version.editorialVersion,
    submittedHash: resource.version.contentHash,
    decision: "approved",
    reviewerId: SIMULATED_USERS.reviewer.id,
    decidedAt: MOCK_APPROVED_AT,
    opinion: "Conteúdo aprovado para publicação simulada.",
  });
  return {
    ...cloneResource(resource),
    state: "approved",
    previousState: "review",
    review,
    version: { ...resource.version, approvedAt: MOCK_APPROVED_AT, revision: 2 },
  };
}

function cloneResource<T extends HomeAdminResource>(resource: T): T {
  return structuredClone(resource);
}

export function createPublicationCandidates(): HomeAdminResource[] {
  return [approvedResource(submittedBanner), approvedResource(submittedContacts), approvedResource(submittedSocial)];
}

function historyEntry(resource: HomeAdminResource, versionId: string, isCurrentPublic: boolean): VersionHistoryEntry {
  return {
    versionId,
    resource: cloneResource(resource),
    authorId: resource.version.createdBy,
    reviewerId: SIMULATED_USERS.reviewer.id,
    reviewDecision: "approved",
    publishedBy: resource.version.publishedBy ?? SIMULATED_USERS.reviewer.id,
    isCurrentPublic,
  };
}

export function createVersionHistory(): VersionHistoryEntry[] {
  const current = [publishedBanner, publishedContacts, publishedSocial].map((resource) => ({
    ...cloneResource(resource),
    version: { ...resource.version, publishedBy: SIMULATED_USERS.reviewer.id },
  })) as HomeAdminResource[];
  const archivedBanner: AdminBanner = {
    ...cloneResource(publishedBanner),
    state: "archived",
    previousState: "published",
    title: "União que transforma.",
    version: createMockVersion("sha256:banner:archived-v0", {
      editorialVersion: 0,
      publicVersion: 0,
      publishedAt: "2026-07-01T12:00:00.000Z",
      archivedAt: MOCK_CREATED_AT,
      publishedBy: SIMULATED_USERS.reviewer.id,
    }),
  };
  return [
    historyEntry(current[0]!, "history-banner-v1", true),
    historyEntry(archivedBanner, "history-banner-v0", false),
    historyEntry(current[1]!, "history-contacts-v1", true),
    historyEntry(current[2]!, "history-social-v1", true),
  ];
}
