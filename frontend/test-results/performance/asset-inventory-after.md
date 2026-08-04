# Inventário final de assets — Home F1

Data: 2026-08-03. Inventário obtido do build oficial final.

| Arquivo fonte final | Uso | Dimensão | Formato | Tamanho | Destino no dist |
|---|---|---:|---|---:|---|
| `src/assets/home/hero-union-1672.webp` | Hero principal em desktop | 1672×941 | WebP | 84.356 B | `assets/hero-union-1672-*.webp` |
| `src/assets/home/hero-union-840.webp` | Hero principal em tablet/mobile | 840×472 | WebP | 33.988 B | `assets/hero-union-840-*.webp` |
| `src/assets/home/news-negotiation-480.webp` | Card notícia 1 | 480×288 | WebP | 21.006 B | `assets/news-negotiation-480-*.webp` |
| `src/assets/home/news-rights-480.webp` | Card notícia 2 | 480×288 | WebP | 21.638 B | `assets/news-rights-480-*.webp` |
| `src/assets/home/news-assembly-480.webp` | Card notícia 3 | 480×288 | WebP | 37.326 B | `assets/news-assembly-480-*.webp` |
| `src/assets/home/logo-128.png` | Cabeçalho e rodapé | 128×128 | PNG RGBA | 12.115 B | `assets/logo-128-*.png` |
| `public/favicon.svg` | Favicon | 48×46 (`viewBox`) | SVG | 9.522 B | `favicon.svg` |

## Uso e entrega

| Imagem | Componente | Máximo exibido observado | Estratégia final |
|---|---|---:|---|
| Hero | `HeroSection` | 1343×340 desktop; 358×356 mobile | `srcSet` 840w/1672w, `sizes` aderente ao layout, eager, `fetchpriority=high`, `decoding=async`, dimensões intrínsecas |
| Notícias | `LatestNewsSection` | 192×106 desktop; 116×116 mobile | Uma variante 480×288 por foto, lazy, `decoding=async`, dimensões intrínsecas |
| Logo | `SiteHeader` / `SiteFooter` | 49×49 / 42×42 | PNG transparente 128×128; header não lazy, footer lazy; dimensões intrínsecas |
| Favicon | `index.html` | Ícone do navegador | SVG original mantido |

O navegador selecionou o Hero de 1672 px em 1440/1024 e o de 840 px em 768/390/360. O mesmo `object-fit` e o mesmo `object-position` continuam responsáveis pelo recorte visual.

## Arquivos removidos por ausência comprovada de uso

| Arquivo removido | Evidência | Economia no repositório |
|---|---|---:|
| `src/assets/home/about.jpg` | Zero ocorrências por nome/caminho em código, CSS, mocks, testes, HTML, manifestos e `public`; não entrava no `dist` | 29.701 B |
| `src/assets/home/hero.jpg` | Mesma busca exaustiva; não entrava no `dist` | 50.104 B |
| `src/assets/home/news-placeholder.jpg` | Mesma busca exaustiva; não entrava no `dist` | 20.457 B |

Total removido sem consumidor: 100.262 B no repositório e 0 B no `dist`, pois o Vite já não os publicava. Os cinco originais usados também foram substituídos pelas versões finais validadas. A pasta `protótipo` não foi alterada.

## Build final

- Arquivos: 10.
- Dist total: 567.404 B.
- Imagens: 219.951 B.
- JavaScript: 321.537 B, em um único chunk, abaixo do limite de aviso do Vite.
- CSS: 25.304 B.
- Gzip agregado por arquivo: 318.411 B.
- Brotli agregado por arquivo: 304.039 B.
- Chunks secundários, fontes, base64 e sourcemaps publicados: 0.
- Imagens duplicadas por conteúdo e imagens sem uso no `dist`: 0.

