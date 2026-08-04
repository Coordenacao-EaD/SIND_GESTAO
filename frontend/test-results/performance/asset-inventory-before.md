# Inventário inicial de assets — Home F1

Data: 2026-08-03. Build oficial aprovado antes de qualquer conversão.

| Arquivo fonte | Uso | Dimensão | Formato | Tamanho | Destino no dist | Ação proposta |
|---|---|---:|---|---:|---|---|
| `src/assets/home/hero-union.jpg` | Hero principal; URL também presente no contrato institucional, embora essa seção não renderize imagem | 1672×941 | JPEG | 1.882.636 B | `assets/hero-union-*.jpg` | WebP 840/1672; `srcSet`; prioridade alta |
| `src/assets/home/news-negotiation.png` | Card notícia 1 | 1619×971 | PNG fotográfico | 1.883.673 B | `assets/news-negotiation-*.png` | WebP 480/800; lazy |
| `src/assets/home/news-rights.png` | Card notícia 2 | 1619×971 | PNG fotográfico | 1.941.086 B | `assets/news-rights-*.png` | WebP 480/800; lazy |
| `src/assets/home/news-assembly.png` | Card notícia 3 | 1619×971 | PNG fotográfico | 2.459.322 B | `assets/news-assembly-*.png` | WebP 480/800; lazy |
| `src/assets/home/logo.png` | Cabeçalho e rodapé | 1254×1254 | PNG com transparência | 500.312 B | `assets/logo-*.png` | WebP lossless 128×128; manter nitidez/transparência |
| `src/assets/home/about.jpg` | Nenhum consumidor encontrado | 1200×900 | JPEG | 29.701 B | Não entra | Remover após confirmação final |
| `src/assets/home/hero.jpg` | Nenhum consumidor encontrado | 1920×1080 | JPEG | 50.104 B | Não entra | Remover após confirmação final |
| `src/assets/home/news-placeholder.jpg` | Nenhum consumidor encontrado | 800×500 | JPEG | 20.457 B | Não entra | Remover após confirmação final |
| `public/favicon.svg` | Favicon em `index.html` | 48×46 (`viewBox`) | SVG | 9.522 B | `favicon.svg` | Manter vetorial |

## Dimensões máximas observadas no build

| Imagem | Componente | Uso visual | Máximo exibido observado | Original |
|---|---|---|---:|---:|
| Hero | `HeroSection` | Fundo LCP com `object-fit: cover` | 1343×340 em 1440; 358×356 em mobile | 1672×941 |
| Notícias | `LatestNewsSection` | Thumbnail de card | 192×106 desktop; 116×116 mobile com recorte | 1619×971 |
| Logo | `SiteHeader` / `SiteFooter` | Marca decorativa junto ao nome | 49×49 / 42×42 | 1254×1254 |

As variantes propostas ficam próximas de 2× o maior uso relevante sem ampliar nenhum original. O enquadramento continuará sendo feito pelo mesmo `object-fit`/`object-position` do CSS.

## Build inicial

- Arquivos: 9.
- Dist total: 9.023.383 B.
- Imagens: 8.676.551 B.
- JavaScript: 320.916 B.
- CSS: 25.304 B.
- Gzip agregado por arquivo: 8.714.195 B.
- Brotli agregado por arquivo: 8.668.935 B.
- Imagens visualmente duplicadas por hash: 0.
- Imagens que entram no dist sem uso: 0.
- Fontes locais/externas, base64 e sourcemaps publicados: 0.

## Baseline equivalente ao Lighthouse

Lighthouse não está instalado; nenhuma pontuação foi inventada. Chrome headless/CDP, cache desabilitado e `PerformanceObserver` mediram:

| Viewport | LCP | CLS | Overflow horizontal | Bytes de documento/JS/CSS/imagens | Requests correspondentes |
|---|---:|---:|---|---:|---:|
| 1440×900 | 212 ms | 0,00051 | Não | 8.776.971 B | 8 |
| 1024×768 | 140 ms | 0,00023 | Não | 8.775.165 B | 7 |
| 768×1024 | 132 ms | 0 | Não | 8.775.165 B | 7 |
| 390×844 | 124 ms | 0 | Não | 8.775.165 B | 7 |
| 360×800 | 124 ms | 0 | Não | 8.775.165 B | 7 |

Todas as cinco imagens eram baixadas imediatamente em todos os viewports; não havia `srcSet`, `sizes`, lazy loading ou prioridade explícita. O favicon foi reutilizado pelo navegador após a primeira navegação, explicando 8 requests na primeira coleta e 7 nas seguintes.
