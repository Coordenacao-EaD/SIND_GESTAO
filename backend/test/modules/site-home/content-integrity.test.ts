import { describe, expect, it } from "vitest";

import {
  calculateContentHash,
  contentMatchesHash,
  normalizeBannerContent,
  normalizeContactsContent,
  normalizeSocialContent,
  serializeCanonicalContent,
  type BannerFunctionalContent,
  type ContactsFunctionalContent,
  type SocialFunctionalContent,
} from "../../../src/modules/site-home/content-integrity.js";

const banner: BannerFunctionalContent = {
  title: "Servidor valorizado",
  subtitle: "Uma construção coletiva",
  bodyText: "Conteúdo funcional completo do banner.",
  imageUrl: "/assets/banner.webp",
  imageAlt: "Servidores reunidos",
  ctaEnabled: true,
  ctaLabel: "Saiba mais",
  ctaLinkType: "internal",
  ctaLinkValue: "/institucional",
};

const contacts: ContactsFunctionalContent = {
  phone: "(65) 3000-0000",
  email: "contato@example.test",
  address: "Rua Principal, 100",
  city: "Cuiabá",
  state: "MT",
  postalCode: "78000-000",
  businessHours: "Segunda a sexta, 8h às 17h",
};

const social: SocialFunctionalContent = {
  links: [
    { platform: "instagram", url: "https://example.test/instagram", displayOrder: 1, isActive: true },
    { platform: "facebook", url: "https://example.test/facebook", displayOrder: 0, isActive: true },
  ],
};

