import { Save, Send, Undo2 } from "lucide-react";
import type { ActionMatrix } from "../../../../features/home-admin/domain/editorial-rules";
import styles from "../AdminEditor.module.css";

interface Props {
  actions: ActionMatrix;
  busy: boolean;
  dirty: boolean;
  cancellationReason: string;
  cancellationError?: string;
  onCancellationReasonChange: (value: string) => void;
  onSave: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function EditorialWorkflowActions(props: Props) {
  const { actions, busy, dirty, cancellationReason, cancellationError, onCancellationReasonChange, onSave, onSubmit, onCancel } = props;
  return (
    <div className={styles.workflow}>
      <div className={dirty ? styles.unsaved : styles.saved} role="status">
        <strong>{dirty ? "Alterações não salvas" : "Sem alterações pendentes"}</strong>
        <span>{dirty ? "Recarregar ou navegar pode descartar esta edição." : "As alterações persistem apenas até recarregar a demonstração."}</span>
      </div>
      {actions.cancel_review.visible ? (
        <div className={styles.cancelBox}>
          <label htmlFor="cancellation-reason">Motivo do cancelamento</label>
          <textarea id="cancellation-reason" aria-describedby={cancellationError ? "cancellation-error" : "cancellation-hint"} aria-invalid={Boolean(cancellationError)} maxLength={500} rows={3} value={cancellationReason} onChange={(event) => onCancellationReasonChange(event.target.value)} />
          {cancellationError ? <small className={styles.error} id="cancellation-error">{cancellationError}</small> : <small id="cancellation-hint">Entre 10 e 500 caracteres.</small>}
          <button className={styles.secondaryButton} disabled={busy || !actions.cancel_review.enabled} onClick={onCancel} type="button"><Undo2 aria-hidden="true" /> Cancelar envio</button>
        </div>
      ) : (
        <div className={styles.actionRow}>
          <button className={styles.secondaryButton} disabled={busy || !actions.save_draft.enabled} onClick={onSave} type="button"><Save aria-hidden="true" /> {busy ? "Salvando..." : "Salvar rascunho"}</button>
          <button className={styles.primaryButton} disabled={busy || !actions.submit_review.enabled} onClick={onSubmit} type="button"><Send aria-hidden="true" /> Enviar para revisão</button>
        </div>
      )}
    </div>
  );
}
