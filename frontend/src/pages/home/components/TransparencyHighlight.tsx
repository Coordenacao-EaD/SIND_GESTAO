import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import type { TransparencySectionState } from "../types/home.types";
import { SectionEmpty, SectionError, SectionLoading } from "./SectionState";
import styles from "./TransparencyHighlight.module.css";

interface TransparencyHighlightProps {
  state: TransparencySectionState;
  onRetry?: () => void;
}

export function TransparencyHighlight({ state, onRetry }: TransparencyHighlightProps) {
  return (
    <section className={styles.section} aria-labelledby="transparency-title">
      <div className="container">
        <h2 id="transparency-title" className="visually-hidden">
          Transparência
        </h2>

        {state.status === "loading" ? <SectionLoading label="Carregando informações de transparência..." /> : null}
        {state.status === "error" ? <SectionError message={state.message} onRetry={onRetry} /> : null}
        {state.status === "empty" ? (
          <SectionEmpty title="Nenhuma informação disponível" description="As informações de transparência serão publicadas em breve." />
        ) : null}
        {state.status === "ready" ? (
          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <ShieldCheck aria-hidden="true" size={28} />
            </div>
            <div>
              <h3 className={styles.title}>{state.data.title}</h3>
              <p className={styles.description}>{state.data.description}</p>
              <p className={styles.reference}>{state.data.referenceLabel}</p>
            </div>
            <Link to={state.data.actionHref} className={styles.action}>
              {state.data.actionLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
