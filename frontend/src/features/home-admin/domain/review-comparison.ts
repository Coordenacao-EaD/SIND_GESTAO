import { formatPhone, formatPostalCode } from "../schemas/home-admin.editor.validators";
import type {
  AdminBanner,
  AdminFooterContacts,
  AdminSocialConfiguration,
  AdminSocialLink,
  HomeAdminResource,
} from "./home-admin.types";

export type ComparisonChange = "unchanged" | "changed" | "added" | "removed";

export const COMPARISON_CHANGE_LABELS: Record<ComparisonChange, string> = {
  unchanged: "Sem alteração",
  changed: "Alterado",
  added: "Adicionado",
  removed: "Removido",
};

export interface ComparisonField {
  id: string;
  label: string;
  /** Valor da versão pública vigente; `null` quando o campo não existe nela. */
  publicValue: string | null;
  /** Valor do conteúdo submetido; `null` quando o campo não existe nele. */
  submittedValue: string | null;
  change: ComparisonChange;
}

export interface ComparisonGroup {
  id: string;
  label: string;
  fields: ComparisonField[];
}

export const NOT_INFORMED = "Não informado";

function classify(publicValue: string | null, submittedValue: string | null): ComparisonChange {
  if (publicValue === null && submittedValue === null) return "unchanged";
  if (publicValue === null) return "added";
  if (submittedValue === null) return "removed";
  return publicValue === submittedValue ? "unchanged" : "changed";
}

/**
 * `rawPublic`/`rawSubmitted` decidem a igualdade; `display*` apenas formatam para leitura. Assim a
 * comparação nunca normaliza silenciosamente o conteúdo submetido.
 */
function field(
  id: string,
  label: string,
  rawPublic: string | null,
  rawSubmitted: string | null,
  format: (value: string) => string = (value) => value,
): ComparisonField {
  return {
    id,
    label,
    publicValue: rawPublic === null ? null : format(rawPublic),
    submittedValue: rawSubmitted === null ? null : format(rawSubmitted),
    change: classify(rawPublic, rawSubmitted),
  };
}

const yesNo = (value: boolean) => (value ? "Sim" : "Não");
const orNotInformed = (value: string) => (value.trim() === "" ? NOT_INFORMED : value);

function bannerCtaParts(banner: AdminBanner | null) {
  if (!banner) return { enabled: null, label: null, kind: null, target: null };
  if (!banner.cta.enabled) {
    return { enabled: yesNo(false), label: null, kind: null, target: null };
  }
  return {
    enabled: yesNo(true),
    label: banner.cta.label,
    kind: banner.cta.kind === "internal" ? "Rota interna" : "URL externa",
    target: banner.cta.kind === "internal" ? banner.cta.route : banner.cta.url,
  };
}

function compareBanner(published: AdminBanner | null, submitted: AdminBanner): ComparisonGroup[] {
  const publicCta = bannerCtaParts(published);
  const submittedCta = bannerCtaParts(submitted);
  return [
    {
      id: "banner-content",
      label: "Conteúdo do banner",
      fields: [
        field("title", "Título", published?.title ?? null, submitted.title),
        field("description", "Texto complementar", published?.description ?? null, submitted.description),
        field("altText", "Texto alternativo", published?.altText ?? null, submitted.altText),
        field("image", "Imagem demonstrativa", published?.image.assetId ?? null, submitted.image.assetId),
        field("imageName", "Nome acessível da imagem", published?.image.accessibleName ?? null, submitted.image.accessibleName),
      ],
    },
    {
      id: "banner-cta",
      label: "Chamada para ação",
      fields: [
        field("ctaEnabled", "CTA habilitado", publicCta.enabled, submittedCta.enabled),
        field("ctaLabel", "Rótulo do CTA", publicCta.label, submittedCta.label),
        field("ctaKind", "Tipo de destino", publicCta.kind, submittedCta.kind),
        field("ctaTarget", "Destino", publicCta.target, submittedCta.target),
      ],
    },
  ];
}

