import { Mail, MapPin, Phone } from "lucide-react";
import logo from "../../assets/home/logo.png";
import type { FooterData } from "../../pages/home/types/home.types";
import { SafeLink } from "../navigation/SafeLink";
import styles from "./SiteFooter.module.css";

interface SiteFooterProps {
  data: FooterData;
}

export function SiteFooter({ data }: SiteFooterProps) {
  const linkGroups = data.linkGroups.filter(
    (group) => group.title.trim() !== "" && group.links.length > 0,
  );
  const socialLinks = data.socialLinks.filter((social) => social.label.trim() !== "");
  const phone = data.phone.trim();
  const email = data.email.trim();
  const address = data.address.trim();
  const phoneDigits = phone.replace(/\D/g, "");
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const hasContact = phone !== "" || email !== "" || address !== "";
  const hasLegalLinks = data.privacyPolicyHref.trim() !== "" || data.termsOfUseHref.trim() !== "";
  const hasBottomContent =
    data.copyrightLabel.trim() !== "" || hasLegalLinks || socialLinks.length > 0;

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brandColumn}>
          <div className={styles.brandRow}>
            <img src={logo} alt="" />
            <strong>{data.institutionName}</strong>
          </div>
          {data.shortDescription?.trim() ? <p>{data.shortDescription}</p> : null}
          {socialLinks.length > 0 ? (
            <ul className={styles.socialLinks} aria-label="Redes sociais">
              {socialLinks.map((social) => (
                <li key={social.id}>
                  <SafeLink href={social.href} ariaLabel={social.label}>
                    <strong aria-hidden="true">{social.label.slice(0, 1)}</strong>
                  </SafeLink>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {linkGroups.map((group) => (
          <nav key={group.title} className={styles.linkGroup} aria-label={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.links.map((link) => (
                <li key={`${group.title}-${link.label}`}>
                  <SafeLink href={link.href}>{link.label}</SafeLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {hasContact ? (
          <address className={styles.contact}>
            <h2>Contato</h2>
            <ul>
              {phone ? (
                <li>
                  <Phone aria-hidden="true" size={14} />{" "}
                  {phoneDigits ? (
                    <a href={`tel:${phoneDigits}`}>{phone}</a>
                  ) : (
                    <span aria-disabled="true">{phone}</span>
                  )}
                </li>
              ) : null}
              {email ? (
                <li>
                  <Mail aria-hidden="true" size={14} />{" "}
                  {hasValidEmail ? (
                    <a href={`mailto:${email}`}>{email}</a>
                  ) : (
                    <span aria-disabled="true">{email}</span>
                  )}
                </li>
              ) : null}
              {address ? (
                <li>
                  <MapPin aria-hidden="true" size={14} /> <span>{address}</span>
                </li>
              ) : null}
            </ul>
          </address>
        ) : null}
      </div>

      {hasBottomContent ? (
        <div className={styles.bottom}>
          <div className={`container ${styles.bottomInner}`}>
            {data.copyrightLabel.trim() ? <p>{data.copyrightLabel}</p> : null}
            {hasLegalLinks ? (
              <div className={styles.bottomLinks}>
                {data.privacyPolicyHref.trim() ? (
                  <SafeLink href={data.privacyPolicyHref}>Política de Privacidade</SafeLink>
                ) : null}
                {data.termsOfUseHref.trim() ? (
                  <SafeLink href={data.termsOfUseHref}>Termos de Uso</SafeLink>
                ) : null}
              </div>
            ) : null}
            {socialLinks.length > 0 ? (
              <ul className={styles.mobileSocials} aria-label="Redes sociais">
                {socialLinks.map((social) => (
                  <li key={`mobile-${social.id}`}>
                    <SafeLink href={social.href} ariaLabel={social.label}>
                      <strong aria-hidden="true">{social.label.slice(0, 1)}</strong>
                    </SafeLink>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </footer>
  );
}
