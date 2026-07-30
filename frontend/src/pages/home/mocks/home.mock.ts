import { ROUTES } from "../../../config/routes";
import { SITE_FOOTER } from "../../../config/site";
import heroImage from "../../../assets/home/hero-union.jpg";
import newsNegotiation from "../../../assets/home/news-negotiation.png";
import newsRights from "../../../assets/home/news-rights.png";
import newsAssembly from "../../../assets/home/news-assembly.png";
import type {
  DocumentsSectionState,
  HeroContent,
  HomePageData,
  InstitutionalSummary,
  MembershipCallToAction,
  NewsSectionState,
  NoticesSectionState,
  QuickLink,
  TransparencySectionState,
} from "../types/home.types";

export const heroContentMock: HeroContent = {
  title: "Juntos somos mais fortes.",
  subtitle: "Unidos, conquistamos direitos.",
  description:
    "Defendemos os direitos, valorizamos o servidor e construímos um serviço público cada vez melhor para toda a sociedade.",
  imageUrl: heroImage,
  imageAlt: "Mãos de servidores unidas, representando cooperação e força coletiva",
  primaryAction: { label: "Filie-se", href: ROUTES.membership, variant: "primary" },
  secondaryAction: { label: "Área do Filiado", href: ROUTES.memberArea, variant: "secondary" },
};

export const quickLinksMock: QuickLink[] = [
  { id: "benefits", label: "Convênios e Benefícios", href: ROUTES.benefits, icon: "benefits" },
  { id: "legal", label: "Assessoria Jurídica", href: ROUTES.legalAdvice, icon: "legal" },
  { id: "guides", label: "Guias e Requerimentos", href: ROUTES.guides, icon: "guides" },
  { id: "calendar", label: "Calendário de Atividades", href: ROUTES.calendar, icon: "calendar" },
  { id: "contact", label: "Fale com o Sindicato", href: ROUTES.contact, icon: "contact" },
  { id: "faq", label: "Perguntas Frequentes", href: ROUTES.faq, icon: "faq" },
];

export const institutionalSummaryMock: InstitutionalSummary = {
  title: "Sobre o Sindicato",
  description:
    "Há mais de 30 anos, o SINDGESTÃO atua com ética, transparência e independência na defesa dos direitos dos servidores e na construção de políticas que valorizam o serviço público e quem o faz acontecer.",
  imageUrl: heroImage,
  imageAlt: "Servidores unidos",
  actionLabel: "Conheça nossa história",
  actionHref: ROUTES.union,
};

export const newsSectionMock: NewsSectionState = {
  status: "ready",
  data: [
    {
      id: "news-1",
      category: "Negociação",
      title: "Sindicato e governo retomam mesa de negociação",
      excerpt: "Representantes discutem a pauta da categoria.",
      publishedAtLabel: "20 de maio de 2026",
      imageUrl: newsNegotiation,
      imageAlt: "Representantes em mesa de negociação",
      href: ROUTES.news,
    },
    {
      id: "news-2",
      category: "Direitos",
      title: "Vitória: reajuste garante recomposição salarial",
      excerpt: "Categoria comemora importante conquista.",
      publishedAtLabel: "17 de maio de 2026",
      imageUrl: newsRights,
      imageAlt: "Reunião institucional sobre direitos",
      href: ROUTES.news,
    },
    {
      id: "news-3",
      category: "Informe",
      title: "Assembleia aprova pauta de reivindicações",
      excerpt: "Servidores aprovam os próximos encaminhamentos.",
      publishedAtLabel: "15 de maio de 2026",
      imageUrl: newsAssembly,
      imageAlt: "Assembleia sindical com votação",
      href: ROUTES.news,
    },
  ],
};

export const noticesSectionMock: NoticesSectionState = {
  status: "ready",
  data: [
    {
      id: "notice-1",
      tag: "Expediente",
      title: "Comunicado sobre o ponto facultativo de 31/05",
      excerpt: "Consulte os horários de funcionamento.",
      publishedAtLabel: "Publicado em 20/05/2026",
      href: ROUTES.notices,
    },
    {
      id: "notice-2",
      tag: "Informe",
      title: "Atualização de dados cadastrais",
      excerpt: "Mantenha seus canais de contato atualizados.",
      publishedAtLabel: "Publicado em 17/05/2026",
      href: ROUTES.notices,
    },
    {
      id: "notice-3",
      tag: "Atendimento",
      title: "Alteração no atendimento presencial",
      excerpt: "Confira o horário especial da sede.",
      publishedAtLabel: "Publicado em 14/05/2026",
      href: ROUTES.notices,
    },
  ],
};

export const transparencySectionMock: TransparencySectionState = {
  status: "ready",
  data: {
    title: "Transparência que gera confiança",
    description:
      "Acreditamos que uma gestão transparente fortalece nossa luta e valoriza cada filiado.",
    referenceLabel: "Acompanhe como o sindicato utiliza os recursos e os resultados alcançados.",
    actionLabel: "Acesse a transparência",
    actionHref: ROUTES.transparency,
  },
};

export const documentsSectionMock: DocumentsSectionState = {
  status: "ready",
  data: [
    {
      id: "doc-1",
      name: "Estatuto, atas, relatórios e documentos essenciais",
      category: "Institucional",
      versionLabel: "Acervo atualizado",
      href: ROUTES.documents,
    },
  ],
};

export const membershipCtaMock: MembershipCallToAction = {
  title: "Fortaleça quem luta por você.",
  description: "Filie-se e faça parte de um sindicato cada vez mais forte e representativo.",
  actionLabel: "Filie-se agora",
  actionHref: ROUTES.membership,
};

export const footerDataMock = SITE_FOOTER;

export const homePageDataMock: HomePageData = {
  hero: heroContentMock,
  quickLinks: quickLinksMock,
  about: institutionalSummaryMock,
  news: newsSectionMock,
  notices: noticesSectionMock,
  transparency: transparencySectionMock,
  documents: documentsSectionMock,
  membershipCta: membershipCtaMock,
  footer: footerDataMock,
};

export const homePageDataEmptyNewsMock: HomePageData = {
  ...homePageDataMock,
  news: { status: "empty" },
};

export const homePageDataEmptyNoticesMock: HomePageData = {
  ...homePageDataMock,
  notices: { status: "empty" },
};

export const homePageDataEmptyDocumentsMock: HomePageData = {
  ...homePageDataMock,
  documents: { status: "empty" },
};

export const homePageDataPartialErrorMock: HomePageData = {
  ...homePageDataMock,
  notices: {
    status: "error",
    message: "Não foi possível carregar os comunicados recentes no momento.",
  },
};
