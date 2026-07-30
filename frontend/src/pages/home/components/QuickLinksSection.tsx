import { Link } from "react-router-dom";
import {
  BadgePercent,
  CalendarDays,
  CircleHelp,
  FileText,
  MessagesSquare,
  Scale,
  type LucideIcon,
} from "lucide-react";
import type { QuickLink, QuickLinkIcon } from "../types/home.types";
import styles from "./QuickLinksSection.module.css";

const ICONS: Record<QuickLinkIcon, LucideIcon> = {
  benefits: BadgePercent,
  legal: Scale,
  guides: FileText,
  calendar: CalendarDays,
  contact: MessagesSquare,
  faq: CircleHelp,
};

interface QuickLinksSectionProps {
  links: QuickLink[];
}

export function QuickLinksSection({ links }: QuickLinksSectionProps) {
  if (links.length === 0) return null;

  return (
    <section className={styles.section} aria-label="Atalhos rápidos">
      <nav className={styles.grid} aria-label="Acesso rápido aos serviços">
        {links.map((link) => {
          const Icon = ICONS[link.icon];
          return (
            <Link key={link.id} to={link.href} className={styles.link}>
              <Icon className={styles.icon} aria-hidden="true" size={29} strokeWidth={1.7} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
