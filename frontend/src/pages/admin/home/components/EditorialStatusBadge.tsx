import type { EditorialState } from "../../../../features/home-admin/domain/home-admin.types";
import styles from "../HomeManagementPage.module.css";

const STATUS_LABELS: Record<EditorialState, string> = {
  draft: "Rascunho",
  review: "Em revisão",
  approved: "Aprovado",
  published: "Publicado",
  archived: "Arquivado",
};

export function EditorialStatusBadge({ state }: { state: EditorialState }) {
  return <span className={`${styles.statusBadge} ${styles[`status_${state}`]}`}>{STATUS_LABELS[state]}</span>;
}
