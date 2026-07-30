import { FileText } from "lucide-react";
import { SafeLink } from "../../../components/navigation/SafeLink";
import type { DocumentsSectionState } from "../types/home.types";
import { SectionEmpty, SectionError, SectionLoading } from "./SectionState";
import styles from "./ImportantDocumentsSection.module.css";

interface ImportantDocumentsSectionProps {
  state: DocumentsSectionState;
  onRetry?: () => void;
}

export function ImportantDocumentsSection({ state, onRetry }: ImportantDocumentsSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="documents-title">
      {state.status !== "ready" ? (
        <h2 id="documents-title" className="visually-hidden">Documentos Importantes</h2>
      ) : null}
      {state.status === "loading" ? <SectionLoading label="Carregando documentos..." /> : null}
      {state.status === "error" ? <SectionError message={state.message} onRetry={onRetry} /> : null}
      {state.status === "empty" ? (
        <SectionEmpty title="Documentos Importantes" description="Os documentos aparecerão aqui em breve." />
      ) : null}
      {state.status === "ready" ? (
        <div className={styles.card}>
          <FileText aria-hidden="true" className={styles.icon} size={56} strokeWidth={1.5} />
          <div>
            <h2 id="documents-title">Documentos Importantes</h2>
            <p>Consulte estatuto, atas, relatórios e outros documentos essenciais para a atuação do sindicato.</p>
            <small>{state.data[0]?.versionLabel}</small>
          </div>
          <SafeLink href={state.data[0]?.href ?? ""} className={styles.action}>
            Ver documentos
          </SafeLink>
        </div>
      ) : null}
    </section>
  );
}