function compareContacts(published: AdminFooterContacts | null, submitted: AdminFooterContacts): ComparisonGroup[] {
  return [
    {
      id: "contacts-channels",
      label: "Canais de contato",
      fields: [
        field("phone", "Telefone público", published?.phone ?? null, submitted.phone, (value) => orNotInformed(formatPhone(value))),
        field("email", "E-mail institucional", published?.email ?? null, submitted.email, orNotInformed),
      ],
    },
    {
      id: "contacts-address",
      label: "Endereço",
      fields: [
        field("address", "Logradouro e número", published?.address ?? null, submitted.address, orNotInformed),
        field("municipality", "Município", published?.municipality ?? null, submitted.municipality, orNotInformed),
        field("stateCode", "Unidade federativa", published?.stateCode ?? null, submitted.stateCode, orNotInformed),
        field("postalCode", "CEP", published?.postalCode ?? null, submitted.postalCode, (value) => orNotInformed(formatPostalCode(value))),
      ],
    },
    {
      id: "contacts-service",
      label: "Atendimento",
      fields: [
        field("businessHours", "Horário de atendimento", published?.businessHours ?? null, submitted.businessHours, orNotInformed),
      ],
    },
  ];
}

function describeLink(link: AdminSocialLink | undefined): string | null {
  if (!link) return null;
  return `${link.platform} · ${link.url} · rótulo "${link.accessibleLabel}" · posição ${link.order + 1} · ${link.active ? "ativo" : "inativo"}`;
}

/**
 * A configuração social é comparada como unidade completa: cada link é uma linha da mesma unidade
 * versionada, nunca uma revisão independente. Os IDs estáveis da F2.2B fazem o pareamento.
 */
function compareSocial(published: AdminSocialConfiguration | null, submitted: AdminSocialConfiguration): ComparisonGroup[] {
  const publishedLinks = published?.links ?? [];
  const ids = [...new Set([...publishedLinks.map((link) => link.id), ...submitted.links.map((link) => link.id)])];
  const fields = ids.map((id) => {
    const before = publishedLinks.find((link) => link.id === id);
    const after = submitted.links.find((link) => link.id === id);
    return field(`link-${id}`, `Link ${after?.platform ?? before?.platform ?? id}`, describeLink(before), describeLink(after));
  });
  return [
    {
      id: "social-unit",
      label: "Configuração de redes sociais (unidade completa)",
      fields: [
        field("linkCount", "Quantidade de links", published ? String(publishedLinks.length) : null, String(submitted.links.length)),
        field(
          "activeCount",
          "Links ativos",
          published ? String(publishedLinks.filter((link) => link.active).length) : null,
          String(submitted.links.filter((link) => link.active).length),
        ),
        field(
          "order",
          "Ordem das plataformas",
          published ? [...publishedLinks].sort((a, b) => a.order - b.order).map((link) => link.platform).join(" → ") : null,
          [...submitted.links].sort((a, b) => a.order - b.order).map((link) => link.platform).join(" → "),
        ),
      ],
    },
    { id: "social-links", label: "Links da configuração", fields },
  ];
}

export function buildReviewComparison(
  published: HomeAdminResource | null,
  submitted: HomeAdminResource,
): ComparisonGroup[] {
  switch (submitted.resourceType) {
    case "banner":
      return compareBanner(published?.resourceType === "banner" ? published : null, submitted);
    case "footer_contacts":
      return compareContacts(published?.resourceType === "footer_contacts" ? published : null, submitted);
    case "footer_social_links":
      return compareSocial(published?.resourceType === "footer_social_links" ? published : null, submitted);
  }
}

export function countChanges(groups: readonly ComparisonGroup[]): number {
  return groups.reduce(
    (total, group) => total + group.fields.filter((item) => item.change !== "unchanged").length,
    0,
  );
}
