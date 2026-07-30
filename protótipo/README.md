# Portal Público Sindical

Protótipo navegável e responsivo da página inicial de um portal público sindical. O projeto foi criado como uma demonstração estática, sem backend, banco de dados, autenticação real ou integrações externas.

## Tecnologias

- HTML5
- CSS3
- JavaScript puro
- Bootstrap Icons 1.13.1
- Assets locais
- Compatível com GitHub Pages

## Estrutura

`index.html` fica na raiz para servir como página inicial do GitHub Pages. As demais páginas ficam organizadas em `html/`.

```text
/
├── index.html
├── README.md
├── html/
│   ├── sindicato.html
│   ├── diretoria.html
│   ├── estatuto.html
│   ├── noticias.html
│   ├── noticia.html
│   ├── comunicados.html
│   ├── comunicado.html
│   ├── transparencia.html
│   └── filie-se.html
└── assets/
    ├── css/
    │   └── styles.css
    ├── js/
    │   ├── main.js
    │   ├── noticias.js
    │   ├── comunicados.js
    │   ├── transparencia.js
    │   └── filiacao.js
    ├── documents/
    │   ├── estatuto-social.pdf, regimento-interno.pdf, ata-fundacao.pdf, normas-institucionais.pdf
    │   ├── transparencia/ (6 documentos demonstrativos)
    │   └── filiacao/politica-privacidade.pdf
    └── images/
        ├── logo.png
        ├── banner.jpg
        ├── sede-sindicato.jpg
        ├── diretoria/
        │   └── placeholder.svg
        ├── noticias/
        │   ├── negociacao.png
        │   ├── direitos.png
        │   └── assembleia.png
        ├── placeholders/
        │   ├── noticia-assembleia.jpg
        │   ├── noticia-direitos.jpg
        │   └── noticia-negociacao.jpg
        └── filiacao/
            ├── uniao-servidores.jpg
            └── filiacao-placeholder.jpg
```

Páginas dentro de `html/` referenciam os assets com o prefixo `../assets/...` e voltam para a página inicial com `../index.html`. Os links entre páginas dentro de `html/` (ex.: `sindicato.html` → `diretoria.html`) permanecem relativos entre si, sem prefixo.

## Como abrir localmente

Abra o arquivo `index.html` diretamente no navegador. Não é necessário instalar dependências ou iniciar servidor.

## Publicação no GitHub Pages

1. Envie todos os arquivos deste diretório para um repositório no GitHub.
2. No repositório, acesse `Settings`.
3. Entre em `Pages`.
4. Em `Build and deployment`, selecione `Deploy from a branch`.
5. Escolha a branch principal e a pasta raiz `/`.
6. Salve e aguarde a URL pública ser gerada pelo GitHub Pages.

## Aviso

Os textos, notícias, formulários, login, botões, links e mensagens são apenas demonstrativos. As imagens atuais são placeholders locais preparados para substituição posterior por arquivos oficiais do sindicato.
