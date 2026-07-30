import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown, Menu, UserRound, X } from "lucide-react";
import { ROUTES } from "../../config/routes";
import logo from "../../assets/home/logo.png";
import styles from "./SiteHeader.module.css";

const NAV_ITEMS = [
  { label: "Início", href: ROUTES.home },
  { label: "Serviços", href: ROUTES.services },
  { label: "Notícias", href: ROUTES.news },
  { label: "Comunicações", href: ROUTES.notices },
  { label: "Transparência", href: ROUTES.transparency },
  { label: "Documentos", href: ROUTES.documents },
  { label: "Fale Conosco", href: ROUTES.contact },
] as const;

const INSTITUTIONAL_ITEMS = [
  { label: "Quem Somos", href: ROUTES.union },
  { label: "Diretoria", href: ROUTES.board },
  { label: "Estatuto", href: ROUTES.bylaws },
] as const;

function navClass(isActive: boolean, base?: string, active?: string): string {
  return isActive && active ? `${base ?? ""} ${active}` : (base ?? "");
}

function Brand() {
  return (
    <NavLink to={ROUTES.home} className={styles.brand} aria-label="SINDGESTÃO — Início">
      <img src={logo} alt="" className={styles.logo} />
      <span className={styles.brandCopy}>
        <strong>SINDGESTÃO</strong>
        <small>Servidores públicos</small>
      </span>
    </NavLink>
  );
}

export function SiteHeader() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isInstitutionalOpen, setInstitutionalOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);
  const wasMenuOpen = useRef(false);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!isMenuOpen) {
      if (wasMenuOpen.current) toggleButtonRef.current?.focus();
      wasMenuOpen.current = false;
      return;
    }

    wasMenuOpen.current = true;
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

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <button
          ref={toggleButtonRef}
          type="button"
          className={styles.menuToggle}
          aria-label="Abrir menu"
          aria-controls="mobile-menu"
          aria-expanded={isMenuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Menu aria-hidden="true" size={23} />
        </button>

        <Brand />

        <nav className={styles.nav} aria-label="Menu principal">
          <NavLink
            to={ROUTES.home}
            end
            className={({ isActive }) => navClass(isActive, styles.navLink, styles.navLinkActive)}
          >
            Início
          </NavLink>

          <div
            className={styles.dropdown}
            onMouseLeave={() => setInstitutionalOpen(false)}
          >
            <button
              type="button"
              className={styles.dropdownToggle}
              aria-expanded={isInstitutionalOpen}
              aria-controls="institutional-menu"
              onClick={() => setInstitutionalOpen((open) => !open)}
            >
              Institucional <ChevronDown aria-hidden="true" size={13} />
            </button>
            <div
              id="institutional-menu"
              className={`${styles.dropdownMenu} ${isInstitutionalOpen ? styles.dropdownMenuOpen : ""}`}
            >
              {INSTITUTIONAL_ITEMS.map((item) => (
                <NavLink key={item.href} to={item.href} onClick={() => setInstitutionalOpen(false)}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {NAV_ITEMS.slice(1).map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => navClass(isActive, styles.navLink, styles.navLinkActive)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <NavLink to={ROUTES.memberArea} className={styles.memberButton} aria-label="Área do Filiado">
          <UserRound aria-hidden="true" size={17} />
          <span>Área do Filiado</span>
        </NavLink>
      </div>

      {isMenuOpen ? (
        <button
          className={styles.backdrop}
          onClick={closeMenu}
          aria-label="Fechar menu ao clicar fora"
          data-testid="menu-backdrop"
        />
      ) : null}

      <aside
        id="mobile-menu"
        className={`${styles.mobilePanel} ${isMenuOpen ? styles.mobilePanelOpen : ""}`}
        aria-hidden={!isMenuOpen}
        aria-label="Menu mobile"
      >
        <div className={styles.mobilePanelHeader}>
          <span className={styles.mobileTitle}>Navegação</span>
          <button
            type="button"
            className={styles.mobileClose}
            aria-label="Fechar menu"
            onClick={closeMenu}
            tabIndex={isMenuOpen ? 0 : -1}
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <nav className={styles.mobileNav} aria-label="Menu principal mobile">
          {[NAV_ITEMS[0], ...INSTITUTIONAL_ITEMS, ...NAV_ITEMS.slice(1)].map((item, index) => (
            <NavLink
              key={`${item.href}-${item.label}`}
              ref={index === 0 ? firstMobileLinkRef : undefined}
              to={item.href}
              end={item.href === ROUTES.home}
              className={({ isActive }) => navClass(isActive, styles.mobileNavLink, styles.mobileNavLinkActive)}
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
          <UserRound aria-hidden="true" size={17} /> Área do Filiado
        </NavLink>
      </aside>
    </header>
  );
}
