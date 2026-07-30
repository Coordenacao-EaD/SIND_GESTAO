import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
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
      {state.status === "loading" ? <SectionLoading label="Carregando transparência..." /> : null}
      {state.status === "error" ? <SectionError message={state.message} onRetry={onRetry} /> : null}
      {state.status === "empty" ? (
        <SectionEmpty title="Transparência" description="As informações serão publicadas em breve." />
      ) : null}
      {state.status === "ready" ? (
        <div className={styles.card}>
          <ShieldCheck aria-hidden="true" className={styles.icon} size={58} strokeWidth={1.5} />
          <div>
            <h2 id="transparency-title">{state.data.title}</h2>
            <p>{state.data.description}</p>
            <small>{state.data.referenceLabel}</small>
          </div>
          <Link to={state.data.actionHref} className={styles.action}>
            {state.data.actionLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
