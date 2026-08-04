# Relatório final de performance — Home F1

Data: 2026-08-03.

## Resumo executivo

| Métrica | Antes | Depois | Redução |
|---|---:|---:|---:|
| Dist total | 9.023.383 B | 567.404 B | 8.455.979 B (93,71%) |
| Imagens | 8.676.551 B | 219.951 B | 8.456.600 B (97,46%) |
| JavaScript | 320.916 B | 321.537 B | −621 B (crescimento de 0,19%) |
| CSS | 25.304 B | 25.304 B | 0 B (0%) |
| Maior imagem | 2.459.322 B | 84.356 B | 2.374.966 B (96,57%) |
| Requests de assets iniciais (primeira coleta) | 8 | 8 | 0; bytes −96,73% desktop / −97,33% mobile |

O pequeno crescimento de 621 B do JavaScript implementa `srcSet`, dimensões e metadados de carregamento; não introduz dependência ou novo chunk. O resultado supera as metas de −50% no `dist` e −60% nas imagens.

## Build e maiores arquivos

- Quantidade: 9 → 10 arquivos (a variante adicional do Hero explica o acréscimo).
- Gzip agregado: 8.714.195 → 318.411 B (−96,35%).
- Brotli agregado: 8.668.935 → 304.039 B (−96,49%).

| Cinco maiores antes | Bytes | Cinco maiores depois | Bytes |
|---|---:|---|---:|
| `news-assembly-*.png` | 2.459.322 | `index-*.js` | 321.537 |
| `news-rights-*.png` | 1.941.086 | `hero-union-1672-*.webp` | 84.356 |
| `news-negotiation-*.png` | 1.883.673 | `news-assembly-480-*.webp` | 37.326 |
| `hero-union-*.jpg` | 1.882.636 | `hero-union-840-*.webp` | 33.988 |
| `logo-*.png` | 500.312 | `index-*.css` | 25.304 |

## Imagens, formatos e carregamento

- Removidas por ausência comprovada de uso: `about.jpg`, `hero.jpg` e `news-placeholder.jpg` (100.262 B no repositório; não entravam no `dist`).
- Substituídos: Hero JPEG, três PNGs fotográficos de notícias e logo PNG original.
- Redimensionadas: Hero para 840×472 (mantida também a variante 1672×941), notícias para 480×288 e logo para 128×128.
- Convertidas/comprimidas: fotografias para WebP; logo para PNG RGBA otimizado; favicon SVG mantido.
- Formatos finais: WebP para fotos, PNG para logo transparente e SVG para favicon.
- Variações responsivas: duas no Hero (840w e 1672w), sem proliferação desnecessária.
- `srcSet` e `sizes`: aplicados ao Hero conforme a largura real do container; Chrome confirmou a variante menor em 768/390/360.
- Lazy: três notícias e logo do rodapé. A logo principal permanece imediata.
- Prioritária/LCP: Hero com `loading=eager`, `fetchpriority=high` e `decoding=async`; não foi adicionado preload redundante.
- Estabilidade: Hero, notícias e logos possuem `width`/`height`; o fallback com `role=img`/`aria-label` e o tratamento sem loop foram preservados.

## Lighthouse equivalente

Lighthouse não estava instalado e não foi adicionada dependência. A medição equivalente usou o build de produção local, Chrome headless/CDP, cache desabilitado e `PerformanceObserver`; nenhuma pontuação, TBT ou Speed Index foi inventada.

| Viewport | LCP antes | LCP depois | CLS antes | CLS depois | Bytes antes | Bytes depois | Overflow |
|---|---:|---:|---:|---:|---:|---:|---|
| 1440×900 | 212 ms | 172 ms | 0,00051 | 0,00051 | 8.776.971 B | 286.590 B | Não |
| 1024×768 | 140 ms | 64 ms | 0,00023 | 0 | 8.775.165 B | 284.784 B | Não |
| 768×1024 | 132 ms | 68 ms | 0 | 0 | 8.775.165 B | 234.416 B | Não |
| 390×844 | 124 ms | 80 ms | 0 | 0 | 8.775.165 B | 234.416 B | Não |
| 360×800 | 124 ms | 80 ms | 0 | 0 | 8.775.165 B | 234.416 B | Não |

Os oito requests da primeira coleta permanecem porque o navegador considerou as três notícias lazy próximas o suficiente da dobra; nas navegações seguintes foram sete, com o favicon reutilizado pelo navegador, tanto antes quanto depois. Ainda assim, o volume inicial caiu de 96,73% a 97,33%. Todos os recursos responderam 200 com MIME correto, sem 404, falhas, `console.error` ou `console.warn`.

## Regressão final

- Testes: 66/66 aprovados em 7 arquivos (64 preservados + 2 novos de comportamento de imagem).
- E2E: 8/8 verificações aprovadas; 0 erro de página, 0 erro/warning de console e 0 falha de recurso.
- Axe: 12 cenários, 0 violações WCAG e 0 violações best-practice; nenhum rule desabilitado. Os `incomplete` de contraste em gradiente/imagem continuam documentados e não são violações.
- Lint: aprovado, sem warnings.
- Typecheck: aprovado.
- Build: aprovado, 1.837 módulos, sem aviso de chunk excedido.
- `git diff --check`: aprovado; apenas avisos informativos de normalização LF/CRLF do Git.
- `npm audit`: 0 vulnerabilidades em todas as dependências.
- `npm audit --omit=dev`: 0 vulnerabilidades de produção. Nenhum upgrade major do React Router foi feito.
- Portas 4180, 4182, 9333 e 9334: encerradas após as medições.

## Escopo e arquivos

Arquivos de produção alterados: `SiteHeader.tsx`, `SiteFooter.tsx`, `HeroSection.tsx`, `LatestNewsSection.tsx`, `home.mock.ts` e `home.types.ts`. Testes ajustados: `HomePage.test.tsx` e `HeroSection.test.tsx`. Infraestrutura reproduzível: scripts `measure-bundle.mjs` e `measure-home-performance.mjs`, com comandos no `package.json`.

Binários criados: `hero-union-1672.webp`, `hero-union-840.webp`, três `news-*-480.webp` e `logo-128.png`. Os originais substituídos e os três arquivos sem uso foram removidos somente do frontend oficial.

Relatórios e evidências estão em `frontend/test-results/performance/`, `frontend/test-results/e2e/` e `frontend/test-results/accessibility/final/`. Não foram adicionados API, backend, banco, autenticação ou persistência; rotas e textos não mudaram. A pasta `protótipo` permaneceu inalterada.
