import { AlertCircle, ChevronRight, Clock3, FilePenLine, Image as ImageIcon, Layers3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { buildActionMatrix } from "../../../features/home-admin/domain/editorial-rules";
import type { AdminBanner, AdminError } from "../../../features/home-admin/domain/home-admin.types";
import { adminBannerMock } from "../../../features/home-admin/mocks/home-admin.mock-data";
import { HomeAdminMockRepository, type HomeAdminMockScenario } from "../../../features/home-admin/mocks/home-admin.mock.repository";
import { HOME_ADMIN_CAPABILITIES, type SimulatedAdminProfile } from "../../../features/home-admin/permissions/home-admin.permissions";
import { parseAdminBanner } from "../../../features/home-admin/schemas/home-admin.validators";
import { BannerForm } from "./banner/BannerForm";
import { BannerPreview } from "./banner/BannerPreview";
import { AdminFeedback, DemoNotice } from "./components/AdminFeedback";
import { AdminHomeLayout } from "./components/AdminHomeLayout";
import { EditorialStatusBadge } from "./components/EditorialStatusBadge";
import styles from "./HomeManagementPage.module.css";

const SCENARIOS: ReadonlyArray<{ value: HomeAdminMockScenario; label: string }> = [
  { value: "success", label: "Conteúdo disponível" },
  { value: "loading", label: "Carregando" },
  { value: "empty", label: "Sem conteúdo" },
  { value: "unauthenticated", label: "Erro 401" },
  { value: "forbidden", label: "Erro 403" },
  { value: "conflict", label: "Erro 409" },
  { value: "validation", label: "Erro 422" },
  { value: "unavailable", label: "Indisponível" },
];

const scenarioValues = new Set(SCENARIOS.map((scenario) => scenario.value));
const editorProfile: SimulatedAdminProfile = {
  actorId: "actor-editor-1",
  displayName: "Editor de demonstração",
  capabilities: [HOME_ADMIN_CAPABILITIES.editBanner, HOME_ADMIN_CAPABILITIES.viewHistory],
};

function cloneBanner() {
  return structuredClone(adminBannerMock);
}

function toValidationError(issues: Array<{ path: string; message: string }>): Extract<AdminError, { kind: "validation" }> {
  const fields: Record<string, string[]> = {};
  issues.forEach((issue) => {
    const field = issue.path.replace(/^banner\./, "");
    fields[field] = [...(fields[field] ?? []), issue.message];
  });
  return { kind: "validation", status: 422, message: "Há campos que precisam de atenção.", fields };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value));
}

