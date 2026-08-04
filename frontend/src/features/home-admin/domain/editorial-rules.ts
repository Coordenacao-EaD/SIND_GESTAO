import {
  HOME_ADMIN_CAPABILITIES,
  hasCapability,
  publishCapabilityFor,
  type HomeAdminCapability,
  type SimulatedAdminProfile,
} from "../permissions/home-admin.permissions";
import type {
  AdminResourceType,
  ContentHash,
  EditorialState,
  ReviewDecision,
  ReviewDecisionCommand,
} from "./home-admin.types";

export const ADMIN_ACTIONS = [
  "edit",
  "save_draft",
  "preview",
  "submit_review",
  "cancel_review",
  "approve",
  "request_changes",
  "publish",
  "view_history",
  "restore_version",
] as const;

export type AdminAction = (typeof ADMIN_ACTIONS)[number];

export type ActionBlockReason =
  | "missing_capability"
  | "invalid_state"
  | "review_not_pending"
  | "own_content"
  | "no_changes"
  | "stale_approval"
  | "hash_mismatch"
  | "not_applicable";

export type ActionAvailability =
  | { visible: false; enabled: false; blocked: true; reason: "not_applicable" }
  | { visible: true; enabled: true; blocked: false; reason: null }
  | { visible: true; enabled: false; blocked: true; reason: Exclude<ActionBlockReason, "not_applicable"> };

export interface ActionMatrixContext {
  resourceType: AdminResourceType;
  state: EditorialState;
  reviewDecision: ReviewDecision | null;
  authorId: string;
  profile: SimulatedAdminProfile;
  hasChanges: boolean;
  approvalValid: boolean;
  currentVersion: number;
  approvedVersion: number | null;
  currentHash: ContentHash;
  approvedHash: ContentHash | null;
}

export type ActionMatrix = Record<AdminAction, ActionAvailability>;

export type EditorialTransitionBlockReason =
  | "transition_not_allowed"
  | "review_decision_required"
  | "changes_required"
  | "approval_invalid"
  | "hash_mismatch";

export type RuleResult<TReason extends string> =
  | { allowed: true }
  | { allowed: false; reason: TReason };

export interface EditorialTransitionContext {
  reviewDecision?: ReviewDecision;
  hasChanges?: boolean;
  approvalValid?: boolean;
  currentHash?: ContentHash;
  approvedHash?: ContentHash | null;
  currentVersion?: number;
  approvedVersion?: number | null;
}

const ALLOWED_TRANSITIONS: Readonly<Record<EditorialState, readonly EditorialState[]>> = {
  draft: ["review"],
  review: ["approved", "draft"],
  approved: ["published", "draft"],
  published: ["archived"],
  archived: [],
};

export function evaluateEditorialTransition(
  from: EditorialState,
  to: EditorialState,
  context: EditorialTransitionContext = {},
): RuleResult<EditorialTransitionBlockReason> {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    return { allowed: false, reason: "transition_not_allowed" };
  }
  if (from === "review" && to === "approved" && context.reviewDecision !== "approved") {
    return { allowed: false, reason: "review_decision_required" };
  }
  if (from === "review" && to === "draft" && !["changes_requested", "cancelled"].includes(context.reviewDecision ?? "")) {
    return { allowed: false, reason: "review_decision_required" };
  }
  if (from === "approved" && to === "draft" && !context.hasChanges) {
    return { allowed: false, reason: "changes_required" };
  }
  if (from === "approved" && to === "published") {
    if (!context.approvalValid) return { allowed: false, reason: "approval_invalid" };
    if (!context.currentVersion || context.approvedVersion !== context.currentVersion) {
      return { allowed: false, reason: "approval_invalid" };
    }
    if (!context.currentHash || context.approvedHash !== context.currentHash) {
      return { allowed: false, reason: "hash_mismatch" };
    }
  }
  return { allowed: true };
}

export type ReviewDecisionBlockReason =
  | "review_not_pending"
  | "own_content"
  | "version_mismatch"
  | "hash_mismatch"
  | "justification_required";

