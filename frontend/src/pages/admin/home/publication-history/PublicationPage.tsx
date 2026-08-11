import { CheckCircle2, ChevronRight, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { buildActionMatrix, type ActionAvailability } from "../../../../features/home-admin/domain/editorial-rules";
import type { AdminError, HomeAdminResource } from "../../../../features/home-admin/domain/home-admin.types";
import { HomeAdminMockRepository, type HomeAdminMockScenario } from "../../../../features/home-admin/mocks/home-admin.mock.repository";
import { AdminFeedback, DemoNotice } from "../components/AdminFeedback";
import { AdminHomeLayout } from "../components/AdminHomeLayout";
import { EditorialStatusBadge } from "../components/EditorialStatusBadge";
import { CriticalActionDialog } from "./CriticalActionDialog";
import { RESOURCE_LABELS } from "./f22d.constants";
import { ResourceSnapshot } from "./ResourceSnapshot";
import styles from "./F22D.module.css";

const SCENARIOS: Array<{ value: HomeAdminMockScenario; label: string }> = [
  { value: "success", label: "Aprovados elegíveis" }, { value: "readonly", label: "Sem capability" },
  { value: "approval_expired", label: "Aprovação expirada" }, { value: "hash_mismatch", label: "Hash divergente" },
  { value: "version_mismatch", label: "Versão divergente" }, { value: "already_published", label: "Já publicado" },
  { value: "decision_changed", label: "Decisão de revisão alterada" },
  { value: "publication_conflict", label: "Conflito 409" }, { value: "unauthenticated", label: "Erro 401" },
  { value: "forbidden", label: "Erro 403" }, { value: "unavailable", label: "Indisponível" },
  { value: "validation", label: "Erro 422" },
  { value: "unexpected", label: "Erro inesperado" },
];
const scenarioSet = new Set(SCENARIOS.map(({ value }) => value));

function approvalValid(resource: HomeAdminResource) {
  return resource.state === "approved" && resource.review?.decision === "approved" && Boolean(resource.version.approvedAt);
}
function blockedReason(action: ActionAvailability) {
  if (action.enabled) return null;
  const labels: Record<string, string> = { missing_capability: "Seu perfil não possui a capability específica.", invalid_state: "O conteúdo não está aprovado.", stale_approval: "A aprovação, a versão ou a revisão não está vigente.", hash_mismatch: "O hash atual diverge do hash aprovado." };
  return labels[action.reason ?? ""] ?? "A publicação está bloqueada pelas regras editoriais.";
}

export default function PublicationPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("scenario") as HomeAdminMockScenario | null;
  const scenario = requested && scenarioSet.has(requested) ? requested : "success";
  const repository = useMemo(() => new HomeAdminMockRepository(scenario), [scenario]);
  const profile = repository.getSimulatedProfile();
  const [resources, setResources] = useState<HomeAdminResource[]>([]);
  const [error, setError] = useState<AdminError>();
  const [success, setSuccess] = useState<string>();
  const [selected, setSelected] = useState<HomeAdminResource>();
  const [busy, setBusy] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => { document.title = "Publicação simulada | Gestão da Home — SINDGESTÃO"; }, []);
  useEffect(() => { void repository.getPublishableResources().then((result) => { if (result.ok) { setResources(result.data); setError(undefined); } else setError(result.error); }); }, [repository]);
  const close = () => { setSelected(undefined); triggerRef.current?.focus(); };
  const open = (resource: HomeAdminResource) => { triggerRef.current = document.activeElement as HTMLElement; setSelected(resource); setError(undefined); setSuccess(undefined); };
  const publish = async () => {
    if (!selected || busy) return;
    setBusy(true);
    const result = await repository.publish({ resourceType: selected.resourceType, resourceId: selected.id, expectedRevision: selected.version.revision, approvedHash: selected.review?.submittedHash ?? selected.version.contentHash, approvedVersion: selected.review?.submittedVersion ?? selected.version.editorialVersion, actor: profile });
    setBusy(false);
    if (!result.ok) { setError(result.error); close(); return; }
    setResources((current) => current.map((item) => item.resourceType === result.data.published.resourceType ? result.data.published : item));
    setSuccess(`${RESOURCE_LABELS[result.data.published.resourceType]} publicado no mock. A Home pública real permanece inalterada.`);
    close();
  };
  return <AdminHomeLayout><main id="admin-content" className={styles.stack}>
    <div className={styles.header}><div><span className={styles.eyebrow}>Gestão de conteúdo · F2.2D</span><h1>Publicação simulada</h1><p>Publicação é uma ação independente da aprovação e acontece separadamente para cada tipo de conteúdo.</p></div>
      <label className={styles.scenario}>Visualizar estado<select value={scenario} onChange={(event) => { const next = event.target.value; setParams(next === "success" ? {} : { scenario: next }); }}><>{SCENARIOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</></select></label></div>
    <DemoNotice /><div className={styles.notice}><p><strong>Aprovação não publica.</strong> Esta simulação não altera a Home pública, não invalida cache e não grava dados externos.</p></div>
    <AdminFeedback error={error} success={success} onRetry={error?.kind === "conflict" ? () => setParams({}) : undefined} retryLabel="Recarregar dados" />
    {!error && resources.length === 0 && <section className={styles.empty}><h2>Nenhum conteúdo elegível</h2><p>Não há versões aprovadas disponíveis para publicação neste cenário.</p></section>}
    <div className={styles.grid}>{resources.map((resource) => {
      const actions = buildActionMatrix({ resourceType: resource.resourceType, state: resource.state, reviewDecision: resource.review?.decision ?? null, authorId: resource.version.createdBy, profile, hasChanges: false, approvalValid: approvalValid(resource), currentVersion: resource.version.editorialVersion, approvedVersion: resource.review?.submittedVersion ?? null, currentHash: resource.version.contentHash, approvedHash: resource.review?.submittedHash ?? null });
      const reason = blockedReason(actions.publish);
      return <section className={styles.card} key={resource.resourceType} aria-labelledby={`publish-${resource.resourceType}`}><div><span className={styles.eyebrow}>Publicação independente</span><h2 id={`publish-${resource.resourceType}`}>{RESOURCE_LABELS[resource.resourceType]}</h2></div>
        <dl className={styles.meta}><div><dt>Status</dt><dd><EditorialStatusBadge state={resource.state} /></dd></div><div><dt>Versão editorial</dt><dd>v{resource.version.editorialVersion}</dd></div><div><dt>Versão pública vigente</dt><dd>{resource.version.publicVersion === null ? "Nenhuma" : `v${resource.version.publicVersion}`}</dd></div><div><dt>Hash</dt><dd>{resource.version.contentHash}</dd></div></dl>
        <ResourceSnapshot resource={resource} />{reason && <p className={styles.reason}>{reason}</p>}
        <div className={styles.actions}><button className={styles.primary} disabled={!actions.publish.enabled || busy} onClick={() => open(resource)} type="button"><UploadCloud aria-hidden="true" /> Publicar {RESOURCE_LABELS[resource.resourceType].toLowerCase()}</button>{resource.state === "published" && <span className={styles.current}><CheckCircle2 aria-hidden="true" /> Publicado no mock</span>}</div>
      </section>;
    })}</div>
    <p><ChevronRight aria-hidden="true" /> Nunca existe a ação “publicar tudo”; redes sociais são publicadas como uma única configuração indivisível.</p>
    {selected && <CriticalActionDialog resource={selected} mode="publish" busy={busy} onCancel={close} onConfirm={() => void publish()} />}
  </main></AdminHomeLayout>;
}
