import { FilterX } from "lucide-react";
import { ADMIN_RESOURCE_TYPES, REVIEW_DECISIONS } from "../../../../features/home-admin/domain/home-admin.types";
import {
  RESOURCE_TYPE_LABELS,
  REVIEW_DECISION_LABELS,
  type ReviewQueueFilters,
} from "../../../../features/home-admin/domain/review-queue.types";
import { describeSimulatedUser } from "../../../../features/home-admin/mocks/home-admin.mock-data";
import styles from "./Reviews.module.css";

interface Props {
  filters: ReviewQueueFilters;
  submitters: readonly string[];
  onChange: (filters: ReviewQueueFilters) => void;
  onClear: () => void;
}

export function ReviewFilters({ filters, submitters, onChange, onClear }: Props) {
  return (
    <section className={styles.card} aria-labelledby="review-filters-title">
      <h2 id="review-filters-title">Filtros</h2>
      <p className={styles.cardIntro}>
        Os filtros existem apenas na memória desta demonstração e não são armazenados no navegador.
      </p>
      <div className={styles.filters}>
        <div className={styles.filterField}>
          <label htmlFor="filter-decision">Situação</label>
          <select
            id="filter-decision"
            value={filters.decision}
            onChange={(event) => onChange({ ...filters, decision: event.target.value as ReviewQueueFilters["decision"] })}
          >
            <option value="all">Todas as situações</option>
            {REVIEW_DECISIONS.map((decision) => (
              <option key={decision} value={decision}>{REVIEW_DECISION_LABELS[decision]}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterField}>
          <label htmlFor="filter-type">Tipo de conteúdo</label>
          <select
            id="filter-type"
            value={filters.resourceType}
            onChange={(event) => onChange({ ...filters, resourceType: event.target.value as ReviewQueueFilters["resourceType"] })}
          >
            <option value="all">Todos os tipos</option>
            {ADMIN_RESOURCE_TYPES.map((type) => (
              <option key={type} value={type}>{RESOURCE_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterField}>
          <label htmlFor="filter-submitter">Responsável pelo envio</label>
          <select
            id="filter-submitter"
            value={filters.submittedBy}
            onChange={(event) => onChange({ ...filters, submittedBy: event.target.value })}
          >
            <option value="all">Qualquer responsável</option>
            {submitters.map((actorId) => (
              <option key={actorId} value={actorId}>{describeSimulatedUser(actorId)}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterActions}>
          <label className={styles.filterToggle} htmlFor="filter-decidable">
            <input
              id="filter-decidable"
              checked={filters.onlyDecidable}
              type="checkbox"
              onChange={(event) => onChange({ ...filters, onlyDecidable: event.target.checked })}
            />
            Somente itens que posso revisar
          </label>
        </div>

        <div className={styles.filterActions}>
          <button className={styles.secondaryButton} onClick={onClear} type="button">
            <FilterX aria-hidden="true" /> Limpar filtros
          </button>
        </div>
      </div>
    </section>
  );
}
