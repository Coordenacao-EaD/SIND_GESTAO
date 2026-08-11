import { lazy, Suspense } from "react";

const ReviewsQueuePage = lazy(() => import("./ReviewsQueuePage"));
const ReviewDetailPage = lazy(() => import("./ReviewDetailPage"));

function fallback(label: string) {
  return <div role="status">{label}</div>;
}

export function LazyReviewsQueuePage() {
  return (
    <Suspense fallback={fallback("Carregando fila de revisões...")}>
      <ReviewsQueuePage />
    </Suspense>
  );
}

export function LazyReviewDetailPage() {
  return (
    <Suspense fallback={fallback("Carregando detalhe da revisão...")}>
      <ReviewDetailPage />
    </Suspense>
  );
}
