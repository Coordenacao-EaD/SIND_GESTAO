import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import type { AdminFooterContacts } from "../../../../features/home-admin/domain/home-admin.types";
import { adaptContactsToPreview } from "./contacts-preview.adapter";
import styles from "../AdminEditor.module.css";

export function ContactsPreview({ contacts }: { contacts: AdminFooterContacts }) {
  const preview = adaptContactsToPreview(contacts);
  return (
    <section className={styles.previewCard} aria-labelledby="contacts-preview-title">
      <div className={styles.previewTitle}><span>Prévia — não publicada</span><h2 id="contacts-preview-title">Contato no rodapé</h2></div>
      <div className={styles.footerPreview}>
        <strong>SINDGESTÃO</strong>
        <p>Representação administrativa do bloco público de contato.</p>
        <div className={styles.contactPreview}>
          {preview.phone && <p><Phone aria-hidden="true" /><a href={preview.phoneHref!}>{preview.phone}</a></p>}
          {preview.email && <p><Mail aria-hidden="true" /><a href={preview.emailHref!}>{preview.email}</a></p>}
          {preview.address && <p><MapPin aria-hidden="true" /><span>{preview.address}</span></p>}
          {preview.businessHours && <p><Clock3 aria-hidden="true" /><span>{preview.businessHours}</span></p>}
        </div>
      </div>
      <p className={styles.previewNote}>Esta prévia não altera o SiteFooter público.</p>
    </section>
  );
}
