import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import type { AdminSocialLink, SocialPlatform } from "../../../../features/home-admin/domain/home-admin.types";
import { adminSocialConfigurationMock } from "../../../../features/home-admin/mocks/home-admin.mock-data";
import type { HomeAdminMockRepository, HomeAdminMockScenario } from "../../../../features/home-admin/mocks/home-admin.mock.repository";
import { HOME_ADMIN_CAPABILITIES, type SimulatedAdminProfile } from "../../../../features/home-admin/permissions/home-admin.permissions";
import { parseAdminSocialConfigurationEditor, SOCIAL_PLATFORM_OPTIONS, validateSocialUrl } from "../../../../features/home-admin/schemas/home-admin.editor.validators";
import { AdminFeedback } from "../components/AdminFeedback";
import { EditorialMetadata } from "../components/EditorialMetadata";
import { EditorialWorkflowActions } from "../components/EditorialWorkflowActions";
import { useAdminResourceEditor } from "../hooks/useAdminResourceEditor";
import { SocialPreview } from "./SocialPreview";
import styles from "../AdminEditor.module.css";

const editorProfile: SimulatedAdminProfile = { actorId: "actor-editor-1", displayName: "Editor de redes", capabilities: [HOME_ADMIN_CAPABILITIES.editFooterSocialLinks, HOME_ADMIN_CAPABILITIES.previewHome] };
const readerProfile: SimulatedAdminProfile = { actorId: "actor-reader-1", displayName: "Leitor", capabilities: [HOME_ADMIN_CAPABILITIES.previewHome] };
const defaultUrls: Record<SocialPlatform, string> = { Facebook: "https://facebook.com/", Instagram: "https://instagram.com/", YouTube: "https://youtube.com/", LinkedIn: "https://linkedin.com/", X: "https://x.com/" };

function normalizeOrder(links: AdminSocialLink[]) { return links.map((link, order) => ({ ...link, order })); }

