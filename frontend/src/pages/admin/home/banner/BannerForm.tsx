import { Save, Send } from "lucide-react";
import type { AdminBanner, AdminError } from "../../../../features/home-admin/domain/home-admin.types";
import type { ActionMatrix } from "../../../../features/home-admin/domain/editorial-rules";
import { BannerCtaFields } from "./BannerCtaFields";
import styles from "../HomeManagementPage.module.css";

interface BannerFormProps {
  banner: AdminBanner;
  actions: ActionMatrix;
  validationError?: Extract<AdminError, { kind: "validation" }>;
  busy: boolean;
  onChange: (banner: AdminBanner) => void;
  onSave: () => void;
  onSubmitReview: () => void;
}

function actionTitle(reason: string | null) {
  if (reason === "no_changes") return "Faça uma alteração para habilitar esta ação.";
  if (reason === "missing_capability") return "O perfil simulado não possui esta capacidade.";
  return undefined;
}

export function BannerForm({ banner, actions, validationError, busy, onChange, onSave, onSubmitReview }: BannerFormProps) {
  const editable = actions.edit.visible && actions.edit.enabled;
  const fieldError = (name: string) => validationError?.fields[name]?.join(" ");
  return (
    <form className={styles.editorForm} onSubmit={(event) => event.preventDefault()} noValidate>
      <div className={styles.sectionHeading}>
        <div><span>Conteúdo principal</span><h2>Editar banner</h2></div>
        <small>Campos obrigatórios</small>
      </div>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Título do banner</span>
          <input aria-invalid={Boolean(fieldError("title"))} aria-describedby={fieldError("title") ? "title-error" : "title-hint"} disabled={!editable} maxLength={90} value={banner.title} onChange={(event) => onChange({ ...banner, title: event.target.value })} />
          {fieldError("title") ? <small className={styles.fieldError} id="title-error">{fieldError("title")}</small> : <small id="title-hint">{banner.title.length}/90 caracteres</small>}
        </label>
        <label className={styles.field}>
          <span>Descrição</span>
          <textarea disabled={!editable} maxLength={180} rows={4} value={banner.description} onChange={(event) => onChange({ ...banner, description: event.target.value })} />
          <small>{banner.description.length}/180 caracteres</small>
        </label>
        <label className={styles.field}>
          <span>Texto alternativo da imagem</span>
          <input disabled={!editable} maxLength={120} value={banner.altText} onChange={(event) => onChange({ ...banner, altText: event.target.value, image: { ...banner.image, accessibleName: event.target.value } })} />
          <small>Descreva a imagem para pessoas que usam leitores de tela.</small>
        </label>
        <div className={styles.assetField}>
          <span>Imagem vinculada</span>
          <strong>{banner.image.assetId}</strong>
          <small>Asset existente. Upload não faz parte desta etapa.</small>
        </div>
      </div>
      <BannerCtaFields cta={banner.cta} disabled={!editable} onChange={(cta) => onChange({ ...banner, cta })} />
      <div className={styles.editorActions}>
        <p>As ações abaixo são simulações locais e serão perdidas ao atualizar a página.</p>
        <div>
          <button className={styles.secondaryButton} disabled={busy || !actions.save_draft.enabled} onClick={onSave} title={actionTitle(actions.save_draft.reason)} type="button"><Save aria-hidden="true" /> Salvar rascunho</button>
          <button className={styles.primaryButton} disabled={busy || !actions.submit_review.enabled} onClick={onSubmitReview} title={actionTitle(actions.submit_review.reason)} type="button"><Send aria-hidden="true" /> Enviar para revisão</button>
        </div>
      </div>
    </form>
  );
}
