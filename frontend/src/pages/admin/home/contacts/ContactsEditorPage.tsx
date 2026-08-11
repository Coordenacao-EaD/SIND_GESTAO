import type { BrazilianStateCode } from "../../../../features/home-admin/domain/home-admin.types";
import { adminFooterContactsMock } from "../../../../features/home-admin/mocks/home-admin.mock-data";
import type { HomeAdminMockRepository, HomeAdminMockScenario } from "../../../../features/home-admin/mocks/home-admin.mock.repository";
import { HOME_ADMIN_CAPABILITIES, type SimulatedAdminProfile } from "../../../../features/home-admin/permissions/home-admin.permissions";
import { BRAZILIAN_STATE_OPTIONS, formatPhone, formatPostalCode, parseAdminFooterContactsEditor } from "../../../../features/home-admin/schemas/home-admin.editor.validators";
import { AdminFeedback } from "../components/AdminFeedback";
import { EditorialMetadata } from "../components/EditorialMetadata";
import { EditorialWorkflowActions } from "../components/EditorialWorkflowActions";
import { useAdminResourceEditor } from "../hooks/useAdminResourceEditor";
import { ContactsPreview } from "./ContactsPreview";
import styles from "../AdminEditor.module.css";

const editorProfile: SimulatedAdminProfile = {
  actorId: "actor-editor-1",
  displayName: "Editor de contatos",
  capabilities: [HOME_ADMIN_CAPABILITIES.editFooterContacts, HOME_ADMIN_CAPABILITIES.previewHome],
};
const readerProfile: SimulatedAdminProfile = {
  actorId: "actor-reader-1",
  displayName: "Leitor",
  capabilities: [HOME_ADMIN_CAPABILITIES.previewHome],
};

