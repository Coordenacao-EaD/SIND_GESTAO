import type {
  AdminResourceType,
  ContentHash,
  EditorialVersionNumber,
  HomeAdminResource,
  ReviewCycle,
  ReviewDecision,
} from "./home-admin.types";

/**
 * Junção de leitura entre um ciclo de revisão da F2.1, o conteúdo submetido e a versão pública
 * vigente. Não substitui nem duplica os contratos da F2.1: apenas os agrega para a fila e o detalhe.
 */
export interface ReviewQueueEntry {
  cycle: ReviewCycle;
  submitted: HomeAdminResource;
  published: HomeAdminResource | null;
  authorId: string;
  currentVersion: EditorialVersionNumber;
  currentHash: ContentHash;
}

export const REVIEW_DECISION_LABELS: Record<ReviewDecision, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  changes_requested: "Ajustes solicitados",
  cancelled: "Cancelada",
  invalidated: "Invalidada",
};

export const REVIEW_DECISION_DESCRIPTIONS: Record<ReviewDecision, string> = {
  pending: "Aguardando decisão de um revisor independente.",
  approved: "Aprovada em demonstração. A publicação exige uma ação separada.",
  changes_requested: "O revisor pediu ajustes e o conteúdo voltou para rascunho.",
  cancelled: "O envio foi cancelado por quem submeteu o conteúdo.",
  invalidated: "O ciclo perdeu validade porque o conteúdo mudou após o envio.",
};

export const RESOURCE_TYPE_LABELS: Record<AdminResourceType, string> = {
  banner: "Banner",
  footer_contacts: "Contatos",
  footer_social_links: "Redes sociais",
};

/** Uma revisão já decidida é somente leitura. */
export function isDecided(cycle: ReviewCycle): boolean {
  return cycle.decision !== "pending";
}

export interface ReviewerIdentity {
  isAuthor: boolean;
  isSubmitter: boolean;
  isCurrentReviewer: boolean;
  relationLabel: string;
}

/**
 * Segregação de funções por identificador estável, nunca pelo nome exibido.
 */
export function describeReviewerIdentity(entry: ReviewQueueEntry, currentUserId: string): ReviewerIdentity {
  const isAuthor = entry.authorId === currentUserId;
  const isSubmitter = entry.cycle.submittedBy === currentUserId;
  const isCurrentReviewer = entry.cycle.reviewerId === currentUserId;
  const relationLabel = isAuthor && isSubmitter
    ? "Autor e responsável pelo envio"
    : isAuthor
      ? "Autor do conteúdo"
      : isSubmitter
        ? "Responsável pelo envio"
        : isCurrentReviewer
          ? "Revisor que decidiu"
          : "Revisor independente";
  return { isAuthor, isSubmitter, isCurrentReviewer, relationLabel };
}

/** Motivo textual do bloqueio por segregação, na ordem de precedência definida na F2.2C. */
export function segregationBlockMessage(identity: ReviewerIdentity): string | null {
  if (identity.isAuthor) return "Você é o autor deste conteúdo.";
  if (identity.isSubmitter) return "Você enviou este conteúdo para revisão.";
  return null;
}

export const SEGREGATION_GENERIC_MESSAGE = "A segregação de funções impede esta decisão.";

export type ReviewIntegrity =
  | { status: "intact" }
  | { status: "version_mismatch"; submitted: EditorialVersionNumber; current: EditorialVersionNumber }
  | { status: "hash_mismatch"; submitted: ContentHash; current: ContentHash };

/**
 * Compara versão e hash submetidos com o estado atual do conteúdo. Não recalcula hash: usa os valores
 * já produzidos pelo contrato da F2.1.
 */
export function evaluateReviewIntegrity(entry: ReviewQueueEntry): ReviewIntegrity {
  if (entry.cycle.submittedVersion !== entry.currentVersion) {
    return { status: "version_mismatch", submitted: entry.cycle.submittedVersion, current: entry.currentVersion };
  }
  if (entry.cycle.submittedHash !== entry.currentHash) {
    return { status: "hash_mismatch", submitted: entry.cycle.submittedHash, current: entry.currentHash };
  }
  return { status: "intact" };
}

export function shortHash(value: ContentHash): string {
  const tail = value.split(":").pop() ?? value;
  return tail.length > 10 ? `${tail.slice(0, 10)}…` : tail;
}

export const REVIEW_OPINION_MIN_LENGTH = 10;
export const REVIEW_OPINION_MAX_LENGTH = 1000;

/**
 * Parecer de revisão: obrigatório para solicitar ajustes, opcional na aprovação. Apenas texto simples;
 * espaços em branco não contam como conteúdo.
 */
export function validateReviewOpinion(value: string, required: boolean): string | null {
  const length = value.trim().length;
  if (length === 0) {
    return required ? `Informe uma justificativa entre ${REVIEW_OPINION_MIN_LENGTH} e ${REVIEW_OPINION_MAX_LENGTH} caracteres.` : null;
  }
  if (length < REVIEW_OPINION_MIN_LENGTH) {
    return `Informe uma justificativa entre ${REVIEW_OPINION_MIN_LENGTH} e ${REVIEW_OPINION_MAX_LENGTH} caracteres.`;
  }
  if (length > REVIEW_OPINION_MAX_LENGTH) return `Use no máximo ${REVIEW_OPINION_MAX_LENGTH} caracteres.`;
  return null;
}

export interface ReviewQueueFilters {
  decision: ReviewDecision | "all";
  resourceType: AdminResourceType | "all";
  submittedBy: string | "all";
  onlyDecidable: boolean;
}

export const DEFAULT_REVIEW_FILTERS: ReviewQueueFilters = {
  decision: "pending",
  resourceType: "all",
  submittedBy: "all",
  onlyDecidable: false,
};

export function filterReviewQueue(
  entries: readonly ReviewQueueEntry[],
  filters: ReviewQueueFilters,
  currentUserId: string,
): ReviewQueueEntry[] {
  return entries.filter((entry) => {
    if (filters.decision !== "all" && entry.cycle.decision !== filters.decision) return false;
    if (filters.resourceType !== "all" && entry.cycle.resourceType !== filters.resourceType) return false;
    if (filters.submittedBy !== "all" && entry.cycle.submittedBy !== filters.submittedBy) return false;
    if (filters.onlyDecidable) {
      const identity = describeReviewerIdentity(entry, currentUserId);
      if (entry.cycle.decision !== "pending" || identity.isAuthor || identity.isSubmitter) return false;
    }
    return true;
  });
}
