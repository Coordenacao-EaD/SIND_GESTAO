# Comparação das imagens — Home F1

As versões foram geradas sem sobrescrever os originais; só passaram a ser consumidas após validação dimensional, objetiva e visual. Fotografias usam WebP, enquanto a logo permanece em PNG otimizado para preservar transparência e cores institucionais sem depender de uma fonte vetorial inexistente.

| Original | Final | Antes | Depois | Redução | Validação |
|---|---|---:|---:|---:|---|
| `hero-union.jpg` 1672×941 | `hero-union-1672.webp` 1672×941 | 1.882.636 B | 84.356 B | 95,52% | SSIM 0,983310; proporção e enquadramento preservados |
| `hero-union.jpg` 1672×941 | `hero-union-840.webp` 840×472 | 1.882.636 B | 33.988 B | 98,19% | SSIM 0,982862 contra original redimensionado; variante responsiva |
| `news-negotiation.png` 1619×971 | `news-negotiation-480.webp` 480×288 | 1.883.673 B | 21.006 B | 98,88% | SSIM 0,982599; thumbnail legível |
| `news-rights.png` 1619×971 | `news-rights-480.webp` 480×288 | 1.941.086 B | 21.638 B | 98,89% | SSIM 0,981599; thumbnail legível |
| `news-assembly.png` 1619×971 | `news-assembly-480.webp` 480×288 | 2.459.322 B | 37.326 B | 98,48% | SSIM 0,976606; público e detalhes preservados |
| `logo.png` 1254×1254 | `logo-128.png` 128×128 | 500.312 B | 12.115 B | 97,58% | Inspeção visual; transparência, nitidez e cores preservadas |

## Inspeção visual

As capturas integrais antes/depois foram comparadas em 1440×900, 1024×768, 768×1024, 390×844 e 360×800. Em todos os casos foram confirmados:

- Hero com conteúdo e recorte equivalentes;
- logo nítida no cabeçalho e no rodapé;
- thumbnails legíveis, sem distorção ou pixelização perceptível;
- mesmos espaçamentos e proporções dos componentes;
- ausência de overflow horizontal;
- fallback acessível preservado no mesmo espaço visual;
- contraste e identidade visual sem alteração.

Evidências: `performance-before-screenshots/` e `performance-after-screenshots/` neste diretório.

