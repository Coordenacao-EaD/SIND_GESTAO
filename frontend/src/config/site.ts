import type { FooterData } from "../pages/home/types/home.types";
import { ROUTES } from "./routes";

export const SITE_FOOTER: FooterData = {
  institutionName: "SINDGESTÃO",
  shortDescription: "Em defesa dos servidores, em benefício da sociedade.",
  linkGroups: [
    {
      title: "Institucional",
      links: [
        { label: "Quem Somos", href: ROUTES.union },
        { label: "Diretoria", href: ROUTES.board },
        { label: "Estatuto", href: ROUTES.bylaws },
        { label: "História", href: ROUTES.union },
        { label: "Trabalhe Conosco", href: ROUTES.contact },
      ],
    },
    {
      title: "Serviços",
      links: [
        { label: "Convênios e Benefícios", href: ROUTES.benefits },
        { label: "Assessoria Jurídica", href: ROUTES.legalAdvice },
        { label: "Guias e Requerimentos", href: ROUTES.guides },
        { label: "Atendimento", href: ROUTES.contact },
        { label: "Perguntas Frequentes", href: ROUTES.faq },
      ],
    },
    {
      title: "Transparência",
      links: [
        { label: "Prestação de Contas", href: ROUTES.transparency },
        { label: "Receitas e Despesas", href: ROUTES.transparency },
        { label: "Relatórios", href: ROUTES.transparency },
        { label: "Licitações e Contratos", href: ROUTES.transparency },
        { label: "Planejamento", href: ROUTES.transparency },
      ],
    },
  ],
  phone: "(11) 1234-5678",
  email: "contato@sindgestao.org.br",
  address: "Rua dos Servidores, 123 — Centro, São Paulo/SP — CEP 01000-000",
  serviceHours: "Segunda a sexta-feira, das 8h às 17h",
  socialLinks: [
    { id: "facebook", label: "Facebook", href: "https://facebook.com" },
    { id: "instagram", label: "Instagram", href: "https://instagram.com" },
    { id: "youtube", label: "YouTube", href: "https://youtube.com" },
  ],
  privacyPolicyHref: ROUTES.privacy,
  termsOfUseHref: ROUTES.terms,
  copyrightLabel: "© 2026 SINDGESTÃO. Todos os direitos reservados.",
};
