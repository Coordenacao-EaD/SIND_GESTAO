import { useEffect, useRef } from "react";
import type { HomeAdminResource } from "../../../../features/home-admin/domain/home-admin.types";
import { RESOURCE_LABELS } from "./f22d.constants";
import { ResourceSnapshot } from "./ResourceSnapshot";
import styles from "./F22D.module.css";

export function CriticalActionDialog({ resource, mode, busy, onCancel, onConfirm }: { resource: HomeAdminResource; mode: "publish" | "restore"; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { confirmRef.current?.focus(); }, []);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) { event.preventDefault(); onCancel(); } };
    document.addEventListener("keydown", keydown); return () => document.removeEventListener("keydown", keydown);
  }, [busy, onCancel]);
  const publishTitle = resource.resourceType === "banner" ? "Publicar banner" : resource.resourceType === "footer_contacts" ? "Publicar contatos" : "Publicar configuração de redes sociais";
  const title = mode === "publish" ? publishTitle : "Restaurar como novo rascunho";
  return <div className={styles.dialogBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <section aria-describedby="critical-dialog-description" aria-labelledby="critical-dialog-title" aria-modal="true" className={styles.dialog} role="dialog">
      <h2 id="critical-dialog-title">{title}</h2>
      <p id="critical-dialog-description">{mode === "publish"
        ? `Você publicará somente ${RESOURCE_LABELS[resource.resourceType].toLowerCase()}, versão editorial v${resource.version.editorialVersion}. Esta ação é simulada e não altera a Home pública real.`
        : `Será criado somente um novo rascunho a partir da versão v${resource.version.editorialVersion}. A versão pública atual não será alterada.`}</p>
      <dl className={styles.meta}>
        <div><dt>Versão</dt><dd>v{resource.version.editorialVersion}</dd></div>
        <div><dt>Hash</dt><dd>{resource.version.contentHash}</dd></div>
        <div><dt>Aprovação</dt><dd>{resource.version.approvedAt ? "Vigente" : "Não vigente"}</dd></div>
        <div><dt>Revisor</dt><dd>{resource.review?.reviewerId ?? "Histórico"}</dd></div>
        <div><dt>Versão pública vigente</dt><dd>{resource.version.publicVersion === null ? "Nenhuma" : `v${resource.version.publicVersion}`}</dd></div>
      </dl>
      <h3>Conteúdo da versão</h3><ResourceSnapshot resource={resource} />
      {mode === "restore" && <p>O novo rascunho precisará passar novamente por edição e validação, revisão, aprovação e publicação.</p>}
      <div className={styles.dialogActions}>
        <button className={styles.secondary} disabled={busy} onClick={onCancel} type="button">Cancelar</button>
        <button className={styles.primary} disabled={busy} onClick={onConfirm} ref={confirmRef} type="button">{busy ? "Processando ação simulada…" : title}</button>
      </div>
    </section>
  </div>;
}
