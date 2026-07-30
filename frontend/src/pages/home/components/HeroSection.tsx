import { useState } from "react";
import { Link } from "react-router-dom";
import type { HeroContent } from "../types/home.types";
import styles from "./HeroSection.module.css";

interface HeroSectionProps {
  content: HeroContent;
}

export function HeroSection({ content }: HeroSectionProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section className={styles.hero} aria-label="Destaque principal">
      {imageFailed ? (
        <div className={styles.imageFallback} aria-hidden="true" />
      ) : (
        <img
          src={content.imageUrl}
          alt={content.imageAlt}
          className={styles.image}
          onError={() => setImageFailed(true)}
        />
      )}
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.content}>
        {content.eyebrow ? <span className={styles.eyebrow}>{content.eyebrow}</span> : null}
        <h1 className={styles.title}>{content.title}</h1>
        <p className={styles.description}>{content.description}</p>
        <div className={styles.actions}>
          <Link to={content.primaryAction.href} className={styles.actionPrimary}>
            {content.primaryAction.label}
          </Link>
          <Link to={content.secondaryAction.href} className={styles.actionSecondary}>
            {content.secondaryAction.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
