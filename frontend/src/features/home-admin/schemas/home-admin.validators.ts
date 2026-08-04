import { isSelectablePublicRouteKey } from "../contracts/public-route-catalog";
import {
  ADMIN_RESOURCE_TYPES,
  EDITORIAL_STATES,
  REVIEW_DECISIONS,
  type AdminBanner,
  type AdminError,
  type AdminFooterContacts,
  type AdminSocialConfiguration,
  type BannerCta,
  type ReviewCycle,
  type VersionMetadata,
} from "../domain/home-admin.types";

export interface ValidationIssue {
  path: string;
  code: "required" | "invalid" | "unknown_property" | "duplicate" | "unsafe";
  message: string;
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issues: ValidationIssue[] };

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function issue(path: string, code: ValidationIssue["code"], message: string): ValidationIssue {
  return { path, code, message };
}

function checkExactKeys(
  value: UnknownRecord,
  allowedKeys: readonly string[],
  path: string,
): ValidationIssue[] {
  return Object.keys(value)
    .filter((key) => !allowedKeys.includes(key))
    .map((key) => issue(`${path}.${key}`, "unknown_property", "Propriedade desconhecida."));
}

function requireNonEmptyString(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (typeof value !== "string" || value.trim() === "") {
    issues.push(issue(path, "required", "Informe um texto não vazio."));
  }
}

function requireNullableString(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (value !== null && typeof value !== "string") {
    issues.push(issue(path, "invalid", "Use texto ou null."));
  }
}

function requireIsoDate(value: unknown, path: string, issues: ValidationIssue[], nullable = false): void {
  if (nullable && value === null) return;
  if (typeof value !== "string" || value.trim() === "" || Number.isNaN(Date.parse(value))) {
    issues.push(issue(path, "invalid", "Informe uma data ISO válida."));
  }
}

function requirePositiveInteger(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!Number.isInteger(value) || Number(value) < 1) {
    issues.push(issue(path, "invalid", "Informe um inteiro positivo."));
  }
}

function requireNonNegativeInteger(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!Number.isInteger(value) || Number(value) < 0) {
    issues.push(issue(path, "invalid", "Informe um inteiro não negativo."));
  }
}

function isSafeHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

function validateVersion(value: unknown, path: string): ValidationIssue[] {
  if (!isRecord(value)) return [issue(path, "invalid", "Metadados de versão inválidos.")];
  const issues = checkExactKeys(value, [
    "editorialVersion", "publicVersion", "revision", "contentHash", "createdAt", "updatedAt",
    "createdBy", "updatedBy", "submittedAt", "approvedAt", "publishedAt", "archivedAt",
  ], path);
  requirePositiveInteger(value.editorialVersion, `${path}.editorialVersion`, issues);
  if (value.publicVersion !== null) {
    requirePositiveInteger(value.publicVersion, `${path}.publicVersion`, issues);
  }
  requireNonNegativeInteger(value.revision, `${path}.revision`, issues);
  requireNonEmptyString(value.contentHash, `${path}.contentHash`, issues);
  requireIsoDate(value.createdAt, `${path}.createdAt`, issues);
  requireIsoDate(value.updatedAt, `${path}.updatedAt`, issues);
  requireNonEmptyString(value.createdBy, `${path}.createdBy`, issues);
  requireNonEmptyString(value.updatedBy, `${path}.updatedBy`, issues);
  requireIsoDate(value.submittedAt, `${path}.submittedAt`, issues, true);
  requireIsoDate(value.approvedAt, `${path}.approvedAt`, issues, true);
  requireIsoDate(value.publishedAt, `${path}.publishedAt`, issues, true);
  requireIsoDate(value.archivedAt, `${path}.archivedAt`, issues, true);
  return issues;
}

