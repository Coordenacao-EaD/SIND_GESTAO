# SINDGESTÃO — Frontend (Página Inicial)

Frontend público do SINDGESTÃO, construído em **React 19 + TypeScript (strict) + Vite**. Esta etapa entrega **apenas a Página Inicial** (rota `/`); as demais rotas existem como páginas "Em construção" para que nenhum link do cabeçalho/rodapé fique quebrado.

> **Esta etapa não possui backend, banco de dados, autenticação real, tokens, cookies ou chamada de API para dados da Home.** Todo o conteúdo visível da Home, inclusive o rodapé, vem do `HomeMockRepository`; os assets são locais. Requisições do navegador para carregar os próprios arquivos da aplicação não são integrações de API.

## Limites da F1

A F1 inclui a Página Inicial pública, componentes React, TypeScript estrito, rotas públicas, mocks tipados, estados de carregamento/vazio/erro, acessibilidade, responsividade, testes e assets locais.

Não fazem parte desta fase: backend, API, banco, autenticação, autorização, painel administrativo, formulários funcionais, upload, persistência, publicação, revisão ou gestão real de conteúdo.

Os botões **Filie-se** e **Área do Filiado** apenas navegam para `/filie-se` e `/area-do-filiado`. A Home não cria conta, não efetiva filiação, não autentica, não coleta documentos e não persiste dados pessoais.

## Como instalar

```bash
cd frontend
npm install
```

## Como executar

```bash
npm run dev
```

Abre em `http://localhost:5173`.

## Como gerar o build de produção

```bash
npm run build
```

Executa `tsc -b` (typecheck via project references) seguido de `vite build`. A saída fica em `dist/`.

```bash
npm run preview
```

Serve o build gerado localmente para conferência.

## Como executar o typecheck isoladamente

```bash
npm run typecheck
```

## Como executar o lint

```bash
npm run lint
```

Usa [oxlint](https://oxc.rs/docs/guide/usage/linter.html) (ferramenta já configurada pelo scaffold do Vite).

## Como executar os testes

```bash
npm run test        # roda uma vez (CI)
npm run test:watch  # modo watch
```

Usa **Vitest** + **React Testing Library** + **jsdom**. Os testes cobrem: renderização da Home, todas as seções, conteúdo do Hero, rotas dos CTAs, menu desktop, menu mobile (abrir/fechar/Escape/clique externo/foco), navegação por teclado, estados de loading/empty/error, erro parcial sem derrubar a página, fallback de imagem, injeção de um `HomeRepository` alternativo, rota `NotFound`, rota "em construção", e ausência de chamadas de rede.

### E2E (Playwright)

`e2e/home.spec.ts` existe apenas como **stub documentado** reservando o local da futura suíte E2E. O Playwright não está instalado nesta fase — não há script `test:e2e`. Veja o comentário no topo do arquivo para os passos de ativação futura.

## Estrutura principal

```text
src/
├── app/                 # App raiz, roteador (createBrowserRouter) e ErrorBoundary global
├── config/routes.ts     # Único lugar com as strings de rota (ROUTES)
├── components/layout/   # SiteHeader, SiteFooter e AppLayout
├── pages/
│   ├── home/            # Tudo relacionado à Página Inicial
│   │   ├── HomePage.tsx         # Componente de rota: usa useHomePage()
│   │   ├── HomeLayout.tsx       # Composição pura das seções, recebe HomePageData já resolvido
│   │   ├── HomeDataProvider.tsx # Injeta o HomeRepository ativo via Context
│   │   ├── hooks/useHomePage.ts # Ciclo de loading/erro/dados
│   │   ├── components/          # Uma seção por arquivo + SectionState (loading/empty/error)
│   │   ├── services/            # HomeRepository (contrato), Mock e Http (stub)
│   │   ├── mocks/home.mock.ts    # Única fonte de dados ativa nesta fase
│   │   └── types/home.types.ts   # Contratos TypeScript da Home
│   ├── NotFoundPage.tsx
│   └── ComingSoonPage.tsx        # Placeholder para as demais rotas do menu
└── styles/               # tokens.css (cores, tipografia, espaçamento) + global.css
```

## Funcionamento do `HomeRepository`

```ts
interface HomeRepository {
  getHomePage(): Promise<HomePageData>;
}
```

Nenhum componente visual da Home conhece `fetch`, mocks ou formato de API — todos recebem dados já tipados via `useHomePage()`, que por sua vez lê o repositório ativo do `HomeDataProvider` (React Context). Isso permite:

- Trocar a fonte de dados sem tocar em nenhum componente visual.
- Testar cada tela injetando um repositório fake (`<HomeDataProvider repository={meuFake}>`).

## Funcionamento do `HomeMockRepository`

Implementação ativa nesta fase. Resolve instantaneamente com dados estáticos de `home.mock.ts` — sem rede, sem storage. Aceita um `scenario` opcional para exercitar os estados de UI:

```ts
new HomeMockRepository("default");         // cenário normal
new HomeMockRepository("empty-news");      // sem notícias
new HomeMockRepository("empty-notices");   // sem comunicados
new HomeMockRepository("empty-documents"); // sem documentos
new HomeMockRepository("partial-error");   // erro só na seção de comunicados
```

O fallback acessível de imagens é validado nos testes por meio da simulação do evento de erro; os assets do cenário padrão permanecem locais.

## Onde estão os mocks

`src/pages/home/mocks/home.mock.ts` — dados demonstrativos completos (hero, atalhos, resumo institucional, notícias, comunicados, transparência, documentos, chamada de filiação, rodapé) e as variações de cenário usadas pelos testes.

## Substituição futura pelo `HomeHttpRepository`

`src/pages/home/services/home.http.repository.ts` já existe como **ponto de extensão documentado**, implementando a mesma interface `HomeRepository`. Nesta fase ele lança um erro se chamado — propositalmente, para não fingir uma integração que não existe. Quando o backend estiver pronto:

1. Implementar `getHomePage()` em `HomeHttpRepository` (chamar o endpoint, mapear o DTO para `HomePageData`).
2. Trocar a instância padrão usada em `HomeDataProvider` (ou passar `repository={new HomeHttpRepository(baseUrl)}` explicitamente onde a rota `/` é declarada em `router.tsx`).

Nenhum componente de seção precisa mudar.

## Documentação técnica da F1

- [Segurança do frontend](./docs/SECURITY.md)
- [Cadastro, filiação e tratamento de dados](./docs/REGISTRATION_AND_DATA.md)
- [Prevenção de injeção SQL](./docs/SQL_INJECTION_PREVENTION.md)
- [Política de dependências](./docs/DEPENDENCY_POLICY.md)
- [Origem dos dados do rodapé da Home](./docs/HOME_FOOTER_DATA_FLOW.md)

## Declaração explícita

Esta etapa **não possui backend, banco de dados, autenticação real, API ativa, `localStorage`/`sessionStorage`, cookies ou tokens**. A Home não cria conta nem filiação, não envia formulários e não persiste dados. Seu conteúdo é demonstrativo e local.