export function SocialEditorPage({ repository, scenario, onDirtyChange }: { repository: HomeAdminMockRepository; scenario: HomeAdminMockScenario; onDirtyChange: (dirty: boolean) => void }) {
  const profile = scenario === "readonly" || scenario === "forbidden" ? readerProfile : editorProfile;
  const editor = useAdminResourceEditor({ initial: adminSocialConfigurationMock, repository, profile, validate: parseAdminSocialConfigurationEditor, onDirtyChange });
  const { resource, update, actions, feedback } = editor;
  const editable = actions.edit.visible && actions.edit.enabled;
  const fieldError = (field: string) => feedback.error?.kind === "validation" ? feedback.error.fields[field]?.join(" ") : undefined;
  const activeCount = resource.links.filter((link) => link.active).length;

  const replaceLink = (index: number, next: AdminSocialLink) => update({ ...resource, links: resource.links.map((link, itemIndex) => itemIndex === index ? next : link) });
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= resource.links.length) return;
    const links = [...resource.links];
    [links[index], links[target]] = [links[target]!, links[index]!];
    update({ ...resource, links: normalizeOrder(links) });
  };
  const add = () => {
    const used = new Set(resource.links.map((link) => link.platform));
    const platform = SOCIAL_PLATFORM_OPTIONS.find(({ value }) => !used.has(value))?.value ?? "Facebook";
    let suffix = resource.links.length + 1;
    while (resource.links.some((link) => link.id === `social-draft-${suffix}`)) suffix += 1;
    update({ ...resource, links: [...resource.links, { id: `social-draft-${suffix}`, platform, url: defaultUrls[platform], accessibleLabel: platform, order: resource.links.length, active: true }] });
  };
  const remove = (index: number) => {
    if (!window.confirm(`Remover ${resource.links[index]?.platform} somente deste rascunho?`)) return;
    update({ ...resource, links: normalizeOrder(resource.links.filter((_, itemIndex) => itemIndex !== index)) });
    requestAnimationFrame(() => document.getElementById("add-social-link")?.focus());
  };

  return (
    <div className={styles.pageStack}>
      {scenario === "forbidden" && <AdminFeedback error={{ kind: "forbidden", status: 403, message: "Você pode visualizar a configuração, mas não editá-la.", requiredCapability: HOME_ADMIN_CAPABILITIES.editFooterSocialLinks }} />}
      <section className={styles.metadataCard} aria-labelledby="social-metadata-title"><div className={styles.cardHeading}><span>Configuração versionada</span><h2 id="social-metadata-title">Redes sociais</h2><p>{resource.links.length} links configurados · {activeCount} ativos</p></div><EditorialMetadata resource={resource} /></section>
      <AdminFeedback error={feedback.error} success={feedback.success} onRetry={feedback.error?.kind === "conflict" ? editor.reload : undefined} retryLabel="Recarregar dados" />
      <div className={styles.editorColumns}>
        <form className={styles.formCard} onSubmit={(event) => event.preventDefault()} noValidate>
          <div className={styles.cardHeading}><span>Configuração completa</span><h2>Editar redes sociais</h2><p>Plataformas ativas e inativas continuam sujeitas à unicidade.</p></div>
          <ol className={styles.socialList}>
            {resource.links.map((link, index) => {
              const platformError = fieldError(`links.${index}.platform`);
              const urlError = fieldError(`links.${index}.url`);
              const labelError = fieldError(`links.${index}.accessibleLabel`);
              const safeUrl = validateSocialUrl(link.platform, link.url) === null;
              return <li className={styles.socialItem} key={link.id}>
                <div className={styles.socialItemHeader}><strong><span>{index + 1}</span>{link.platform}</strong><small>ID estável: {link.id}</small></div>
                <div className={styles.socialFields}>
                  <label className={styles.socialField}>Plataforma<select data-error-field={`links.${index}.platform`} disabled={!editable} value={link.platform} aria-invalid={Boolean(platformError)} aria-describedby={platformError ? `platform-${index}-error` : undefined} onChange={(event) => replaceLink(index, { ...link, platform: event.target.value as SocialPlatform })}>{SOCIAL_PLATFORM_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select>{platformError && <small className={styles.error} id={`platform-${index}-error`}>{platformError}</small>}</label>
                  <label className={styles.socialField}>URL HTTPS<input data-error-field={`links.${index}.url`} disabled={!editable} type="url" value={link.url} aria-invalid={Boolean(urlError)} aria-describedby={urlError ? `url-${index}-error` : undefined} onChange={(event) => replaceLink(index, { ...link, url: event.target.value })} />{urlError && <small className={styles.error} id={`url-${index}-error`}>{urlError}</small>}</label>
                  <label className={styles.socialField}>Rótulo acessível<input data-error-field={`links.${index}.accessibleLabel`} disabled={!editable} maxLength={100} value={link.accessibleLabel} aria-invalid={Boolean(labelError)} aria-describedby={labelError ? `label-${index}-error` : undefined} onChange={(event) => replaceLink(index, { ...link, accessibleLabel: event.target.value })} />{labelError && <small className={styles.error} id={`label-${index}-error`}>{labelError}</small>}</label>
                </div>
                <div className={styles.socialControls}>
                  <button className={styles.switch} disabled={!editable} role="switch" aria-checked={link.active} aria-label={`${link.active ? "Inativar" : "Ativar"} ${link.platform}`} onClick={() => replaceLink(index, { ...link, active: !link.active })} type="button"><i aria-hidden="true" />{link.active ? "Ativa" : "Inativa"}</button>
                  <button className={styles.iconButton} disabled={!editable || index === 0} aria-label={`Mover ${link.platform} para cima`} onClick={() => move(index, -1)} type="button"><ArrowUp aria-hidden="true" /> Subir</button>
                  <button className={styles.iconButton} disabled={!editable || index === resource.links.length - 1} aria-label={`Mover ${link.platform} para baixo`} onClick={() => move(index, 1)} type="button"><ArrowDown aria-hidden="true" /> Descer</button>
                  <button className={styles.dangerButton} disabled={!editable} aria-label={`Remover ${link.platform} do rascunho`} onClick={() => remove(index)} type="button"><Trash2 aria-hidden="true" /> Remover</button>
                  {safeUrl && <a className={styles.externalTest} href={link.url} rel="noopener noreferrer" target="_blank" aria-label={`Testar link de ${link.platform} (abre em nova aba)`}><ExternalLink aria-hidden="true" /> Testar link</a>}
                </div>
              </li>;
            })}
          </ol>
          {resource.links.length === 0 && <p className={styles.emptyPreview}>Nenhum link no rascunho. A configuração vazia é válida.</p>}
          <button className={`${styles.secondaryButton} ${styles.addButton}`} disabled={!editable} id="add-social-link" onClick={add} type="button"><Plus aria-hidden="true" /> Adicionar rede social</button>
          <EditorialWorkflowActions actions={actions} busy={editor.busy} dirty={editor.hasChanges} cancellationReason={editor.cancellationReason} cancellationError={editor.cancellationError} onCancellationReasonChange={editor.setCancellationReason} onSave={editor.saveDraft} onSubmit={editor.submitReview} onCancel={editor.cancelReview} />
        </form>
        {actions.preview.enabled ? <SocialPreview configuration={resource} /> : <p className={styles.previewBlocked}>Prévia bloqueada: capability {HOME_ADMIN_CAPABILITIES.previewHome} ausente.</p>}
      </div>
    </div>
  );
}