export function evaluateReviewDecision(
  command: ReviewDecisionCommand,
): RuleResult<ReviewDecisionBlockReason> {
  const { cycle, reviewerId, decision, opinion, reason, currentVersion, currentHash } = command;
  if (cycle.decision !== "pending") return { allowed: false, reason: "review_not_pending" };
  if (decision === "approved" && cycle.submittedBy === reviewerId) {
    return { allowed: false, reason: "own_content" };
  }
  if (cycle.submittedVersion !== currentVersion) return { allowed: false, reason: "version_mismatch" };
  if (cycle.submittedHash !== currentHash) return { allowed: false, reason: "hash_mismatch" };
  if (decision === "changes_requested" && !opinion?.trim()) {
    return { allowed: false, reason: "justification_required" };
  }
  if ((decision === "cancelled" || decision === "invalidated") && !reason?.trim()) {
    return { allowed: false, reason: "justification_required" };
  }
  return { allowed: true };
}

function enabled(): ActionAvailability {
  return { visible: true, enabled: true, blocked: false, reason: null };
}

function blocked(reason: Exclude<ActionBlockReason, "not_applicable">): ActionAvailability {
  return { visible: true, enabled: false, blocked: true, reason };
}

function hidden(): ActionAvailability {
  return { visible: false, enabled: false, blocked: true, reason: "not_applicable" };
}

function requireCapability(
  profile: SimulatedAdminProfile,
  capability: HomeAdminCapability,
): ActionAvailability {
  return hasCapability(profile, capability) ? enabled() : blocked("missing_capability");
}

function editCapabilityFor(context: ActionMatrixContext): HomeAdminCapability {
  return context.resourceType === "banner"
    ? HOME_ADMIN_CAPABILITIES.editBanner
    : publishCapabilityFor(context.resourceType);
}

export function buildActionMatrix(context: ActionMatrixContext): ActionMatrix {
  const editCapability = editCapabilityFor(context);
  const canEdit = requireCapability(context.profile, editCapability);
  const canDecide = requireCapability(context.profile, HOME_ADMIN_CAPABILITIES.decideReview);
  const publishCapability = publishCapabilityFor(context.resourceType);
  const publishPermission = requireCapability(context.profile, publishCapability);
  const pendingReview = context.state === "review" && context.reviewDecision === "pending";
  const ownContent = context.authorId === context.profile.actorId;
  const hashesMatch = context.approvedHash === context.currentHash;
  const versionsMatch = context.approvedVersion === context.currentVersion;

  return {
    edit: ["draft", "approved"].includes(context.state) ? canEdit : hidden(),
    save_draft: context.state === "draft"
      ? (context.hasChanges ? canEdit : blocked("no_changes"))
      : hidden(),
    preview: ["draft", "review", "approved", "published"].includes(context.state) ? enabled() : hidden(),
    submit_review: context.state === "draft"
      ? (context.hasChanges ? canEdit : blocked("no_changes"))
      : hidden(),
    cancel_review: context.state === "review"
      ? (pendingReview ? canEdit : blocked("review_not_pending"))
      : hidden(),
    approve: context.state === "review"
      ? (!pendingReview
        ? blocked("review_not_pending")
        : ownContent
          ? blocked("own_content")
          : canDecide)
      : hidden(),
    request_changes: context.state === "review"
      ? (pendingReview ? canDecide : blocked("review_not_pending"))
      : hidden(),
    publish: context.state === "approved"
      ? (!context.approvalValid || !versionsMatch
        ? blocked("stale_approval")
        : !hashesMatch
          ? blocked("hash_mismatch")
          : publishPermission)
      : hidden(),
    view_history: requireCapability(context.profile, HOME_ADMIN_CAPABILITIES.viewHistory),
    restore_version: ["published", "archived"].includes(context.state)
      ? requireCapability(context.profile, HOME_ADMIN_CAPABILITIES.restoreVersion)
      : hidden(),
  };
}
