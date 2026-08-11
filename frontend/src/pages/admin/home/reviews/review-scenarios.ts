import type { HomeAdminMockScenario } from "../../../../features/home-admin/mocks/home-admin.mock.repository";

/**
 * Cenários oferecidos pelas telas de revisão. Cobrem identidade, integridade, concorrência e os
 * estados de erro exigidos pela F2.2C. Nenhum deles é persistido: vivem apenas na query string.
 */
export const REVIEW_SCENARIOS: ReadonlyArray<{ value: HomeAdminMockScenario; label: string }> = [
  { value: "success", label: "Revisor independente" },
  { value: "author", label: "Autor do conteúdo" },
  { value: "submitter", label: "Responsável pelo envio" },
  { value: "no_review_capability", label: "Sem capability de revisão" },
  { value: "readonly", label: "Somente leitura" },
  { value: "hash_mismatch", label: "Hash divergente" },
  { value: "version_mismatch", label: "Versão divergente" },
  { value: "concurrent", label: "Decisão concorrente" },
  { value: "loading", label: "Carregando" },
  { value: "empty", label: "Sem revisões" },
  { value: "unauthenticated", label: "Erro 401" },
  { value: "forbidden", label: "Erro 403" },
  { value: "validation", label: "Erro 422" },
  { value: "unavailable", label: "Indisponível" },
  { value: "unexpected", label: "Erro inesperado" },
];

const reviewScenarioValues = new Set(REVIEW_SCENARIOS.map((item) => item.value));

export function parseReviewScenario(value: string | null): HomeAdminMockScenario {
  return value && reviewScenarioValues.has(value as HomeAdminMockScenario)
    ? (value as HomeAdminMockScenario)
    : "success";
}
