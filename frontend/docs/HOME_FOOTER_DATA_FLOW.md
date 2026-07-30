# Origem dos dados do rodapé da Home

## Decisão

O rodapé visível na Página Inicial pertence ao payload de `HomePageData`. A
implementação ativa de `HomeRepository` fornece esse payload, `HomePage`
aguarda o estado `ready` e passa `data.footer` ao `SiteFooter`.

Fluxo oficial:

`HomeRepository → HomePageData → HomePage → SiteFooter`

`SiteFooter` é exclusivamente apresentacional: recebe `FooterData` por props e
não conhece repositório, mocks ou constantes institucionais. Loading e erro
global não exibem antecipadamente o rodapé de dados finais.

## Inventário

| Bloco visível | Campo do contrato | Consumidor |
|---|---|---|
| Marca e descrição | `footer.institutionName`, `footer.shortDescription` | `SiteFooter` |
| Navegação | `footer.linkGroups` | `SiteFooter` |
| Contato | `footer.phone`, `footer.email`, `footer.address` | `SiteFooter` |
| Redes sociais | `footer.socialLinks` | `SiteFooter` |
| Links legais | `footer.privacyPolicyHref`, `footer.termsOfUseHref` | `SiteFooter` |
| Direitos autorais | `footer.copyrightLabel` | `SiteFooter` |

Os dados demonstrativos vivem em `pages/home/mocks/home.mock.ts` e são
entregues por `HomeMockRepository`. Não existe uma segunda fonte `SITE_FOOTER`.
Uma futura API poderá substituir esse adaptador sem mudar os componentes
visuais.
Campos opcionais ou coleções vazias não geram títulos, regiões ou links órfãos;
destinos inválidos são renderizados sem ação.
