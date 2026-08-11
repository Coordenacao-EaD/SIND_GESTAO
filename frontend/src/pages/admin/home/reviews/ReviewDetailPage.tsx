import { ArrowLeft, ChevronRight, FileQuestion, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ADMIN_ROUTES } from "../../../../config/routes";
import { buildActionMatrix } from "../../../../features/home-admin/domain/editorial-rules";
import type { AdminError } from "../../../../features/home-admin/domain/home-admin.types";
import {
  RESOURCE_TYPE_LABELS,
  REVIEW_DECISION_DESCRIPTIONS,
  describeReviewerIdentity,
  evaluateReviewIntegrity,
  isDecided,
  type ReviewQueueEntry,
} from "../../../../features/home-admin/domain/review-queue.types";
import { describeSimulatedUser } from "../../../../features/home-admin/mocks/home-admin.mock-data";
import { HomeAdminMockRepository } from "../../../../features/home-admin/mocks/home-admin.mock.repository";
import type { SimulatedAdminProfile } from "../../../../features/home-admin/permissions/home-admin.permissions";
import { EditorialStatusBadge } from "../components/EditorialStatusBadge";
import { AdminFeedback, DemoNotice } from "../components/AdminFeedback";
import { AdminHomeLayout } from "../components/AdminHomeLayout";
import { ReviewComparison } from "./ReviewComparison";
import { ReviewDecisionPanel, type DecisionKind } from "./ReviewDecisionPanel";
import { ReviewIdentityCard, ReviewScenarioControl } from "./ReviewIdentity";
import { parseReviewScenario } from "./review-scenarios";
import { ReviewPreview } from "./ReviewPreview";
import { ReviewStatusBadge } from "./ReviewStatusBadge";
import shellStyles from "../HomeManagementPage.module.css";
import styles from "./Reviews.module.css";

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value))
    : "Não registrada";
}

function editorRouteFor(entry: ReviewQueueEntry): string {
  switch (entry.cycle.resourceType) {
    case "footer_contacts": return ADMIN_ROUTES.contacts;
    case "footer_social_links": return ADMIN_ROUTES.social;
    default: return ADMIN_ROUTES.home;
  }
}

