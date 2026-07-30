import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../../assets/home/logo.png";
import type { FooterData } from "../../pages/home/types/home.types";
import styles from "./SiteFooter.module.css";

interface SiteFooterProps {
  data: FooterData;
}

export function SiteFooter({ data }: SiteFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brandColumn}>
          <div className={styles.brandRow}>
            <img src={logo} alt="" />
            <strong>{data.institutionName}</strong>
          </div>
          <p>{data.shortDescription}</p>
          <ul className={styles.socialLinks} aria-label="Redes sociais">
            {data.socialLinks.map((social) => (
              <li key={social.id}>
                <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                  <strong aria-hidden="true">{social.label.slice(0, 1)}</strong>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {data.linkGroups.map((group) => (
          <nav key={group.title} className={styles.linkGroup} aria-label={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.links.map((link) => (
                <li key={`${group.title}-${link.label}`}><Link to={link.href}>{link.label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}

        <address className={styles.contact}>
          <h2>Contato</h2>
          <ul>
            <li><Phone aria-hidden="true" size={14} /> <a href={`tel:${data.phone.replace(/\D/g, "")}`}>{data.phone}</a></li>
            <li><Mail aria-hidden="true" size={14} /> <a href={`mailto:${data.email}`}>{data.email}</a></li>
            <li><MapPin aria-hidden="true" size={14} /> <span>{data.address}</span></li>
          </ul>
        </address>
      </div>

      <div className={styles.bottom}>
        <div className={`container ${styles.bottomInner}`}>
          <p>{data.copyrightLabel}</p>
          <div className={styles.bottomLinks}>
            <Link to={data.privacyPolicyHref}>Política de Privacidade</Link>
            <Link to={data.termsOfUseHref}>Termos de Uso</Link>
          </div>
          <ul className={styles.mobileSocials} aria-label="Redes sociais">
            {data.socialLinks.map((social) => (
              <li key={`mobile-${social.id}`}>
                <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                  <strong aria-hidden="true">{social.label.slice(0, 1)}</strong>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
