import { describe, expect, it } from "vitest";
import { buildActionMatrix } from "../domain/editorial-rules";
import type { HomeAdminResource, VersionHistoryEntry } from "../domain/home-admin.types";
import { HomeAdminMockRepository } from "../mocks/home-admin.mock.repository";
import { HOME_ADMIN_CAPABILITIES, type SimulatedAdminProfile } from "../permissions/home-admin.permissions";

const fullProfile = new HomeAdminMockRepository().getSimulatedProfile();
const emptyProfile: SimulatedAdminProfile = { actorId: "actor-reader-1", displayName: "Leitor", capabilities: [] };

async function candidates(repository = new HomeAdminMockRepository()) {
  const result = await repository.getPublishableResources();
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
async function publish(repository: HomeAdminMockRepository, resource: HomeAdminResource, actor = fullProfile) {
  return repository.publish({ resourceType: resource.resourceType, resourceId: resource.id, expectedRevision: resource.version.revision, approvedHash: resource.review?.submittedHash ?? resource.version.contentHash, approvedVersion: resource.review?.submittedVersion ?? resource.version.editorialVersion, actor });
}
async function history(repository = new HomeAdminMockRepository()) {
  const result = await repository.listHistory();
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
async function restore(repository: HomeAdminMockRepository, entry: VersionHistoryEntry, actor = fullProfile) {
  return repository.restoreVersion({ versionId: entry.versionId, expectedRevision: entry.resource.version.revision, actor });
}
function matrix(resource: HomeAdminResource, profile = fullProfile, overrides: Partial<Parameters<typeof buildActionMatrix>[0]> = {}) {
  return buildActionMatrix({ resourceType: resource.resourceType, state: resource.state, reviewDecision: resource.review?.decision ?? null, authorId: resource.version.createdBy, profile, hasChanges: false, approvalValid: Boolean(resource.version.approvedAt), currentVersion: resource.version.editorialVersion, approvedVersion: resource.review?.submittedVersion ?? null, currentHash: resource.version.contentHash, approvedHash: resource.review?.submittedHash ?? null, ...overrides });
}

describe("F2.2D capabilities e matriz", () => {
  it("usa a capability oficial de publicação do banner", () => expect(HOME_ADMIN_CAPABILITIES.publishBanner).toBe("site.home.banner.publish"));
  it("usa a capability oficial de publicação dos contatos", () => expect(HOME_ADMIN_CAPABILITIES.publishFooterContacts).toBe("site.footer.contacts.publish"));
  it("usa a capability oficial de publicação social", () => expect(HOME_ADMIN_CAPABILITIES.publishFooterSocialLinks).toBe("site.footer.social_links.publish"));
  it("usa a capability oficial de histórico", () => expect(HOME_ADMIN_CAPABILITIES.viewHistory).toBe("site.home.history.view"));
  it("usa a capability oficial de restauração", () => expect(HOME_ADMIN_CAPABILITIES.restoreVersion).toBe("site.home.version.restore"));
  it("habilita publicação de banner aprovado", async () => expect(matrix((await candidates())[0]!).publish.enabled).toBe(true));
  it("habilita publicação de contatos aprovada", async () => expect(matrix((await candidates())[1]!).publish.enabled).toBe(true));
  it("habilita publicação da configuração social aprovada", async () => expect(matrix((await candidates())[2]!).publish.enabled).toBe(true));
  it("bloqueia publicação sem capability", async () => expect(matrix((await candidates())[0]!, emptyProfile).publish.reason).toBe("missing_capability"));
  it("bloqueia aprovação expirada", async () => expect(matrix((await candidates(new HomeAdminMockRepository("approval_expired")))[0]!).publish.reason).toBe("stale_approval"));
  it("bloqueia hash divergente", async () => expect(matrix((await candidates(new HomeAdminMockRepository("hash_mismatch")))[0]!).publish.reason).toBe("hash_mismatch"));
  it("bloqueia versão divergente", async () => expect(matrix((await candidates(new HomeAdminMockRepository("version_mismatch")))[0]!).publish.reason).toBe("stale_approval"));
  it("habilita visualização do histórico com capability", async () => expect(matrix((await candidates())[0]!).view_history.enabled).toBe(true));
  it("bloqueia restauração sem capability", async () => expect(matrix((await history())[0]!.resource, emptyProfile).restore_version.reason).toBe("missing_capability"));
});

describe("F2.2D publicação simulada", () => {
  it("expõe três conteúdos aprovados separados", async () => expect(await candidates()).toHaveLength(3));
  it("não publica automaticamente depois da aprovação", async () => expect((await candidates()).every((item) => item.state === "approved")).toBe(true));
  it("mantém identificadores independentes", async () => expect(new Set((await candidates()).map((item) => item.id)).size).toBe(3));
  it("publica banner válido", async () => { const repo = new HomeAdminMockRepository(); const result = await publish(repo, (await candidates(repo))[0]!); expect(result.ok && result.data.published.state).toBe("published"); });
  it("publica contatos válidos", async () => { const repo = new HomeAdminMockRepository(); const result = await publish(repo, (await candidates(repo))[1]!); expect(result.ok && result.data.published.resourceType).toBe("footer_contacts"); });
  it("publica configuração social como conjunto", async () => { const repo = new HomeAdminMockRepository(); const source = (await candidates(repo))[2]!; const result = await publish(repo, source); expect(result.ok && result.data.published.resourceType === "footer_social_links" && result.data.published.links.length).toBe(3); });
  it("não cria status editorial por link social", async () => { const repo = new HomeAdminMockRepository(); const result = await publish(repo, (await candidates(repo))[2]!); if (!result.ok || result.data.published.resourceType !== "footer_social_links") throw new Error("falha"); expect(result.data.published.links.every((link) => !("state" in link))).toBe(true); });
  it("registra metadata de publicação mockada", async () => { const repo = new HomeAdminMockRepository(); const result = await publish(repo, (await candidates(repo))[0]!); expect(result.ok && result.data.published.version.publishedBy).toBe(fullProfile.actorId); });
  it("incrementa a versão pública", async () => { const repo = new HomeAdminMockRepository(); const result = await publish(repo, (await candidates(repo))[0]!); expect(result.ok && result.data.published.version.publicVersion).toBe(2); });
  it("arquiva a versão pública anterior", async () => { const repo = new HomeAdminMockRepository(); const result = await publish(repo, (await candidates(repo))[0]!); expect(result.ok && result.data.archived?.resource.state).toBe("archived"); });
  it("registra a nova versão no histórico", async () => { const repo = new HomeAdminMockRepository(); const result = await publish(repo, (await candidates(repo))[1]!); expect(result.ok && result.data.historyEntry.isCurrentPublic).toBe(true); });
  it("retorna 403 sem capability específica", async () => { const repo = new HomeAdminMockRepository(); const result = await publish(repo, (await candidates(repo))[0]!, emptyProfile); expect(!result.ok && result.error.kind).toBe("forbidden"); });
  it("retorna 409 para conteúdo já publicado", async () => { const repo = new HomeAdminMockRepository("already_published"); const result = await publish(repo, (await candidates(repo))[0]!); expect(!result.ok && result.error.kind).toBe("conflict"); });
  it("retorna 409 para hash divergente", async () => { const repo = new HomeAdminMockRepository("hash_mismatch"); const result = await publish(repo, (await candidates(repo))[0]!); expect(!result.ok && result.error.kind).toBe("conflict"); });
  it("retorna 409 para versão divergente", async () => { const repo = new HomeAdminMockRepository("version_mismatch"); const result = await publish(repo, (await candidates(repo))[0]!); expect(!result.ok && result.error.kind).toBe("conflict"); });
  it("retorna 409 para aprovação expirada", async () => { const repo = new HomeAdminMockRepository("approval_expired"); const result = await publish(repo, (await candidates(repo))[0]!); expect(!result.ok && result.error.kind).toBe("conflict"); });
  it("retorna 409 para publicação concorrente", async () => { const repo = new HomeAdminMockRepository("publication_conflict"); const result = await publish(repo, (await candidates(repo))[0]!); expect(!result.ok && result.error.kind).toBe("conflict"); });
  it("retorna 409 quando a decisão de revisão foi alterada", async () => { const repo = new HomeAdminMockRepository("decision_changed"); const result = await publish(repo, (await candidates(repo))[0]!); expect(!result.ok && result.error.kind).toBe("conflict"); });
  it("representa 422 sem publicar conteúdo", async () => { const repo = new HomeAdminMockRepository("validation"); const result = await publish(repo, (await candidates())[0]!); expect(!result.ok && result.error.kind).toBe("validation"); });
  it("retorna 401 sem simular sucesso", async () => { const repo = new HomeAdminMockRepository("unauthenticated"); const source = (await candidates())[0]!; const result = await publish(repo, source); expect(!result.ok && result.error.kind).toBe("unauthenticated"); });
  it("retorna indisponibilidade sem simular sucesso", async () => { const repo = new HomeAdminMockRepository("unavailable"); const result = await publish(repo, (await candidates())[0]!); expect(!result.ok && result.error.kind).toBe("unavailable"); });
  it("conflito não altera a versão pública", async () => { const repo = new HomeAdminMockRepository("publication_conflict"); const before = await history(repo); await publish(repo, (await candidates(repo))[0]!); expect(await history(repo)).toEqual(before); });
  it("403 não altera a versão pública", async () => { const repo = new HomeAdminMockRepository(); const before = await history(repo); await publish(repo, (await candidates(repo))[0]!, emptyProfile); expect(await history(repo)).toEqual(before); });
  it("dupla publicação não duplica histórico", async () => { const repo = new HomeAdminMockRepository(); const source = (await candidates(repo))[0]!; await publish(repo, source); await publish(repo, source); expect((await history(repo)).filter((entry) => entry.versionId === "history-banner-v2")).toHaveLength(1); });
});

describe("F2.2D histórico e restauração", () => {
  it("lista versões dos três tipos", async () => expect(new Set((await history()).map((entry) => entry.resource.resourceType)).size).toBe(3));
  it("identifica as versões públicas atuais", async () => expect((await history()).filter((entry) => entry.isCurrentPublic)).toHaveLength(3));
  it("inclui versão arquivada", async () => expect((await history()).some((entry) => entry.resource.state === "archived")).toBe(true));
  it("carrega detalhe por versionId", async () => { const repo = new HomeAdminMockRepository(); const result = await repo.getHistoryVersion("history-banner-v1"); expect(result.ok && result.data.versionId).toBe("history-banner-v1"); });
  it("retorna erro contextual para versionId inexistente", async () => { const result = await new HomeAdminMockRepository().getHistoryVersion("inexistente"); expect(!result.ok && result.error.kind).toBe("unexpected"); });
  it("restaura banner como draft", async () => { const repo = new HomeAdminMockRepository(); const result = await restore(repo, (await history(repo))[0]!); expect(result.ok && result.data.draft.state).toBe("draft"); });
  it("restaura contatos como draft", async () => { const repo = new HomeAdminMockRepository(); const entry = (await history(repo)).find((item) => item.resource.resourceType === "footer_contacts")!; const result = await restore(repo, entry); expect(result.ok && result.data.draft.resourceType).toBe("footer_contacts"); });
  it("restaura redes como configuração completa", async () => { const repo = new HomeAdminMockRepository(); const entry = (await history(repo)).find((item) => item.resource.resourceType === "footer_social_links")!; const result = await restore(repo, entry); expect(result.ok && result.data.draft.resourceType === "footer_social_links" && result.data.draft.links.length).toBe(3); });
  it("restauração nunca publica", async () => { const repo = new HomeAdminMockRepository(); const result = await restore(repo, (await history(repo))[0]!); expect(result.ok && result.data.draft.version.publishedAt).toBeNull(); });
  it("invalida a aprovação histórica", async () => { const repo = new HomeAdminMockRepository(); const result = await restore(repo, (await history(repo))[0]!); expect(result.ok && result.data.draft.version.approvedAt).toBeNull(); });
  it("remove o ciclo de revisão histórico", async () => { const repo = new HomeAdminMockRepository(); const result = await restore(repo, (await history(repo))[0]!); expect(result.ok && result.data.draft.review).toBeNull(); });
  it("gera novo hash editorial", async () => { const repo = new HomeAdminMockRepository(); const entry = (await history(repo))[0]!; const result = await restore(repo, entry); expect(result.ok && result.data.draft.version.contentHash).not.toBe(entry.resource.version.contentHash); });
  it("gera novo identificador editorial", async () => { const repo = new HomeAdminMockRepository(); const entry = (await history(repo))[0]!; const result = await restore(repo, entry); expect(result.ok && result.data.draft.id).not.toBe(entry.resource.id); });
  it("gera nova versão de rascunho", async () => { const repo = new HomeAdminMockRepository(); const entry = (await history(repo))[0]!; const result = await restore(repo, entry); expect(result.ok && result.data.draft.version.editorialVersion).toBeGreaterThan(entry.resource.version.editorialVersion); });
  it("preserva versão pública durante restore", async () => { const repo = new HomeAdminMockRepository(); const before = await history(repo); await restore(repo, before[0]!); expect(await history(repo)).toEqual(before); });
  it("bloqueia restore sem capability", async () => { const repo = new HomeAdminMockRepository(); const result = await restore(repo, (await history(repo))[0]!, emptyProfile); expect(!result.ok && result.error.kind).toBe("forbidden"); });
  it("retorna 409 no conflito de restore", async () => { const repo = new HomeAdminMockRepository("restore_conflict"); const result = await restore(repo, (await history(repo))[0]!); expect(!result.ok && result.error.kind).toBe("conflict"); });
  it("não cria versão histórica falsa no conflito", async () => { const repo = new HomeAdminMockRepository("restore_conflict"); const before = await history(repo); await restore(repo, before[0]!); expect(await history(repo)).toEqual(before); });
});
