# SIND_GESTÃO — Protótipo acadêmico do SINPROTEC/MT

Protótipo navegável desenvolvido em HTML, CSS e JavaScript para representar e validar a proposta de um sistema web de gestão sindical do SINPROTEC/MT.

Esta versão foi construída para fins acadêmicos e de validação de requisitos. Não possui backend, banco de dados, autenticação real, armazenamento definitivo de arquivos ou infraestrutura de produção. Os dados utilizados são demonstrativos e os estados de navegação e simulação são mantidos no próprio navegador.

## Escopo representado

O protótipo contempla três contextos principais:

- **Área Pública:** Página Inicial, O Sindicato, Diretoria, Estatuto, Notícias, Comunicados, Transparência, Documentos, Galeria, Filie-se, Contato e telas de acesso.
- **Área do Filiado:** painel, dados cadastrais, comunicados e notificações, assembleias e reuniões, atas e documentos, prestação de contas, solicitações, enquetes e votações e denúncias e manifestações.
- **Área Administrativa:** Usuários e Permissões, Solicitações de Filiação, Filiados, Notícias e Comunicados, Notificações, Assembleias e Reuniões, Atas e Documentos, Prestação de Contas, Solicitações dos Filiados, Enquetes e Votações, Denúncias e Manifestações dos Conselhos, Relatórios e Configurações/Conteúdo Institucional.

Também existe um ponto de acesso específico para o perfil **Servidor cadastrado** participar de Enquetes e Votações quando estiver incluído no público da consulta, sem criação de uma Área do Servidor separada.

## Perfis demonstrativos

A navegação e as permissões são representadas por perfis demonstrativos:

- Administrador Geral
- Diretoria
- Presidência
- Tesouraria
- Secretaria
- Conselho de Ética
- Conselho Fiscal
- Filiado
- Servidor cadastrado

A Presidência é tratada como uma variação de autorização da Diretoria no projeto, e não como um novo perfil-base.

## Estrutura do repositório

```text
protótipo/
├── index.html
├── README.md
├── html/
│   ├── páginas públicas e de acesso
│   ├── páginas da Área do Filiado
│   ├── páginas da Área Administrativa
│   └── servidor-votacoes.html
├── assets/
│   ├── css/
│   ├── js/
│   ├── images/
│   ├── docs/
│   └── documents/
└── tests/
    ├── admin-usuarios.test.mjs
    └── integracao-publica.test.mjs
```

Na versão atual, o protótipo possui 39 páginas HTML, incluindo a página inicial, páginas públicas, Área do Filiado, Área Administrativa e a página específica de votações para Servidor cadastrado.

## Principais regras representadas

Entre as decisões validadas no protótipo estão:

- exibição de menus administrativos conforme o perfil;
- separação entre os escopos do Conselho de Ética e do Conselho Fiscal;
- preparação da prestação de contas pela Tesouraria e validação/publicação pela Presidência;
- revisão de conteúdos antes da publicação;
- exibição pública apenas de conteúdos com status **Publicado**;
- restrição de conteúdos destinados somente a filiados ou outros públicos;
- participação em votações conforme público, período e regra de voto único;
- acompanhamento de solicitações e filiação por protocolo demonstrativo;
- manifestações identificadas ou com identidade protegida;
- integração entre conteúdos administrativos e páginas públicas.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Bootstrap Icons via CDN
- GitHub Actions
- GitHub Pages

O protótipo não utiliza framework de frontend e não possui backend nesta etapa.

## Execução local

Abra `index.html` diretamente no navegador ou execute um servidor local dentro da pasta `protótipo`, por exemplo:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000/
```

## GitHub Pages

O workflow `.github/workflows/pages.yml` publica somente a pasta `protótipo/` no GitHub Pages.

Protótipo navegável:

https://eneidaandre.github.io/SIND_GESTAO/

## Validação

A validação foi realizada durante a construção do protótipo, com revisão dos fluxos, perfis, permissões, navegação e integração entre áreas.

O repositório mantém dois testes automatizados:

- `tests/admin-usuarios.test.mjs`: valida a renderização e a acessibilidade das ações de Usuários e Permissões;
- `tests/integracao-publica.test.mjs`: valida publicação por status, integração entre conteúdos administrativos e área pública, Notícias e Comunicados, votação do Servidor cadastrado e isolamento de dados restritos.

O workflow `.github/workflows/tests.yml` executa `node --test tests/*.test.mjs` automaticamente quando houver alterações no protótipo ou nos testes.

Também foram feitas revisões visuais e funcionais das páginas públicas e das áreas restritas demonstrativas.

## Limites desta etapa

Este repositório representa um **protótipo acadêmico navegável**. Não deve ser interpretado como sistema pronto para produção.

Uma futura implementação técnica poderá incluir:

- banco de dados;
- backend;
- APIs;
- autenticação e autorização reais;
- armazenamento definitivo de arquivos;
- integrações externas;
- testes de produção;
- controles adicionais de segurança;
- infraestrutura;
- implantação;
- monitoramento e manutenção.
