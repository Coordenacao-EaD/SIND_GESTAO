import { Link } from "react-router-dom";
import type { MembershipCallToAction } from "../types/home.types";
import styles from "./MembershipCta.module.css";

interface MembershipCtaProps {
  cta: MembershipCallToAction;
}

export function MembershipCta({ cta }: MembershipCtaProps) {
  return (
    <section className={styles.section} aria-labelledby="membership-cta-title">
      <div className="container">
        <div className={styles.banner}>
          <div>
            <h2 id="membership-cta-title" className={styles.title}>
              {cta.title}
            </h2>
            <p className={styles.description}>{cta.description}</p>
          </div>
          <Link to={cta.actionHref} className={styles.action}>
            {cta.actionLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
