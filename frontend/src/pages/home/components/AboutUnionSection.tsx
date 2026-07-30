import { Link } from "react-router-dom";
import type { InstitutionalSummary } from "../types/home.types";
import styles from "./AboutUnionSection.module.css";

interface AboutUnionSectionProps {
  summary: InstitutionalSummary;
}

export function AboutUnionSection({ summary }: AboutUnionSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="about-union-title">
      <h2 id="about-union-title" className={styles.title}>
        {summary.title}
      </h2>
      <span className={styles.rule} aria-hidden="true" />
      <p className={styles.description}>{summary.description}</p>
      <Link to={summary.actionHref} className={styles.action}>
        {summary.actionLabel}
      </Link>
    </section>
  );
}
