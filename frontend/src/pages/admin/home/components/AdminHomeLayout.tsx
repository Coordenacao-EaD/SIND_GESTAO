import { LayoutDashboard, Image as ImageIcon, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import styles from "../HomeManagementPage.module.css";

interface AdminHomeLayoutProps {
  children: ReactNode;
}

export function AdminHomeLayout({ children }: AdminHomeLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.adminShell}>
      <a className={styles.skipLink} href="#admin-content">Pular para o conteúdo</a>
      <header className={styles.mobileHeader}>
        <span className={styles.mobileBrand}>SINDGESTÃO</span>
        <button
          aria-expanded={menuOpen}
          aria-controls="admin-navigation"
          aria-label={menuOpen ? "Fechar menu administrativo" : "Abrir menu administrativo"}
          className={styles.menuButton}
          onClick={() => setMenuOpen((current) => !current)}
          type="button"
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>

      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brandBlock}>
          <span className={styles.brandMark} aria-hidden="true">SG</span>
          <div><strong>SINDGESTÃO</strong><span>Administração</span></div>
        </div>
        <nav id="admin-navigation" aria-label="Navegação administrativa">
          <a className={styles.navItem} href="#overview" onClick={() => setMenuOpen(false)}>
            <LayoutDashboard aria-hidden="true" /> Visão geral
          </a>
          <a className={`${styles.navItem} ${styles.navItemActive}`} href="#banner-editor" onClick={() => setMenuOpen(false)} aria-current="page">
            <ImageIcon aria-hidden="true" /> Banner da Home
          </a>
        </nav>
        <div className={styles.futureScope}>
          <span>Próximas etapas</span>
          <p>Contatos, redes sociais e revisão completa ainda não estão disponíveis.</p>
        </div>
        <div className={styles.profileCard}>
          <span aria-hidden="true">EA</span>
          <div><strong>Editor de demonstração</strong><small>Perfil simulado</small></div>
        </div>
      </aside>

      <div className={styles.adminWorkspace}>{children}</div>
    </div>
  );
}
