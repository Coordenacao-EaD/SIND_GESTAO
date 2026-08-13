import { describe, expect, it } from "vitest";

import {
  InvalidHomeSnapshotError,
  bannerSnapshotToDraftInput,
  buildSnapshot,
  contactsSnapshotToDraftInput,
  socialSnapshotToLinkInputs,
  validateSiteHomeSnapshot,
  type SiteHomeSnapshot,
} from "../../../src/modules/site-home/site-home-version.service.js";

const ACTOR_ID = "82000000-0000-4000-8000-000000000001";

function snapshotFixture(): SiteHomeSnapshot {
  return buildSnapshot({
    banner: {
      title: "Atuação sindical",
      subtitle: null,
      bodyText: "Conteúdo institucional consolidado.",
      imageUrl: "/assets/banner.webp",
      imageAlt: "Trabalhadores reunidos",
      ctaEnabled: true,
      ctaLabel: "Conheça",
      ctaLinkType: "internal",
      ctaLinkValue: "/institucional",
    },
    contacts: {
      phone: "(65) 3000-0000",
      email: "contato@example.test",
      address: "Rua Central, 10",
      city: "Cuiabá",
      state: "MT",
      postalCode: "78000-000",
      businessHours: null,
    },
    socialConfiguration: {
      links: [
        {
          platform: "instagram",
          url: "https://example.test/instagram",
          displayOrder: 2,
          isActive: true,
        },
        {
          platform: "facebook",
          url: "https://example.test/facebook",
          displayOrder: 1,
          isActive: false,
        },
      ],
    },
  });
}

describe("site-home snapshot and restore mappings", () => {
  it("VERSION-UNIT-001: builds a stable functional snapshot in canonical social order", () => {
    const snapshot = snapshotFixture();

    expect(snapshot).toEqual({
      schemaVersion: 1,
      banner: {
        title: "Atuação sindical",
        subtitle: null,
        bodyText: "Conteúdo institucional consolidado.",
        imageUrl: "/assets/banner.webp",
        imageAlt: "Trabalhadores reunidos",
        ctaEnabled: true,
        ctaLabel: "Conheça",
        ctaLinkType: "internal",
        ctaLinkValue: "/institucional",
      },
      contacts: {
        phone: "(65) 3000-0000",
        email: "contato@example.test",
        address: "Rua Central, 10",
        city: "Cuiabá",
        state: "MT",
        postalCode: "78000-000",
        businessHours: null,
      },
      socialConfiguration: {
        links: [
          {
            platform: "facebook",
            url: "https://example.test/facebook",
            displayOrder: 1,
            isActive: false,
          },
          {
            platform: "instagram",
            url: "https://example.test/instagram",
            displayOrder: 2,
            isActive: true,
          },
        ],
      },
    });
  });

  it("VERSION-UNIT-002: normalizes disabled CTA fields and supports an absent social configuration", () => {
    const snapshot = buildSnapshot({
      ...snapshotFixture(),
      banner: {
        ...snapshotFixture().banner,
        ctaEnabled: false,
        ctaLabel: "ignored",
        ctaLinkType: "external",
        ctaLinkValue: "https://example.test/ignored",
      },
      socialConfiguration: null,
    });

    expect(snapshot.banner).toMatchObject({
      ctaEnabled: false,
      ctaLabel: null,
      ctaLinkType: null,
      ctaLinkValue: null,
    });
    expect(snapshot.socialConfiguration).toBeNull();
  });

  it("VERSION-UNIT-003: validates and canonicalizes a persisted snapshot", () => {
    const raw = structuredClone(snapshotFixture());
    raw.socialConfiguration!.links.reverse();

    expect(validateSiteHomeSnapshot(raw)).toEqual(snapshotFixture());
  });

  it.each([
    ["root", null],
    ["schema", { ...snapshotFixture(), schemaVersion: 2 }],
    ["banner", { ...snapshotFixture(), banner: null }],
    ["contacts", { ...snapshotFixture(), contacts: { ...snapshotFixture().contacts, email: 7 } }],
    [
      "CTA",
      {
        ...snapshotFixture(),
        banner: { ...snapshotFixture().banner, ctaEnabled: true, ctaLabel: null },
      },
    ],
    [
      "social platform",
      {
        ...snapshotFixture(),
        socialConfiguration: {
          links: [{ platform: "tiktok", url: "https://example.test", displayOrder: 0, isActive: true }],
        },
      },
    ],
  ])("VERSION-UNIT-004: rejects an invalid %s snapshot with a domain error", (_case, value) => {
    expect(() => validateSiteHomeSnapshot(value)).toThrow(InvalidHomeSnapshotError);
  });

  it("VERSION-UNIT-005: maps functional content to new draft inputs without editorial state", () => {
    const snapshot = snapshotFixture();

    expect(bannerSnapshotToDraftInput(snapshot.banner, 8, ACTOR_ID)).toEqual({
      ...snapshot.banner,
      versionNumber: 8,
      createdBy: ACTOR_ID,
    });
    expect(contactsSnapshotToDraftInput(snapshot.contacts, 9, ACTOR_ID)).toEqual({
      ...snapshot.contacts,
      versionNumber: 9,
      createdBy: ACTOR_ID,
    });
    expect(socialSnapshotToLinkInputs(snapshot.socialConfiguration!, ACTOR_ID)).toEqual(
      snapshot.socialConfiguration!.links.map((link) => ({ ...link, createdBy: ACTOR_ID })),
    );
  });
});
