import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { ROUTES } from "../config/routes";
import { AppLayout } from "../components/layout/AppLayout";
import { HomePage } from "../pages/home/HomePage";
import { HomeDataProvider } from "../pages/home/HomeDataProvider";
import { ComingSoonPage } from "../pages/ComingSoonPage";
import { NotFoundPage } from "../pages/NotFoundPage";

const COMING_SOON_ROUTES: Array<{ path: string; title: string }> = [
  { path: ROUTES.union, title: "O Sindicato" },
  { path: ROUTES.board, title: "Diretoria" },
  { path: ROUTES.bylaws, title: "Estatuto" },
  { path: ROUTES.news, title: "Notícias" },
  { path: ROUTES.notices, title: "Comunicados" },
  { path: ROUTES.transparency, title: "Transparência" },
  { path: ROUTES.documents, title: "Documentos" },
  { path: ROUTES.gallery, title: "Galeria" },
  { path: ROUTES.membership, title: "Filie-se" },
  { path: ROUTES.contact, title: "Contato" },
  { path: ROUTES.memberArea, title: "Área do Filiado" },
  { path: ROUTES.services, title: "Serviços" },
  { path: ROUTES.benefits, title: "Convênios e Benefícios" },
  { path: ROUTES.legalAdvice, title: "Assessoria Jurídica" },
  { path: ROUTES.guides, title: "Guias e Requerimentos" },
  { path: ROUTES.calendar, title: "Calendário de Atividades" },
  { path: ROUTES.faq, title: "Perguntas Frequentes" },
  { path: ROUTES.privacy, title: "Política de Privacidade" },
  { path: ROUTES.terms, title: "Termos de Uso" },
];

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      {
        path: ROUTES.home,
        element: (
          <HomeDataProvider>
            <HomePage />
          </HomeDataProvider>
        ),
      },
      ...COMING_SOON_ROUTES.map((route) => ({
        path: route.path,
        element: <ComingSoonPage title={route.title} />,
      })),
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
