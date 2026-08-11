import type { HomeAdminResource } from "../../../../features/home-admin/domain/home-admin.types";
import { EditorialStatusBadge } from "./EditorialStatusBadge";
import styles from "../AdminEditor.module.css";

function date(value: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value)) : "Não realizada";
}

export function EditorialMetadata({ resource }: { resource: HomeAdminResource }) {
  return (
    <dl className={styles.metadata} aria-label="Metadados editoriais">
      <div><dt>Situação</dt><dd><EditorialStatusBadge state={resource.state} /></dd></div>
      <div><dt>Versão editorial</dt><dd>v{resource.version.editorialVersion}</dd></div>
      <div><dt>Versão pública vigente</dt><dd>{resource.version.publicVersion ? `v${resource.version.publicVersion}` : "Nenhuma"}</dd></div>
      <div><dt>Revisão</dt><dd>r{resource.version.revision}</dd></div>
      <div><dt>Última atualização</dt><dd>{date(resource.version.updatedAt)}</dd></div>
      <div><dt>Autor</dt><dd>{resource.version.updatedBy}</dd></div>
      <div><dt>Submissão para revisão</dt><dd>{date(resource.version.submittedAt)}</dd></div>
      <div><dt>Revisão pendente</dt><dd>{resource.review?.decision === "pending" ? "Sim" : "Não"}</dd></div>
      <div><dt>Publicação vigente</dt><dd>{date(resource.version.publishedAt)}</dd></div>
    </dl>
  );
}
