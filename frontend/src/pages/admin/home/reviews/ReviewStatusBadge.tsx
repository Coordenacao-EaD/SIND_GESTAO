import { Ban, CircleSlash, Clock3, CheckCircle2, PenLine } from "lucide-react";
import type { ReviewDecision } from "../../../../features/home-admin/domain/home-admin.types";
import { REVIEW_DECISION_LABELS } from "../../../../features/home-admin/domain/review-queue.types";
import styles from "./Reviews.module.css";

const ICONS: Record<ReviewDecision, typeof Clock3> = {
  pending: Clock3,
  approved: CheckCircle2,
  changes_requested: PenLine,
  cancelled: Ban,
  invalidated: CircleSlash,
};

/**
 * O estado nunca é comunicado apenas por cor: sempre há rótulo textual e um ícone distinto.
 */
export function ReviewStatusBadge({ decision }: { decision: ReviewDecision }) {
  const Icon = ICONS[decision];
  return (
    <span className={`${styles.badge} ${styles[`badge_${decision}`]}`}>
      <Icon aria-hidden="true" />
      {REVIEW_DECISION_LABELS[decision]}
    </span>
  );
}
