import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { ADMIN_ROUTES, ROUTES } from "../config/routes";
import { AppLayout } from "../components/layout/AppLayout";
import { HomePage } from "../pages/home/HomePage";
import { HomeDataProvider } from "../pages/home/HomeDataProvider";
import { ComingSoonPage } from "../pages/ComingSoonPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { LazyHomeManagementPage } from "../pages/admin/home/LazyHomeManagementPage";
import { LazyReviewDetailPage, LazyReviewsQueuePage } from "../pages/admin/home/reviews/LazyReviewPages";
import { LazyHistoryDetailPage, LazyHistoryPage, LazyPublicationPage } from "../pages/admin/home/publication-history/LazyF22DPages";

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
    path: ADMIN_ROUTES.home,
    element: <LazyHomeManagementPage />,
  },
  {
    path: ADMIN_ROUTES.contacts,
    element: <LazyHomeManagementPage />,
  },
  {
    path: ADMIN_ROUTES.social,
    element: <LazyHomeManagementPage />,
  },
  {
    path: ADMIN_ROUTES.reviews,
    element: <LazyReviewsQueuePage />,
  },
  {
    path: ADMIN_ROUTES.reviewDetail,
    element: <LazyReviewDetailPage />,
  },
  {
    path: ADMIN_ROUTES.publication,
    element: <LazyPublicationPage />,
  },
  {
    path: ADMIN_ROUTES.history,
    element: <LazyHistoryPage />,
  },
  {
    path: ADMIN_ROUTES.historyDetail,
    element: <LazyHistoryDetailPage />,
  },
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
