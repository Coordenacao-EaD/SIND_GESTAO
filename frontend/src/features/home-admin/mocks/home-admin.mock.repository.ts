import type {
  AdminError,
  AdminLoadState,
  AdminResourceSummary,
  AdminResourceType,
  AdminResult,
  HomeAdminResource,
  ReviewCycle,
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
import {
  adminBannerMock,
  adminFooterContactsMock,
  adminSocialConfigurationMock,
  createPendingReview,
} from "./home-admin.mock-data";

export type HomeAdminMockScenario =
  | "success"
  | "loading"
  | "empty"
  | "validation"
  | "unauthenticated"
  | "forbidden"
  | "conflict"
  | "unavailable";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function scenarioError(scenario: HomeAdminMockScenario): AdminError | null {
  switch (scenario) {
    case "validation":
      return { kind: "validation", status: 422, message: "Conteúdo inválido.", fields: { title: ["Campo obrigatório."] } };
    case "unauthenticated":
      return { kind: "unauthenticated", status: 401, message: "Sessão administrativa necessária." };
    case "forbidden":
      return { kind: "forbidden", status: 403, message: "Capacidade insuficiente.", requiredCapability: "home.banner.edit" };
    case "conflict":
      return { kind: "conflict", status: 409, message: "Versão desatualizada.", expectedRevision: 0, actualRevision: 1 };
    case "unavailable":
      return { kind: "unavailable", message: "Serviço temporariamente indisponível.", retryable: true };
    default:
      return null;
  }
}

export class HomeAdminMockRepository
implements HomeAdminContentRepository, HomeAdminReviewRepository, HomeAdminScenarioAdapter {
  private readonly scenario: HomeAdminMockScenario;
  private resources: HomeAdminResource[];
  private reviews: ReviewCycle[];

  constructor(scenario: HomeAdminMockScenario = "success") {
    this.scenario = scenario;
    this.resources = clone([adminBannerMock, adminFooterContactsMock, adminSocialConfigurationMock]);
    this.reviews = [];
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
    return this.result(this.findResource(resourceType, resourceId));
  }

  async saveDraft(command: SaveDraftCommand): Promise<AdminResult<HomeAdminResource>> {
    const error = scenarioError(this.scenario);
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

  async publish(command: PublishResourceCommand): Promise<AdminResult<HomeAdminResource>> {
    const current = this.findResource(command.resourceType, command.resourceId);
    return this.result(current);
  }

  async getHistory(resourceType: AdminResourceType, resourceId: string): Promise<AdminResult<HomeAdminResource[]>> {
    return this.result([this.findResource(resourceType, resourceId)]);
  }

  async restoreVersion(command: RestoreVersionCommand): Promise<AdminResult<HomeAdminResource>> {
    return this.result(this.findResource(command.resourceType, command.resourceId));
  }

  async submitReview(command: SubmitReviewCommand): Promise<AdminResult<ReviewCycle>> {
    const review = createPendingReview(command.resourceType, command.resourceId);
    review.submittedVersion = command.version;
    review.submittedHash = command.contentHash;
    review.submittedBy = command.submittedBy;
    const result = this.result(review);
    if (result.ok) this.reviews.push(clone(review));
    return result;
  }

  async cancelReview(command: CancelReviewCommand): Promise<AdminResult<ReviewCycle>> {
    const review = this.reviews.find((item) => item.cycleId === command.cycleId)
      ?? createPendingReview();
    return this.result({ ...review, decision: "cancelled", cancellationReason: command.reason });
  }

  async decideReview(command: DecideReviewCommand): Promise<AdminResult<ReviewCycle>> {
    const review = this.reviews.find((item) => item.cycleId === command.cycleId)
      ?? createPendingReview();
    return this.result({
      ...review,
      reviewerId: command.reviewerId,
      decision: command.decision,
      opinion: command.opinion,
    });
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

