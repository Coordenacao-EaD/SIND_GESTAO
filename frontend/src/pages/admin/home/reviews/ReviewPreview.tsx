import type { HomeAdminResource } from "../../../../features/home-admin/domain/home-admin.types";
import { BannerPreview } from "../banner/BannerPreview";
import { ContactsPreview } from "../contacts/ContactsPreview";
import { SocialPreview } from "../social/SocialPreview";
import styles from "./Reviews.module.css";

/**
 * Prévia do conteúdo submetido. Reutiliza os adaptadores explícitos da F2.2A/F2.2B — os contratos
 * administrativos continuam desacoplados dos componentes públicos, e nada aqui altera a Home pública.
 */
export function ReviewPreview({ submitted }: { submitted: HomeAdminResource }) {
  return (
    <section className={styles.card} aria-labelledby="review-preview-title">
      <h2 id="review-preview-title">Prévia da submissão — não publicada</h2>
      <p className={styles.cardIntro}>
        Representação local do conteúdo enviado para revisão. Nenhuma decisão desta tela altera a Home
        pública nem o rodapé público.
      </p>
      {submitted.resourceType === "banner" && <BannerPreview banner={submitted} />}
      {submitted.resourceType === "footer_contacts" && <ContactsPreview contacts={submitted} />}
      {submitted.resourceType === "footer_social_links" && <SocialPreview configuration={submitted} />}
    </section>
  );
}
