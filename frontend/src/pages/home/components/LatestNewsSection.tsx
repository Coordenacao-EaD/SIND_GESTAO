import { useState } from "react";
import { Link } from "react-router-dom";
import { ImageOff } from "lucide-react";
import { ROUTES } from "../../../config/routes";
import type { NewsSectionState, NewsSummary } from "../types/home.types";
import { SectionEmpty, SectionError, SectionLoading } from "./SectionState";
import styles from "./LatestNewsSection.module.css";

interface NewsCardProps {
  news: NewsSummary;
}

function NewsCard({ news }: NewsCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        {imageFailed ? (
          <div className={styles.imageFallback}>
            <ImageOff aria-hidden="true" size={28} />
          </div>
        ) : (
          <img
            src={news.imageUrl}
            alt={news.imageAlt}
            className={styles.image}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
      <div className={styles.cardBody}>
        <span className={styles.category}>{news.category}</span>
        <h3 className={styles.cardTitle}>{news.title}</h3>
        <p className={styles.excerpt}>{news.excerpt}</p>
        <div className={styles.meta}>
          <time className={styles.date}>{news.publishedAtLabel}</time>
          <Link to={news.href} className={styles.readMore}>
            Leia mais
          </Link>
        </div>
      </div>
    </article>
  );
}

interface LatestNewsSectionProps {
  state: NewsSectionState;
  onRetry?: () => void;
}

export function LatestNewsSection({ state, onRetry }: LatestNewsSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="latest-news-title">
      <div className="container">
        <div className={styles.header}>
          <h2 id="latest-news-title" className={styles.title}>
            Últimas Notícias
          </h2>
          <Link to={ROUTES.news} className={styles.viewAll}>
            Ver todas
          </Link>
        </div>

        {state.status === "loading" ? <SectionLoading label="Carregando notícias..." /> : null}
        {state.status === "error" ? <SectionError message={state.message} onRetry={onRetry} /> : null}
        {state.status === "empty" ? (
          <SectionEmpty title="Nenhuma notícia publicada" description="Novas notícias aparecerão aqui assim que forem divulgadas." />
        ) : null}
        {state.status === "ready" ? (
          <div className={styles.grid}>
            {state.data.map((news) => (
              <NewsCard key={news.id} news={news} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
