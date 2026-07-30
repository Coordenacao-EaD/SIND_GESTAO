import type { HomePageData } from "./types/home.types";
import { HeroSection } from "./components/HeroSection";
import { QuickLinksSection } from "./components/QuickLinksSection";
import { AboutUnionSection } from "./components/AboutUnionSection";
import { LatestNewsSection } from "./components/LatestNewsSection";
import { RecentNoticesSection } from "./components/RecentNoticesSection";
import { TransparencyHighlight } from "./components/TransparencyHighlight";
import { ImportantDocumentsSection } from "./components/ImportantDocumentsSection";
import { MembershipCta } from "./components/MembershipCta";

interface HomeLayoutProps {
  data: HomePageData;
  onRetrySection?: () => void;
}

/**
 * Pure presentation: given a fully-resolved HomePageData, renders every Home
 * section in the required order. Knows nothing about repositories, fetch
 * lifecycles, or where the data came from — easy to render in isolation
 * with any mock dataset for tests or Storybook-style exploration.
 */
export function HomeLayout({ data, onRetrySection }: HomeLayoutProps) {
  return (
    <>
      <HeroSection content={data.hero} />
      <QuickLinksSection links={data.quickLinks} />
      <AboutUnionSection summary={data.about} />
      <LatestNewsSection state={data.news} onRetry={onRetrySection} />
      <RecentNoticesSection state={data.notices} onRetry={onRetrySection} />
      <TransparencyHighlight state={data.transparency} onRetry={onRetrySection} />
      <ImportantDocumentsSection state={data.documents} onRetry={onRetrySection} />
      <MembershipCta cta={data.membershipCta} />
    </>
  );
}
