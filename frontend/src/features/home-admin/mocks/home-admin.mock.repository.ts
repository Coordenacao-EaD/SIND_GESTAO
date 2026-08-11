import type {
  AdminError,
  AdminLoadState,
  AdminResourceSummary,
  AdminResourceType,
  AdminResult,
  HomeAdminResource,
  PublishResourceResult,
  ReviewCycle,
  RestoreVersionResult,
  VersionHistoryEntry,
} from "../domain/home-admin.types";
import type {
  CancelReviewCommand,
  DecideReviewCommand,
  HomeAdminContentRepository,
  HomeAdminReviewRepository,
  HomeAdminScenarioAdapter,
  PublishResourceCommand,
  RestoreVersionCommand,
  SaveDraftCommand,
  SubmitReviewCommand,
} from "../repositories/home-admin.repository";
import { evaluateReviewDecision, type ReviewDecisionBlockReason } from "../domain/editorial-rules";
import type { ReviewQueueEntry } from "../domain/review-queue.types";
import { HOME_ADMIN_CAPABILITIES, hasCapability, publishCapabilityFor, type SimulatedAdminProfile } from "../permissions/home-admin.permissions";
import {
  SIMULATED_USERS,
  adminBannerMock,
  adminFooterContactsMock,
  adminSocialConfigurationMock,
  createPendingReview,
  createPublicationCandidates,
  createReviewQueue,
  createVersionHistory,
  MOCK_PUBLISHED_AT,
} from "./home-admin.mock-data";

export type HomeAdminMockScenario =
  | "success"
  | "readonly"
  | "loading"
  | "empty"
  | "validation"
  | "unauthenticated"
  | "forbidden"
  | "conflict"
  | "unavailable"
  | "unexpected"
  // Cenários de identidade e integridade introduzidos pela F2.2C.
  | "author"
  | "submitter"
  | "no_review_capability"
  | "hash_mismatch"
  | "version_mismatch"
  | "concurrent"
  | "approved"
  | "approval_expired"
  | "already_published"
  | "decision_changed"
  | "publication_conflict"
  | "restore_conflict"
  | "restored";

const reviewerCapabilities = [
  HOME_ADMIN_CAPABILITIES.decideReview,
  HOME_ADMIN_CAPABILITIES.previewHome,
  HOME_ADMIN_CAPABILITIES.publishBanner,
  HOME_ADMIN_CAPABILITIES.publishFooterContacts,
  HOME_ADMIN_CAPABILITIES.publishFooterSocialLinks,
  HOME_ADMIN_CAPABILITIES.viewHistory,
  HOME_ADMIN_CAPABILITIES.restoreVersion,
] as const;

