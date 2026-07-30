import { Megaphone } from "lucide-react";
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
      <div className={styles.header}>
        <h2 id="recent-notices-title">Comunicados Recentes</h2>
        {state.status === "ready" && state.data.length > 0 ? (
          <Link to={ROUTES.notices} aria-label="Ver todos os comunicados">Ver todas</Link>
        ) : null}
      </div>
      {state.status === "loading" ? <SectionLoading label="Carregando comunicados..." /> : null}
      {state.status === "error" ? <SectionError message={state.message} onRetry={onRetry} /> : null}
      {state.status === "empty" ? (
        <SectionEmpty title="Nenhum comunicado publicado" description="Novos comunicados aparecerão aqui em breve." />
      ) : null}
      {state.status === "ready" ? (
        <ul className={styles.list}>
          {state.data.map((notice) => (
            <li key={notice.id}>
              <Megaphone aria-hidden="true" size={15} />
              <div>
                <h3><Link to={notice.href}>{notice.title}</Link></h3>
                <time>{notice.publishedAtLabel}</time>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
