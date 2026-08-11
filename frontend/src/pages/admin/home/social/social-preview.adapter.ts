import type { AdminSocialConfiguration } from "../../../../features/home-admin/domain/home-admin.types";
import { validateSocialUrl } from "../../../../features/home-admin/schemas/home-admin.editor.validators";

export interface SocialPreviewItem { id: string; label: string; href: string; shortLabel: string; }

export function adaptSocialConfigurationToPreview(value: AdminSocialConfiguration): SocialPreviewItem[] {
  return [...value.links]
    .filter((link) => link.active && validateSocialUrl(link.platform, link.url) === null)
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    .map((link) => ({ id: link.id, label: link.accessibleLabel.trim(), href: link.url, shortLabel: link.platform === "YouTube" ? "YT" : link.platform.slice(0, 2).toUpperCase() }));
}