export default function ReviewDetailPage() {
  const { reviewId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const scenario = parseReviewScenario(searchParams.get("scenario"));
  const repository = useMemo(() => new HomeAdminMockRepository(scenario), [scenario]);
  const profile = repository.getSimulatedProfile();
  const loadState = repository.getReviewDetailState(reviewId);

  useEffect(() => { document.title = "Detalhe da revisão | Gestão da Home — SINDGESTÃO"; }, []);

  const changeScenario = (next: string) => {
    if (next === "success") setSearchParams({});
    else setSearchParams({ scenario: next });
  };

  const header = (
    <>
      <div className={shellStyles.breadcrumb} aria-label="Você está em">
        <span>Administração</span><ChevronRight aria-hidden="true" />
        <Link to={ADMIN_ROUTES.reviews}>Revisões</Link><ChevronRight aria-hidden="true" />
        <strong>Detalhe</strong>
      </div>
      <div className={shellStyles.managementHeader}>
        <div>
          <span className={shellStyles.eyebrow}>Gestão de conteúdo · F2.2C</span>
          <h1>Detalhe da revisão</h1>
          <p>Compare o conteúdo submetido com a versão pública vigente antes de decidir.</p>
        </div>
        <ReviewScenarioControl scenario={scenario} onChange={changeScenario} />
      </div>
      <DemoNotice />
    </>
  );

  if (loadState.status === "loading") {
    return (
      <AdminHomeLayout>
        <main id="admin-content" className={shellStyles.main}>
          {header}
          <section className={styles.loadingCard} aria-busy="true" aria-live="polite">
            <span className={shellStyles.spinner} aria-hidden="true" />
            <div><h2>Carregando a revisão</h2><p>Preparando os dados administrativos simulados...</p></div>
          </section>
        </main>
      </AdminHomeLayout>
    );
  }

  if (loadState.status === "error") {
    return (
      <AdminHomeLayout>
        <main id="admin-content" className={shellStyles.main}>
          {header}
          <AdminFeedback
            error={loadState.error}
            onRetry={loadState.error.kind === "unavailable" ? () => changeScenario("success") : undefined}
          />
          <p><Link className={styles.secondaryButton} to={ADMIN_ROUTES.reviews}><ArrowLeft aria-hidden="true" /> Voltar para a fila</Link></p>
        </main>
      </AdminHomeLayout>
    );
  }

  if (loadState.status === "empty") {
    return (
      <AdminHomeLayout>
        <main id="admin-content" className={shellStyles.main}>
          {header}
          <div className={styles.contextualState}>
            <FileQuestion aria-hidden="true" />
            <h2>Revisão não encontrada</h2>
            <p>
              Nenhuma revisão com o identificador <strong>{reviewId || "não informado"}</strong> existe na
              demonstração atual. Ela pode ter sido removida do mock ou o endereço pode estar incorreto.
            </p>
            <Link className={styles.primaryButton} to={ADMIN_ROUTES.reviews}>
              <ArrowLeft aria-hidden="true" /> Voltar para a fila de revisões
            </Link>
          </div>
        </main>
      </AdminHomeLayout>
    );
  }

  return (
    <AdminHomeLayout>
      <main id="admin-content" className={shellStyles.main}>
        {header}
        {/* A `key` reinicia decisão, parecer e feedback sempre que o cenário ou a revisão muda. */}
        <ReviewDetailContent
          initialEntry={loadState.data}
          key={`${scenario}:${reviewId}`}
          profile={profile}
          repository={repository}
          reviewId={reviewId}
        />
      </main>
    </AdminHomeLayout>
  );
}

interface ContentProps {
  initialEntry: ReviewQueueEntry;
  profile: SimulatedAdminProfile;
  repository: HomeAdminMockRepository;
  reviewId: string;
}

function ReviewDetailContent({ initialEntry, profile, repository, reviewId }: ContentProps) {
  const [entry, setEntry] = useState<ReviewQueueEntry>(initialEntry);
  const [feedback, setFeedback] = useState<{ error?: AdminError; success?: string }>({});
  const [busy, setBusy] = useState(false);

  const reload = () => {
    const fresh = repository.getReviewDetailState(reviewId);
    if (fresh.status === "ready") setEntry(fresh.data);
    setFeedback({ success: "Dados simulados recarregados. A tela mostra o estado mais recente do mock." });
  };

  const decide = async (decision: DecisionKind, opinion: string): Promise<boolean> => {
    setBusy(true);
    const result = await repository.decideReview({
      cycleId: entry.cycle.cycleId,
      reviewerId: profile.actorId,
      decision,
      opinion: opinion.trim() === "" ? null : opinion.trim(),
      currentHash: entry.currentHash,
      currentVersion: entry.currentVersion,
    });
    setBusy(false);
    if (!result.ok) {
      // Conflito nunca simula sucesso: o estado anterior é preservado até recarregar.
      setFeedback({ error: result.error });
      return false;
    }
    setEntry(result.data);
    setFeedback({
      success: decision === "approved"
        ? "Conteúdo aprovado. A publicação exige uma ação separada."
        : "Ajustes solicitados. O conteúdo voltou para rascunho e a versão pública permanece inalterada.",
    });
    return true;
  };

  const identity = describeReviewerIdentity(entry, profile.actorId);
  const integrity = evaluateReviewIntegrity(entry);
  const decided = isDecided(entry.cycle);
  const actions = buildActionMatrix({
    resourceType: entry.cycle.resourceType,
    state: entry.submitted.state,
    reviewDecision: entry.cycle.decision,
    authorId: entry.authorId,
    submittedById: entry.cycle.submittedBy,
    submittedVersion: entry.cycle.submittedVersion,
    submittedHash: entry.cycle.submittedHash,
    profile,
    hasChanges: false,
    approvalValid: false,
    currentVersion: entry.currentVersion,
    approvedVersion: null,
    currentHash: entry.currentHash,
    approvedHash: null,
  });
  const validationFieldError = feedback.error?.kind === "validation"
    ? feedback.error.fields.opinion?.join(" ")
    : undefined;

  return (
    <div className={styles.stack}>
          <AdminFeedback
            error={feedback.error}
            success={feedback.success}
            onRetry={feedback.error?.kind === "conflict" ? reload : undefined}
            retryLabel="Recarregar dados"
          />

          <section className={styles.card} aria-labelledby="review-submission-title">
            <h2 id="review-submission-title">Dados da submissão</h2>
            <p className={styles.cardIntro}>
              {RESOURCE_TYPE_LABELS[entry.cycle.resourceType]} · {REVIEW_DECISION_DESCRIPTIONS[entry.cycle.decision]}
            </p>
            <dl className={styles.summaryList}>
              <div><dt>Identificador do ciclo</dt><dd>{entry.cycle.cycleId}</dd></div>
              <div><dt>Tipo de conteúdo</dt><dd>{RESOURCE_TYPE_LABELS[entry.cycle.resourceType]}</dd></div>
              <div><dt>Situação da revisão</dt><dd><ReviewStatusBadge decision={entry.cycle.decision} /></dd></div>
              <div><dt>Situação editorial</dt><dd><EditorialStatusBadge state={entry.submitted.state} /></dd></div>
              <div><dt>Versão submetida</dt><dd>v{entry.cycle.submittedVersion}</dd></div>
              <div><dt>Versão pública vigente</dt><dd>{entry.published?.version.publicVersion ? `v${entry.published.version.publicVersion}` : "Nenhuma"}</dd></div>
              <div><dt>Autor do conteúdo</dt><dd>{describeSimulatedUser(entry.authorId)}</dd></div>
              <div><dt>Responsável pelo envio</dt><dd>{describeSimulatedUser(entry.cycle.submittedBy)}</dd></div>
              <div><dt>Enviado em</dt><dd>{formatDate(entry.cycle.submittedAt)}</dd></div>
              <div><dt>Revisor atual</dt><dd>{entry.cycle.reviewerId ? describeSimulatedUser(entry.cycle.reviewerId) : "Nenhum"}</dd></div>
              <div><dt>Decidido em</dt><dd>{formatDate(entry.cycle.decidedAt)}</dd></div>
            </dl>

            {entry.cycle.opinion && (
              <p className={styles.opinionBox}><strong>Parecer do revisor</strong>{entry.cycle.opinion}</p>
            )}
            {entry.cycle.cancellationReason && (
              <p className={styles.opinionBox}><strong>Motivo do cancelamento</strong>{entry.cycle.cancellationReason}</p>
            )}
            {entry.cycle.invalidationReason && (
              <p className={styles.opinionBox}><strong>Motivo da invalidação</strong>{entry.cycle.invalidationReason}</p>
            )}
          </section>

          <ReviewIdentityCard profile={profile} relationLabel={identity.relationLabel} />

          <div className={styles.detailGrid}>
            <ReviewComparison published={entry.published} submitted={entry.submitted} />
            <ReviewPreview submitted={entry.submitted} />
          </div>

          <ReviewDecisionPanel
            actions={actions}
            busy={busy}
            currentUserId={profile.actorId}
            entry={entry}
            serverFieldError={validationFieldError}
            onDecide={decide}
          />

          <section className={styles.card} aria-labelledby="review-integrity-title">
            <h2 id="review-integrity-title">Informações de integridade</h2>
            <p className={styles.cardIntro}>
              Versão e hash são comparados exatamente como registrados no envio; nenhum hash é recalculado.
            </p>
            <dl className={styles.summaryList}>
              <div><dt>Versão submetida</dt><dd>v{entry.cycle.submittedVersion}</dd></div>
              <div><dt>Versão atual do conteúdo</dt><dd>v{entry.currentVersion}</dd></div>
              <div><dt>Hash submetido</dt><dd className={styles.hashValue}>{entry.cycle.submittedHash}</dd></div>
              <div><dt>Hash atual do conteúdo</dt><dd className={styles.hashValue}>{entry.currentHash}</dd></div>
            </dl>
            {integrity.status === "intact" ? (
              <p className={styles.readOnlyNotice}>
                <ShieldCheck aria-hidden="true" />
                <span>Versão e hash conferem: o conteúdo não foi alterado depois do envio.</span>
              </p>
            ) : (
              <p className={styles.readOnlyNotice}>
                <TriangleAlert aria-hidden="true" />
                <span>
                  {integrity.status === "version_mismatch"
                    ? `A versão editorial mudou de v${integrity.submitted} para v${integrity.current} após o envio. Qualquer decisão está bloqueada até um novo ciclo.`
                    : "O conteúdo foi alterado após o envio e o hash não confere. Qualquer decisão está bloqueada até um novo ciclo."}
                </span>
              </p>
            )}
          </section>

          <section className={styles.card} aria-labelledby="review-navigation-title">
            <h2 id="review-navigation-title">Próximos passos</h2>
            <p className={styles.cardIntro}>
              {decided
                ? "Esta revisão é somente leitura. Para um novo ciclo, edite o conteúdo e envie-o novamente."
                : "Para cancelar este envio, use o editor do conteúdo — a regra de cancelamento pertence a quem submeteu."}
            </p>
            <div className={styles.queueActions}>
              <Link className={styles.secondaryButton} to={ADMIN_ROUTES.reviews}>
                <ArrowLeft aria-hidden="true" /> Voltar para a fila
              </Link>
              <Link className={styles.secondaryButton} to={editorRouteFor(entry)}>
                Abrir o editor de {RESOURCE_TYPE_LABELS[entry.cycle.resourceType].toLowerCase()}
              </Link>
            </div>
          </section>
    </div>
  );
}
