import { ArrowRightLeft, Minus, Plus, Equal } from "lucide-react";
import {
  COMPARISON_CHANGE_LABELS,
  buildReviewComparison,
  countChanges,
  type ComparisonChange,
} from "../../../../features/home-admin/domain/review-comparison";
import type { HomeAdminResource } from "../../../../features/home-admin/domain/home-admin.types";
import styles from "./Reviews.module.css";

const CHANGE_ICONS: Record<ComparisonChange, typeof Equal> = {
  unchanged: Equal,
  changed: ArrowRightLeft,
  added: Plus,
  removed: Minus,
};

function ChangeTag({ change }: { change: ComparisonChange }) {
  const Icon = CHANGE_ICONS[change];
  return (
    <span className={`${styles.changeTag} ${styles[`change_${change}`]}`}>
      <Icon aria-hidden="true" />
      {COMPARISON_CHANGE_LABELS[change]}
    </span>
  );
}

function Value({ value }: { value: string | null }) {
  if (value === null) return <span className={styles.emptyValue}>Campo ausente</span>;
  if (value.trim() === "") return <span className={styles.emptyValue}>Vazio</span>;
  return <span>{value}</span>;
}

interface Props {
  published: HomeAdminResource | null;
  submitted: HomeAdminResource;
}

/**
 * Comparação somente de leitura. O conteúdo é sempre tratado como dado textual — nunca interpretado
 * como HTML — e a diferença é comunicada por rótulo, ícone e posição, não apenas por cor.
 */
export function ReviewComparison({ published, submitted }: Props) {
  const groups = buildReviewComparison(published, submitted);
  const changes = countChanges(groups);

  return (
    <section className={styles.card} aria-labelledby="review-comparison-title">
      <h2 id="review-comparison-title">Diferenças</h2>
      <p className={styles.cardIntro}>
        {changes === 0
          ? "Nenhuma diferença entre a versão pública vigente e o conteúdo submetido."
          : `${changes} ${changes === 1 ? "campo alterado" : "campos alterados"} em relação à versão pública vigente.`}
        {published === null && " Ainda não existe versão pública para este conteúdo."}
      </p>

      {groups.map((group) => (
        <div className={styles.comparisonGroup} key={group.id}>
          <h3>{group.label}</h3>
          <table className={styles.comparisonTable}>
            <caption>Comparação entre a versão pública vigente e o conteúdo submetido.</caption>
            <thead>
              <tr>
                <th scope="col">Campo</th>
                <th scope="col">Versão pública</th>
                <th scope="col">Conteúdo submetido</th>
                <th scope="col">Situação</th>
              </tr>
            </thead>
            <tbody>
              {group.fields.map((item) => (
                <tr key={item.id}>
                  <th scope="row">{item.label}</th>
                  <td data-column="Versão pública"><Value value={item.publicValue} /></td>
                  <td data-column="Conteúdo submetido"><Value value={item.submittedValue} /></td>
                  <td data-column="Situação"><ChangeTag change={item.change} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}
