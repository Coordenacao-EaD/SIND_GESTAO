import { ArrowLeft, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ADMIN_ROUTES } from "../../../../config/routes";
import { buildActionMatrix } from "../../../../features/home-admin/domain/editorial-rules";
import type { AdminError, RestoreVersionResult, VersionHistoryEntry } from "../../../../features/home-admin/domain/home-admin.types";
import { HomeAdminMockRepository, type HomeAdminMockScenario } from "../../../../features/home-admin/mocks/home-admin.mock.repository";
import { AdminFeedback, DemoNotice } from "../components/AdminFeedback";
import { AdminHomeLayout } from "../components/AdminHomeLayout";
import { EditorialStatusBadge } from "../components/EditorialStatusBadge";
import { CriticalActionDialog } from "./CriticalActionDialog";
import { RESOURCE_LABELS } from "./f22d.constants";
import { ResourceSnapshot } from "./ResourceSnapshot";
import styles from "./F22D.module.css";

function editorPath(result: RestoreVersionResult) {
  const base = result.draft.resourceType === "banner" ? ADMIN_ROUTES.home : result.draft.resourceType === "footer_contacts" ? ADMIN_ROUTES.contacts : ADMIN_ROUTES.social;
  return `${base}?scenario=restored&draftId=${encodeURIComponent(result.draft.id)}`;
}

export default function HistoryDetailPage() {
  const { versionId = "" } = useParams(); const [params] = useSearchParams();
  const scenario = (params.get("scenario") as HomeAdminMockScenario | null) ?? "success";
  const repository = useMemo(() => new HomeAdminMockRepository(scenario), [scenario]); const profile = repository.getSimulatedProfile();
  const [entry, setEntry] = useState<VersionHistoryEntry>(); const [error, setError] = useState<AdminError>(); const [dialog, setDialog] = useState(false); const [busy, setBusy] = useState(false); const [restored, setRestored] = useState<RestoreVersionResult>(); const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { document.title = "Detalhe da versão | Gestão da Home — SINDGESTÃO"; }, []);
  useEffect(() => { void repository.getHistoryVersion(versionId).then((result) => result.ok ? setEntry(result.data) : setError(result.error)); }, [repository, versionId]);
  const close = () => { setDialog(false); trigger.current?.focus(); };
  const restore = async () => { if (!entry || busy) return; setBusy(true); const result = await repository.restoreVersion({ versionId: entry.versionId, expectedRevision: entry.resource.version.revision, actor: profile }); setBusy(false); if (!result.ok) { setError(result.error); close(); return; } setRestored(result.data); close(); };
  if (error && !entry) return <AdminHomeLayout><main id="admin-content" className={styles.stack}><h1>Versão histórica não encontrada</h1><AdminFeedback error={error} /><Link className={styles.secondary} to={ADMIN_ROUTES.history}>Voltar ao histórico</Link></main></AdminHomeLayout>;
  if (!entry) return <AdminHomeLayout><main id="admin-content" className={styles.stack} aria-busy="true"><h1>Carregando versão histórica</h1></main></AdminHomeLayout>;
  const action = buildActionMatrix({ resourceType: entry.resource.resourceType, state: entry.resource.state, reviewDecision: entry.reviewDecision, authorId: entry.authorId, profile, hasChanges: false, approvalValid: false, currentVersion: entry.resource.version.editorialVersion, approvedVersion: null, currentHash: entry.resource.version.contentHash, approvedHash: null }).restore_version;
  return <AdminHomeLayout><main id="admin-content" className={styles.stack}><div className={styles.header}><div><span className={styles.eyebrow}>{RESOURCE_LABELS[entry.resource.resourceType]} · histórico imutável</span><h1>Versão editorial v{entry.resource.version.editorialVersion}</h1><p>Esta tela é somente leitura. O conteúdo histórico nunca é editado diretamente.</p></div>{entry.isCurrentPublic && <span className={styles.current}>Versão pública atual</span>}</div><DemoNotice />
    <AdminFeedback error={error} success={restored ? "Novo rascunho criado. A versão pública permanece intacta e a aprovação histórica não foi reutilizada." : undefined} onRetry={error?.kind === "conflict" ? () => globalThis.location.reload() : undefined} retryLabel="Recarregar dados" />
    <section className={styles.card}><h2>Metadados completos</h2><dl className={styles.meta}><div><dt>ID da versão</dt><dd>{entry.versionId}</dd></div><div><dt>Status</dt><dd><EditorialStatusBadge state={entry.resource.state} /></dd></div><div><dt>Hash</dt><dd>{entry.resource.version.contentHash}</dd></div><div><dt>Autor</dt><dd>{entry.authorId}</dd></div><div><dt>Revisor</dt><dd>{entry.reviewerId ?? "—"}</dd></div><div><dt>Decisão</dt><dd>{entry.reviewDecision ?? "—"}</dd></div><div><dt>Publicado por</dt><dd>{entry.publishedBy ?? "—"}</dd></div><div><dt>Publicado em</dt><dd>{entry.resource.version.publishedAt ?? "—"}</dd></div></dl></section>
    <section className={styles.card}><h2>Conteúdo imutável desta versão</h2><ResourceSnapshot resource={entry.resource} /></section>
    <section className={styles.card}><h2>Restauração</h2><p>Restaurar cria um novo draft sem aprovação, revisão ou publicação. A versão pública vigente não muda.</p>{!action.enabled && <p className={styles.reason}>Ação bloqueada: capability site.home.version.restore ausente ou versão não restaurável.</p>}<div className={styles.actions}><button className={styles.primary} disabled={!action.enabled || busy} onClick={() => setDialog(true)} ref={trigger} type="button"><RotateCcw aria-hidden="true" /> Restaurar como novo rascunho</button>{restored && <Link className={styles.secondary} to={editorPath(restored)}>Abrir novo rascunho</Link>}</div></section>
    <Link className={styles.secondary} to={ADMIN_ROUTES.history}><ArrowLeft aria-hidden="true" /> Voltar ao histórico</Link>{dialog && <CriticalActionDialog resource={entry.resource} mode="restore" busy={busy} onCancel={close} onConfirm={() => void restore()} />}
  </main></AdminHomeLayout>;
}
