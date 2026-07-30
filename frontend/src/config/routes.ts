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
