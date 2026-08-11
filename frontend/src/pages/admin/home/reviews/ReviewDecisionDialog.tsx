import { useEffect, useId, useRef, useState } from "react";
import { validateReviewOpinion } from "../../../../features/home-admin/domain/review-queue.types";
import styles from "./Reviews.module.css";

export interface DecisionDialogConfig {
  title: string;
  description: string;
  confirmLabel: string;
  /** Aprovação aceita parecer opcional; solicitação de ajustes exige justificativa. */
  justificationRequired: boolean;
  justificationLabel: string;
  maxLength: number;
}

interface Props {
  config: DecisionDialogConfig;
  busy: boolean;
  serverError?: string;
  initialValue: string;
  onValueChange: (value: string) => void;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

/**
 * Diálogo modal acessível: recebe foco ao abrir, fecha com Escape e devolve o foco ao disparador.
 */
export function ReviewDecisionDialog({ config, busy, serverError, initialValue, onValueChange, onConfirm, onClose }: Props) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fieldId = useId();
  const messageId = `${fieldId}-message`;

  useEffect(() => { textareaRef.current?.focus(); }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button, textarea");
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const submit = () => {
    const validationError = validateReviewOpinion(value, config.justificationRequired);
    setError(validationError);
    if (validationError) {
      textareaRef.current?.focus();
      return;
    }
    onConfirm(value.trim());
  };

  const visibleError = error ?? serverError ?? null;

  return (
    <div className={styles.dialogBackdrop}>
      <div
        aria-labelledby={`${fieldId}-title`}
        aria-modal="true"
        className={styles.dialog}
        ref={dialogRef}
        role="dialog"
      >
        <h2 id={`${fieldId}-title`}>{config.title}</h2>
        <p>{config.description}</p>
        <div className={styles.dialogField}>
          <label htmlFor={fieldId}>{config.justificationLabel}</label>
          <textarea
            aria-describedby={messageId}
            aria-invalid={Boolean(visibleError)}
            id={fieldId}
            maxLength={config.maxLength}
            ref={textareaRef}
            value={value}
            onChange={(event) => { setValue(event.target.value); setError(null); onValueChange(event.target.value); }}
          />
          <small className={visibleError ? styles.error : ""} id={messageId}>
            {visibleError ?? `${value.trim().length} de ${config.maxLength} caracteres. ${config.justificationRequired ? "Entre 10 e 1000 caracteres." : "Opcional; se preenchido, use ao menos 10 caracteres."}`}
          </small>
        </div>
        <div className={styles.dialogActions}>
          <button className={styles.secondaryButton} disabled={busy} onClick={onClose} type="button">Cancelar</button>
          <button className={styles.primaryButton} disabled={busy} onClick={submit} type="button">
            {busy ? "Registrando..." : config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
