import { Outlet } from "react-router-dom";
import { ErrorBoundary } from "../../app/ErrorBoundary";
import { SITE_FOOTER } from "../../config/site";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

/**
 * Shared chrome for every route: header, routed content, footer.
 *
 * Footer content is institutional/static (logo, contact, social links) and
 * does not depend on which page is active, so it is sourced directly from
 * the Home mock for this phase rather than round-tripping through
 * HomeRepository. When a site-wide content source exists, this becomes the
 * seam to swap it out — no page component needs to change.
 */
export function AppLayout() {
  return (
    <div className="site-shell">
      <a href="#conteudo" className="skip-link">
        Ir para o conteúdo principal
      </a>
      <SiteHeader />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <SiteFooter data={SITE_FOOTER} />
    </div>
  );
}
