import { ROUTES } from "../../../config/routes";
import heroImage from "../../../assets/home/hero.jpg";
import aboutImage from "../../../assets/home/about.jpg";
import newsPlaceholder from "../../../assets/home/news-placeholder.jpg";
import type {
  DocumentsSectionState,
  FooterData,
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
  eyebrow: "Sindicato de Servidores Públicos",
  title: "Juntos somos mais fortes",
  description:
    "Representação, transparência e compromisso com os trabalhadores.",
  imageUrl: heroImage,
  imageAlt: "Ilustração institucional representando a união entre servidores",
  primaryAction: { label: "Filie-se agora", href: ROUTES.membership, variant: "primary" },
  secondaryAction: { label: "Área do Filiado", href: ROUTES.memberArea, variant: "secondary" },
};

export const quickLinksMock: QuickLink[] = [
  { id: "union", label: "O Sindicato", href: ROUTES.union, icon: "union" },
  { id: "news", label: "Notícias", href: ROUTES.news, icon: "news" },
  { id: "notices", label: "Comunicados", href: ROUTES.notices, icon: "notices" },
  { id: "transparency", label: "Transparência", href: ROUTES.transparency, icon: "transparency" },
  { id: "documents", label: "Documentos", href: ROUTES.documents, icon: "documents" },
  { id: "contact", label: "Contato", href: ROUTES.contact, icon: "contact" },
];

export const institutionalSummaryMock: InstitutionalSummary = {
  title: "Sobre o Sindicato",
  description:
    "Há mais de 30 anos defendemos os direitos dos servidores públicos, promovendo diálogo, participação coletiva e valorização do serviço público prestado à sociedade.",
  imageUrl: aboutImage,
  imageAlt: "Representantes do sindicato reunidos em atividade institucional",
  actionLabel: "Conheça o Sindicato",
  actionHref: ROUTES.union,
};

export const newsSectionMock: NewsSectionState = {
  status: "ready",
  data: [
    {
      id: "news-1",
      category: "Negociação",
      title: "Sindicato e governo retomam mesa de negociação",
      excerpt: "Representantes discutem pauta de reivindicações da categoria em nova rodada de diálogo.",
      publishedAtLabel: "20 de maio de 2026",
      imageUrl: newsPlaceholder,
      imageAlt: "Representantes reunidos em uma mesa de negociação institucional",
      href: "/noticias/1",
    },
    {
      id: "news-2",
      category: "Direitos",
      title: "Vitória: reajuste garante recomposição salarial",
      excerpt: "Categoria comemora conquista após meses de mobilização e articulação institucional.",
      publishedAtLabel: "17 de maio de 2026",
      imageUrl: newsPlaceholder,
      imageAlt: "Representantes reunidos para discutir direitos dos servidores",
      href: "/noticias/2",
    },
    {
      id: "news-3",
      category: "Informe",
      title: "Assembleia aprova pauta de reivindicações",
      excerpt: "Servidores votam e aprovam encaminhamentos para o próximo semestre.",
      publishedAtLabel: "15 de maio de 2026",
      imageUrl: "/assets/home/imagem-inexistente.jpg",
      imageAlt: "Assembleia sindical com servidores votando de mãos levantadas",
      href: "/noticias/3",
    },
  ],
};

export const noticesSectionMock: NoticesSectionState = {
  status: "ready",
  data: [
    {
      id: "notice-1",
      tag: "Expediente",
      title: "Comunicado sobre o ponto facultativo",
      excerpt: "Confira os horários de funcionamento da sede durante o feriado prolongado.",
      publishedAtLabel: "20/05/2026",
      href: "/comunicados/1",
    },
    {
      id: "notice-2",
      tag: "Informe",
      title: "Atualização de dados cadastrais",
      excerpt: "Filiados devem revisar suas informações para manter os canais de comunicação atualizados.",
      publishedAtLabel: "17/05/2026",
      href: "/comunicados/2",
    },
    {
      id: "notice-3",
      tag: "Atendimento",
      title: "Alteração no atendimento presencial",
      excerpt: "A sede funcionará em horário especial durante o período indicado.",
      publishedAtLabel: "14/05/2026",
      href: "/comunicados/3",
    },
  ],
};

export const transparencySectionMock: TransparencySectionState = {
  status: "ready",
  data: {
    title: "Transparência que gera confiança",
    description:
      "Acompanhe como o sindicato utiliza os recursos institucionais e os resultados alcançados em favor da categoria.",
    referenceLabel: "Prestação de contas do 1º semestre disponível para consulta pública.",
    actionLabel: "Ver transparência",
    actionHref: ROUTES.transparency,
  },
};

export const documentsSectionMock: DocumentsSectionState = {
  status: "ready",
  data: [
    { id: "doc-1", name: "Estatuto Social", category: "Institucional", versionLabel: "Versão vigente", href: "/documentos/estatuto" },
    { id: "doc-2", name: "Regimento Interno", category: "Institucional", versionLabel: "Atualizado em 2026", href: "/documentos/regimento" },
    { id: "doc-3", name: "Ata da última assembleia", category: "Assembleias", versionLabel: "Publicada em 2026", href: "/documentos/ata" },
  ],
};

export const membershipCtaMock: MembershipCallToAction = {
  title: "Fortaleça quem representa você.",
  description: "Filie-se e faça parte de um sindicato cada vez mais forte e representativo.",
  actionLabel: "Quero me filiar",
  actionHref: ROUTES.membership,
};

export const footerDataMock: FooterData = {
  institutionName: "Sindicato de Servidores Públicos",
  shortDescription: "Em defesa dos servidores, em benefício da sociedade.",
  linkGroups: [
    {
      title: "Institucional",
      links: [
        { label: "O Sindicato", href: ROUTES.union },
        { label: "Diretoria", href: ROUTES.board },
        { label: "Estatuto", href: ROUTES.bylaws },
      ],
    },
    {
      title: "Portal",
      links: [
        { label: "Notícias", href: ROUTES.news },
        { label: "Comunicados", href: ROUTES.notices },
        { label: "Transparência", href: ROUTES.transparency },
        { label: "Documentos", href: ROUTES.documents },
      ],
    },
  ],
  phone: "(11) 1234-5678",
  email: "contato@sindicatoservidores.org.br",
  address: "Rua dos Servidores, 123 — Centro, São Paulo/SP",
  serviceHours: "Segunda a sexta-feira, das 8h às 17h",
  socialLinks: [
    { id: "facebook", label: "Facebook", href: "https://facebook.com" },
    { id: "instagram", label: "Instagram", href: "https://instagram.com" },
    { id: "youtube", label: "YouTube", href: "https://youtube.com" },
  ],
  privacyPolicyHref: "/politica-de-privacidade",
  termsOfUseHref: "/termos-de-uso",
  copyrightLabel: "© 2026 Sindicato de Servidores Públicos. Todos os direitos reservados.",
};

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
