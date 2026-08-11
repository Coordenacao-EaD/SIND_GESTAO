import { AlertCircle, ChevronRight, ClipboardCheck, Contact, Image as ImageIcon, Inbox, Share2, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ADMIN_ROUTES, adminReviewDetailPath } from "../../../../config/routes";
import type { AdminResourceType } from "../../../../features/home-admin/domain/home-admin.types";
import {
  DEFAULT_REVIEW_FILTERS,
  RESOURCE_TYPE_LABELS,
  describeReviewerIdentity,
  evaluateReviewIntegrity,
  filterReviewQueue,
  shortHash,
  type ReviewQueueEntry,
  type ReviewQueueFilters,
} from "../../../../features/home-admin/domain/review-queue.types";
import { describeSimulatedUser } from "../../../../features/home-admin/mocks/home-admin.mock-data";
import { HomeAdminMockRepository } from "../../../../features/home-admin/mocks/home-admin.mock.repository";
import { AdminFeedback, DemoNotice } from "../components/AdminFeedback";
import { AdminHomeLayout } from "../components/AdminHomeLayout";
import { ReviewFilters } from "./ReviewFilters";
import { ReviewIdentityCard, ReviewScenarioControl } from "./ReviewIdentity";
import { parseReviewScenario } from "./review-scenarios";
import { ReviewStatusBadge } from "./ReviewStatusBadge";
import shellStyles from "../HomeManagementPage.module.css";
import styles from "./Reviews.module.css";

const TYPE_ICONS: Record<AdminResourceType, typeof ImageIcon> = {
  banner: ImageIcon,
  footer_contacts: Contact,
  footer_social_links: Share2,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value));
}

function summarize(entry: ReviewQueueEntry): string {
  const resource = entry.submitted;
  if (resource.resourceType === "banner") return resource.title;
  if (resource.resourceType === "footer_contacts") return resource.email;
  return `${resource.links.length} links · ${resource.links.filter((link) => link.active).length} ativos`;
}

function QueueItem({ entry, currentUserId }: { entry: ReviewQueueEntry; currentUserId: string }) {
  const Icon = TYPE_ICONS[entry.cycle.resourceType];
  const integrity = evaluateReviewIntegrity(entry);
  const identity = describeReviewerIdentity(entry, currentUserId);
  return (
    <li className={styles.queueItem}>
      <div className={styles.queueHeader}>
        <span className={styles.typeTag}><Icon aria-hidden="true" /> {RESOURCE_TYPE_LABELS[entry.cycle.resourceType]}</span>
        <h3>{summarize(entry)}</h3>
        <ReviewStatusBadge decision={entry.cycle.decision} />
        {integrity.status !== "intact" && (
          <span className={styles.conflictTag}>
            <TriangleAlert aria-hidden="true" />
            {integrity.status === "version_mismatch" ? "Versão divergente" : "Hash divergente"}
          </span>
        )}
      </div>
      <dl className={styles.queueMeta}>
        <div><dt>Identificador</dt><dd>{entry.cycle.cycleId}</dd></div>
        <div><dt>Versão editorial</dt><dd>v{entry.cycle.submittedVersion}</dd></div>
        <div><dt>Versão pública vigente</dt><dd>{entry.published?.version.publicVersion ? `v${entry.published.version.publicVersion}` : "Nenhuma"}</dd></div>
        <div><dt>Autor do conteúdo</dt><dd>{describeSimulatedUser(entry.authorId)}</dd></div>
        <div><dt>Responsável pelo envio</dt><dd>{describeSimulatedUser(entry.cycle.submittedBy)}</dd></div>
        <div><dt>Enviado em</dt><dd>{formatDate(entry.cycle.submittedAt)}</dd></div>
        <div><dt>Hash submetido</dt><dd className={styles.hashValue}>{shortHash(entry.cycle.submittedHash)}</dd></div>
        <div><dt>Sua relação</dt><dd>{identity.relationLabel}</dd></div>
      </dl>
      <div className={styles.queueActions}>
        <Link className={styles.primaryButton} to={adminReviewDetailPath(entry.cycle.cycleId)}>
          Analisar revisão<span className="visually-hidden"> {entry.cycle.cycleId}</span>
        </Link>
      </div>
    </li>
  );
}