export function ContactsEditorPage({ repository, scenario, onDirtyChange }: { repository: HomeAdminMockRepository; scenario: HomeAdminMockScenario; onDirtyChange: (dirty: boolean) => void }) {
  const profile = scenario === "readonly" || scenario === "forbidden" ? readerProfile : editorProfile;
  const editor = useAdminResourceEditor({ initial: adminFooterContactsMock, repository, profile, validate: parseAdminFooterContactsEditor, onDirtyChange });
  const { resource, update, actions, feedback } = editor;
  const editable = actions.edit.visible && actions.edit.enabled;
  const fieldError = (field: string) => feedback.error?.kind === "validation" ? feedback.error.fields[field]?.join(" ") : undefined;
  const describedBy = (field: string, hint: string) => fieldError(field) ? `${field}-error` : hint;

  return (
    <div className={styles.pageStack}>
      {scenario === "forbidden" && <AdminFeedback error={{ kind: "forbidden", status: 403, message: "Você pode visualizar a configuração, mas não editá-la.", requiredCapability: HOME_ADMIN_CAPABILITIES.editFooterContacts }} />}
      <section className={styles.metadataCard} aria-labelledby="contacts-metadata-title">
        <div className={styles.cardHeading}><span>Recurso versionado</span><h2 id="contacts-metadata-title">Contatos públicos</h2><p>{resource.email} · {resource.phone || "telefone não informado"}</p></div>
        <EditorialMetadata resource={resource} />
      </section>
      <AdminFeedback error={feedback.error} success={feedback.success} onRetry={feedback.error?.kind === "conflict" ? editor.reload : undefined} retryLabel="Recarregar dados" />
      <div className={styles.editorColumns}>
        <form className={styles.formCard} onSubmit={(event) => event.preventDefault()} noValidate>
          <div className={styles.cardHeading}><span>Dados institucionais</span><h2>Editar contatos</h2><p>Os campos alimentam somente a prévia administrativa.</p></div>
          <div className={styles.fieldGrid}>
            <label className={styles.field}><span>Telefone público <small>(opcional)</small></span><input data-error-field="phone" disabled={!editable} inputMode="tel" value={formatPhone(resource.phone)} aria-invalid={Boolean(fieldError("phone"))} aria-describedby={describedBy("phone", "phone-hint")} onChange={(event) => update({ ...resource, phone: event.target.value })} /><small className={fieldError("phone") ? styles.error : ""} id={fieldError("phone") ? "phone-error" : "phone-hint"}>{fieldError("phone") ?? "Formato nacional ou internacional."}</small></label>
            <label className={styles.field}><span>E-mail institucional</span><input data-error-field="email" disabled={!editable} maxLength={254} type="email" value={resource.email} aria-invalid={Boolean(fieldError("email"))} aria-describedby={describedBy("email", "email-hint")} onChange={(event) => update({ ...resource, email: event.target.value })} /><small className={fieldError("email") ? styles.error : ""} id={fieldError("email") ? "email-error" : "email-hint"}>{fieldError("email") ?? `${resource.email.length}/254 caracteres`}</small></label>
            <label className={`${styles.field} ${styles.fullField}`}><span>Logradouro e número</span><input data-error-field="address" disabled={!editable} maxLength={255} value={resource.address} aria-invalid={Boolean(fieldError("address"))} aria-describedby={describedBy("address", "address-hint")} onChange={(event) => update({ ...resource, address: event.target.value })} /><small className={fieldError("address") ? styles.error : ""} id={fieldError("address") ? "address-error" : "address-hint"}>{fieldError("address") ?? `${resource.address.length}/255 caracteres`}</small></label>
            <label className={styles.field}><span>Município</span><input data-error-field="municipality" disabled={!editable} maxLength={100} value={resource.municipality} aria-invalid={Boolean(fieldError("municipality"))} aria-describedby={fieldError("municipality") ? "municipality-error" : undefined} onChange={(event) => update({ ...resource, municipality: event.target.value })} />{fieldError("municipality") && <small className={styles.error} id="municipality-error">{fieldError("municipality")}</small>}</label>
            <label className={styles.field}><span>Unidade federativa</span><select data-error-field="stateCode" disabled={!editable} value={resource.stateCode} aria-invalid={Boolean(fieldError("stateCode"))} aria-describedby={fieldError("stateCode") ? "stateCode-error" : undefined} onChange={(event) => update({ ...resource, stateCode: event.target.value as BrazilianStateCode })}>{BRAZILIAN_STATE_OPTIONS.map(({ code }) => <option key={code} value={code}>{code}</option>)}</select>{fieldError("stateCode") && <small className={styles.error} id="stateCode-error">{fieldError("stateCode")}</small>}</label>
            <label className={styles.field}><span>CEP</span><input data-error-field="postalCode" disabled={!editable} inputMode="numeric" value={formatPostalCode(resource.postalCode)} aria-invalid={Boolean(fieldError("postalCode"))} aria-describedby={describedBy("postalCode", "postalCode-hint")} onChange={(event) => update({ ...resource, postalCode: event.target.value })} /><small className={fieldError("postalCode") ? styles.error : ""} id={fieldError("postalCode") ? "postalCode-error" : "postalCode-hint"}>{fieldError("postalCode") ?? "Formato 00000-000."}</small></label>
            <label className={`${styles.field} ${styles.fullField}`}><span>Horário de atendimento <small>(opcional)</small></span><textarea disabled={!editable} maxLength={255} rows={3} value={resource.businessHours} onChange={(event) => update({ ...resource, businessHours: event.target.value })} /><small>{resource.businessHours.length}/255 caracteres</small></label>
          </div>
          <EditorialWorkflowActions actions={actions} busy={editor.busy} dirty={editor.hasChanges} cancellationReason={editor.cancellationReason} cancellationError={editor.cancellationError} onCancellationReasonChange={editor.setCancellationReason} onSave={editor.saveDraft} onSubmit={editor.submitReview} onCancel={editor.cancelReview} />
        </form>
        {actions.preview.enabled ? <ContactsPreview contacts={resource} /> : <p className={styles.previewBlocked}>Prévia bloqueada: capability {HOME_ADMIN_CAPABILITIES.previewHome} ausente.</p>}
      </div>
    </div>
  );
}
