import { describe, expect, it } from "vitest";
import { buildActionMatrix } from "../domain/editorial-rules";
import type { AdminBanner, AdminFooterContacts, AdminSocialConfiguration } from "../domain/home-admin.types";
import { buildReviewComparison, countChanges } from "../domain/review-comparison";
import {
  DEFAULT_REVIEW_FILTERS,
  describeReviewerIdentity,
  evaluateReviewIntegrity,
  filterReviewQueue,
  isDecided,
  segregationBlockMessage,
  shortHash,
  validateReviewOpinion,
  type ReviewQueueEntry,
} from "../domain/review-queue.types";
import { SIMULATED_USERS, createReviewQueue } from "../mocks/home-admin.mock-data";
import { HOME_ADMIN_CAPABILITIES, type SimulatedAdminProfile } from "../permissions/home-admin.permissions";

const queue = createReviewQueue();
const bannerEntry = queue.find((item) => item.cycle.cycleId === "review-banner-1")!;
const contactsEntry = queue.find((item) => item.cycle.cycleId === "review-contacts-1")!;
const socialEntry = queue.find((item) => item.cycle.cycleId === "review-social-1")!;
const approvedEntry = queue.find((item) => item.cycle.cycleId === "review-banner-2")!;
const cancelledEntry = queue.find((item) => item.cycle.cycleId === "review-social-2")!;
const invalidatedEntry = queue.find((item) => item.cycle.cycleId === "review-banner-3")!;

function reviewerProfile(actorId: string, capabilities = [HOME_ADMIN_CAPABILITIES.decideReview]): SimulatedAdminProfile {
  return { actorId, displayName: actorId, capabilities };
}

function matrixFor(entry: ReviewQueueEntry, profile: SimulatedAdminProfile, overrides: Partial<{ currentVersion: number; currentHash: string }> = {}) {
  return buildActionMatrix({
    resourceType: entry.cycle.resourceType,
    state: entry.submitted.state,
    reviewDecision: entry.cycle.decision,
    authorId: entry.authorId,
    submittedById: entry.cycle.submittedBy,
    submittedVersion: entry.cycle.submittedVersion,
    submittedHash: entry.cycle.submittedHash,
    profile,
    hasChanges: false,
    approvalValid: false,
    currentVersion: overrides.currentVersion ?? entry.currentVersion,
    approvedVersion: null,
    currentHash: overrides.currentHash ?? entry.currentHash,
    approvedHash: null,
  });
}

describe("F2.2C review queue domain", () => {
  it("covers the three content types with stable discriminated identifiers", () => {
    expect(new Set(queue.map((entry) => entry.cycle.resourceType)))
      .toEqual(new Set(["banner", "footer_contacts", "footer_social_links"]));
  });

  it("exposes every review decision state deterministically", () => {
    expect(new Set(queue.map((entry) => entry.cycle.decision)))
      .toEqual(new Set(["pending", "approved", "changes_requested", "cancelled", "invalidated"]));
  });

  it("treats any decided cycle as read-only", () => {
    expect(isDecided(bannerEntry.cycle)).toBe(false);
    [approvedEntry, cancelledEntry, invalidatedEntry].forEach((entry) => expect(isDecided(entry.cycle)).toBe(true));
  });

  it("shortens hashes without hiding the algorithm prefix segment", () => {
    expect(shortHash("sha256:banner:v2")).toBe("v2");
    expect(shortHash("sha256:banner:abcdefghijklmno")).toBe("abcdefghij…");
  });
});