export function parseBannerCta(value: unknown): ValidationResult<BannerCta> {
  if (!isRecord(value) || typeof value.enabled !== "boolean") {
    return { success: false, issues: [issue("cta", "invalid", "CTA inválido.")] };
  }

  const issues = value.enabled
    ? checkExactKeys(value, value.kind === "internal"
      ? ["enabled", "kind", "label", "route"]
      : ["enabled", "kind", "label", "url"], "cta")
    : checkExactKeys(value, ["enabled"], "cta");

  if (!value.enabled) {
    return issues.length === 0
      ? { success: true, data: { enabled: false } }
      : { success: false, issues };
  }

  requireNonEmptyString(value.label, "cta.label", issues);
  if (value.kind === "internal") {
    if (!isSelectablePublicRouteKey(value.route)) {
      issues.push(issue("cta.route", "invalid", "Selecione uma rota habilitada do catálogo."));
    }
  } else if (value.kind === "external") {
    if (!isSafeHttpsUrl(value.url)) {
      issues.push(issue("cta.url", "unsafe", "Use uma URL HTTPS segura."));
    }
  } else {
    issues.push(issue("cta.kind", "invalid", "Tipo de CTA desconhecido."));
  }

  return issues.length === 0
    ? { success: true, data: value as unknown as BannerCta }
    : { success: false, issues };
}

export function parseReviewCycle(value: unknown): ValidationResult<ReviewCycle> {
  if (!isRecord(value)) {
    return { success: false, issues: [issue("review", "invalid", "Ciclo de revisão inválido.")] };
  }
  const issues = checkExactKeys(value, [
    "cycleId", "resourceType", "resourceId", "submittedVersion", "submittedHash", "submittedBy",
    "reviewerId", "submittedAt", "decidedAt", "decision", "opinion", "cancellationReason",
    "invalidationReason",
  ], "review");
  requireNonEmptyString(value.cycleId, "review.cycleId", issues);
  if (!ADMIN_RESOURCE_TYPES.includes(value.resourceType as never)) {
    issues.push(issue("review.resourceType", "invalid", "Recurso administrativo inválido."));
  }
  requireNonEmptyString(value.resourceId, "review.resourceId", issues);
  requirePositiveInteger(value.submittedVersion, "review.submittedVersion", issues);
  requireNonEmptyString(value.submittedHash, "review.submittedHash", issues);
  requireNonEmptyString(value.submittedBy, "review.submittedBy", issues);
  requireNullableString(value.reviewerId, "review.reviewerId", issues);
  requireIsoDate(value.submittedAt, "review.submittedAt", issues);
  requireIsoDate(value.decidedAt, "review.decidedAt", issues, true);
  if (!REVIEW_DECISIONS.includes(value.decision as never)) {
    issues.push(issue("review.decision", "invalid", "Decisão de revisão inválida."));
  }
  requireNullableString(value.opinion, "review.opinion", issues);
  requireNullableString(value.cancellationReason, "review.cancellationReason", issues);
  requireNullableString(value.invalidationReason, "review.invalidationReason", issues);

  if (value.decision === "changes_requested" && !(typeof value.opinion === "string" && value.opinion.trim())) {
    issues.push(issue("review.opinion", "required", "A solicitação de ajustes exige justificativa."));
  }
  if (value.decision === "cancelled" && !(typeof value.cancellationReason === "string" && value.cancellationReason.trim())) {
    issues.push(issue("review.cancellationReason", "required", "O cancelamento exige motivo."));
  }
  if (value.decision === "invalidated" && !(typeof value.invalidationReason === "string" && value.invalidationReason.trim())) {
    issues.push(issue("review.invalidationReason", "required", "A invalidação exige motivo."));
  }

  return issues.length === 0
    ? { success: true, data: value as unknown as ReviewCycle }
    : { success: false, issues };
}

function validateResourceBase(
  value: UnknownRecord,
  resourceType: string,
  path: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (value.resourceType !== resourceType) {
    issues.push(issue(`${path}.resourceType`, "invalid", "Discriminador de recurso incorreto."));
  }
  requireNonEmptyString(value.id, `${path}.id`, issues);
  if (!EDITORIAL_STATES.includes(value.state as never)) {
    issues.push(issue(`${path}.state`, "invalid", "Estado editorial inválido."));
  }
  if (value.previousState !== null && !EDITORIAL_STATES.includes(value.previousState as never)) {
    issues.push(issue(`${path}.previousState`, "invalid", "Estado anterior inválido."));
  }
  issues.push(...validateVersion(value.version, `${path}.version`));
  if (value.review !== null) {
    const reviewResult = parseReviewCycle(value.review);
    if (!reviewResult.success) issues.push(...reviewResult.issues);
  }
  return issues;
}

