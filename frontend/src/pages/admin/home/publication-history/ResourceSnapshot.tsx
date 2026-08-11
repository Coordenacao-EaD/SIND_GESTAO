import type { HomeAdminResource } from "../../../../features/home-admin/domain/home-admin.types";
import styles from "./F22D.module.css";

export function ResourceSnapshot({ resource }: { resource: HomeAdminResource }) {
  const rows: Array<[string, string]> = resource.resourceType === "banner"
    ? [
        ["Título", resource.title], ["Subtítulo", resource.description],
        ["CTA", resource.cta.enabled ? resource.cta.label : "Desativado"],
        ["Imagem demonstrativa", resource.image.accessibleName],
      ]
    : resource.resourceType === "footer_contacts"
      ? [["Telefone", resource.phone || "Não informado"], ["E-mail", resource.email], ["Endereço", resource.address], ["Município", resource.municipality], ["UF", resource.stateCode], ["CEP", resource.postalCode], ["Horário", resource.businessHours || "Não informado"]]
      : resource.links.map((link) => [link.platform, `${link.url} · ordem ${link.order + 1} · ${link.active ? "ativa" : "inativa"}`]);
  return <ul className={styles.snapshot}>{rows.map(([label, value], index) => <li key={`${label}-${index}`}><strong>{label}</strong><span>{value}</span></li>)}</ul>;
}
