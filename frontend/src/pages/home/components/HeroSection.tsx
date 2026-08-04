import { useState } from "react";
import { UserRound } from "lucide-react";
import type { HeroAction, HeroContent } from "../types/home.types";
import { SafeLink } from "../../../components/navigation/SafeLink";
import styles from "./HeroSection.module.css";

interface HeroSectionProps {
  content: HeroContent;
}

function HeroButton({ action }: { action: HeroAction }) {
  if (action.enabled === false) {
    return null;
  }

  const className = action.variant === "primary" ? styles.actionPrimary : styles.actionSecondary;

  return (
    <SafeLink href={action.href} className={className}>
      <UserRound aria-hidden="true" size={17} />
      {action.label}
    </SafeLink>
  );
}

export function HeroSection({ content }: HeroSectionProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section className={styles.hero} aria-label="Destaque principal">
      {imageFailed ? (
        <div
          role="img"
          aria-label={content.imageAlt}
          className={styles.imageFallback}
        />
      ) : (
        <img
          src={content.imageUrl}
          srcSet={content.imageSrcSet}
          sizes={content.imageSizes}
          width={content.imageWidth}
          height={content.imageHeight}
          alt={content.imageAlt}
          className={styles.image}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      )}
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.content}>
        <h1 className={styles.title}>{content.title}</h1>
        <p className={styles.subtitle}>{content.subtitle}</p>
        <p className={styles.description}>{content.description}</p>
        <div className={styles.actions}>
          <HeroButton action={content.primaryAction} />
          <HeroButton action={content.secondaryAction} />
          {content.optionalAction?.enabled ? <HeroButton action={content.optionalAction} /> : null}
        </div>
      </div>
    </section>
  );
}