export function parseAdminBanner(value: unknown): ValidationResult<AdminBanner> {
  if (!isRecord(value)) {
    return { success: false, issues: [issue("banner", "invalid", "Banner inválido.")] };
  }
  const issues = checkExactKeys(value, [
    "resourceType", "id", "state", "previousState", "version", "review",
    "title", "description", "altText", "image", "cta",
  ], "banner");
  issues.push(...validateResourceBase(value, "banner", "banner"));
  requireNonEmptyString(value.title, "banner.title", issues);
  requireNonEmptyString(value.description, "banner.description", issues);
  requireNonEmptyString(value.altText, "banner.altText", issues);
  if (!isRecord(value.image)) {
    issues.push(issue("banner.image", "invalid", "Referência de imagem inválida."));
  } else {
    issues.push(...checkExactKeys(value.image, ["kind", "assetId", "accessibleName"], "banner.image"));
    if (value.image.kind !== "existing_asset") {
      issues.push(issue("banner.image.kind", "invalid", "A F2.1 aceita somente asset existente."));
    }
    requireNonEmptyString(value.image.assetId, "banner.image.assetId", issues);
    requireNonEmptyString(value.image.accessibleName, "banner.image.accessibleName", issues);
  }
  const ctaResult = parseBannerCta(value.cta);
  if (!ctaResult.success) issues.push(...ctaResult.issues);
  return issues.length === 0
    ? { success: true, data: value as unknown as AdminBanner }
    : { success: false, issues };
}

export function normalizeFooterContacts(value: AdminFooterContacts): AdminFooterContacts {
  return {
    ...value,
    phone: value.phone.trim(),
    email: value.email.trim().toLowerCase(),
    address: value.address.trim(),
  };
}

export function parseAdminFooterContacts(value: unknown): ValidationResult<AdminFooterContacts> {
  if (!isRecord(value)) {
    return { success: false, issues: [issue("contacts", "invalid", "Contatos inválidos.")] };
  }
  const issues = checkExactKeys(value, [
    "resourceType", "id", "state", "previousState", "version", "review",
    "phone", "email", "address",
  ], "contacts");
  issues.push(...validateResourceBase(value, "footer_contacts", "contacts"));
  if (typeof value.phone !== "string" || (value.phone.trim() && value.phone.replace(/\D/g, "").length < 8)) {
    issues.push(issue("contacts.phone", "invalid", "Telefone inválido."));
  }
  if (typeof value.email !== "string" || (value.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim()))) {
    issues.push(issue("contacts.email", "invalid", "E-mail inválido."));
  }
  if (typeof value.address !== "string") {
    issues.push(issue("contacts.address", "invalid", "Endereço inválido."));
  }
  if ([value.phone, value.email, value.address].every((item) => typeof item !== "string" || item.trim() === "")) {
    issues.push(issue("contacts", "required", "Informe pelo menos um canal de contato."));
  }
  return issues.length === 0
    ? { success: true, data: normalizeFooterContacts(value as unknown as AdminFooterContacts) }
    : { success: false, issues };
}

