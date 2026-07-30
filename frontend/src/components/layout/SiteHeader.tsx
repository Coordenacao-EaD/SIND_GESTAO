import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, User, X } from "lucide-react";
import { ROUTES } from "../../config/routes";
import styles from "./SiteHeader.module.css";

const NAV_ITEMS = [
  { label: "Início", href: ROUTES.home },
  { label: "O Sindicato", href: ROUTES.union },
  { label: "Diretoria", href: ROUTES.board },
  { label: "Estatuto", href: ROUTES.bylaws },
  { label: "Notícias", href: ROUTES.news },
  { label: "Comunicados", href: ROUTES.notices },
  { label: "Transparência", href: ROUTES.transparency },
  { label: "Documentos", href: ROUTES.documents },
  { label: "Galeria", href: ROUTES.gallery },
  { label: "Filie-se", href: ROUTES.membership },
  { label: "Contato", href: ROUTES.contact },
] as const;

function navLinkClassName(isActive: boolean, base: string, active: string): string {
  return isActive ? `${base} ${active}` : base;
}

export function SiteHeader() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!isMenuOpen) return;

    document.body.style.overflow = "hidden";
    firstMobileLinkRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) toggleButtonRef.current?.focus();
  }, [isMenuOpen]);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <NavLink to={ROUTES.home} className={styles.brand} aria-label="Sindicato de Servidores Públicos — Início">
          <span className={styles.brandMark} aria-hidden="true">
            S
          </span>
          <span className={styles.brandName}>Sindicato</span>
        </NavLink>

        <nav className={styles.nav} aria-label="Menu principal">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === ROUTES.home}
              className={({ isActive }) => navLinkClassName(isActive, styles.navLink, styles.navLinkActive)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <NavLink to={ROUTES.memberArea} className={styles.memberButton}>
          <User aria-hidden="true" size={16} style={{ marginRight: 8 }} />
          Área do Filiado
        </NavLink>

        <button
          ref={toggleButtonRef}
          type="button"
          className={styles.menuToggle}
          aria-label="Abrir menu"
          aria-controls="mobile-menu"
          aria-expanded={isMenuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Menu aria-hidden="true" size={24} />
        </button>
      </div>

      {isMenuOpen ? (
        <div className={styles.backdrop} onClick={closeMenu} aria-hidden="true" />
      ) : null}

      <aside
        id="mobile-menu"
        className={`${styles.mobilePanel} ${isMenuOpen ? styles.mobilePanelOpen : ""}`}
        aria-hidden={!isMenuOpen}
        aria-label="Menu mobile"
      >
        <div className={styles.mobilePanelHeader}>
          <span className={styles.brandName} style={{ color: "var(--color-blue-deep)" }}>
            Sindicato
          </span>
          <button type="button" className={styles.mobileClose} aria-label="Fechar menu" onClick={closeMenu}>
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <nav className={styles.mobileNav} aria-label="Menu principal mobile">
          {NAV_ITEMS.map((item, index) => (
            <NavLink
              key={item.href}
              ref={index === 0 ? firstMobileLinkRef : undefined}
              to={item.href}
              end={item.href === ROUTES.home}
              className={({ isActive }) => navLinkClassName(isActive, styles.mobileNavLink, styles.mobileNavLinkActive)}
              onClick={closeMenu}
              tabIndex={isMenuOpen ? 0 : -1}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <NavLink
          to={ROUTES.memberArea}
          className={styles.mobileMemberButton}
          onClick={closeMenu}
          tabIndex={isMenuOpen ? 0 : -1}
        >
          Área do Filiado
        </NavLink>
      </aside>
    </header>
  );
}
