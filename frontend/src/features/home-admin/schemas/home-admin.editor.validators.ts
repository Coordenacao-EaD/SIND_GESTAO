import {
  BRAZILIAN_STATE_CODES,
  SOCIAL_PLATFORMS,
  type AdminFooterContacts,
  type AdminSocialConfiguration,
  type AdminSocialLink,
  type SocialPlatform,
} from "../domain/home-admin.types";
import {
  normalizeFooterContacts,
  parseAdminFooterContacts,
  parseAdminSocialConfiguration,
  type ValidationIssue,
  type ValidationResult,
} from "./home-admin.validators";

export const BRAZILIAN_STATE_OPTIONS = BRAZILIAN_STATE_CODES.map((code) => ({ code, label: code }));
export const SOCIAL_PLATFORM_OPTIONS = SOCIAL_PLATFORMS.map((platform) => ({ value: platform, label: platform }));

export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const prefix = trimmed.startsWith("+") ? "+" : "";
  return `${prefix}${trimmed.replace(/\D/g, "")}`;
}

export function formatPhone(value: string): string {
  const normalized = normalizePhone(value);
  const international = normalized.startsWith("+");
  const digits = normalized.replace(/\D/g, "").slice(0, 15);
  if (international) {
    const country = digits.slice(0, 2);
    const area = digits.slice(2, 4);
    const first = digits.slice(4, digits.length > 12 ? 9 : 8);
    const last = digits.slice(digits.length > 12 ? 9 : 8);
    return [`+${country}`, area, first, last].filter(Boolean).join(" ");
  }
  if (digits.length <= 2) return digits;
  const area = digits.slice(0, 2);
  const first = digits.slice(2, digits.length > 10 ? 7 : 6);
  const last = digits.slice(digits.length > 10 ? 7 : 6);
  return `(${area})${first ? ` ${first}` : ""}${last ? `-${last}` : ""}`;
}

export function normalizePostalCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatPostalCode(value: string): string {
  const digits = normalizePostalCode(value);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

function add(issues: ValidationIssue[], path: string, code: ValidationIssue["code"], message: string) {
  issues.push({ path, code, message });
}

const CONTACT_EDITOR_FIELDS = ["phone", "email", "address", "municipality", "stateCode", "postalCode", "businessHours"] as const;

// The editor only re-validates the fields it renders; anything else (shape, versioning) stays with the F2.1 contract.
function hasEditableContactFields(value: unknown): value is AdminFooterContacts {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return CONTACT_EDITOR_FIELDS.every((field) => typeof candidate[field] === "string");
}

function collectContactsEditorIssues(data: AdminFooterContacts): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const phoneDigits = normalizePhone(data.phone).replace(/\D/g, "");
  if (data.phone && (phoneDigits.length < 10 || phoneDigits.length > 15)) {
    add(issues, "contacts.phone", "invalid", "Informe um telefone nacional ou internacional válido.");
  }
  if (!data.email) add(issues, "contacts.email", "required", "Informe o e-mail institucional.");
  else if (data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    add(issues, "contacts.email", "invalid", "Informe um e-mail institucional válido, com até 254 caracteres.");
  }
  if (data.address.length < 3 || data.address.length > 255) {
    add(issues, "contacts.address", "invalid", "Informe logradouro e número entre 3 e 255 caracteres.");
  }
  if (!data.municipality || data.municipality.length > 100) {
    add(issues, "contacts.municipality", data.municipality ? "invalid" : "required", "Informe um município com até 100 caracteres.");
  }
  if (!BRAZILIAN_STATE_CODES.includes(data.stateCode)) {
    add(issues, "contacts.stateCode", "invalid", "Selecione uma UF oficial.");
  }
  if (normalizePostalCode(data.postalCode).length !== 8) {
    add(issues, "contacts.postalCode", "invalid", "Informe um CEP com exatamente 8 dígitos.");
  }
  if (data.businessHours.length > 255) {
    add(issues, "contacts.businessHours", "invalid", "Use até 255 caracteres para o horário de atendimento.");
  }
  return issues;
}

export function parseAdminFooterContactsEditor(value: unknown): ValidationResult<AdminFooterContacts> {
  const base = parseAdminFooterContacts(value);
  if (!base.success) {
    // A contract rejection must never become a success, but the fields the editor also owns keep the
    // field-specific F2.2B message instead of the coarser contract text.
    if (!hasEditableContactFields(value)) return base;
    const editorIssues = collectContactsEditorIssues(normalizeFooterContacts(value));
    const superseded = new Set(editorIssues.map((item) => item.path));
    return { success: false, issues: [...base.issues.filter((item) => !superseded.has(item.path)), ...editorIssues] };
  }
  const data = normalizeFooterContacts(base.data);
  const issues = collectContactsEditorIssues(data);
  return issues.length ? { success: false, issues } : {
    success: true,
    data: { ...data, phone: normalizePhone(data.phone), postalCode: normalizePostalCode(data.postalCode) },
  };
}

const SOCIAL_HOSTS: Record<SocialPlatform, readonly string[]> = {
  Facebook: ["facebook.com", "www.facebook.com", "fb.com", "www.fb.com"],
  Instagram: ["instagram.com", "www.instagram.com"],
  YouTube: ["youtube.com", "www.youtube.com", "youtu.be"],
  LinkedIn: ["linkedin.com", "www.linkedin.com"],
  X: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
};

export function validateSocialUrl(platform: SocialPlatform, value: string): string | null {
  if (value.includes("\\") || [...value].some((character) => character.charCodeAt(0) <= 31 || character.charCodeAt(0) === 127)) {
    return "A URL contém caracteres não permitidos.";
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return "Use uma URL HTTPS sem credenciais.";
    if (!SOCIAL_HOSTS[platform].includes(url.hostname.toLowerCase())) return `Use um domínio oficial de ${platform}.`;
    return null;
  } catch {
    return "Informe uma URL absoluta e válida.";
  }
}

export function parseAdminSocialConfigurationEditor(value: unknown): ValidationResult<AdminSocialConfiguration> {
  const base = parseAdminSocialConfiguration(value);
  if (!base.success) return base;
  const data = base.data;
  const issues: ValidationIssue[] = [];
  const platforms = new Map<SocialPlatform, number>();
  data.links.forEach((link: AdminSocialLink, index) => {
    const path = `social.links.${index}`;
    if (!SOCIAL_PLATFORMS.includes(link.platform)) add(issues, `${path}.platform`, "invalid", "Selecione uma plataforma permitida.");
    const first = platforms.get(link.platform);
    if (first !== undefined && !issues.some((item) => item.path === `${path}.platform` && item.code === "duplicate")) {
      add(issues, `${path}.platform`, "duplicate", `A plataforma já é usada no item ${first + 1}.`);
    }
    platforms.set(link.platform, first ?? index);
    const urlError = SOCIAL_PLATFORMS.includes(link.platform) ? validateSocialUrl(link.platform, link.url) : null;
    if (urlError) add(issues, `${path}.url`, "unsafe", urlError);
    if (link.accessibleLabel.trim().length < 2 || link.accessibleLabel.length > 100) {
      add(issues, `${path}.accessibleLabel`, "invalid", "Informe um rótulo acessível entre 2 e 100 caracteres.");
    }
  });
  return issues.length ? { success: false, issues } : { success: true, data };
}

export function validateCancellationReason(value: string): string | null {
  const length = value.trim().length;
  if (length < 10) return "Informe um motivo com pelo menos 10 caracteres.";
  if (length > 500) return "Use no máximo 500 caracteres.";
  return null;
}
