import { CheckCircle2, Info, Lock, PenLine, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ActionAvailability, ActionMatrix } from "../../../../features/home-admin/domain/editorial-rules";
import {
  SEGREGATION_GENERIC_MESSAGE,
  describeReviewerIdentity,
  isDecided,
  segregationBlockMessage,
  type ReviewQueueEntry,
} from "../../../../features/home-admin/domain/review-queue.types";
import { HOME_ADMIN_CAPABILITIES } from "../../../../features/home-admin/permissions/home-admin.permissions";
import { ReviewDecisionDialog, type DecisionDialogConfig } from "./ReviewDecisionDialog";
import styles from "./Reviews.module.css";

export type DecisionKind = "approved" | "changes_requested";

const DIALOGS: Record<DecisionKind, DecisionDialogConfig> = {
  approved: {
    title: "Confirmar aprovação",
    description: "A aprovação é simulada e não publica o conteúdo. A publicação exige uma ação separada.",
    confirmLabel: "Aprovar revisão",
    justificationRequired: false,
    justificationLabel: "Parecer de aprovação (opcional)",
    maxLength: 1000,
  },
  changes_requested: {
    title: "Solicitar ajustes",
    description: "O conteúdo volta para rascunho e o parecer fica visível ao editor responsável.",
    confirmLabel: "Solicitar ajustes",
    justificationRequired: true,
    justificationLabel: "Justificativa dos ajustes",
    maxLength: 1000,
  },
};

/** Traduz o motivo vindo da matriz da F2.1 em texto acessível, sem reimplementar a regra. */
function blockMessages(entry: ReviewQueueEntry, availability: ActionAvailability, currentUserId: string): string[] {
  if (!availability.blocked) return [];
  const identity = describeReviewerIdentity(entry, currentUserId);
  switch (availability.reason) {
    case "missing_capability":
      return [`Seu perfil simulado não possui a capability ${HOME_ADMIN_CAPABILITIES.decideReview}.`];
    case "review_not_pending":
      return ["Esta revisão já possui uma decisão registrada e é somente leitura."];
    case "own_content":
      return [segregationBlockMessage(identity) ?? SEGREGATION_GENERIC_MESSAGE, SEGREGATION_GENERIC_MESSAGE];
    case "own_submission":
      return ["Você enviou este conteúdo para revisão.", SEGREGATION_GENERIC_MESSAGE];
    case "version_mismatch":
      return [`A versão editorial mudou após o envio: submetida v${entry.cycle.submittedVersion}, atual v${entry.currentVersion}.`];
    case "hash_mismatch":
      return ["O conteúdo foi alterado após o envio e o hash submetido não confere com o atual."];
    default:
      return ["Esta decisão não está disponível para o cenário atual."];
  }
}

interface Props {
  entry: ReviewQueueEntry;
  actions: ActionMatrix;
  currentUserId: string;
  busy: boolean;
  serverFieldError?: string;
  /** Resolve `true` quando a decisão foi registrada; só então o diálogo fecha. */
  onDecide: (decision: DecisionKind, opinion: string) => Promise<boolean>;
}

export function ReviewDecisionPanel({ entry, actions, currentUserId, busy, serverFieldError, onDecide }: Props) {
  const [openDialog, setOpenDialog] = useState<DecisionKind | null>(null);
  const [draftOpinion, setDraftOpinion] = useState("");
  const triggerRefs = {
    approved: useRef<HTMLButtonElement>(null),
    changes_requested: useRef<HTMLButtonElement>(null),
  };

  const closeDialog = () => {
    const kind = openDialog;
    setOpenDialog(null);
    if (kind) triggerRefs[kind].current?.focus();
  };

  const approveBlocks = blockMessages(entry, actions.approve, currentUserId);
  const changesBlocks = blockMessages(entry, actions.request_changes, currentUserId);
  const allBlocks = [...new Set([...approveBlocks, ...changesBlocks])];
  const decided = isDecided(entry.cycle);

  /**
   * A abertura do diálogo deriva do estado real do ciclo: assim que a decisão é registrada ele fecha e
   * devolve o foco. Um conflito ou erro mantém o ciclo pendente e o diálogo aberto, preservando o
   * parecer digitado.
   */
  useEffect(() => {
    if (!decided || !openDialog) return;
    const kind = openDialog;
    setOpenDialog(null);
    triggerRefs[kind].current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decided, openDialog]);

  return (
    <section className={styles.card} aria-labelledby="review-decision-title">
      <h2 id="review-decision-title">Decisão</h2>
      <div className={styles.decisionPanel}>
        <p className={styles.noPublishNotice}>
          <Info aria-hidden="true" />
          <span>Aprovar ou solicitar ajustes nunca publica o conteúdo. A publicação exige uma ação separada, fora do escopo desta etapa.</span>
        </p>

        {decided && (
          <p className={styles.readOnlyNotice}>
            <Lock aria-hidden="true" />
            <span>Esta revisão já foi decidida e está em modo somente leitura. Nenhuma nova decisão pode ser registrada para o mesmo ciclo.</span>
          </p>
        )}

        {allBlocks.length > 0 && (
          <ul className={styles.blockList} aria-label="Motivos que bloqueiam a decisão">
            {allBlocks.map((message) => (
              <li key={message}><ShieldAlert aria-hidden="true" /><span>{message}</span></li>
            ))}
          </ul>
        )}

        <div className={styles.decisionActions}>
          <button
            className={styles.primaryButton}
            disabled={busy || !actions.approve.enabled}
            onClick={() => { setDraftOpinion(""); setOpenDialog("approved"); }}
            ref={triggerRefs.approved}
            type="button"
          >
            <CheckCircle2 aria-hidden="true" /> Aprovar
          </button>
          <button
            className={styles.secondaryButton}
            disabled={busy || !actions.request_changes.enabled}
            onClick={() => { setDraftOpinion(""); setOpenDialog("changes_requested"); }}
            ref={triggerRefs.changes_requested}
            type="button"
          >
            <PenLine aria-hidden="true" /> Solicitar ajustes
          </button>
        </div>
      </div>

      {openDialog && (
        <ReviewDecisionDialog
          busy={busy}
          config={DIALOGS[openDialog]}
          initialValue={draftOpinion}
          serverError={serverFieldError}
          onClose={closeDialog}
          onConfirm={(value) => { void onDecide(openDialog, value); }}
          onValueChange={setDraftOpinion}
        />
      )}
    </section>
  );
}
