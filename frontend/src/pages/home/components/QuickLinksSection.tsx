import { Link } from "react-router-dom";
import { FileText, Landmark, Mail, Megaphone, ScrollText, Scale, type LucideIcon } from "lucide-react";
import type { QuickLink, QuickLinkIcon } from "../types/home.types";
import styles from "./QuickLinksSection.module.css";

const ICONS: Record<QuickLinkIcon, LucideIcon> = {
  union: Landmark,
  news: ScrollText,
  notices: Megaphone,
  transparency: Scale,
  documents: FileText,
  contact: Mail,
};

interface QuickLinksSectionProps {
  links: QuickLink[];
}

export function QuickLinksSection({ links }: QuickLinksSectionProps) {
  return (
    <section className={styles.section} aria-label="Atalhos rápidos">
      <div className="container">
        <nav className={styles.grid} aria-label="Atalhos para as principais páginas">
          {links.map((link) => {
            const Icon = ICONS[link.icon];
            return (
              <Link key={link.id} to={link.href} className={styles.link}>
                <Icon aria-hidden="true" size={26} className={styles.icon} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