describe("F2.2C segregation of duties", () => {
  it("identifies the author by stable identifier, not by display name", () => {
    const identity = describeReviewerIdentity(bannerEntry, SIMULATED_USERS.author.id);
    expect(identity).toMatchObject({ isAuthor: true, isSubmitter: false });
    expect(segregationBlockMessage(identity)).toBe("Você é o autor deste conteúdo.");
  });

  it("identifies the submitter separately from the author", () => {
    const identity = describeReviewerIdentity(bannerEntry, SIMULATED_USERS.submitter.id);
    expect(identity).toMatchObject({ isAuthor: false, isSubmitter: true });
    expect(segregationBlockMessage(identity)).toBe("Você enviou este conteúdo para revisão.");
  });

  it("treats an unrelated actor as an independent reviewer", () => {
    const identity = describeReviewerIdentity(bannerEntry, SIMULATED_USERS.reviewer.id);
    expect(identity).toMatchObject({ isAuthor: false, isSubmitter: false });
    expect(segregationBlockMessage(identity)).toBeNull();
    expect(identity.relationLabel).toBe("Revisor independente");
  });

  it("blocks the author from approving even holding the review capability", () => {
    const matrix = matrixFor(bannerEntry, reviewerProfile(SIMULATED_USERS.author.id));
    expect(matrix.approve).toMatchObject({ enabled: false, reason: "own_content" });
    expect(matrix.request_changes).toMatchObject({ enabled: false, reason: "own_content" });
  });

  it("blocks the submitter from deciding even holding the review capability", () => {
    const matrix = matrixFor(bannerEntry, reviewerProfile(SIMULATED_USERS.submitter.id));
    expect(matrix.approve).toMatchObject({ enabled: false, reason: "own_submission" });
  });

  it("allows an independent reviewer holding the capability", () => {
    const matrix = matrixFor(bannerEntry, reviewerProfile(SIMULATED_USERS.reviewer.id));
    expect(matrix.approve).toMatchObject({ enabled: true, blocked: false });
    expect(matrix.request_changes).toMatchObject({ enabled: true, blocked: false });
  });

  it("requires the review capability in addition to independence", () => {
    const matrix = matrixFor(bannerEntry, reviewerProfile(SIMULATED_USERS.reviewer.id, []));
    expect(matrix.approve).toMatchObject({ enabled: false, reason: "missing_capability" });
  });

  it("blocks any decision on a cycle that is no longer pending", () => {
    const matrix = matrixFor(approvedEntry, reviewerProfile(SIMULATED_USERS.reviewer.id));
    expect(matrix.approve).toMatchObject({ enabled: false, reason: "review_not_pending" });
  });
});

describe("F2.2C version and hash integrity", () => {
  it("reports an intact cycle when version and hash match", () => {
    expect(evaluateReviewIntegrity(bannerEntry)).toEqual({ status: "intact" });
  });

  it("detects a diverging version", () => {
    const entry = { ...bannerEntry, currentVersion: bannerEntry.cycle.submittedVersion + 1 };
    expect(evaluateReviewIntegrity(entry)).toMatchObject({ status: "version_mismatch" });
    expect(matrixFor(entry, reviewerProfile(SIMULATED_USERS.reviewer.id)).approve)
      .toMatchObject({ enabled: false, reason: "version_mismatch" });
  });

  it("detects a diverging hash", () => {
    const entry = { ...bannerEntry, currentHash: "sha256:banner:v2-alterado" };
    expect(evaluateReviewIntegrity(entry)).toMatchObject({ status: "hash_mismatch" });
    expect(matrixFor(entry, reviewerProfile(SIMULATED_USERS.reviewer.id)).approve)
      .toMatchObject({ enabled: false, reason: "hash_mismatch" });
  });
});

describe("F2.2C review opinion validation", () => {
  it("rejects an empty justification when it is required", () => {
    expect(validateReviewOpinion("", true)).toMatch(/entre 10 e 1000 caracteres/);
    expect(validateReviewOpinion("     ", true)).toMatch(/entre 10 e 1000 caracteres/);
  });

  it("rejects a justification shorter than ten characters", () => {
    expect(validateReviewOpinion("curto", true)).toMatch(/entre 10 e 1000 caracteres/);
  });

  it("rejects a justification longer than one thousand characters", () => {
    expect(validateReviewOpinion("a".repeat(1001), true)).toMatch(/no máximo 1000/);
  });

  it("accepts a valid justification and an omitted optional opinion", () => {
    expect(validateReviewOpinion("Ajuste o horário de atendimento antes de reenviar.", true)).toBeNull();
    expect(validateReviewOpinion("", false)).toBeNull();
  });
});

