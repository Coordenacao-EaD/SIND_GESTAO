import { FileText } from "lucide-react";
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
      <div className="container">
        <h2 id="documents-title" className={styles.title}>
          Documentos Importantes
        </h2>

        {state.status === "loading" ? <SectionLoading label="Carregando documentos..." /> : null}
        {state.status === "error" ? <SectionError message={state.message} onRetry={onRetry} /> : null}
        {state.status === "empty" ? (
          <SectionEmpty title="Nenhum documento disponível" description="Os documentos públicos aparecerão aqui assim que forem publicados." />
        ) : null}
        {state.status === "ready" ? (
          <div className={styles.grid}>
            {state.data.map((document) => (
              <article key={document.id} className={styles.card}>
                <div className={styles.iconWrapper}>
                  <FileText aria-hidden="true" size={20} />
                </div>
                <div className={styles.body}>
                  <p className={styles.name}>{document.name}</p>
                  <p className={styles.meta}>
                    {document.category} • {document.versionLabel}
                  </p>
                </div>
                <a href={document.href} className={styles.action}>
                  Ver documento
                </a>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
