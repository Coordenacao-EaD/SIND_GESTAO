import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { ROUTES } from "../config/routes";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  return (
    <main id="conteudo" className={styles.wrapper}>
      <div className={`container ${styles.content}`}>
        <Compass aria-hidden="true" size={48} className={styles.icon} />
        <h1 className={styles.title}>Página não encontrada</h1>
        <p className={styles.description}>
          O endereço acessado não existe ou foi movido. Volte para a Página Inicial para continuar navegando.
        </p>
        <Link to={ROUTES.home} className={styles.action}>
          Voltar à Página Inicial
        </Link>
      </div>
    </main>
  );
}
