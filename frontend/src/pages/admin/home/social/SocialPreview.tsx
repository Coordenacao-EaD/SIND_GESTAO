import type { AdminSocialConfiguration } from "../../../../features/home-admin/domain/home-admin.types";
import { adaptSocialConfigurationToPreview } from "./social-preview.adapter";
import styles from "../AdminEditor.module.css";

export function SocialPreview({ configuration }: { configuration: AdminSocialConfiguration }) {
  const items = adaptSocialConfigurationToPreview(configuration);
  return (
    <section className={styles.previewCard} aria-labelledby="social-preview-title">
      <div className={styles.previewTitle}><span>Prévia — não publicada</span><h2 id="social-preview-title">Redes sociais no rodapé</h2></div>
      <div className={styles.footerPreview}>
        <strong>SINDGESTÃO</strong>
        <p>Somente links ativos, válidos e na ordem configurada são mostrados.</p>
        {items.length > 0 ? <ul className={styles.socialPreviewLinks} aria-label="Prévia das redes sociais">{items.map((item) => <li key={item.id}><a aria-label={`${item.label} (abre em nova aba)`} href={item.href} rel="noopener noreferrer" target="_blank">{item.shortLabel}</a></li>)}</ul> : <p className={styles.emptyPreview}>Nenhuma rede social ativa para exibir.</p>}
      </div>
      <p className={styles.previewNote}>Esta prévia não altera o SiteFooter público.</p>
    </section>
  );
}
