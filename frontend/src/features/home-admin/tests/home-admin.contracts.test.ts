import { describe, expect, it } from "vitest";
import { isSelectablePublicRouteKey } from "../contracts/public-route-catalog";
import {
  buildActionMatrix,
  evaluateEditorialTransition,
  evaluateReviewDecision,
  type ActionMatrixContext,
} from "../domain/editorial-rules";
import type { AdminError, ReviewDecisionCommand } from "../domain/home-admin.types";
import {
  adminBannerMock,
  adminFooterContactsMock,
  adminSocialConfigurationMock,
  createPendingReview,
} from "../mocks/home-admin.mock-data";
import { HomeAdminMockRepository } from "../mocks/home-admin.mock.repository";
import {
  HOME_ADMIN_CAPABILITIES,
  hasCapability,
  type SimulatedAdminProfile,
} from "../permissions/home-admin.permissions";
import {
  parseAdminBanner,
  parseAdminError,
  parseAdminFooterContacts,
  parseAdminSocialConfiguration,
  parseBannerCta,
  parseReviewCycle,
} from "../schemas/home-admin.validators";

const reviewerProfile: SimulatedAdminProfile = {
  actorId: "actor-reviewer-1",
  displayName: "Revisor",
  capabilities: Object.values(HOME_ADMIN_CAPABILITIES),
};

const noCapabilitiesProfile: SimulatedAdminProfile = {
  actorId: "actor-viewer-1",
  displayName: "Sem capacidades",
  capabilities: [],
};

function actionContext(
  overrides: Partial<ActionMatrixContext> = {},
): ActionMatrixContext {
  return {
    resourceType: "banner",
    state: "approved",
    reviewDecision: "approved",
    authorId: "actor-editor-1",
    profile: reviewerProfile,
    hasChanges: true,
    approvalValid: true,
    currentVersion: 1,
    approvedVersion: 1,
    currentHash: "sha256:banner:v1",
    approvedHash: "sha256:banner:v1",
    ...overrides,
  };
}

function decisionCommand(
  overrides: Partial<ReviewDecisionCommand> = {},
): ReviewDecisionCommand {
  return {
    cycle: createPendingReview(),
    reviewerId: "actor-reviewer-1",
    decision: "approved",
    currentVersion: 1,
    currentHash: "sha256:banner:v1",
    ...overrides,
  };
}

