export type EditorialStatus = "draft" | "review" | "approved" | "published" | "archived";
export type SocialPlatform = "facebook" | "instagram" | "youtube" | "linkedin" | "x";
export type ReviewContentType = "banner" | "contacts" | "social_configuration";
export type ReviewDecision =
  | "pending"
  | "approved"
  | "changes_requested"
  | "cancelled"
  | "invalidated";

export interface SiteHomeBanner {
  id: string;
  title: string;
  subtitle: string | null;
  bodyText: string;
  imageUrl: string | null;
  imageAlt: string | null;
  ctaEnabled: boolean;
  ctaLabel: string | null;
  ctaLinkType: "internal" | "external" | null;
  ctaLinkValue: string | null;
  status: EditorialStatus;
  versionNumber: number;
  publishedAt: Date | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BannerDraftInput {
  title: string;
  subtitle: string | null;
  bodyText: string;
  imageUrl: string | null;
  imageAlt: string | null;
  ctaEnabled: boolean;
  ctaLabel: string | null;
  ctaLinkType: "internal" | "external" | null;
  ctaLinkValue: string | null;
  versionNumber: number;
  createdBy: string;
}

export interface BannerDraftUpdateInput extends Omit<BannerDraftInput, "createdBy"> {
  updatedBy: string;
}

export interface SitePublicContacts {
  id: string;
  phone: string | null;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  businessHours: string | null;
  status: EditorialStatus;
  versionNumber: number;
  publishedAt: Date | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactsDraftInput {
  phone: string | null;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  businessHours: string | null;
  versionNumber: number;
  createdBy: string;
}

export interface ContactsDraftUpdateInput extends Omit<ContactsDraftInput, "createdBy"> {
  updatedBy: string;
}

export interface SiteSocialConfiguration {
  id: string;
  status: EditorialStatus;
  versionNumber: number;
  submittedAt: Date | null;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialConfigurationDraftInput {
  versionNumber: number;
  createdBy: string;
}

export interface SocialConfigurationDraftUpdateInput {
  versionNumber: number;
  updatedBy: string;
}

export interface SiteSocialLink {
  id: string;
  socialConfigurationId: string;
  platform: SocialPlatform;
  url: string;
  displayOrder: number;
  isActive: boolean;
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialLinkReplacementInput {
  platform: SocialPlatform;
  url: string;
  displayOrder: number;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string | null;
}

export interface SiteHomeReview {
  id: string;
  contentType: ReviewContentType;
  bannerId: string | null;
  contactsId: string | null;
  socialConfigurationId: string | null;
  contentId: string;
  cycleNumber: number;
  contentVersion: number;
  submittedContentHash: string;
  decision: ReviewDecision;
  submittedBy: string;
  submittedAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  invalidatedBy: string | null;
  invalidatedAt: Date | null;
  invalidationReason: string | null;
}

export type ReviewTarget =
  | { contentType: "banner"; bannerId: string }
  | { contentType: "contacts"; contactsId: string }
  | { contentType: "social_configuration"; socialConfigurationId: string };

export type CreateReviewCycleInput = ReviewTarget & {
  cycleNumber: number;
  contentVersion: number;
  submittedContentHash: string;
  submittedBy: string;
};

export interface SiteHomeVersion {
  id: string;
  bannerId: string;
  contactsId: string;
  socialConfigurationId: string | null;
  versionNumber: number;
  snapshotJson: object;
  changeSummary: string;
  publishedAt: Date;
  isCurrent: boolean;
  createdBy: string;
}

export interface CreateHomeVersionInput {
  bannerId: string;
  contactsId: string;
  socialConfigurationId: string | null;
  versionNumber: number;
  snapshotJson: object;
  changeSummary: string;
  isCurrent: boolean;
  createdBy: string;
}