export function parseAdminSocialConfiguration(value: unknown): ValidationResult<AdminSocialConfiguration> {
  if (!isRecord(value)) {
    return { success: false, issues: [issue("social", "invalid", "Configuração social inválida.")] };
  }
  const issues = checkExactKeys(value, [
    "resourceType", "id", "state", "previousState", "version", "review", "links",
  ], "social");
  issues.push(...validateResourceBase(value, "footer_social_links", "social"));
  if (!Array.isArray(value.links)) {
    issues.push(issue("social.links", "invalid", "Informe uma coleção de redes sociais."));
  } else {
    const ids = new Set<string>();
    const platforms = new Set<string>();
    const orders = new Set<number>();
    value.links.forEach((link, index) => {
      const path = `social.links.${index}`;
      if (!isRecord(link)) {
        issues.push(issue(path, "invalid", "Rede social inválida."));
        return;
      }
      issues.push(...checkExactKeys(link, ["id", "platform", "url", "accessibleLabel", "order", "active"], path));
      requireNonEmptyString(link.id, `${path}.id`, issues);
      requireNonEmptyString(link.platform, `${path}.platform`, issues);
      requireNonEmptyString(link.accessibleLabel, `${path}.accessibleLabel`, issues);
      requireNonNegativeInteger(link.order, `${path}.order`, issues);
      if (!isSafeHttpsUrl(link.url)) issues.push(issue(`${path}.url`, "unsafe", "Use uma URL HTTPS segura."));
      if (typeof link.active !== "boolean") issues.push(issue(`${path}.active`, "invalid", "Situação ativa inválida."));
      if (typeof link.id === "string" && ids.has(link.id)) issues.push(issue(`${path}.id`, "duplicate", "ID duplicado."));
      if (typeof link.platform === "string" && platforms.has(link.platform.toLowerCase())) {
        issues.push(issue(`${path}.platform`, "duplicate", "Plataforma duplicada."));
      }
      if (typeof link.order === "number" && orders.has(link.order)) issues.push(issue(`${path}.order`, "duplicate", "Ordem duplicada."));
      if (typeof link.id === "string") ids.add(link.id);
      if (typeof link.platform === "string") platforms.add(link.platform.toLowerCase());
      if (typeof link.order === "number") orders.add(link.order);
    });
    const sortedOrders = [...orders].sort((left, right) => left - right);
    if (sortedOrders.some((order, index) => order !== index)) {
      issues.push(issue("social.links", "invalid", "A ordem deve ser contínua e iniciar em zero."));
    }
  }
  return issues.length === 0
    ? { success: true, data: value as unknown as AdminSocialConfiguration }
    : { success: false, issues };
}

export function parseAdminError(value: unknown): ValidationResult<AdminError> {
  if (!isRecord(value) || typeof value.kind !== "string") {
    return { success: false, issues: [issue("error", "invalid", "Erro administrativo inválido.")] };
  }
  const keysByKind: Record<string, readonly string[]> = {
    unauthenticated: ["kind", "status", "message"],
    forbidden: ["kind", "status", "message", "requiredCapability"],
    conflict: ["kind", "status", "message", "expectedRevision", "actualRevision"],
    validation: ["kind", "status", "message", "fields"],
    unavailable: ["kind", "message", "retryable"],
    unexpected: ["kind", "message", "retryable"],
  };
  const allowedKeys = keysByKind[value.kind];
  if (!allowedKeys) return { success: false, issues: [issue("error.kind", "invalid", "Tipo de erro desconhecido.")] };
  const issues = checkExactKeys(value, allowedKeys, "error");
  requireNonEmptyString(value.message, "error.message", issues);
  const expectedStatus = { unauthenticated: 401, forbidden: 403, conflict: 409, validation: 422 }[value.kind];
  if (expectedStatus !== undefined && value.status !== expectedStatus) {
    issues.push(issue("error.status", "invalid", "Status incompatível com o tipo de erro."));
  }
  if (value.kind === "forbidden") {
    requireNonEmptyString(value.requiredCapability, "error.requiredCapability", issues);
  }
  if (value.kind === "conflict") {
    requireNonNegativeInteger(value.expectedRevision, "error.expectedRevision", issues);
    requireNonNegativeInteger(value.actualRevision, "error.actualRevision", issues);
  }
  if (value.kind === "validation") {
    if (!isRecord(value.fields)) {
      issues.push(issue("error.fields", "invalid", "Erros de campo inválidos."));
    } else {
      for (const [field, messages] of Object.entries(value.fields)) {
        if (!Array.isArray(messages) || messages.length === 0
          || messages.some((message) => typeof message !== "string" || message.trim() === "")) {
          issues.push(issue(`error.fields.${field}`, "invalid", "Informe ao menos uma mensagem válida."));
        }
      }
    }
  }
  if (value.kind === "unavailable" && value.retryable !== true) {
    issues.push(issue("error.retryable", "invalid", "Indisponibilidade deve ser retentável."));
  }
  if (value.kind === "unexpected" && value.retryable !== false) {
    issues.push(issue("error.retryable", "invalid", "Erro inesperado não é retentável automaticamente."));
  }
  return issues.length === 0
    ? { success: true, data: value as unknown as AdminError }
    : { success: false, issues };
}

export function isVersionMetadata(value: unknown): value is VersionMetadata {
  return validateVersion(value, "version").length === 0;
}
