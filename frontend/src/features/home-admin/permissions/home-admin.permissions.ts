import type { AdminResourceType } from "../domain/home-admin.types";

export const HOME_ADMIN_CAPABILITIES = {
  editBanner: "home.banner.edit",
  editFooterContacts: "site.footer.contacts.edit",
  editFooterSocialLinks: "site.footer.social_links.edit",
  previewHome: "site.home.preview",
  decideReview: "site.home.review",
  publishBanner: "site.home.banner.publish",
  publishFooterContacts: "site.footer.contacts.publish",
  publishFooterSocialLinks: "site.footer.social_links.publish",
  viewHistory: "site.home.history.view",
  restoreVersion: "site.home.version.restore",
} as const;

export type HomeAdminCapability =
  (typeof HOME_ADMIN_CAPABILITIES)[keyof typeof HOME_ADMIN_CAPABILITIES];

export interface SimulatedAdminProfile {
  actorId: string;
  displayName: string;
  capabilities: readonly HomeAdminCapability[];
}

export function hasCapability(
  profile: SimulatedAdminProfile,
  capability: HomeAdminCapability,
): boolean {
  return profile.capabilities.includes(capability);
}

export function publishCapabilityFor(resourceType: AdminResourceType): HomeAdminCapability {
  switch (resourceType) {
    case "banner":
      return HOME_ADMIN_CAPABILITIES.publishBanner;
    case "footer_contacts":
      return HOME_ADMIN_CAPABILITIES.publishFooterContacts;
    case "footer_social_links":
      return HOME_ADMIN_CAPABILITIES.publishFooterSocialLinks;
  }
}

export function editCapabilityFor(resourceType: AdminResourceType): HomeAdminCapability {
  switch (resourceType) {
    case "banner": return HOME_ADMIN_CAPABILITIES.editBanner;
    case "footer_contacts": return HOME_ADMIN_CAPABILITIES.editFooterContacts;
    case "footer_social_links": return HOME_ADMIN_CAPABILITIES.editFooterSocialLinks;
  }
}
