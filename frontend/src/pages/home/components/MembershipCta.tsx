import { HeartHandshake, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import type { MembershipCallToAction } from "../types/home.types";
import styles from "./MembershipCta.module.css";

interface MembershipCtaProps {
  cta: MembershipCallToAction;
}

export function MembershipCta({ cta }: MembershipCtaProps) {
  return (
    <section className={styles.section} aria-labelledby="membership-cta-title">
      <HeartHandshake className={styles.icon} aria-hidden="true" size={52} />
      <div>
        <h2 id="membership-cta-title">{cta.title}</h2>
        <p>{cta.description}</p>
      </div>
      <Link to={cta.actionHref} className={styles.action}>
        <UserRound aria-hidden="true" size={16} /> {cta.actionLabel}
      </Link>
    </section>
  );
}
