import type { AdminResourceType } from "../domain/home-admin.types";

export const HOME_ADMIN_CAPABILITIES = {
  editBanner: "home.banner.edit",
  decideReview: "home.review.decide",
  publishBanner: "home.banner.publish",
  publishFooterContacts: "home.footer_contacts.publish",
  publishFooterSocialLinks: "home.footer_social_links.publish",
  viewHistory: "home.history.view",
  restoreVersion: "home.version.restore",
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

