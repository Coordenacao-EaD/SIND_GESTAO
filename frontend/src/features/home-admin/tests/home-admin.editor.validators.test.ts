import { describe, expect, it } from "vitest";
import type { AdminSocialConfiguration, SocialPlatform } from "../domain/home-admin.types";
import { adminFooterContactsMock, adminSocialConfigurationMock } from "../mocks/home-admin.mock-data";
import {
  formatPhone,
  formatPostalCode,
  normalizePhone,
  normalizePostalCode,
  parseAdminFooterContactsEditor,
  parseAdminSocialConfigurationEditor,
  validateCancellationReason,
  validateSocialUrl,
} from "../schemas/home-admin.editor.validators";

const social = (mutate: (value: AdminSocialConfiguration) => void) => {
  const value = structuredClone(adminSocialConfigurationMock); mutate(value); return value;
};

describe("F2.2B editor runtime validation", () => {
  describe("contacts", () => {
    it("accepts the complete contacts mock", () => expect(parseAdminFooterContactsEditor(adminFooterContactsMock).success).toBe(true));
    it("requires institutional email", () => expect(parseAdminFooterContactsEditor({ ...adminFooterContactsMock, email: "" }).success).toBe(false));
    it("rejects malformed email", () => expect(parseAdminFooterContactsEditor({ ...adminFooterContactsMock, email: "invalid" }).success).toBe(false));
    it("rejects email longer than 254 characters", () => expect(parseAdminFooterContactsEditor({ ...adminFooterContactsMock, email: `${"a".repeat(245)}@example.com` }).success).toBe(false));
    it("accepts empty phone with a valid email", () => expect(parseAdminFooterContactsEditor({ ...adminFooterContactsMock, phone: "" }).success).toBe(true));
    it("accepts a national phone", () => expect(parseAdminFooterContactsEditor({ ...adminFooterContactsMock, phone: "(65) 99999-0000" }).success).toBe(true));
    it("accepts an international phone", () => expect(parseAdminFooterContactsEditor({ ...adminFooterContactsMock, phone: "+55 65 99999-0000" }).success).toBe(true));
    it("rejects arbitrary phone text", () => expect(parseAdminFooterContactsEditor({ ...adminFooterContactsMock, phone: "telefone" }).success).toBe(false));
    it("requires street and number", () => expect(parseAdminFooterContactsEditor({ ...adminFooterContactsMock, address: "" }).success).toBe(false));
    it("requires municipality", () => expect(parseAdminFooterContactsEditor({ ...adminFooterContactsMock, municipality: "" }).success).toBe(false));
    it("rejects municipality over 100 characters", () => expect(parseAdminFooterContactsEditor({ ...adminFooterContactsMock, municipality: "x".repeat(101) }).success).toBe(false));
    it("rejects state outside the official catalog", () => expect(parseAdminFooterContactsEditor({ ...adminFooterContactsMock, stateCode: "XX" }).success).toBe(false));
    it("accepts an eight-digit postal code", () => expect(parseAdminFooterContactsEditor({ ...adminFooterContactsMock, postalCode: "78000000" }).success).toBe(true));
    it("rejects an incomplete postal code", () => expect(parseAdminFooterContactsEditor({ ...adminFooterContactsMock, postalCode: "78000" }).success).toBe(false));
    it("accepts empty business hours", () => expect(parseAdminFooterContactsEditor({ ...adminFooterContactsMock, businessHours: "" }).success).toBe(true));
    it("rejects business hours over 255 characters", () => expect(parseAdminFooterContactsEditor({ ...adminFooterContactsMock, businessHours: "x".repeat(256) }).success).toBe(false));
    it("normalizes email, phone, CEP and edge whitespace", () => {
      const result = parseAdminFooterContactsEditor({ ...adminFooterContactsMock, email: " CONTATO@EXAMPLE.ORG ", phone: "(65) 99999-0000", postalCode: "78000-000", address: " Rua A, 1 " });
      expect(result).toMatchObject({ success: true, data: { email: "contato@example.org", phone: "65999990000", postalCode: "78000000", address: "Rua A, 1" } });
    });
    it("formats phone without requiring a library", () => expect(formatPhone("65999990000")).toBe("(65) 99999-0000"));
    it("preserves international phone prefix", () => expect(normalizePhone("+55 65 99999-0000")).toBe("+5565999990000"));
    it("formats postal code", () => expect(formatPostalCode("78000000")).toBe("78000-000"));
    it("removes postal code mask", () => expect(normalizePostalCode("78000-000")).toBe("78000000"));
  });

  describe("social configuration", () => {
    it("accepts the complete social mock", () => expect(parseAdminSocialConfigurationEditor(adminSocialConfigurationMock).success).toBe(true));
    it("rejects malformed list items without throwing", () => expect(() => parseAdminSocialConfigurationEditor({ ...adminSocialConfigurationMock, links: [null] })).not.toThrow());
    it.each<[SocialPlatform, string]>([["Facebook", "https://facebook.com/sind"], ["Instagram", "https://instagram.com/sind"], ["YouTube", "https://youtu.be/video"], ["LinkedIn", "https://linkedin.com/company/sind"], ["X", "https://x.com/sind"]])("accepts the official domain for %s", (platform, url) => expect(validateSocialUrl(platform, url)).toBeNull());
    it.each(["http://facebook.com/sind", "javascript:alert(1)", "data:text/html,x", "ftp://facebook.com/file", "facebook.com/sind", "https://facebook.com.evil.test/sind", "https:\\facebook.com\\sind"])("rejects unsafe URL %s", (url) => expect(validateSocialUrl("Facebook", url)).not.toBeNull());
    it("rejects a domain incompatible with the platform", () => expect(validateSocialUrl("Instagram", "https://facebook.com/sind")).not.toBeNull());
    it("rejects duplicate platforms", () => expect(parseAdminSocialConfigurationEditor(social((value) => { value.links[1]!.platform = "Facebook"; })).success).toBe(false));
    it("counts inactive items for platform uniqueness", () => expect(parseAdminSocialConfigurationEditor(social((value) => { value.links[0]!.active = false; value.links[1]!.platform = "Facebook"; })).success).toBe(false));
    it("rejects duplicate order", () => expect(parseAdminSocialConfigurationEditor(social((value) => { value.links[1]!.order = 0; })).success).toBe(false));
    it("rejects non-contiguous order", () => expect(parseAdminSocialConfigurationEditor(social((value) => { value.links[2]!.order = 5; })).success).toBe(false));
    it("accepts an empty versioned configuration", () => expect(parseAdminSocialConfigurationEditor(social((value) => { value.links = []; })).success).toBe(true));
    it("rejects an unsupported platform", () => expect(parseAdminSocialConfigurationEditor(social((value) => { value.links[0]!.platform = "TikTok" as SocialPlatform; })).success).toBe(false));
    it("rejects a short accessible label", () => expect(parseAdminSocialConfigurationEditor(social((value) => { value.links[0]!.accessibleLabel = "F"; })).success).toBe(false));
    it("rejects an empty social URL", () => expect(parseAdminSocialConfigurationEditor(social((value) => { value.links[0]!.url = ""; })).success).toBe(false));
  });

  describe("review cancellation", () => {
    it("requires at least ten meaningful characters", () => expect(validateCancellationReason(" curto ")).toMatch(/10 caracteres/));
    it("rejects whitespace only", () => expect(validateCancellationReason("            ")).not.toBeNull());
    it("rejects more than 500 characters", () => expect(validateCancellationReason("x".repeat(501))).toMatch(/500/));
    it("accepts a documented reason", () => expect(validateCancellationReason("Precisamos corrigir o telefone.")).toBeNull());
  });
});