describe("canonical content integrity", () => {
  it("serializes a fixed field order and emits lowercase prefixed SHA-256", () => {
    const normalized = normalizeBannerContent(banner);
    expect(serializeCanonicalContent(normalized)).toBe(
      '{"contentType":"banner","title":"Servidor valorizado","subtitle":"Uma construção coletiva","bodyText":"Conteúdo funcional completo do banner.","imageUrl":"/assets/banner.webp","imageAlt":"Servidores reunidos","ctaEnabled":true,"ctaLabel":"Saiba mais","ctaLinkType":"internal","ctaLinkValue":"/institucional"}',
    );
    expect(calculateContentHash(normalized)).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("normalizes nullable fields and disabled CTA deterministically", () => {
    expect(
      normalizeBannerContent({
        ...banner,
        subtitle: null,
        imageUrl: null,
        imageAlt: null,
        ctaEnabled: false,
        ctaLabel: null,
        ctaLinkType: null,
        ctaLinkValue: null,
      }),
    ).toMatchObject({
      subtitle: null,
      imageUrl: null,
      imageAlt: null,
      ctaEnabled: false,
      ctaLabel: null,
      ctaLinkType: null,
      ctaLinkValue: null,
    });
    expect(normalizeContactsContent({ ...contacts, phone: null, businessHours: null })).toMatchObject({
      phone: null,
      businessHours: null,
    });
  });

  it("contentMatchesHash compares against the exact normalized content", () => {
    const normalized = normalizeContactsContent(contacts);
    const hash = calculateContentHash(normalized);
    expect(contentMatchesHash(normalized, hash)).toBe(true);
    expect(contentMatchesHash(normalizeContactsContent({ ...contacts, city: "Várzea Grande" }), hash)).toBe(false);
  });
});

describe("banner hash", () => {
  it("is stable for equal functional content and ignores technical metadata", () => {
    const withTechnicalFields = {
      ...banner,
      id: "banner-other-id",
      status: "published",
      createdAt: "2030-01-01T00:00:00.000Z",
      updatedAt: "2031-01-01T00:00:00.000Z",
      createdBy: "actor-other",
      updatedBy: "actor-other",
    };
    expect(calculateContentHash(normalizeBannerContent(withTechnicalFields))).toBe(
      calculateContentHash(normalizeBannerContent({ ...banner })),
    );
  });

  it.each([
    ["title", { title: "Outro título" }],
    ["subtitle", { subtitle: "Outro subtítulo" }],
    ["bodyText", { bodyText: "Outro conteúdo funcional completo." }],
    ["imageUrl", { imageUrl: "/assets/other.webp" }],
    ["imageAlt", { imageAlt: "Outra descrição" }],
    ["ctaEnabled", { ctaEnabled: false, ctaLabel: null, ctaLinkType: null, ctaLinkValue: null }],
    ["ctaLabel", { ctaLabel: "Conheça" }],
    ["ctaLinkType", { ctaLinkType: "external" }],
    ["ctaLinkValue", { ctaLinkValue: "https://example.test/other" }],
  ] as const)("changes hash when %s changes", (_field, override) => {
    expect(calculateContentHash(normalizeBannerContent({ ...banner, ...override }))).not.toBe(
      calculateContentHash(normalizeBannerContent(banner)),
    );
  });
});

describe("contacts hash", () => {
  it("is stable for equal functional content and ignores technical metadata", () => {
    const withTechnicalFields = {
      ...contacts,
      id: "contacts-other-id",
      versionNumber: 99,
      status: "archived",
      updatedAt: "2031-01-01T00:00:00.000Z",
    };
    expect(calculateContentHash(normalizeContactsContent(withTechnicalFields))).toBe(
      calculateContentHash(normalizeContactsContent({ ...contacts })),
    );
  });

  it.each([
    ["phone", { phone: "(65) 9999-9999" }],
    ["email", { email: "other@example.test" }],
    ["address", { address: "Avenida Secundária, 200" }],
    ["city", { city: "Várzea Grande" }],
    ["state", { state: "GO" }],
    ["postalCode", { postalCode: "78001-000" }],
    ["businessHours", { businessHours: "Somente pela manhã" }],
  ] as const)("changes hash when %s changes", (_field, override) => {
    expect(calculateContentHash(normalizeContactsContent({ ...contacts, ...override }))).not.toBe(
      calculateContentHash(normalizeContactsContent(contacts)),
    );
  });
});

describe("CT-HOM-009 social hash", () => {
  it("is equal when object properties arrive in a different order", () => {
    const reorderedProperties: SocialFunctionalContent = {
      links: social.links.map((link) => ({
        isActive: link.isActive,
        displayOrder: link.displayOrder,
        url: link.url,
        platform: link.platform,
      })),
    };
    expect(calculateContentHash(normalizeSocialContent(reorderedProperties))).toBe(
      calculateContentHash(normalizeSocialContent(social)),
    );
  });

  it("is equal when the input array order differs", () => {
    expect(calculateContentHash(normalizeSocialContent({ links: [...social.links].reverse() }))).toBe(
      calculateContentHash(normalizeSocialContent(social)),
    );
  });

  it.each([
    ["platform", { platform: "youtube" }],
    ["url", { url: "https://example.test/changed" }],
    ["displayOrder", { displayOrder: 3 }],
    ["isActive", { isActive: false }],
  ] as const)("changes when %s changes", (_field, override) => {
    const changed: SocialFunctionalContent = {
      links: [{ ...social.links[0]!, ...override }, social.links[1]!],
    };
    expect(calculateContentHash(normalizeSocialContent(changed))).not.toBe(
      calculateContentHash(normalizeSocialContent(social)),
    );
  });

  it("ignores updated_at and other technical metadata", () => {
    const links = social.links.map((link) => ({
      ...link,
      updated_at: "2031-01-01T00:00:00.000Z",
      created_by: "actor-other",
    }));
    expect(calculateContentHash(normalizeSocialContent({ links }))).toBe(
      calculateContentHash(normalizeSocialContent(social)),
    );
  });

  it("ignores technical IDs when functional content is equal", () => {
    const first = { links: social.links.map((link, index) => ({ ...link, id: `first-${index}` })) };
    const second = { links: social.links.map((link, index) => ({ ...link, id: `second-${index}` })) };
    expect(calculateContentHash(normalizeSocialContent(first))).toBe(
      calculateContentHash(normalizeSocialContent(second)),
    );
  });
});
