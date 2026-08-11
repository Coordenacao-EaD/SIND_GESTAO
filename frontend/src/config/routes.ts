export const ROUTES = {
  home: "/",
  union: "/o-sindicato",
  board: "/diretoria",
  bylaws: "/estatuto",
  news: "/noticias",
  notices: "/comunicados",
  transparency: "/transparencia",
  documents: "/documentos",
  gallery: "/galeria",
  membership: "/filie-se",
  contact: "/contato",
  memberArea: "/area-do-filiado",
  services: "/servicos",
  benefits: "/convenios-e-beneficios",
  legalAdvice: "/assessoria-juridica",
  guides: "/guias-e-requerimentos",
  calendar: "/calendario",
  faq: "/perguntas-frequentes",
  privacy: "/politica-de-privacidade",
  terms: "/termos-de-uso",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];

export const ADMIN_ROUTES = {
  home: "/admin/home",
  contacts: "/admin/home/contacts",
  social: "/admin/home/social",
  reviews: "/admin/home/reviews",
  reviewDetail: "/admin/home/reviews/:reviewId",
  publication: "/admin/home/publication",
  history: "/admin/home/history",
  historyDetail: "/admin/home/history/:versionId",
} as const;

export function adminReviewDetailPath(reviewId: string): string {
  return `${ADMIN_ROUTES.reviews}/${encodeURIComponent(reviewId)}`;
}

export function adminHistoryDetailPath(versionId: string): string {
  return `${ADMIN_ROUTES.history}/${encodeURIComponent(versionId)}`;
}