export default function ReviewsQueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const scenario = parseReviewScenario(searchParams.get("scenario"));
  const repository = useMemo(() => new HomeAdminMockRepository(scenario), [scenario]);
  const profile = repository.getSimulatedProfile();
  const queueState = repository.getReviewQueueState();
  const [filters, setFilters] = useState<ReviewQueueFilters>(DEFAULT_REVIEW_FILTERS);

  useEffect(() => { document.title = "Revisões | Gestão da Home — SINDGESTÃO"; }, []);

  const entries = queueState.status === "ready" ? queueState.data : [];
  const visible = filterReviewQueue(entries, filters, profile.actorId);
  const submitters = [...new Set(entries.map((entry) => entry.cycle.submittedBy))];
  const pendingCount = entries.filter((entry) => entry.cycle.decision === "pending").length;

  const changeScenario = (next: string) => {
    if (next === "success") setSearchParams({});
    else setSearchParams({ scenario: next });
    setFilters(DEFAULT_REVIEW_FILTERS);
  };

  return (
    <AdminHomeLayout>
      <main id="admin-content" className={shellStyles.main}>
        <div className={shellStyles.breadcrumb} aria-label="Você está em">
          <span>Administração</span><ChevronRight aria-hidden="true" />
          <span>Página Inicial</span><ChevronRight aria-hidden="true" />
          <strong>Revisões</strong>
        </div>

        <div className={shellStyles.managementHeader}>
          <div>
            <span className={shellStyles.eyebrow}>Gestão de conteúdo · F2.2C</span>
            <h1>Revisões da Página Inicial</h1>
            <p>Analise submissões de banner, contatos e redes sociais antes de qualquer publicação.</p>
          </div>
          <ReviewScenarioControl scenario={scenario} onChange={changeScenario} />
        </div>

        <DemoNotice />

        <div className={shellStyles.summaryGrid} aria-label="Resumo da fila">
          <div><ClipboardCheck aria-hidden="true" /><span><strong>{pendingCount}</strong> {pendingCount === 1 ? "revisão pendente" : "revisões pendentes"}</span></div>
          <div><Inbox aria-hidden="true" /><span><strong>{entries.length}</strong> no cenário atual</span></div>
          <div><ImageIcon aria-hidden="true" /><span><strong>3</strong> tipos de conteúdo</span></div>
        </div>

        <div className={styles.stack}>
          <ReviewIdentityCard profile={profile} relationLabel="Depende da revisão analisada" />

          {queueState.status === "loading" && (
            <section className={styles.loadingCard} aria-busy="true" aria-live="polite">
              <span className={shellStyles.spinner} aria-hidden="true" />
              <div><h2>Carregando revisões</h2><p>Preparando a fila administrativa simulada...</p></div>
            </section>
          )}

          {queueState.status === "error" && (
            <AdminFeedback
              error={queueState.error}
              onRetry={queueState.error.kind === "unavailable" ? () => changeScenario("success") : undefined}
            />
          )}

          {queueState.status === "empty" && (
            <div className={styles.contextualState}>
              <Inbox aria-hidden="true" />
              <h2>Nenhuma revisão neste cenário</h2>
              <p>Nenhum conteúdo da Página Inicial foi enviado para revisão na demonstração atual.</p>
              <Link className={styles.secondaryButton} to={ADMIN_ROUTES.home}>Voltar ao painel</Link>
            </div>
          )}

          {queueState.status === "ready" && (
            <>
              <ReviewFilters
                filters={filters}
                submitters={submitters}
                onChange={setFilters}
                onClear={() => setFilters({ ...DEFAULT_REVIEW_FILTERS, decision: "all" })}
              />

              <section aria-labelledby="review-queue-title">
                <h2 id="review-queue-title">Submissões</h2>
                <p className={styles.filterSummary} role="status">
                  {visible.length === 0
                    ? "Nenhuma revisão corresponde aos filtros aplicados."
                    : `${visible.length} de ${entries.length} ${entries.length === 1 ? "revisão" : "revisões"} em exibição.`}
                </p>

                {visible.length === 0 ? (
                  <div className={styles.contextualState}>
                    <AlertCircle aria-hidden="true" />
                    <h3>Nenhum resultado para os filtros atuais</h3>
                    <p>Ajuste a situação, o tipo de conteúdo ou o responsável pelo envio para ver outras submissões.</p>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => setFilters({ ...DEFAULT_REVIEW_FILTERS, decision: "all" })}
                      type="button"
                    >
                      Limpar filtros
                    </button>
                  </div>
                ) : (
                  <ul className={styles.queueList}>
                    {visible.map((entry) => (
                      <QueueItem currentUserId={profile.actorId} entry={entry} key={entry.cycle.cycleId} />
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </AdminHomeLayout>
  );
}
