import type { AdminFooterContacts } from "../../../../features/home-admin/domain/home-admin.types";
import { formatPhone, formatPostalCode, normalizePhone, normalizePostalCode } from "../../../../features/home-admin/schemas/home-admin.editor.validators";

export interface ContactPreviewModel {
  phone: string | null;
  phoneHref: string | null;
  email: string | null;
  emailHref: string | null;
  address: string;
  businessHours: string | null;
}

export function adaptContactsToPreview(value: AdminFooterContacts): ContactPreviewModel {
  const phoneDigits = normalizePhone(value.phone).replace(/\D/g, "");
  const validPhone = phoneDigits.length >= 10 && phoneDigits.length <= 15;
  const email = value.email.trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const postalCode = normalizePostalCode(value.postalCode);
  const address = [value.address.trim(), value.municipality.trim(), value.stateCode, postalCode.length === 8 ? `CEP ${formatPostalCode(postalCode)}` : ""].filter(Boolean).join(" · ");
  return {
    phone: validPhone ? formatPhone(value.phone) : null,
    phoneHref: validPhone ? `tel:${normalizePhone(value.phone)}` : null,
    email: validEmail ? email : null,
    emailHref: validEmail ? `mailto:${email}` : null,
    address,
    businessHours: value.businessHours.trim() || null,
  };
}
