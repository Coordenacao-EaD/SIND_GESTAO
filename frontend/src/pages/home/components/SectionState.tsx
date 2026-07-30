import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import styles from "./SectionState.module.css";

interface SectionLoadingProps {
  label: string;
}

export function SectionLoading({ label }: SectionLoadingProps) {
  return (
    <div className={styles.state} role="status" aria-live="polite">
      <Loader2 aria-hidden="true" size={32} className={styles.loadingIcon} />
      <p className={styles.title}>{label}</p>
    </div>
  );
}

interface SectionEmptyProps {
  title: string;
  description: string;
}

export function SectionEmpty({ title, description }: SectionEmptyProps) {
  return (
    <div className={styles.state} role="status">
      <Inbox aria-hidden="true" size={32} className={styles.icon} />
      <p className={styles.title}>{title}</p>
      <p className={styles.description}>{description}</p>
    </div>
  );
}

interface SectionErrorProps {
  message: string;
  onRetry?: () => void;
}

export function SectionError({ message, onRetry }: SectionErrorProps) {
  return (
    <div className={styles.state} role="alert">
      <AlertTriangle aria-hidden="true" size={32} className={styles.errorIcon} />
      <p className={styles.title}>Não foi possível carregar esta seção</p>
      <p className={styles.description}>{message}</p>
      {onRetry ? (
        <button type="button" className={styles.retryButton} onClick={onRetry}>
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}
