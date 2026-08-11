import { ChevronRight, History } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ADMIN_ROUTES, adminHistoryDetailPath } from "../../../../config/routes";
import { buildActionMatrix } from "../../../../features/home-admin/domain/editorial-rules";
import type { AdminError, AdminResourceType, EditorialState, VersionHistoryEntry } from "../../../../features/home-admin/domain/home-admin.types";
import { HomeAdminMockRepository, type HomeAdminMockScenario } from "../../../../features/home-admin/mocks/home-admin.mock.repository";
import { AdminFeedback, DemoNotice } from "../components/AdminFeedback";
import { AdminHomeLayout } from "../components/AdminHomeLayout";
import { EditorialStatusBadge } from "../components/EditorialStatusBadge";
import { RESOURCE_LABELS } from "./f22d.constants";
import styles from "./F22D.module.css";

const scenarios: Array<{ value: HomeAdminMockScenario; label: string }> = [
  { value: "success", label: "Histórico disponível" }, { value: "empty", label: "Histórico vazio" },
  { value: "readonly", label: "Sem capability" }, { value: "unauthenticated", label: "Erro 401" },
  { value: "forbidden", label: "Erro 403" }, { value: "unavailable", label: "Indisponível" }, { value: "unexpected", label: "Erro inesperado" },
];

export default function HistoryPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("scenario") as HomeAdminMockScenario | null;
  const scenario = scenarios.some((item) => item.value === requested) ? requested! : "success";
  const repository = useMemo(() => new HomeAdminMockRepository(scenario), [scenario]);
  const profile = repository.getSimulatedProfile();
  const [entries, setEntries] = useState<VersionHistoryEntry[]>([]);
  const [error, setError] = useState<AdminError>();
  const [type, setType] = useState<AdminResourceType | "all">("all");
  const [status, setStatus] = useState<EditorialState | "all">("all");
  const [period, setPeriod] = useState<"all" | "august" | "july">("all");
  const [currentOnly, setCurrentOnly] = useState(false);
  const historyAction = buildActionMatrix({ resourceType: "banner", state: "published", reviewDecision: "approved", authorId: "actor-editor-1", profile, hasChanges: false, approvalValid: true, currentVersion: 1, approvedVersion: 1, currentHash: "hash", approvedHash: "hash" }).view_history;

  useEffect(() => { document.title = "Histórico de versões | Gestão da Home — SINDGESTÃO"; }, []);
  useEffect(() => {
    if (!historyAction.enabled) { setError({ kind: "forbidden", status: 403, message: "Seu perfil não pode visualizar o histórico.", requiredCapability: "site.home.history.view" }); return; }
    void repository.listHistory().then((result) => result.ok ? (setEntries(result.data), setError(undefined)) : setError(result.error));
  }, [historyAction.enabled, repository]);
  const filtered = entries.filter((entry) => (type === "all" || entry.resource.resourceType === type) && (status === "all" || entry.resource.state === status) && (!currentOnly || entry.isCurrentPublic) && (period === "all" || (period === "august" ? entry.resource.version.createdAt.includes("2026-08") : entry.resource.version.createdAt.includes("2026-07"))));
  return <AdminHomeLayout><main id="admin-content" className={styles.stack}>
    <div className={styles.header}><div><span className={styles.eyebrow}>Gestão de conteúdo · F2.2D</span><h1>Histórico de versões</h1><p>Registro somente leitura de banner, contatos e da configuração completa de redes sociais.</p></div><label className={styles.scenario}>Visualizar estado<select value={scenario} onChange={(event) => setParams(event.target.value === "success" ? {} : { scenario: event.target.value })}>{scenarios.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></div>
    <DemoNotice /><AdminFeedback error={error} onRetry={error?.kind === "unavailable" ? () => setParams({}) : undefined} />
    {!error && <section className={styles.card} aria-labelledby="history-filters-title"><h2 id="history-filters-title">Filtrar histórico</h2><div className={styles.filters}>
      <label>Tipo<select value={type} onChange={(event) => setType(event.target.value as typeof type)}><option value="all">Todos</option><option value="banner">Banner</option><option value="footer_contacts">Contatos</option><option value="footer_social_links">Redes sociais</option></select></label>
      <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">Todos</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label>
      <label>Período simulado<select value={period} onChange={(event) => setPeriod(event.target.value as typeof period)}><option value="all">Todo o período</option><option value="august">Agosto de 2026</option><option value="july">Julho de 2026</option></select></label>
      <label className={styles.toggle}><input checked={currentOnly} onChange={(event) => setCurrentOnly(event.target.checked)} type="checkbox" /> Somente versão pública atual</label>
    </div><p>{filtered.length} de {entries.length} versões exibidas.</p></section>}
    {!error && filtered.length === 0 && <section className={styles.empty}><History aria-hidden="true" /><h2>Nenhuma versão encontrada</h2><p>Ajuste os filtros ou consulte outro cenário simulado.</p></section>}
    {!error && filtered.length > 0 && <ol className={styles.history}>{filtered.map((entry) => <li key={entry.versionId}><div><span className={styles.eyebrow}>{RESOURCE_LABELS[entry.resource.resourceType]}</span><h2>Versão editorial v{entry.resource.version.editorialVersion}</h2>{entry.isCurrentPublic && <span className={styles.current}>Versão pública atual</span>}</div><dl className={styles.meta}><div><dt>Status</dt><dd><EditorialStatusBadge state={entry.resource.state} /></dd></div><div><dt>Autor</dt><dd>{entry.authorId}</dd></div><div><dt>Revisor</dt><dd>{entry.reviewerId ?? "—"}</dd></div><div><dt>Publicação</dt><dd>{entry.publishedBy ?? "—"}</dd></div><div><dt>Hash</dt><dd>{entry.resource.version.contentHash}</dd></div><div><dt>Data</dt><dd>{entry.resource.version.publishedAt ?? entry.resource.version.createdAt}</dd></div></dl><Link className={styles.secondary} to={adminHistoryDetailPath(entry.versionId)}>Ver detalhe <ChevronRight aria-hidden="true" /></Link></li>)}</ol>}
    <Link className={styles.secondary} to={ADMIN_ROUTES.home}>Voltar à administração</Link>
  </main></AdminHomeLayout>;
}
