import type { BannerCta } from "../../../../features/home-admin/domain/home-admin.types";
import { ADMIN_PUBLIC_ROUTE_CATALOG, type SelectablePublicRouteKey } from "../../../../features/home-admin/contracts/public-route-catalog";
import styles from "../HomeManagementPage.module.css";

interface BannerCtaFieldsProps {
  cta: BannerCta;
  disabled?: boolean;
  onChange: (cta: BannerCta) => void;
}

const selectableRoutes = ADMIN_PUBLIC_ROUTE_CATALOG.filter((route) => route.enabled && route.selectable);

export function BannerCtaFields({ cta, disabled, onChange }: BannerCtaFieldsProps) {
  const mode = cta.enabled ? cta.kind : "disabled";
  const changeMode = (nextMode: string) => {
    if (nextMode === "disabled") onChange({ enabled: false });
    if (nextMode === "internal") onChange({ enabled: true, kind: "internal", label: "Saiba mais", route: "home" });
    if (nextMode === "external") onChange({ enabled: true, kind: "external", label: "Saiba mais", url: "https://" });
  };

  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend>Chamada para ação (CTA)</legend>
      <p className={styles.fieldHint}>Defina se o banner terá um botão e qual será seu destino.</p>
      <label className={styles.field}>
        <span>Tipo de CTA</span>
        <select aria-describedby="cta-mode-hint" value={mode} onChange={(event) => changeMode(event.target.value)}>
          <option value="disabled">Sem botão</option>
          <option value="internal">Página do site</option>
          <option value="external">Endereço externo</option>
        </select>
        <small id="cta-mode-hint">Links externos aceitam somente HTTPS.</small>
      </label>
      {cta.enabled && (
        <label className={styles.field}>
          <span>Texto do botão</span>
          <input maxLength={40} value={cta.label} onChange={(event) => onChange({ ...cta, label: event.target.value })} />
        </label>
      )}
      {cta.enabled && cta.kind === "internal" && (
        <label className={styles.field}>
          <span>Página de destino</span>
          <select value={cta.route} onChange={(event) => onChange({ ...cta, route: event.target.value as SelectablePublicRouteKey })}>
            {selectableRoutes.map((route) => <option key={route.key} value={route.key}>{route.label} · {route.path}</option>)}
          </select>
        </label>
      )}
      {cta.enabled && cta.kind === "external" && (
        <label className={styles.field}>
          <span>URL de destino</span>
          <input inputMode="url" placeholder="https://exemplo.org.br" type="url" value={cta.url} onChange={(event) => onChange({ ...cta, url: event.target.value })} />
        </label>
      )}
    </fieldset>
  );
}
