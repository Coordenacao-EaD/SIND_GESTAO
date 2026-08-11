import { lazy, Suspense } from "react";

const PublicationPage = lazy(() => import("./PublicationPage"));
const HistoryPage = lazy(() => import("./HistoryPage"));
const HistoryDetailPage = lazy(() => import("./HistoryDetailPage"));
const fallback = <main aria-busy="true"><h1>Carregando administração</h1></main>;
export function LazyPublicationPage() { return <Suspense fallback={fallback}><PublicationPage /></Suspense>; }
export function LazyHistoryPage() { return <Suspense fallback={fallback}><HistoryPage /></Suspense>; }
export function LazyHistoryDetailPage() { return <Suspense fallback={fallback}><HistoryDetailPage /></Suspense>; }
