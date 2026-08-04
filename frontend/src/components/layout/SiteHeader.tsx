import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown, Menu, UserRound, X } from "lucide-react";
import { ROUTES } from "../../config/routes";
import logo from "../../assets/home/logo-128.png";
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
      <img src={logo} alt="" className={styles.logo} width={128} height={128} decoding="async" />
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
  const headerRef = useRef<HTMLElement>(null);
  const headerInnerRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const institutionalButtonRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
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
    const siteShell = headerRef.current?.parentElement;
    const backgroundElements = [
      headerInnerRef.current,
      ...Array.from(siteShell?.children ?? []).filter((element) => element !== headerRef.current),
    ].filter((element): element is HTMLElement => element instanceof HTMLElement);
    const previousInertStates = backgroundElements.map((element) => ({
      element,
      inert: element.inert,
    }));

    backgroundElements.forEach((element) => {
      element.inert = true;
    });
    firstMobileLinkRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        mobilePanelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements.at(-1);

      if (!firstFocusable || !lastFocusable) {
        event.preventDefault();
        mobilePanelRef.current?.focus();
        return;
      }

      if (!mobilePanelRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        firstFocusable.focus();
      } else if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      previousInertStates.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header ref={headerRef} className={styles.header}>
      <div ref={headerInnerRef} className={`container ${styles.inner}`}>
        <button
          ref={toggleButtonRef}
          type="button"
          className={styles.menuToggle}
          aria-label={isMenuOpen ? "Fechar menu de navegação" : "Abrir menu"}
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
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setInstitutionalOpen(false);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" && isInstitutionalOpen) {
                event.preventDefault();
                setInstitutionalOpen(false);
                institutionalButtonRef.current?.focus();
              }
            }}
          >
            <button
              ref={institutionalButtonRef}
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
          type="button"
          className={styles.backdrop}
          onClick={closeMenu}
          aria-label="Fechar menu ao clicar fora"
          tabIndex={-1}
          data-testid="menu-backdrop"
        />
      ) : null}

      <div
        ref={mobilePanelRef}
        id="mobile-menu"
        className={`${styles.mobilePanel} ${isMenuOpen ? styles.mobilePanelOpen : ""}`}
        role="dialog"
        aria-modal={isMenuOpen ? "true" : undefined}
        aria-hidden={!isMenuOpen}
        aria-labelledby="mobile-menu-title"
        inert={!isMenuOpen}
        tabIndex={-1}
      >
        <div className={styles.mobilePanelHeader}>
          <span id="mobile-menu-title" className={styles.mobileTitle}>Navegação</span>
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
      </div>
    </header>
  );
}
