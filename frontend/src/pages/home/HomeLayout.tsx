import type { HomePageData } from "./types/home.types";
import { HeroSection } from "./components/HeroSection";
import { QuickLinksSection } from "./components/QuickLinksSection";
import { AboutUnionSection } from "./components/AboutUnionSection";
import { LatestNewsSection } from "./components/LatestNewsSection";
import { RecentNoticesSection } from "./components/RecentNoticesSection";
import { TransparencyHighlight } from "./components/TransparencyHighlight";
import { ImportantDocumentsSection } from "./components/ImportantDocumentsSection";
import { MembershipCta } from "./components/MembershipCta";
import styles from "./HomePage.module.css";

interface HomeLayoutProps {
  data: HomePageData;
  onRetrySection?: () => void;
}

export function HomeLayout({ data, onRetrySection }: HomeLayoutProps) {
  return (
    <div className={styles.home}>
      <div className="container">
        <HeroSection content={data.hero} />
        <QuickLinksSection links={data.quickLinks} />

        <div className={styles.informationGrid}>
          <AboutUnionSection summary={data.about} />
          <LatestNewsSection state={data.news} onRetry={onRetrySection} />
          <RecentNoticesSection state={data.notices} onRetry={onRetrySection} />
        </div>

        <div className={styles.highlightsGrid}>
          <TransparencyHighlight state={data.transparency} onRetry={onRetrySection} />
          <ImportantDocumentsSection state={data.documents} onRetry={onRetrySection} />
        </div>

        <MembershipCta cta={data.membershipCta} />
      </div>
    </div>
  );
}
