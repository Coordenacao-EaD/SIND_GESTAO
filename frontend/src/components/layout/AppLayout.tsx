import { Outlet } from "react-router-dom";
import { ErrorBoundary } from "../../app/ErrorBoundary";
import { SiteHeader } from "./SiteHeader";

/**
 * Shared chrome for every route. Page-owned content, including the Home
 * footer, stays inside the routed component so it uses that route's data
 * source instead of a parallel configuration.
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
    </div>
  );
}
