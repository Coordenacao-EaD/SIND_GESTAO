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
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