describe("F2.1 Home administrative contracts", () => {
  describe("strict CTA contract", () => {
    it("accepts a disabled CTA without label or destination", () => {
      expect(parseBannerCta({ enabled: false })).toEqual({ success: true, data: { enabled: false } });
    });

    it("accepts an enabled internal CTA from the selectable route catalog", () => {
      expect(parseBannerCta({ enabled: true, kind: "internal", label: "Filie-se", route: "membership" }).success).toBe(true);
      expect(isSelectablePublicRouteKey("membership")).toBe(true);
    });

    it("accepts an enabled external HTTPS CTA", () => {
      expect(parseBannerCta({ enabled: true, kind: "external", label: "Portal", url: "https://example.org" }).success).toBe(true);
    });

    it("rejects an internal route outside the catalog", () => {
      expect(parseBannerCta({ enabled: true, kind: "internal", label: "Outro", route: "arbitrary" }).success).toBe(false);
    });

    it("rejects a disabled catalog route", () => {
      expect(parseBannerCta({ enabled: true, kind: "internal", label: "Área", route: "memberArea" }).success).toBe(false);
    });

    it("rejects HTTP external URLs", () => {
      expect(parseBannerCta({ enabled: true, kind: "external", label: "Inseguro", url: "http://example.org" }).success).toBe(false);
    });

    it("rejects javascript URLs", () => {
      expect(parseBannerCta({ enabled: true, kind: "external", label: "Inseguro", url: "javascript:alert(1)" }).success).toBe(false);
    });

    it("rejects incompatible fields on a disabled CTA", () => {
      const result = parseBannerCta({ enabled: false, label: "Não deveria existir" });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.issues[0]?.code).toBe("unknown_property");
    });

    it("rejects unknown properties on an enabled CTA", () => {
      expect(parseBannerCta({
        enabled: true,
        kind: "internal",
        label: "Filie-se",
        route: "membership",
        target: "_blank",
      }).success).toBe(false);
    });
  });

  describe("runtime schemas", () => {
    it("accepts a complete valid banner", () => {
      expect(parseAdminBanner(adminBannerMock).success).toBe(true);
    });

    it("rejects an invalid banner", () => {
      expect(parseAdminBanner({ ...adminBannerMock, title: "" }).success).toBe(false);
    });

    it("rejects an unknown banner property", () => {
      expect(parseAdminBanner({ ...adminBannerMock, cssClass: "hero-large" }).success).toBe(false);
    });

    it("accepts and normalizes valid footer contacts", () => {
      const result = parseAdminFooterContacts({
        ...adminFooterContactsMock,
        email: " CONTATO@SINDGESTAO.ORG.BR ",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.email).toBe("contato@sindgestao.org.br");
    });

    it("accepts empty individual contact values when another channel exists", () => {
      expect(parseAdminFooterContacts({
        ...adminFooterContactsMock,
        phone: "",
        email: "",
      }).success).toBe(true);
    });

    it("rejects contacts without any usable channel", () => {
      expect(parseAdminFooterContacts({
        ...adminFooterContactsMock,
        phone: "",
        email: "",
        address: "",
      }).success).toBe(false);
    });

    it("rejects malformed contact email", () => {
      expect(parseAdminFooterContacts({ ...adminFooterContactsMock, email: "invalid" }).success).toBe(false);
    });

    it("accepts a complete ordered social configuration", () => {
      expect(parseAdminSocialConfiguration(adminSocialConfigurationMock).success).toBe(true);
    });

    it("rejects an unsafe social URL", () => {
      const links = structuredClone(adminSocialConfigurationMock.links);
      links[0]!.url = "data:text/html,unsafe";
      expect(parseAdminSocialConfiguration({ ...adminSocialConfigurationMock, links }).success).toBe(false);
    });

    it("rejects duplicate or non-contiguous social ordering", () => {
      const links = structuredClone(adminSocialConfigurationMock.links);
      links[2]!.order = 1;
      expect(parseAdminSocialConfiguration({ ...adminSocialConfigurationMock, links }).success).toBe(false);
    });

    it("requires justification for requested changes", () => {
      expect(parseReviewCycle({
        ...createPendingReview(),
        decision: "changes_requested",
        decidedAt: "2026-08-03T12:00:00.000Z",
      }).success).toBe(false);
    });
  });

  describe("editorial and review rules", () => {
    it.each([
      ["draft", "review", {}],
      ["review", "approved", { reviewDecision: "approved" }],
      ["review", "draft", { reviewDecision: "changes_requested" }],
      ["review", "draft", { reviewDecision: "cancelled" }],
      ["approved", "published", { approvalValid: true, currentVersion: 1, approvedVersion: 1, currentHash: "hash", approvedHash: "hash" }],
      ["approved", "draft", { hasChanges: true }],
      ["published", "archived", {}],
    ] as const)("allows %s → %s when its preconditions hold", (from, to, context) => {
      expect(evaluateEditorialTransition(from, to, context)).toEqual({ allowed: true });
    });

    it.each([
      ["draft", "published"],
      ["review", "published"],
      ["archived", "published"],
      ["published", "draft"],
    ] as const)("blocks %s → %s", (from, to) => {
      expect(evaluateEditorialTransition(from, to).allowed).toBe(false);
    });

    it("blocks approval by the content author", () => {
      const command = decisionCommand({ reviewerId: "actor-editor-1" });
      expect(evaluateReviewDecision(command)).toEqual({ allowed: false, reason: "own_content" });
    });

    it("blocks cancellation after a decision", () => {
      const cycle = { ...createPendingReview(), decision: "approved" as const };
      expect(evaluateReviewDecision(decisionCommand({ cycle, decision: "cancelled", reason: "Tarde demais" })))
        .toEqual({ allowed: false, reason: "review_not_pending" });
    });

    it("requires a new cycle after editing approved content", () => {
      expect(evaluateEditorialTransition("approved", "draft", { hasChanges: true })).toEqual({ allowed: true });
      const matrix = buildActionMatrix(actionContext({ approvalValid: false }));
      expect(matrix.publish).toMatchObject({ enabled: false, reason: "stale_approval" });
    });

    it("blocks review approval when the submitted hash diverges", () => {
      expect(evaluateReviewDecision(decisionCommand({ currentHash: "sha256:changed" })))
        .toEqual({ allowed: false, reason: "hash_mismatch" });
    });

    it("blocks review approval when the submitted version diverges", () => {
      expect(evaluateReviewDecision(decisionCommand({ currentVersion: 2 })))
        .toEqual({ allowed: false, reason: "version_mismatch" });
    });

    it("blocks publication when the approved hash diverges", () => {
      const matrix = buildActionMatrix(actionContext({ approvedHash: "sha256:old" }));
      expect(matrix.publish).toMatchObject({ enabled: false, reason: "hash_mismatch" });
    });

    it("blocks publication when the approved version is stale", () => {
      const matrix = buildActionMatrix(actionContext({ currentVersion: 2, approvedVersion: 1 }));
      expect(matrix.publish).toMatchObject({ enabled: false, reason: "stale_approval" });
    });
  });

  describe("capabilities and action matrix", () => {
    it("hasCapability uses the simulated profile capability set", () => {
      expect(hasCapability(reviewerProfile, HOME_ADMIN_CAPABILITIES.decideReview)).toBe(true);
      expect(hasCapability(noCapabilitiesProfile, HOME_ADMIN_CAPABILITIES.decideReview)).toBe(false);
    });

    it("exposes and enables actions according to state and capability", () => {
      const matrix = buildActionMatrix(actionContext({ state: "review", reviewDecision: "pending" }));
      expect(matrix.approve).toMatchObject({ visible: true, enabled: true, blocked: false });
      expect(matrix.publish).toMatchObject({ visible: false, enabled: false, reason: "not_applicable" });
    });

    it("requires the specific banner publication capability", () => {
      const matrix = buildActionMatrix(actionContext({ profile: noCapabilitiesProfile }));
      expect(matrix.publish).toMatchObject({ enabled: false, reason: "missing_capability" });
    });

    it("requires the specific footer contacts publication capability", () => {
      const profile = { ...noCapabilitiesProfile, capabilities: [HOME_ADMIN_CAPABILITIES.publishBanner] };
      const matrix = buildActionMatrix(actionContext({ resourceType: "footer_contacts", profile }));
      expect(matrix.publish).toMatchObject({ enabled: false, reason: "missing_capability" });
    });

    it("requires the specific social configuration publication capability", () => {
      const profile = { ...noCapabilitiesProfile, capabilities: [HOME_ADMIN_CAPABILITIES.publishFooterContacts] };
      const matrix = buildActionMatrix(actionContext({ resourceType: "footer_social_links", profile }));
      expect(matrix.publish).toMatchObject({ enabled: false, reason: "missing_capability" });
    });
  });

  describe("discriminated administrative errors", () => {
    it.each<AdminError>([
      { kind: "unauthenticated", status: 401, message: "Não autenticado." },
      { kind: "forbidden", status: 403, message: "Sem capacidade.", requiredCapability: "home.banner.edit" },
      { kind: "conflict", status: 409, message: "Conflito.", expectedRevision: 1, actualRevision: 2 },
      { kind: "validation", status: 422, message: "Inválido.", fields: { title: ["Obrigatório."] } },
      { kind: "unavailable", message: "Indisponível.", retryable: true },
      { kind: "unexpected", message: "Inesperado.", retryable: false },
    ])("represents $status as $kind", (error) => {
      expect(parseAdminError(error)).toEqual({ success: true, data: error });
    });
  });

  describe("deterministic mock adapters", () => {
    it.each([
      ["success", "ready"],
      ["loading", "loading"],
      ["empty", "empty"],
      ["validation", "error"],
      ["unauthenticated", "error"],
      ["forbidden", "error"],
      ["conflict", "error"],
      ["unavailable", "error"],
    ] as const)("maps the %s scenario to %s", (scenario, status) => {
      expect(new HomeAdminMockRepository(scenario).getResourceListState().status).toBe(status);
    });

    it("does not mutate state when an operation returns an error", async () => {
      const repository = new HomeAdminMockRepository("conflict");
      const before = repository.getDeterministicSnapshot();
      const result = await repository.saveDraft({ resource: adminBannerMock, expectedRevision: 0 });

      expect(result.ok).toBe(false);
      expect(repository.getDeterministicSnapshot()).toEqual(before);
    });

    it("returns deterministic copies instead of exposing mutable mock state", async () => {
      const repository = new HomeAdminMockRepository("success");
      const first = await repository.listResources();
      const second = await repository.listResources();
      expect(first).toEqual(second);
      expect(first).not.toBe(second);
    });
  });
});
