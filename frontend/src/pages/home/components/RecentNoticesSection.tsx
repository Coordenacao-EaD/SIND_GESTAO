import { Link } from "react-router-dom";
import { ROUTES } from "../../../config/routes";
import type { NoticesSectionState } from "../types/home.types";
import { SectionEmpty, SectionError, SectionLoading } from "./SectionState";
import styles from "./RecentNoticesSection.module.css";

interface RecentNoticesSectionProps {
  state: NoticesSectionState;
  onRetry?: () => void;
}

export function RecentNoticesSection({ state, onRetry }: RecentNoticesSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="recent-notices-title">
      <div className="container">
        <div className={styles.header}>
          <h2 id="recent-notices-title" className={styles.title}>
            Comunicados Recentes
          </h2>
          <Link to={ROUTES.notices} className={styles.viewAll}>
            Ver todos os comunicados
          </Link>
        </div>

        {state.status === "loading" ? <SectionLoading label="Carregando comunicados..." /> : null}
        {state.status === "error" ? <SectionError message={state.message} onRetry={onRetry} /> : null}
        {state.status === "empty" ? (
          <SectionEmpty title="Nenhum comunicado publicado" description="Novos comunicados aparecerão aqui assim que forem divulgados." />
        ) : null}
        {state.status === "ready" ? (
          <ul className={styles.list}>
            {state.data.map((notice) => (
              <li key={notice.id} className={styles.item}>
                <span className={styles.tag}>{notice.tag}</span>
                <div className={styles.itemBody}>
                  <h3>{notice.title}</h3>
                  <p className={styles.excerpt}>{notice.excerpt}</p>
                </div>
                <div className={styles.itemFooter}>
                  <time className={styles.date}>{notice.publishedAtLabel}</time>
                  <Link to={notice.href} className={styles.details}>
                    Ver detalhes
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
