import { Contact, Eye, Image as ImageIcon, Pencil, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "../../../../config/routes";
import { buildActionMatrix } from "../../../../features/home-admin/domain/editorial-rules";
import type { HomeAdminResource } from "../../../../features/home-admin/domain/home-admin.types";
import { adminBannerMock, adminFooterContactsMock, adminSocialConfigurationMock } from "../../../../features/home-admin/mocks/home-admin.mock-data";
import { HOME_ADMIN_CAPABILITIES, type SimulatedAdminProfile } from "../../../../features/home-admin/permissions/home-admin.permissions";
import { EditorialStatusBadge } from "./EditorialStatusBadge";
import styles from "../AdminEditor.module.css";

const dashboardProfile: SimulatedAdminProfile = { actorId: "actor-editor-1", displayName: "Editor", capabilities: [HOME_ADMIN_CAPABILITIES.editBanner, HOME_ADMIN_CAPABILITIES.editFooterContacts, HOME_ADMIN_CAPABILITIES.editFooterSocialLinks, HOME_ADMIN_CAPABILITIES.previewHome] };

function updatedAt(resource: HomeAdminResource) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Cuiaba" }).format(new Date(resource.version.updatedAt));
}

function actionsFor(resource: HomeAdminResource) {
  return buildActionMatrix({ resourceType: resource.resourceType, state: resource.state, reviewDecision: resource.review?.decision ?? null, authorId: resource.review?.submittedBy ?? resource.version.createdBy, profile: dashboardProfile, hasChanges: false, approvalValid: false, currentVersion: resource.version.editorialVersion, approvedVersion: null, currentHash: resource.version.contentHash, approvedHash: null });
}

export function ManagementResourceCards() {
  const contactsActions = actionsFor(adminFooterContactsMock);
  const socialActions = actionsFor(adminSocialConfigurationMock);
  const activeSocials = adminSocialConfigurationMock.links.filter((link) => link.active).length;
  return (
    <section className={styles.resourceGrid} aria-label="Conteúdos gerenciáveis da Home">
      <article className={styles.resourceCard}><ImageIcon aria-hidden="true" /><EditorialStatusBadge state={adminBannerMock.state} /><h2>Banner principal</h2><p>Versão v{adminBannerMock.version.editorialVersion} · autor {adminBannerMock.version.updatedBy}</p><div className={styles.resourceStats}><span>Revisão pendente: não</span><span>Publicação vigente: nenhuma</span></div><div className={styles.resourceActions}><Link className={styles.primaryButton} to={`${ADMIN_ROUTES.home}#banner-editor`}><Pencil aria-hidden="true" /> Editar banner</Link><Link className={styles.secondaryButton} to={`${ADMIN_ROUTES.home}#banner-preview-title`}><Eye aria-hidden="true" /> Visualizar prévia</Link></div></article>
      <article className={styles.resourceCard}><Contact aria-hidden="true" /><EditorialStatusBadge state={adminFooterContactsMock.state} /><h2>Contatos públicos</h2><p>{adminFooterContactsMock.email} · {adminFooterContactsMock.phone}</p><div className={styles.resourceStats}><span>Versão v{adminFooterContactsMock.version.editorialVersion}</span><span>Atualizado em {updatedAt(adminFooterContactsMock)}</span><span>Revisão pendente: não</span><span>Autor: {adminFooterContactsMock.version.updatedBy}</span><span>Publicação vigente: nenhuma</span></div><div className={styles.resourceActions}><Link aria-disabled={!contactsActions.edit.enabled} className={styles.primaryButton} to={ADMIN_ROUTES.contacts}><Pencil aria-hidden="true" /> Editar contatos</Link><Link aria-disabled={!contactsActions.preview.enabled} className={styles.secondaryButton} to={`${ADMIN_ROUTES.contacts}#contacts-preview-title`}><Eye aria-hidden="true" /> Visualizar prévia</Link></div></article>
      <article className={styles.resourceCard}><Share2 aria-hidden="true" /><EditorialStatusBadge state={adminSocialConfigurationMock.state} /><h2>Redes sociais</h2><p>{adminSocialConfigurationMock.links.length} links configurados · {activeSocials} ativos</p><div className={styles.resourceStats}><span>Versão v{adminSocialConfigurationMock.version.editorialVersion}</span><span>Atualizado em {updatedAt(adminSocialConfigurationMock)}</span><span>Revisão pendente: não</span><span>Autor: {adminSocialConfigurationMock.version.updatedBy}</span><span>Publicação vigente: nenhuma</span></div><div className={styles.resourceActions}><Link aria-disabled={!socialActions.edit.enabled} className={styles.primaryButton} to={ADMIN_ROUTES.social}><Pencil aria-hidden="true" /> Editar redes sociais</Link><Link aria-disabled={!socialActions.preview.enabled} className={styles.secondaryButton} to={`${ADMIN_ROUTES.social}#social-preview-title`}><Eye aria-hidden="true" /> Visualizar prévia</Link></div></article>
    </section>
  );
}
