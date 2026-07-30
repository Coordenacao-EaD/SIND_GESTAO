import type { RoutePath } from "../../../config/routes";

export interface HeroAction {
  label: string;
  href: string;
  variant: "primary" | "secondary";
  enabled?: boolean;
}

export interface HeroContent {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  primaryAction: HeroAction;
  secondaryAction: HeroAction;
  optionalAction?: HeroAction;
}

export interface QuickLink {
  id: string;
  label: string;
  href: RoutePath;
  icon: QuickLinkIcon;
}

export type QuickLinkIcon =
  | "benefits"
  | "legal"
  | "guides"
  | "calendar"
  | "contact"
  | "faq";

export interface InstitutionalSummary {
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  actionLabel: string;
  actionHref: RoutePath;
}

export interface NewsSummary {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  publishedAtLabel: string;
  imageUrl: string;
  imageAlt: string;
  href: string;
}

export interface NoticeSummary {
  id: string;
  tag: string;
  title: string;
  excerpt: string;
  publishedAtLabel: string;
  href: string;
}

export interface TransparencySummary {
  title: string;
  description: string;
  referenceLabel: string;
  actionLabel: string;
  actionHref: RoutePath;
}

export interface PublicDocumentSummary {
  id: string;
  name: string;
  category: string;
  versionLabel: string;
  href: string;
}

export interface MembershipCallToAction {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: RoutePath;
}

export interface SocialLink {
  id: string;
  label: string;
  href: string;
}

export interface FooterLinkItem {
  label: string;
  href: RoutePath;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLinkItem[];
}

export interface FooterData {
  institutionName: string;
  shortDescription?: string;
  linkGroups: FooterLinkGroup[];
  phone: string;
  email: string;
  address: string;
  socialLinks: SocialLink[];
  privacyPolicyHref: string;
  termsOfUseHref: string;
  copyrightLabel: string;
}

/** Per-section fetch state, so one failing section never brings down the whole Home. */
export type SectionStatus<T> =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

export type NewsSectionState = SectionStatus<NewsSummary[]>;
export type NoticesSectionState = SectionStatus<NoticeSummary[]>;
export type TransparencySectionState = SectionStatus<TransparencySummary>;
export type DocumentsSectionState = SectionStatus<PublicDocumentSummary[]>;

export interface HomePageData {
  hero: HeroContent;
  quickLinks: QuickLink[];
  about: InstitutionalSummary;
  news: NewsSectionState;
  notices: NoticesSectionState;
  transparency: TransparencySectionState;
  documents: DocumentsSectionState;
  membershipCta: MembershipCallToAction;
  footer: FooterData;
}

export type UIState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: HomePageData };
