import { lazy, Suspense } from "react";

const HomeManagementPage = lazy(() => import("./HomeManagementPage"));

export function LazyHomeManagementPage() {
  return (
    <Suspense fallback={<div role="status">Carregando painel administrativo...</div>}>
      <HomeManagementPage />
    </Suspense>
  );
}
