import { useState } from "react";
import { Link } from "react-router-dom";
import type { InstitutionalSummary } from "../types/home.types";
import styles from "./AboutUnionSection.module.css";

interface AboutUnionSectionProps {
  summary: InstitutionalSummary;
}

export function AboutUnionSection({ summary }: AboutUnionSectionProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section className={styles.section} aria-labelledby="about-union-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <h2 id="about-union-title" className={styles.title}>
            {summary.title}
          </h2>
          <p className={styles.description}>{summary.description}</p>
          <Link to={summary.actionHref} className={styles.action}>
            {summary.actionLabel}
          </Link>
        </div>

        {imageFailed ? (
          <div className={styles.imageFallback} aria-hidden="true" />
        ) : (
          <figure className={styles.figure}>
            <img
              src={summary.imageUrl}
              alt={summary.imageAlt}
              className={styles.image}
              onError={() => setImageFailed(true)}
            />
          </figure>
        )}
      </div>
    </section>
  );
}
