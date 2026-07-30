import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
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
          <span className={styles.brandRow}>{data.institutionName}</span>
          <p className={styles.description}>{data.shortDescription}</p>
          <ul className={styles.socialLinks} aria-label="Redes sociais">
            {data.socialLinks.map((social) => (
              <li key={social.id}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label={social.label}
                >
                  {social.label.slice(0, 2).toUpperCase()}
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
                <li key={link.label}>
                  <Link to={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <address className={styles.contact}>
          <h2>Contato</h2>
          <ul>
            <li>
              <Phone aria-hidden="true" size={14} style={{ marginRight: 6 }} />
              {data.phone}
            </li>
            <li>
              <Mail aria-hidden="true" size={14} style={{ marginRight: 6 }} />
              {data.email}
            </li>
            <li>
              <MapPin aria-hidden="true" size={14} style={{ marginRight: 6 }} />
              {data.address}
            </li>
            <li>{data.serviceHours}</li>
          </ul>
        </address>
      </div>

      <div className={styles.bottom}>
        <div className={`container ${styles.bottomInner}`}>
          <p>{data.copyrightLabel}</p>
          <div className={styles.bottomLinks}>
            <a href={data.privacyPolicyHref}>Política de Privacidade</a>
            <a href={data.termsOfUseHref}>Termos de Uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