function ScenarioControl({ scenario, onChange }: { scenario: HomeAdminMockScenario; onChange: (scenario: HomeAdminMockScenario) => void }) {
  return (
    <label className={styles.scenarioControl}>
      <span>Visualizar estado</span>
      <select value={scenario} onChange={(event) => onChange(event.target.value as HomeAdminMockScenario)}>
        {SCENARIOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>
  );
}

function BannerManagement({ repository }: { repository: HomeAdminMockRepository }) {
  const [banner, setBanner] = useState<AdminBanner>(cloneBanner);
  const [baseline, setBaseline] = useState<AdminBanner>(cloneBanner);
  const [feedback, setFeedback] = useState<{ error?: AdminError; success?: string }>({});
  const [busy, setBusy] = useState(false);
  const hasChanges = JSON.stringify(banner) !== JSON.stringify(baseline);
  const actions = buildActionMatrix({
    resourceType: "banner",
    state: banner.state,
    reviewDecision: banner.review?.decision ?? null,
    authorId: banner.version.createdBy,
    profile: editorProfile,
    hasChanges,
    approvalValid: false,
    currentVersion: banner.version.editorialVersion,
    approvedVersion: null,
    currentHash: banner.version.contentHash,
    approvedHash: null,
  });

  const validate = () => {
    const result = parseAdminBanner(banner);
    if (result.success) return result.data;
    setFeedback({ error: toValidationError(result.issues) });
    return null;
  };

  const saveDraft = async () => {
    const validated = validate();
    if (!validated) return;
    setBusy(true);
    const result = await repository.saveDraft({ resource: validated, expectedRevision: baseline.version.revision });
    setBusy(false);
    if (!result.ok) return setFeedback({ error: result.error });
    if (result.data.resourceType !== "banner") return;
    setBanner(result.data);
    setBaseline(result.data);
    setFeedback({ success: "Rascunho salvo somente na memória desta demonstração." });
  };

  const submitReview = async () => {
    const validated = validate();
    if (!validated) return;
    setBusy(true);
    const result = await repository.submitReview({
      resourceType: validated.resourceType,
      resourceId: validated.id,
      version: validated.version.editorialVersion,
      contentHash: validated.version.contentHash,
      submittedBy: editorProfile.actorId,
    });
    setBusy(false);
    if (!result.ok) return setFeedback({ error: result.error });
    const reviewed: AdminBanner = {
      ...validated,
      previousState: validated.state,
      state: "review",
      review: result.data,
      version: { ...validated.version, submittedAt: result.data.submittedAt },
    };
    setBanner(reviewed);
    setBaseline(reviewed);
    setFeedback({ success: "Banner enviado para uma revisão simulada. Nenhuma fila real foi acionada." });
  };

  return (
    <>
      <section className={styles.statusCard} aria-labelledby="banner-status-title">
        <div className={styles.statusIcon}><ImageIcon aria-hidden="true" /></div>
        <div className={styles.statusIdentity}>
          <span>Conteúdo gerenciável</span>
          <h2 id="banner-status-title">Banner principal</h2>
          <p>Área de destaque exibida no topo da Página Inicial.</p>
        </div>
        <div className={styles.statusMeta}>
          <div><span>Situação</span><EditorialStatusBadge state={banner.state} /></div>
          <div><span>Versão editorial</span><strong>v{banner.version.editorialVersion}</strong></div>
          <div><span>Revisão</span><strong>r{banner.version.revision}</strong></div>
          <div><span>Última atualização</span><strong>{formatDate(banner.version.updatedAt)}</strong></div>
        </div>
      </section>

      <AdminFeedback error={feedback.error} success={feedback.success} />

      <section className={styles.editorGrid} id="banner-editor" aria-label="Edição e prévia do banner">
        <BannerForm banner={banner} actions={actions} busy={busy} onChange={(next) => { setBanner(next); setFeedback({}); }} onSave={saveDraft} onSubmitReview={submitReview} validationError={feedback.error?.kind === "validation" ? feedback.error : undefined} />
        <BannerPreview banner={banner} />
      </section>
    </>
  );
}

export default function HomeManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedScenario = searchParams.get("scenario") ?? "success";
  const scenario = scenarioValues.has(requestedScenario as HomeAdminMockScenario) ? requestedScenario as HomeAdminMockScenario : "success";
  const repository = useMemo(() => new HomeAdminMockRepository(scenario), [scenario]);
  const loadState = repository.getResourceListState();

  useEffect(() => { document.title = "Gestão da Home | SINDGESTÃO"; }, []);

  const changeScenario = (next: HomeAdminMockScenario) => {
    if (next === "success") setSearchParams({});
    else setSearchParams({ scenario: next });
  };

  return (
    <AdminHomeLayout>
      <main id="admin-content" className={styles.main}>
        <div className={styles.breadcrumb} aria-label="Você está em"><span>Administração</span><ChevronRight aria-hidden="true" /><strong>Página Inicial</strong></div>
        <div className={styles.managementHeader} id="overview">
          <div><span className={styles.eyebrow}>Gestão de conteúdo</span><h1>Página Inicial</h1><p>Edite e acompanhe o banner principal em um fluxo editorial demonstrativo.</p></div>
          <ScenarioControl scenario={scenario} onChange={changeScenario} />
        </div>
        <DemoNotice />

        <div className={styles.summaryGrid} aria-label="Resumo da gestão">
          <div><FilePenLine aria-hidden="true" /><span><strong>1</strong> conteúdo editável</span></div>
          <div><Clock3 aria-hidden="true" /><span><strong>{scenario === "success" ? "Rascunho" : "—"}</strong> situação atual</span></div>
          <div><Layers3 aria-hidden="true" /><span><strong>F2.2A</strong> recorte ativo</span></div>
        </div>

        {loadState.status === "loading" && (
          <section className={styles.loadingCard} aria-busy="true" aria-live="polite"><span className={styles.spinner} aria-hidden="true" /><div><h2>Carregando gestão da Home</h2><p>Preparando os dados administrativos simulados...</p></div></section>
        )}
        {loadState.status === "empty" && (
          <section className={styles.emptyCard}><AlertCircle aria-hidden="true" /><h2>Nenhum banner configurado</h2><p>O estado vazio é somente uma representação visual. A criação de novos recursos não faz parte desta etapa.</p><button className={styles.secondaryButton} onClick={() => changeScenario("success")} type="button">Voltar à demonstração</button></section>
        )}
        {loadState.status === "error" && <AdminFeedback error={loadState.error} onRetry={() => changeScenario("success")} />}
        {loadState.status === "ready" && <BannerManagement key={scenario} repository={repository} />}
      </main>
    </AdminHomeLayout>
  );
}
