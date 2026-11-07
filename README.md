# SIND_GESTÃO

Protótipo acadêmico de um sistema web de gestão sindical desenvolvido a partir do levantamento e da validação de necessidades do SINPROTEC/MT.

O projeto reúne a especificação funcional e um protótipo navegável usado para validar estrutura de navegação, perfis, permissões, regras de negócio e principais fluxos do sistema.

## Protótipo navegável

**Acessar:** https://eneidaandre.github.io/SIND_GESTAO/

> O ambiente é demonstrativo. Os dados, usuários, documentos, votações e demais registros apresentados no protótipo não representam informações oficiais ou operações reais do SINPROTEC/MT.

## Escopo da solução

A proposta foi organizada em três contextos principais:

- **Área Pública:** informações institucionais, Diretoria, Estatuto, Notícias, Comunicados, Transparência, Documentos, Galeria, Filie-se e Contato.
- **Área do Filiado:** dados cadastrais, comunicações, assembleias, documentos, prestação de contas, solicitações, enquetes e votações e denúncias e manifestações.
- **Área Administrativa:** gestão de usuários e permissões, filiações, filiados, comunicação, notificações, assembleias, documentos, prestação de contas, solicitações, votações, Conselhos, relatórios e conteúdo institucional.

O perfil **Servidor cadastrado** possui acesso específico a consultas e votações quando estiver incluído no público definido, sem criação de uma área própria.

## Situação desta entrega

Esta etapa acadêmica contempla:

- levantamento e organização dos requisitos;
- definição de perfis e permissões;
- requisitos de negócio, funcionais e não funcionais;
- regras de negócio;
- estados e ciclos de vida;
- fluxos dos principais processos;
- casos de uso;
- matriz de rastreabilidade;
- critérios de aceite da prototipação;
- protótipo navegável;
- testes automatizados de partes críticas do protótipo.

A especificação consolidada possui **13 módulos funcionais, 14 requisitos de negócio, 78 requisitos funcionais, 15 requisitos não funcionais, 32 regras de negócio e 38 casos de uso**.

## Tecnologias do protótipo

- HTML5
- CSS3
- JavaScript
- Bootstrap Icons via CDN
- GitHub Actions
- GitHub Pages

O protótipo é executado no navegador e utiliza `localStorage` e `sessionStorage` somente para simular estados e dados durante a demonstração.

## Estrutura do repositório

```text
.
├── .github/
│   └── workflows/
│       ├── pages.yml
│       └── tests.yml
├── protótipo/
│   ├── index.html
│   ├── README.md
│   ├── html/
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   ├── images/
│   │   ├── docs/
│   │   └── documents/
│   └── tests/
└── README.md
```

A documentação técnica específica do protótipo está em [`protótipo/README.md`](protótipo/README.md).

## Testes e publicação

O workflow `.github/workflows/tests.yml` executa os testes automatizados do protótipo com:

```bash
node --test tests/
```

Os testes atuais verificam, entre outros pontos:

- ações e acessibilidade na tela de Usuários e Permissões;
- publicação pública somente de conteúdo autorizado;
- integração de Notícias e Comunicados;
- preservação de conteúdo estático quando não houver versão publicada válida;
- participação do perfil Servidor cadastrado em votações compatíveis;
- voto único e regras de visibilidade de resultados;
- bloqueio de dados financeiros e manifestações na integração pública.

O workflow `.github/workflows/pages.yml` publica a pasta `protótipo/` no GitHub Pages.

## Limites desta etapa

Este repositório contém um **protótipo acadêmico navegável**, não um sistema pronto para produção.

Não fazem parte desta entrega:

- backend;
- banco de dados;
- APIs;
- autenticação e autorização reais;
- armazenamento definitivo de arquivos;
- envio real de e-mails ou mensagens;
- infraestrutura de produção;
- monitoramento e operação do sistema.

Uma futura implementação técnica deverá tratar esses componentes, além de segurança, privacidade, integrações, testes de produção e manutenção.

## Organização da entrega

Para conhecer rapidamente o projeto:

1. acesse o protótipo pelo link acima;
2. consulte este README para entender o escopo geral;
3. consulte [`protótipo/README.md`](protótipo/README.md) para detalhes da implementação demonstrativa;
4. consulte `protótipo/tests/` e `.github/workflows/` para as verificações automatizadas e publicação.