describe("F2.2C queue filters", () => {
  it("prioritises pending reviews by default", () => {
    const visible = filterReviewQueue(queue, DEFAULT_REVIEW_FILTERS, SIMULATED_USERS.reviewer.id);
    expect(visible).toHaveLength(3);
    expect(visible.every((entry) => entry.cycle.decision === "pending")).toBe(true);
  });

  it("filters by decision", () => {
    const visible = filterReviewQueue(queue, { ...DEFAULT_REVIEW_FILTERS, decision: "cancelled" }, SIMULATED_USERS.reviewer.id);
    expect(visible.map((entry) => entry.cycle.cycleId)).toEqual(["review-social-2"]);
  });

  it("filters by content type", () => {
    const visible = filterReviewQueue(queue, { ...DEFAULT_REVIEW_FILTERS, decision: "all", resourceType: "footer_social_links" }, SIMULATED_USERS.reviewer.id);
    expect(visible.map((entry) => entry.cycle.cycleId)).toEqual(["review-social-1", "review-social-2"]);
  });

  it("filters by the actor responsible for the submission", () => {
    const visible = filterReviewQueue(queue, { ...DEFAULT_REVIEW_FILTERS, decision: "all", submittedBy: SIMULATED_USERS.author.id }, SIMULATED_USERS.reviewer.id);
    expect(visible.every((entry) => entry.cycle.submittedBy === SIMULATED_USERS.author.id)).toBe(true);
  });

  it("filters to only the reviews the current actor may decide", () => {
    const forAuthor = filterReviewQueue(queue, { ...DEFAULT_REVIEW_FILTERS, onlyDecidable: true }, SIMULATED_USERS.author.id);
    expect(forAuthor.map((entry) => entry.cycle.cycleId)).toEqual(["review-social-1"]);
    const forReviewer = filterReviewQueue(queue, { ...DEFAULT_REVIEW_FILTERS, onlyDecidable: true }, SIMULATED_USERS.reviewer.id);
    expect(forReviewer).toHaveLength(3);
  });

  it("returns the full scenario list when every filter is cleared", () => {
    const visible = filterReviewQueue(queue, { decision: "all", resourceType: "all", submittedBy: "all", onlyDecidable: false }, SIMULATED_USERS.reviewer.id);
    expect(visible).toHaveLength(queue.length);
  });
});

describe("F2.2C banner comparison", () => {
  const groups = buildReviewComparison(bannerEntry.published, bannerEntry.submitted);
  const fields = groups.flatMap((group) => group.fields);
  const byId = (id: string) => fields.find((item) => item.id === id)!;

  it("marks a changed title with both values", () => {
    expect(byId("title")).toMatchObject({
      label: "Título",
      publicValue: "Juntos somos mais fortes.",
      submittedValue: "Servidor valorizado, cidade mais forte.",
      change: "changed",
    });
  });

  it("keeps an unchanged field explicitly marked as unchanged", () => {
    expect(byId("description").change).toBe("unchanged");
  });

  it("compares alternative text and the demonstration image", () => {
    expect(byId("altText").change).toBe("changed");
    expect(byId("image")).toMatchObject({ publicValue: "hero-union-840", submittedValue: "hero-union-1672" });
  });

  it("compares CTA destination kind and target", () => {
    expect(byId("ctaKind")).toMatchObject({ publicValue: "Rota interna", submittedValue: "URL externa" });
    expect(byId("ctaTarget")).toMatchObject({ publicValue: "membership", submittedValue: "https://sindgestao.org.br/assembleia" });
  });

  it("reports every banner field as added when there is no public version", () => {
    const withoutPublic = buildReviewComparison(null, bannerEntry.submitted).flatMap((group) => group.fields);
    expect(withoutPublic.filter((item) => item.change === "added").length).toBeGreaterThan(0);
    expect(withoutPublic.some((item) => item.change === "changed")).toBe(false);
  });

  it("marks a removed CTA label as removed rather than changed", () => {
    const disabled: AdminBanner = { ...(bannerEntry.submitted as AdminBanner), cta: { enabled: false } };
    const fieldsWithoutCta = buildReviewComparison(bannerEntry.published, disabled).flatMap((group) => group.fields);
    expect(fieldsWithoutCta.find((item) => item.id === "ctaLabel")?.change).toBe("removed");
  });
});

