import { ROUTES, type RouteKey } from "../../../config/routes";

interface AdminRouteDefinition {
  label: string;
  enabled: boolean;
  selectable: boolean;
}

export const ADMIN_PUBLIC_ROUTE_DEFINITIONS = {
  home: { label: "Página Inicial", enabled: true, selectable: true },
  union: { label: "O Sindicato", enabled: true, selectable: true },
  board: { label: "Diretoria", enabled: true, selectable: true },
  bylaws: { label: "Estatuto", enabled: true, selectable: true },
  news: { label: "Notícias", enabled: true, selectable: true },
  notices: { label: "Comunicados", enabled: true, selectable: true },
  transparency: { label: "Transparência", enabled: true, selectable: true },
  documents: { label: "Documentos", enabled: true, selectable: true },
  gallery: { label: "Galeria", enabled: true, selectable: true },
  membership: { label: "Filie-se", enabled: true, selectable: true },
  contact: { label: "Contato", enabled: true, selectable: true },
  memberArea: { label: "Área do Filiado", enabled: false, selectable: false },
  services: { label: "Serviços", enabled: true, selectable: true },
  benefits: { label: "Convênios e Benefícios", enabled: true, selectable: true },
  legalAdvice: { label: "Assessoria Jurídica", enabled: true, selectable: true },
  guides: { label: "Guias e Requerimentos", enabled: true, selectable: true },
  calendar: { label: "Calendário", enabled: true, selectable: true },
  faq: { label: "Perguntas Frequentes", enabled: true, selectable: true },
  privacy: { label: "Política de Privacidade", enabled: true, selectable: true },
  terms: { label: "Termos de Uso", enabled: true, selectable: true },
} as const satisfies Record<RouteKey, AdminRouteDefinition>;

export type AdminPublicRouteKey = keyof typeof ADMIN_PUBLIC_ROUTE_DEFINITIONS;

export type SelectablePublicRouteKey = {
  [TKey in AdminPublicRouteKey]:
    (typeof ADMIN_PUBLIC_ROUTE_DEFINITIONS)[TKey]["enabled"] extends true
      ? (typeof ADMIN_PUBLIC_ROUTE_DEFINITIONS)[TKey]["selectable"] extends true
        ? TKey
        : never
      : never;
}[AdminPublicRouteKey];

export interface AdminPublicRouteOption {
  key: AdminPublicRouteKey;
  path: (typeof ROUTES)[AdminPublicRouteKey];
  label: string;
  enabled: boolean;
  selectable: boolean;
}

export const ADMIN_PUBLIC_ROUTE_CATALOG: readonly AdminPublicRouteOption[] = (
  Object.keys(ADMIN_PUBLIC_ROUTE_DEFINITIONS) as AdminPublicRouteKey[]
).map((key) => ({
  key,
  path: ROUTES[key],
  ...ADMIN_PUBLIC_ROUTE_DEFINITIONS[key],
}));

export function isSelectablePublicRouteKey(value: unknown): value is SelectablePublicRouteKey {
  if (typeof value !== "string" || !(value in ADMIN_PUBLIC_ROUTE_DEFINITIONS)) return false;
  const key = value as AdminPublicRouteKey;
  const definition = ADMIN_PUBLIC_ROUTE_DEFINITIONS[key];
  return definition.enabled && definition.selectable;
}

