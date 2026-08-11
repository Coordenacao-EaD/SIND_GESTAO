import type { HomeAdminMockScenario } from "../../../../features/home-admin/mocks/home-admin.mock.repository";
import type { SimulatedAdminProfile } from "../../../../features/home-admin/permissions/home-admin.permissions";
import { REVIEW_SCENARIOS } from "./review-scenarios";
import shellStyles from "../HomeManagementPage.module.css";
import styles from "./Reviews.module.css";

export function ReviewScenarioControl({
  scenario,
  onChange,
}: {
  scenario: HomeAdminMockScenario;
  onChange: (scenario: HomeAdminMockScenario) => void;
}) {
  return (
    <label className={shellStyles.scenarioControl}>
      <span>Visualizar cenário</span>
      <select value={scenario} onChange={(event) => onChange(event.target.value as HomeAdminMockScenario)}>
        {REVIEW_SCENARIOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>
  );
}

/**
 * Identidade simulada da demonstração. Não há login, token nem persistência de perfil: o cenário da
 * URL escolhe qual usuário simulado está em uso.
 */
export function ReviewIdentityCard({
  profile,
  relationLabel,
}: {
  profile: SimulatedAdminProfile;
  relationLabel: string;
}) {
  return (
    <section className={styles.card} aria-labelledby="review-identity-title">
      <h2 id="review-identity-title">Identidade simulada</h2>
      <div className={styles.identityCard}>
        <dl className={styles.identityGrid}>
          <div><dt>Usuário atual</dt><dd>{profile.displayName}</dd></div>
          <div><dt>Identificador</dt><dd>{profile.actorId}</dd></div>
          <div><dt>Relação com o conteúdo</dt><dd>{relationLabel}</dd></div>
          <div>
            <dt>Capabilities simuladas</dt>
            <dd>
              {profile.capabilities.length > 0 ? (
                <ul className={styles.capabilityList}>
                  {profile.capabilities.map((capability) => <li key={capability}>{capability}</li>)}
                </ul>
              ) : "Nenhuma"}
            </dd>
          </div>
        </dl>
        <p className={styles.simulationNote}>
          Identidade simulada para demonstração. A autorização real será implementada na F3.
        </p>
      </div>
    </section>
  );
}
