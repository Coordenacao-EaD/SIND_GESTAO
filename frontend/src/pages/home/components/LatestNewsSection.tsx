import { useState } from "react";
import { ImageOff } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../config/routes";
import type { NewsSectionState, NewsSummary } from "../types/home.types";
import { SectionEmpty, SectionError, SectionLoading } from "./SectionState";
import styles from "./LatestNewsSection.module.css";

function NewsCard({ news }: { news: NewsSummary }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className={styles.card}>
      <Link to={news.href} className={styles.imageWrapper} aria-label={`Leia: ${news.title}`}>
        {imageFailed ? (
          <span
            role="img"
            aria-label={news.imageAlt}
            className={styles.imageFallback}
          >
            <ImageOff aria-hidden="true" size={21} />
          </span>
        ) : (
          <img
            src={news.imageUrl}
            alt={news.imageAlt}
            className={styles.image}
            onError={() => setImageFailed(true)}
          />
        )}
      </Link>
      <div className={styles.cardBody}>
        <span className={styles.category}>{news.category}</span>
        <h3><Link to={news.href}>{news.title}</Link></h3>
        <time>{news.publishedAtLabel}</time>
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
      <div className={styles.header}>
        <h2 id="latest-news-title">Últimas Notícias</h2>
        {state.status === "ready" && state.data.length > 0 ? (
          <Link to={ROUTES.news} aria-label="Ver todas as notícias">Ver todas</Link>
        ) : null}
      </div>
      {state.status === "loading" ? <SectionLoading label="Carregando notícias..." /> : null}
      {state.status === "error" ? <SectionError message={state.message} onRetry={onRetry} /> : null}
      {state.status === "empty" ? (
        <SectionEmpty title="Nenhuma notícia publicada" description="Novas notícias aparecerão aqui em breve." />
      ) : null}
      {state.status === "ready" ? (
        <div className={styles.grid}>
          {state.data.map((news) => <NewsCard key={news.id} news={news} />)}
        </div>
      ) : null}
    </section>
  );
}
