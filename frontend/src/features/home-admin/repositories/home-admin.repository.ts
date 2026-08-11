import type {
  AdminLoadState,
  AdminResourceSummary,
  AdminResourceType,
  AdminResult,
  ConcurrencyRevision,
  ContentHash,
  EditorialVersionNumber,
  HomeAdminResource,
  PublishResourceResult,
  RestoreVersionResult,
  ReviewCycle,
  ReviewDecision,
  VersionHistoryEntry,
} from "../domain/home-admin.types";
import type { ReviewQueueEntry } from "../domain/review-queue.types";
import type { SimulatedAdminProfile } from "../permissions/home-admin.permissions";

export interface SaveDraftCommand {
  resource: HomeAdminResource;
  expectedRevision: ConcurrencyRevision;
}

export interface PublishResourceCommand {
  resourceType: AdminResourceType;
  resourceId: string;
  expectedRevision: ConcurrencyRevision;
  approvedHash: ContentHash;
  approvedVersion: EditorialVersionNumber;
  actor: SimulatedAdminProfile;
}

export interface RestoreVersionCommand {
  versionId: string;
  expectedRevision: ConcurrencyRevision;
  actor: SimulatedAdminProfile;
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
  currentVersion: EditorialVersionNumber;
}

export interface HomeAdminContentRepository {
  listResources(): Promise<AdminResult<AdminResourceSummary[]>>;
  getResource(resourceType: AdminResourceType, resourceId: string): Promise<AdminResult<HomeAdminResource>>;
  saveDraft(command: SaveDraftCommand): Promise<AdminResult<HomeAdminResource>>;
  getPublishableResources(): Promise<AdminResult<HomeAdminResource[]>>;
  publish(command: PublishResourceCommand): Promise<AdminResult<PublishResourceResult>>;
  getHistory(resourceType: AdminResourceType, resourceId: string): Promise<AdminResult<HomeAdminResource[]>>;
  listHistory(): Promise<AdminResult<VersionHistoryEntry[]>>;
  getHistoryVersion(versionId: string): Promise<AdminResult<VersionHistoryEntry>>;
  restoreVersion(command: RestoreVersionCommand): Promise<AdminResult<RestoreVersionResult>>;
}

export interface HomeAdminReviewRepository {
  submitReview(command: SubmitReviewCommand): Promise<AdminResult<ReviewCycle>>;
  cancelReview(command: CancelReviewCommand): Promise<AdminResult<ReviewCycle>>;
  decideReview(command: DecideReviewCommand): Promise<AdminResult<ReviewQueueEntry>>;
  listReviews(): Promise<AdminResult<ReviewQueueEntry[]>>;
  getReview(cycleId: string): Promise<AdminResult<ReviewQueueEntry>>;
}

export interface HomeAdminScenarioAdapter {
  getResourceListState(): AdminLoadState<AdminResourceSummary[]>;
  getReviewQueueState(): AdminLoadState<ReviewQueueEntry[]>;
  getReviewDetailState(cycleId: string): AdminLoadState<ReviewQueueEntry>;
  getSimulatedProfile(): SimulatedAdminProfile;
}