describe("F2.2C contacts comparison", () => {
  const fields = buildReviewComparison(contactsEntry.published, contactsEntry.submitted).flatMap((group) => group.fields);
  const byId = (id: string) => fields.find((item) => item.id === id)!;

  it("formats phone and postal code for reading without normalising the comparison", () => {
    expect(byId("phone")).toMatchObject({ publicValue: "(11) 1234-5678", submittedValue: "(65) 99999-0000", change: "changed" });
    expect(byId("postalCode")).toMatchObject({ publicValue: "78000-000", submittedValue: "78123-456", change: "changed" });
  });

  it("compares e-mail, address and federative unit", () => {
    expect(byId("email").change).toBe("changed");
    expect(byId("address").change).toBe("changed");
    expect(byId("stateCode").change).toBe("unchanged");
  });

  it("represents an emptied optional field as Não informado", () => {
    expect(byId("businessHours")).toMatchObject({ submittedValue: "Não informado", change: "changed" });
  });

  it("does not report a change when only formatting differs", () => {
    const submitted = contactsEntry.submitted as AdminFooterContacts;
    const identical = buildReviewComparison({ ...submitted, state: "published" }, submitted).flatMap((group) => group.fields);
    expect(identical.every((item) => item.change === "unchanged")).toBe(true);
  });
});

describe("F2.2C social comparison", () => {
  const groups = buildReviewComparison(socialEntry.published, socialEntry.submitted);
  const fields = groups.flatMap((group) => group.fields);
  const byId = (id: string) => fields.find((item) => item.id === id)!;

  it("compares the configuration as a single versioned unit", () => {
    expect(groups[0]?.label).toContain("unidade completa");
    expect(byId("linkCount")).toMatchObject({ publicValue: "3", submittedValue: "3" });
  });

  it("detects an added platform by stable id", () => {
    expect(byId("link-linkedin")).toMatchObject({ publicValue: null, change: "added" });
  });

  it("detects a removed platform by stable id", () => {
    expect(byId("link-youtube")).toMatchObject({ submittedValue: null, change: "removed" });
  });

  it("detects url, label, activation and order changes inside one link row", () => {
    expect(byId("link-instagram").submittedValue).toContain("https://instagram.com/sindgestao");
    expect(byId("link-instagram").submittedValue).toContain("Instagram do SINDGESTÃO");
    expect(byId("link-facebook").submittedValue).toContain("inativo");
    expect(byId("link-facebook").publicValue).toContain("ativo");
    expect(byId("order")).toMatchObject({
      publicValue: "Facebook → Instagram → YouTube",
      submittedValue: "Instagram → Facebook → LinkedIn",
      change: "changed",
    });
  });

  it("counts active links as part of the unit", () => {
    expect(byId("activeCount")).toMatchObject({ publicValue: "3", submittedValue: "2" });
  });

  it("reports no changes when the submitted configuration equals the public one", () => {
    const submitted = socialEntry.submitted as AdminSocialConfiguration;
    const identical = buildReviewComparison({ ...submitted, state: "published" }, submitted);
    expect(countChanges(identical)).toBe(0);
  });
});
