import { createHash } from "node:crypto";

export interface BannerFunctionalContent {
  title: string;
  subtitle: string | null;
  bodyText: string;
  imageUrl: string | null;
  imageAlt: string | null;
  ctaEnabled: boolean;
  ctaLabel: string | null;
  ctaLinkType: "internal" | "external" | null;
  ctaLinkValue: string | null;
}

export interface ContactsFunctionalContent {
  phone: string | null;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  businessHours: string | null;
}

export interface SocialLinkFunctionalContent {
  platform: "facebook" | "instagram" | "youtube" | "linkedin" | "x";
  url: string;
  displayOrder: number;
  isActive: boolean;
}

export interface SocialFunctionalContent {
  links: readonly SocialLinkFunctionalContent[];
}

export type CanonicalHomeContent =
  | ReturnType<typeof normalizeBannerContent>
  | ReturnType<typeof normalizeContactsContent>
  | ReturnType<typeof normalizeSocialContent>;

export function normalizeBannerContent(content: BannerFunctionalContent) {
  const ctaDisabled = content.ctaEnabled === false;
  return {
    contentType: "banner" as const,
    title: content.title,
    subtitle: content.subtitle ?? null,
    bodyText: content.bodyText,
    imageUrl: content.imageUrl ?? null,
    imageAlt: content.imageAlt ?? null,
    ctaEnabled: content.ctaEnabled,
    ctaLabel: ctaDisabled ? null : content.ctaLabel,
    ctaLinkType: ctaDisabled ? null : content.ctaLinkType,
    ctaLinkValue: ctaDisabled ? null : content.ctaLinkValue,
  };
}

export function normalizeContactsContent(content: ContactsFunctionalContent) {
  return {
    contentType: "contacts" as const,
    phone: content.phone ?? null,
    email: content.email,
    address: content.address,
    city: content.city,
    state: content.state,
    postalCode: content.postalCode,
    businessHours: content.businessHours ?? null,
  };
}

export function normalizeSocialContent(content: SocialFunctionalContent) {
  const links = content.links
    .map((link) => ({
      platform: link.platform,
      url: link.url,
      displayOrder: link.displayOrder,
      isActive: link.isActive,
    }))
    .sort(
      (left, right) =>
        left.displayOrder - right.displayOrder || left.platform.localeCompare(right.platform, "en"),
    );
  return { contentType: "social_configuration" as const, links };
}

export function serializeCanonicalContent(content: CanonicalHomeContent): string {
  return JSON.stringify(content);
}

export function calculateContentHash(content: CanonicalHomeContent): string {
  const digest = createHash("sha256").update(serializeCanonicalContent(content), "utf8").digest("hex");
  return `sha256:${digest}`;
}

export function contentMatchesHash(content: CanonicalHomeContent, expectedHash: string): boolean {
  return calculateContentHash(content) === expectedHash;
}