function profileForScenario(scenario: HomeAdminMockScenario): SimulatedAdminProfile {
  switch (scenario) {
    case "author":
      return { actorId: SIMULATED_USERS.author.id, displayName: SIMULATED_USERS.author.name, capabilities: [...reviewerCapabilities] };
    case "submitter":
      return { actorId: SIMULATED_USERS.submitter.id, displayName: SIMULATED_USERS.submitter.name, capabilities: [...reviewerCapabilities] };
    case "no_review_capability":
    case "readonly":
      return { actorId: SIMULATED_USERS.reader.id, displayName: SIMULATED_USERS.reader.name, capabilities: [HOME_ADMIN_CAPABILITIES.previewHome] };
    default:
      return { actorId: SIMULATED_USERS.reviewer.id, displayName: SIMULATED_USERS.reviewer.name, capabilities: [...reviewerCapabilities] };
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function scenarioError(scenario: HomeAdminMockScenario, resourceType?: AdminResourceType): AdminError | null {
  switch (scenario) {
    case "validation":
      return {
        kind: "validation", status: 422, message: "Conteúdo inválido.",
        fields: resourceType === "footer_contacts"
          ? { email: ["Informe um e-mail institucional válido."] }
          : resourceType === "footer_social_links"
            ? { "links.0.url": ["Use uma URL oficial da plataforma."] }
            : { title: ["Campo obrigatório."] },
      };
    case "unauthenticated":
      return { kind: "unauthenticated", status: 401, message: "Sessão administrativa necessária." };
    case "forbidden":
      return {
        kind: "forbidden", status: 403, message: "Capacidade insuficiente.",
        requiredCapability: resourceType === "footer_contacts"
          ? "site.footer.contacts.edit"
          : resourceType === "footer_social_links"
            ? "site.footer.social_links.edit"
            : "home.banner.edit",
      };
    case "conflict":
      return { kind: "conflict", status: 409, message: "Versão desatualizada.", expectedRevision: 0, actualRevision: 1 };
    case "unavailable":
      return { kind: "unavailable", message: "Serviço temporariamente indisponível.", retryable: true };
    case "unexpected":
      return { kind: "unexpected", message: "Não foi possível concluir a operação.", retryable: false };
    default:
      return null;
  }
}

export const MOCK_DECIDED_AT = "2026-08-03T12:00:00.000Z";

/** Traduz o motivo de bloqueio da regra da F2.1 para o erro administrativo correspondente. */
function decisionBlockToError(reason: ReviewDecisionBlockReason, entry: ReviewQueueEntry): AdminError {
  switch (reason) {
    case "review_not_pending":
      return {
        kind: "conflict", status: 409,
        message: "Esta revisão já possui uma decisão registrada.",
        expectedRevision: entry.cycle.submittedVersion,
        actualRevision: entry.cycle.submittedVersion,
      };
    case "version_mismatch":
      return {
        kind: "conflict", status: 409,
        message: "A versão editorial mudou depois do envio para revisão.",
        expectedRevision: entry.cycle.submittedVersion,
        actualRevision: entry.currentVersion,
      };
    case "hash_mismatch":
      return {
        kind: "conflict", status: 409,
        message: "O conteúdo foi alterado depois do envio e o hash não confere.",
        expectedRevision: entry.cycle.submittedVersion,
        actualRevision: entry.currentVersion,
      };
    case "own_content":
      return {
        kind: "forbidden", status: 403,
        message: "A segregação de funções impede decidir sobre o próprio conteúdo.",
        requiredCapability: HOME_ADMIN_CAPABILITIES.decideReview,
      };
    case "justification_required":
      return {
        kind: "validation", status: 422,
        message: "Revise os campos destacados.",
        fields: { opinion: ["Informe uma justificativa entre 10 e 1000 caracteres."] },
      };
  }
}

export class HomeAdminMockRepository
implements HomeAdminContentRepository, HomeAdminReviewRepository, HomeAdminScenarioAdapter {
  private readonly scenario: HomeAdminMockScenario;
  private resources: HomeAdminResource[];
  private reviews: ReviewCycle[];
  private queue: ReviewQueueEntry[];
  private publicationCandidates: HomeAdminResource[];
  private history: VersionHistoryEntry[];

  constructor(scenario: HomeAdminMockScenario = "success") {
    this.scenario = scenario;
    this.resources = clone([adminBannerMock, adminFooterContactsMock, adminSocialConfigurationMock]);
    this.reviews = [];
    this.queue = this.buildQueue();
    this.publicationCandidates = this.buildPublicationCandidates();
    this.history = createVersionHistory();
  }

  private buildPublicationCandidates(): HomeAdminResource[] {
    const candidates = createPublicationCandidates();
    if (this.scenario === "approval_expired") {
      candidates[0] = { ...candidates[0]!, version: { ...candidates[0]!.version, approvedAt: null } } as HomeAdminResource;
    }
    if (this.scenario === "hash_mismatch") {
      candidates[0] = { ...candidates[0]!, version: { ...candidates[0]!.version, contentHash: `${candidates[0]!.version.contentHash}-alterado` } } as HomeAdminResource;
    }
    if (this.scenario === "version_mismatch") {
      candidates[0] = { ...candidates[0]!, version: { ...candidates[0]!.version, editorialVersion: candidates[0]!.version.editorialVersion + 1 } } as HomeAdminResource;
    }
    if (this.scenario === "already_published") {
      candidates[0] = { ...candidates[0]!, state: "published" } as HomeAdminResource;
    }
    if (this.scenario === "decision_changed") {
      candidates[0] = { ...candidates[0]!, review: { ...candidates[0]!.review!, decision: "changes_requested" } } as HomeAdminResource;
    }
    return candidates;
  }

  /**
   * A fila é reconstruída a partir das fixtures determinísticas; os cenários de integridade apenas
   * divergem versão ou hash atuais, sem recalcular o hash submetido.
   */
  private buildQueue(): ReviewQueueEntry[] {
    const queue = createReviewQueue();
    const first = queue[0];
    if (!first) return queue;
    if (this.scenario === "hash_mismatch") {
      queue[0] = { ...first, currentHash: `${first.cycle.submittedHash}-alterado` };
    }
    if (this.scenario === "version_mismatch") {
      queue[0] = { ...first, currentVersion: first.cycle.submittedVersion + 1 };
    }
    return queue;
  }

  private result<T>(data: T): AdminResult<T> {
    const error = scenarioError(this.scenario);
    return error ? { ok: false, error: clone(error) } : { ok: true, data: clone(data) };
  }

  private findResource(resourceType: AdminResourceType, resourceId: string): HomeAdminResource {
    return this.resources.find((resource) => resource.resourceType === resourceType && resource.id === resourceId)
      ?? adminBannerMock;
  }

  getResourceListState(): AdminLoadState<AdminResourceSummary[]> {
    if (this.scenario === "loading") return { status: "loading" };
    if (this.scenario === "empty") return { status: "empty" };
    const error = scenarioError(this.scenario);
    if (error) return { status: "error", error: clone(error) };
    return { status: "ready", data: this.resources.map((resource) => this.toSummary(resource)) };
  }

  async listResources(): Promise<AdminResult<AdminResourceSummary[]>> {
    if (this.scenario === "empty") return { ok: true, data: [] };
    return this.result(this.resources.map((resource) => this.toSummary(resource)));
  }

  async getResource(resourceType: AdminResourceType, resourceId: string): Promise<AdminResult<HomeAdminResource>> {
    const error = scenarioError(this.scenario, resourceType);
    return error
      ? { ok: false, error: clone(error) }
      : { ok: true, data: clone(this.findResource(resourceType, resourceId)) };
  }

  async saveDraft(command: SaveDraftCommand): Promise<AdminResult<HomeAdminResource>> {
    const error = scenarioError(this.scenario, command.resource.resourceType);
    if (error) return { ok: false, error: clone(error) };
    const current = this.findResource(command.resource.resourceType, command.resource.id);
    if (current.version.revision !== command.expectedRevision) {
      return {
        ok: false,
        error: {
          kind: "conflict",
          status: 409,
          message: "Versão desatualizada.",
          expectedRevision: command.expectedRevision,
          actualRevision: current.version.revision,
        },
      };
    }
    const updated = clone(command.resource);
    updated.state = "draft";
    updated.version.revision += 1;
    const index = this.resources.findIndex((resource) => resource.resourceType === updated.resourceType);
    this.resources[index] = updated;
    return { ok: true, data: clone(updated) };
  }

  async getPublishableResources(): Promise<AdminResult<HomeAdminResource[]>> {
    if (this.scenario === "empty") return { ok: true, data: [] };
    const error = scenarioError(this.scenario);
    return error ? { ok: false, error: clone(error) } : { ok: true, data: clone(this.publicationCandidates) };
  }

  async publish(command: PublishResourceCommand): Promise<AdminResult<PublishResourceResult>> {
    const requiredCapability = publishCapabilityFor(command.resourceType);
    if (!hasCapability(command.actor, requiredCapability)) {
      return { ok: false, error: { kind: "forbidden", status: 403, message: "Capability de publicação ausente.", requiredCapability } };
    }
    const operationError = scenarioError(this.scenario, command.resourceType);
    if (operationError && operationError.kind !== "conflict") return { ok: false, error: clone(operationError) };
    const current = this.publicationCandidates.find((resource) => resource.resourceType === command.resourceType && resource.id === command.resourceId);
    if (!current) return { ok: false, error: { kind: "unexpected", message: "Conteúdo aprovado não encontrado.", retryable: false } };
    const publicBefore = this.history.find((entry) => entry.resource.resourceType === current.resourceType && entry.isCurrentPublic) ?? null;
    const conflict = (message: string): AdminResult<PublishResourceResult> => ({
      ok: false,
      error: { kind: "conflict", status: 409, message, expectedRevision: command.expectedRevision, actualRevision: current.version.revision },
    });
    if (this.scenario === "publication_conflict" || this.scenario === "conflict" || current.version.revision !== command.expectedRevision) {
      return conflict("Outra publicação alterou este conteúdo enquanto a confirmação estava aberta.");
    }
    if (current.state !== "approved") return conflict("Somente conteúdo aprovado pode ser publicado.");
    if (current.review?.decision !== "approved" || !current.version.approvedAt) return conflict("A aprovação não está mais vigente.");
    if (current.review.submittedVersion !== current.version.editorialVersion || command.approvedVersion !== current.version.editorialVersion) {
      return conflict("A versão atual diverge da versão aprovada.");
    }
    if (current.review.submittedHash !== current.version.contentHash || command.approvedHash !== current.version.contentHash) {
      return conflict("O hash atual diverge do conteúdo aprovado.");
    }
    if (publicBefore) {
      publicBefore.isCurrentPublic = false;
      publicBefore.resource = { ...publicBefore.resource, state: "archived", previousState: "published", version: { ...publicBefore.resource.version, archivedAt: MOCK_PUBLISHED_AT } } as HomeAdminResource;
    }
    const nextPublicVersion = (publicBefore?.resource.version.publicVersion ?? 0) + 1;
    const published = {
      ...clone(current),
      previousState: "approved",
      state: "published",
      version: { ...current.version, publicVersion: nextPublicVersion, publishedAt: MOCK_PUBLISHED_AT, publishedBy: command.actor.actorId, revision: current.version.revision + 1 },
    } as HomeAdminResource;
    const historyEntry: VersionHistoryEntry = {
      versionId: `history-${current.resourceType}-v${current.version.editorialVersion}`,
      resource: clone(published),
      authorId: current.version.createdBy,
      reviewerId: current.review.reviewerId,
      reviewDecision: current.review.decision,
      publishedBy: command.actor.actorId,
      isCurrentPublic: true,
    };
    this.history.unshift(historyEntry);
    const index = this.publicationCandidates.indexOf(current);
    this.publicationCandidates[index] = published;
    return { ok: true, data: clone({ published, archived: publicBefore, historyEntry }) };
  }

  async getHistory(resourceType: AdminResourceType, resourceId: string): Promise<AdminResult<HomeAdminResource[]>> {
    return this.result(this.history.filter((entry) => entry.resource.resourceType === resourceType && entry.resource.id === resourceId).map((entry) => entry.resource));
  }

  async listHistory(): Promise<AdminResult<VersionHistoryEntry[]>> {
    if (this.scenario === "empty") return { ok: true, data: [] };
    const error = scenarioError(this.scenario);
    return error ? { ok: false, error: clone(error) } : { ok: true, data: clone(this.history) };
  }

  async getHistoryVersion(versionId: string): Promise<AdminResult<VersionHistoryEntry>> {
    const error = scenarioError(this.scenario);
    if (error) return { ok: false, error: clone(error) };
    const entry = this.history.find((item) => item.versionId === versionId);
    return entry
      ? { ok: true, data: clone(entry) }
      : { ok: false, error: { kind: "unexpected", message: "Versão histórica não encontrada.", retryable: false } };
  }

  async restoreVersion(command: RestoreVersionCommand): Promise<AdminResult<RestoreVersionResult>> {
    if (!hasCapability(command.actor, HOME_ADMIN_CAPABILITIES.restoreVersion)) {
      return { ok: false, error: { kind: "forbidden", status: 403, message: "Capability de restauração ausente.", requiredCapability: HOME_ADMIN_CAPABILITIES.restoreVersion } };
    }
    const operationError = scenarioError(this.scenario);
    if (operationError && operationError.kind !== "conflict") return { ok: false, error: clone(operationError) };
    const source = this.history.find((entry) => entry.versionId === command.versionId);
    if (!source) return { ok: false, error: { kind: "unexpected", message: "Versão histórica não encontrada.", retryable: false } };
    if (this.scenario === "restore_conflict" || this.scenario === "conflict" || source.resource.version.revision !== command.expectedRevision) {
      return { ok: false, error: { kind: "conflict", status: 409, message: "O histórico mudou antes da restauração.", expectedRevision: command.expectedRevision, actualRevision: source.resource.version.revision } };
    }
    const highestVersion = Math.max(...this.history.filter((entry) => entry.resource.resourceType === source.resource.resourceType).map((entry) => entry.resource.version.editorialVersion));
    const draft = {
      ...clone(source.resource),
      id: `${source.resource.id}-restored-${highestVersion + 1}`,
      state: "draft",
      previousState: source.resource.state,
      review: null,
      version: {
        ...source.resource.version,
        editorialVersion: highestVersion + 1,
        revision: 0,
        contentHash: `sha256:${source.resource.resourceType}:restored-v${highestVersion + 1}`,
        createdAt: MOCK_PUBLISHED_AT,
        updatedAt: MOCK_PUBLISHED_AT,
        createdBy: command.actor.actorId,
        updatedBy: command.actor.actorId,
        submittedAt: null,
        approvedAt: null,
        publishedAt: null,
        archivedAt: null,
        publishedBy: null,
      },
    } as HomeAdminResource;
    this.resources = [...this.resources.filter((item) => item.resourceType !== draft.resourceType), draft];
    return { ok: true, data: clone({ source, draft }) };
  }

  async submitReview(command: SubmitReviewCommand): Promise<AdminResult<ReviewCycle>> {
    const review = createPendingReview(command.resourceType, command.resourceId);
    review.submittedVersion = command.version;
    review.submittedHash = command.contentHash;
    review.submittedBy = command.submittedBy;
    const error = scenarioError(this.scenario, command.resourceType);
    const result: AdminResult<ReviewCycle> = error
      ? { ok: false, error: clone(error) }
      : { ok: true, data: clone(review) };
    if (result.ok) this.reviews.push(clone(review));
    return result;
  }

  async cancelReview(command: CancelReviewCommand): Promise<AdminResult<ReviewCycle>> {
    const review = this.reviews.find((item) => item.cycleId === command.cycleId)
      ?? createPendingReview();
    const error = scenarioError(this.scenario, review.resourceType);
    return error
      ? { ok: false, error: clone(error) }
      : { ok: true, data: clone({ ...review, decision: "cancelled", cancellationReason: command.reason }) };
  }

  getSimulatedProfile(): SimulatedAdminProfile {
    return profileForScenario(this.scenario);
  }

  getReviewQueueState(): AdminLoadState<ReviewQueueEntry[]> {
    if (this.scenario === "loading") return { status: "loading" };
    if (this.scenario === "empty") return { status: "empty" };
    const error = scenarioError(this.scenario);
    if (error) return { status: "error", error: clone(error) };
    return { status: "ready", data: clone(this.queue) };
  }

  /** `empty` representa uma revisão inexistente: o detalhe apresenta um 404 contextual, sem tela branca. */
  getReviewDetailState(cycleId: string): AdminLoadState<ReviewQueueEntry> {
    if (this.scenario === "loading") return { status: "loading" };
    const error = scenarioError(this.scenario);
    if (error) return { status: "error", error: clone(error) };
    const entry = this.queue.find((item) => item.cycle.cycleId === cycleId);
    if (!entry) return { status: "empty" };
    return { status: "ready", data: clone(entry) };
  }

  async listReviews(): Promise<AdminResult<ReviewQueueEntry[]>> {
    if (this.scenario === "empty") return { ok: true, data: [] };
    return this.result(this.queue);
  }

  async getReview(cycleId: string): Promise<AdminResult<ReviewQueueEntry>> {
    const error = scenarioError(this.scenario);
    if (error) return { ok: false, error: clone(error) };
    const entry = this.queue.find((item) => item.cycle.cycleId === cycleId);
    return entry
      ? { ok: true, data: clone(entry) }
      : { ok: false, error: { kind: "unexpected", message: "Revisão não encontrada nesta demonstração.", retryable: false } };
  }

  async decideReview(command: DecideReviewCommand): Promise<AdminResult<ReviewQueueEntry>> {
    const scenarioFailure = scenarioError(this.scenario);
    if (scenarioFailure) return { ok: false, error: clone(scenarioFailure) };

    const entry = this.queue.find((item) => item.cycle.cycleId === command.cycleId);
    if (!entry) {
      return { ok: false, error: { kind: "unexpected", message: "Revisão não encontrada nesta demonstração.", retryable: false } };
    }
    const index = this.queue.indexOf(entry);

    // Decisão concorrente: outro revisor decidiu antes, e o estado local ainda não sabe disso.
    if (this.scenario === "concurrent") {
      return {
        ok: false,
        error: {
          kind: "conflict",
          status: 409,
          message: "Esta revisão já foi decidida por outra pessoa enquanto esta tela estava aberta.",
          expectedRevision: entry.cycle.submittedVersion,
          actualRevision: entry.cycle.submittedVersion + 1,
        },
      };
    }

    const verdict = evaluateReviewDecision({
      cycle: entry.cycle,
      reviewerId: command.reviewerId,
      decision: command.decision,
      opinion: command.opinion ?? undefined,
      currentVersion: command.currentVersion,
      currentHash: command.currentHash,
      authorId: entry.authorId,
    });

    if (!verdict.allowed) {
      return { ok: false, error: decisionBlockToError(verdict.reason, entry) };
    }

    const decided: ReviewCycle = {
      ...entry.cycle,
      decision: command.decision,
      reviewerId: command.reviewerId,
      decidedAt: MOCK_DECIDED_AT,
      opinion: command.opinion,
    };
    // Aprovar não publica: o estado editorial avança, mas `published` permanece intocado.
    const submitted: HomeAdminResource = {
      ...entry.submitted,
      previousState: entry.submitted.state,
      state: command.decision === "approved" ? "approved" : "draft",
      review: decided,
    };
    const updated: ReviewQueueEntry = { ...entry, cycle: decided, submitted };
    this.queue[index] = updated;
    return { ok: true, data: clone(updated) };
  }

  getDeterministicSnapshot(): HomeAdminResource[] {
    return clone(this.resources);
  }

  private toSummary(resource: HomeAdminResource): AdminResourceSummary {
    return {
      resourceType: resource.resourceType,
      id: resource.id,
      state: resource.state,
      editorialVersion: resource.version.editorialVersion,
      updatedAt: resource.version.updatedAt,
      updatedBy: resource.version.updatedBy,
    };
  }
}
