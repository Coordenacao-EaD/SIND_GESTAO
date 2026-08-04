import { ExternalLink } from "lucide-react";
import heroLarge from "../../../../assets/home/hero-union-1672.webp";
import heroSmall from "../../../../assets/home/hero-union-840.webp";
import type { AdminBanner } from "../../../../features/home-admin/domain/home-admin.types";
import styles from "../HomeManagementPage.module.css";

export function BannerPreview({ banner }: { banner: AdminBanner }) {
  return (
    <section className={styles.previewPanel} aria-labelledby="banner-preview-title">
      <div className={styles.previewHeader}>
        <div><span>Prévia administrativa</span><h2 id="banner-preview-title">Banner da Página Inicial</h2></div>
        <span className={styles.liveBadge}><i aria-hidden="true" /> Atualização local</span>
      </div>
      <div className={styles.previewViewport}>
        <picture>
          <source media="(max-width: 720px)" srcSet={heroSmall} />
          <img alt={banner.altText || "Prévia sem texto alternativo"} src={heroLarge} />
        </picture>
        <div className={styles.previewOverlay} />
        <div className={styles.previewContent}>
          <span>SINDGESTÃO</span>
          <h3>{banner.title || "Título do banner"}</h3>
          <p>{banner.description || "A descrição aparecerá aqui."}</p>
          {banner.cta.enabled && <span className={styles.previewCta}>{banner.cta.label || "Texto do botão"}{banner.cta.kind === "external" && <ExternalLink aria-hidden="true" />}</span>}
        </div>
      </div>
      <p className={styles.previewFootnote}>A prévia é ilustrativa e não altera a Home pública.</p>
    </section>
  );
}
