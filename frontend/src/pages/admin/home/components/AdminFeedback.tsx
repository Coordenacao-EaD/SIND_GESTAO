import { AlertTriangle, CheckCircle2, Info, RotateCw } from "lucide-react";
import type { AdminError } from "../../../../features/home-admin/domain/home-admin.types";
import styles from "../HomeManagementPage.module.css";

interface AdminFeedbackProps {
  error?: AdminError;
  success?: string;
  onRetry?: () => void;
}

function errorDetails(error: AdminError) {
  switch (error.kind) {
    case "unauthenticated": return { code: "401", title: "Acesso demonstrativo indisponível" };
    case "forbidden": return { code: "403", title: "Ação não permitida para este perfil" };
    case "conflict": return { code: "409", title: "A versão foi alterada" };
    case "validation": return { code: "422", title: "Revise os campos informados" };
    case "unavailable": return { code: "—", title: "Painel temporariamente indisponível" };
    case "unexpected": return { code: "—", title: "Não foi possível concluir a ação" };
  }
}

export function AdminFeedback({ error, success, onRetry }: AdminFeedbackProps) {
  if (success) {
    return <div className={`${styles.feedback} ${styles.feedbackSuccess}`} role="status"><CheckCircle2 aria-hidden="true" /><div><strong>Ação simulada concluída</strong><p>{success}</p></div></div>;
  }
  if (!error) return null;
  const details = errorDetails(error);
  return (
    <div className={`${styles.feedback} ${styles.feedbackError}`} role="alert">
      <AlertTriangle aria-hidden="true" />
      <div>
        <span className={styles.errorCode}>{details.code}</span>
        <strong>{details.title}</strong>
        <p>{error.message}</p>
        {error.kind === "forbidden" && <small>Capacidade necessária: {error.requiredCapability}</small>}
        {error.kind === "conflict" && <small>Revisão esperada: {error.expectedRevision}; revisão atual: {error.actualRevision}.</small>}
        {error.kind === "validation" && Object.entries(error.fields).map(([field, messages]) => <small key={field}>{field}: {messages.join(" ")}</small>)}
        {onRetry && <button className={styles.secondaryButton} onClick={onRetry} type="button"><RotateCw aria-hidden="true" /> Tentar novamente</button>}
      </div>
    </div>
  );
}

export function DemoNotice() {
  return <div className={styles.demoNotice} role="note"><Info aria-hidden="true" /><p><strong>Ambiente demonstrativo.</strong> Nenhuma alteração é persistida e nenhuma publicação real será feita.</p></div>;
}
