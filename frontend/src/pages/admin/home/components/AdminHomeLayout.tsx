import { ClipboardCheck, Contact, History, Image as ImageIcon, LayoutDashboard, Menu, Share2, UploadCloud, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { ADMIN_ROUTES } from "../../../../config/routes";
import styles from "../HomeManagementPage.module.css";

interface AdminHomeLayoutProps {
  children: ReactNode;
  hasUnsavedChanges?: boolean;
}

export function AdminHomeLayout({ children, hasUnsavedChanges = false }: AdminHomeLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeMenu();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeMenu, menuOpen]);

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
          ref={menuButtonRef}
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
          <Link className={styles.navItem} to={ADMIN_ROUTES.home} onClick={(event) => {
            if (hasUnsavedChanges && !window.confirm("Descartar alterações não salvas?")) event.preventDefault();
            else setMenuOpen(false);
          }}>
            <LayoutDashboard aria-hidden="true" /> Visão geral
          </Link>
          <NavLink className={styles.navItem} end to={ADMIN_ROUTES.home} onClick={(event) => {
            if (hasUnsavedChanges && !window.confirm("Descartar alterações não salvas?")) event.preventDefault();
            else setMenuOpen(false);
          }}>
            <ImageIcon aria-hidden="true" /> Banner da Home
          </NavLink>
          <NavLink className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`} to={ADMIN_ROUTES.contacts} onClick={(event) => {
            if (hasUnsavedChanges && !window.confirm("Descartar alterações não salvas?")) event.preventDefault();
            else setMenuOpen(false);
          }}>
            <Contact aria-hidden="true" /> Contatos públicos
          </NavLink>
          <NavLink className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`} to={ADMIN_ROUTES.social} onClick={(event) => {
            if (hasUnsavedChanges && !window.confirm("Descartar alterações não salvas?")) event.preventDefault();
            else setMenuOpen(false);
          }}>
            <Share2 aria-hidden="true" /> Redes sociais
          </NavLink>
          <NavLink className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`} to={ADMIN_ROUTES.reviews} onClick={(event) => {
            if (hasUnsavedChanges && !window.confirm("Descartar alterações não salvas?")) event.preventDefault();
            else setMenuOpen(false);
          }}>
            <ClipboardCheck aria-hidden="true" /> Revisões
          </NavLink>
          <NavLink className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`} to={ADMIN_ROUTES.publication} onClick={() => setMenuOpen(false)}>
            <UploadCloud aria-hidden="true" /> Publicação
          </NavLink>
          <NavLink className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`} to={ADMIN_ROUTES.history} onClick={() => setMenuOpen(false)}>
            <History aria-hidden="true" /> Histórico e restauração
          </NavLink>
        </nav>
        <div className={styles.profileCard}>
          <span aria-hidden="true">EA</span>
          <div><strong>Editor de demonstração</strong><small>Perfil simulado</small></div>
        </div>
      </aside>

      <div className={styles.adminWorkspace}>{children}</div>
    </div>
  );
}
