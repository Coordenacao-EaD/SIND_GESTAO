import type {
  AdminLoadState,
  AdminResourceSummary,
  AdminResourceType,
  AdminResult,
  ConcurrencyRevision,
  ContentHash,
  EditorialVersionNumber,
  HomeAdminResource,
  ReviewCycle,
  ReviewDecision,
} from "../domain/home-admin.types";

export interface SaveDraftCommand {
  resource: HomeAdminResource;
  expectedRevision: ConcurrencyRevision;
}

export interface PublishResourceCommand {
  resourceType: AdminResourceType;
  resourceId: string;
  expectedRevision: ConcurrencyRevision;
  approvedHash: ContentHash;
}

export interface RestoreVersionCommand {
  resourceType: AdminResourceType;
  resourceId: string;
  editorialVersion: EditorialVersionNumber;
  expectedRevision: ConcurrencyRevision;
}

export interface SubmitReviewCommand {
  resourceType: AdminResourceType;
  resourceId: string;
  version: EditorialVersionNumber;
  contentHash: ContentHash;
  submittedBy: string;
}

export interface CancelReviewCommand {
  cycleId: string;
  actorId: string;
  reason: string;
}

export interface DecideReviewCommand {
  cycleId: string;
  reviewerId: string;
  decision: Exclude<ReviewDecision, "pending" | "cancelled">;
  opinion: string | null;
  currentHash: ContentHash;
}

export interface HomeAdminContentRepository {
  listResources(): Promise<AdminResult<AdminResourceSummary[]>>;
  getResource(resourceType: AdminResourceType, resourceId: string): Promise<AdminResult<HomeAdminResource>>;
  saveDraft(command: SaveDraftCommand): Promise<AdminResult<HomeAdminResource>>;
  publish(command: PublishResourceCommand): Promise<AdminResult<HomeAdminResource>>;
  getHistory(resourceType: AdminResourceType, resourceId: string): Promise<AdminResult<HomeAdminResource[]>>;
  restoreVersion(command: RestoreVersionCommand): Promise<AdminResult<HomeAdminResource>>;
}

export interface HomeAdminReviewRepository {
  submitReview(command: SubmitReviewCommand): Promise<AdminResult<ReviewCycle>>;
  cancelReview(command: CancelReviewCommand): Promise<AdminResult<ReviewCycle>>;
  decideReview(command: DecideReviewCommand): Promise<AdminResult<ReviewCycle>>;
}

export interface HomeAdminScenarioAdapter {
  getResourceListState(): AdminLoadState<AdminResourceSummary[]>;
}

