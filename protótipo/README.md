# SINPROTEC/MT — protótipo público

Portal estático em HTML, CSS e JavaScript puro, com 16 páginas existentes. Não há backend, banco de dados, autenticação real ou envio real dos formulários. Dados editoriais, documentos, composição da Diretoria e fluxos de acesso são demonstrativos.

## Estrutura

```text
protótipo/
├── index.html
├── README.md
├── html/
│   ├── sindicato.html
│   ├── diretoria.html
│   ├── estatuto.html
│   ├── documentos.html
│   ├── noticias.html
│   ├── noticia.html
│   ├── comunicados.html
│   ├── comunicado.html
│   ├── galeria.html
│   ├── transparencia.html
│   ├── contato.html
│   ├── filie-se.html
│   ├── login.html
│   ├── recuperar-senha.html
│   └── area-filiado-demo.html
└── assets/
    ├── css/styles.css
    ├── js/
    │   ├── main.js
    │   ├── noticias.js
    │   ├── comunicados.js
    │   ├── documentos.js
    │   ├── galeria.js
    │   ├── contato.js
    │   ├── filiacao.js
    │   └── autenticacao-demo.js
    ├── documents/
    │   ├── politica-privacidade.pdf
    │   └── filiacao/politica-privacidade.pdf
    └── images/
        ├── logo.png
        ├── banner.jpg
        ├── sede-sindicato.jpg
        ├── diretoria/placeholder.svg
        ├── noticias/       (negociacao.png, direitos.png, assembleia.png)
        ├── placeholders/   (imagens de notícias)
        ├── contato/        (mapa-localizacao.jpg, atendimento.jpg)
        ├── filiacao/       (uniao-servidores.jpg, filiacao-placeholder.jpg)
        └── login/acesso-seguro.svg
```

## Páginas e comportamento

- **Home:** atalhos e cards correspondentes aos registros de `noticias.js` (IDs 1, 3 e 4) e `comunicados.js` (IDs 1, 3 e 4). Os cards são HTML estático: alterações nesses registros devem ser refletidas na Home.
- **Sindicato, Diretoria e Estatuto:** apresentação institucional. A Diretoria preserva cargos, cards e modal com nomes demonstrativos; mandato e dados oficiais aguardam confirmação. O Estatuto explica os instrumentos institucionais e encaminha à biblioteca, sem duplicar busca e filtros.
- **Documentos:** biblioteca pública com busca, categoria, ano e metadados de situação, responsabilidade e visibilidade. Registros sem arquivo abrem informações demonstrativas e não oferecem download ativo.
- **Notícias e Comunicados:** listagem, filtros, paginação e detalhes por `?id=`. Comunicados destinados a filiados ou à Diretoria são excluídos da exibição pública, inclusive do detalhe. Esses registros continuam no JavaScript estático e não devem conter informações sigilosas.
- **Galeria:** categorias, imagens ilustrativas locais e consulta de álbuns.
- **Transparência:** informações institucionais e encaminhamento ao login para prestação de contas; sem demonstrativos financeiros detalhados públicos.
- **Contato e Filiação:** formulários com validações e confirmações demonstrativas. Os PDFs de privacidade tratam exclusivamente desses formulários, não de uma política institucional completa.
- **Login, recuperação e área de demonstração:** telas existentes de simulação, sem controle de acesso real. Não constituem uma Área do Filiado implementada.

`main.js` controla navegação, menus, modais e filtros comuns de documentos. Os demais scripts concentram o comportamento de suas respectivas páginas. Bootstrap Icons 1.13.1 é carregado via CDN; as demais imagens e estilos são locais.

O rodapé comum contém Institucional, Conteúdo, Serviços e Transparência. Prestação de Contas e Área do Filiado levam a `login.html`. Política institucional, termos e redes sociais ficam omitidos enquanto não houver destinos oficiais. Endereço, telefone, e-mail e horários aguardam confirmação; não há links de contato fictícios ativos.

## Execução local e GitHub Pages

Abra `index.html` no navegador ou execute `python -m http.server 8000` neste diretório e acesse `http://localhost:8000/`.

Os caminhos são relativos: páginas em `html/` acessam `../assets/` e retornam por `../index.html`, permitindo hospedagem em subdiretórios do GitHub Pages.

O workflow existente `../.github/workflows/pages.yml` publica **somente este diretório** via GitHub Actions, em pushes relevantes para `main` ou execução manual. Este bloco não executa publicação.

## Validação e limites atuais

Foram conferidos os destinos locais, âncoras, referências ARIA, imagens e a sintaxe dos oito scripts; os cards da Home foram comparados aos registros de origem. Os dois PDFs existentes são legíveis pelo extrator, mas apresentam aviso de ponteiro `startxref` e precisam de revisão futura dos arquivos oficiais.

A revisão visual nas larguras 1440, 1366, 1024, 768, 390 e 360 px, o console no navegador e a interação com menus e modais ainda precisam ser executados: não havia navegador disponível nesta sessão. A antiga barra de abas do Estatuto foi retirada junto com a biblioteca duplicada; a ausência de overflow ainda requer confirmação visual.

Permanecem seis atalhos `data-demo`: Convênios e Benefícios, Assessoria Jurídica, Guias e Requerimentos e Calendário de Atividades na Home; Abrir no mapa em Contato e Sindicato. Não há módulos ou destinos oficiais para esses atalhos.
