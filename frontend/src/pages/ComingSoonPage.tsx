import { Link } from "react-router-dom";
import { Construction } from "lucide-react";
import { ROUTES } from "../config/routes";
import styles from "./NotFoundPage.module.css";

interface ComingSoonPageProps {
  title: string;
}

/**
 * Temporary stand-in for routes outside the Home page scope. Exists only so
 * header/footer links never resolve to a broken route while those pages are
 * implemented in a future phase.
 */
export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <main id="conteudo" className={styles.wrapper}>
      <div className={`container ${styles.content}`}>
        <Construction aria-hidden="true" size={48} className={styles.icon} />
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>Página em construção. Este conteúdo será disponibilizado em uma próxima etapa.</p>
        <Link to={ROUTES.home} className={styles.action}>
          Voltar à Página Inicial
        </Link>
      </div>
    </main>
  );
}
