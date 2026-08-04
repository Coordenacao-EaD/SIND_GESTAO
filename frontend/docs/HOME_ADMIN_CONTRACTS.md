# Contratos administrativos da Home — F2.1

## Limites e separação

A F2.1 cria somente o domínio tipado que será consumido pela interface administrativa da F2.2. Não há tela, rota administrativa, API, cliente HTTP, autenticação, autorização real, upload, publicação ou persistência.

O fluxo público permanece independente:

```text
HomeRepository → HomePageData → Home pública
```

O módulo `src/features/home-admin/` não é importado por `src/pages/home/`, não adiciona campos editoriais a `HomePageData` e não entra no bundle público. Os tipos públicos servem apenas como referência para uma conversão futura no backend/F3. A única fonte compartilhada é `ROUTES`, usada por um catálogo administrativo derivado para impedir divergência de caminhos.

Links legais, grupos de navegação e demais conteúdos do rodapé não foram incluídos: a documentação disponível para esta subfase só comprova administração de banner, contatos e configuração social completa.

## Inventário inicial

| Contrato necessário | Existia | Reutilização | Ação F2.1 |
|---|---|---|---|
| Dados públicos da Home | `HomePageData` | Apenas saída futura | Preservado sem campos administrativos |
| CTA público | `HeroAction`/`SafeLink` | Sem reutilização direta | Criada união administrativa estrita |
| Contatos públicos | `FooterData` | Referência dos campos suportados | Criado recurso editorial próprio |
| Redes sociais públicas | `SocialLink[]` | Referência da projeção pública | Criada configuração versionada e ordenada |
| Rotas públicas | `ROUTES`, `RouteKey`, `RoutePath` | Sim | Catálogo administrativo derivado da fonte única |
| Estados editoriais | Não | Não | Criados cinco estados documentados |
| Revisão e decisões | Não | Não | Criado ciclo vinculado a recurso, versão e hash |
| Capacidades | Não havia IDs técnicos | Não | Criado catálogo granular a partir das ações documentadas |
| Erros administrativos | Não | Não | Criada união discriminada sem transporte HTTP |
| Schemas runtime | Não havia biblioteca | Não | Validadores puros estritos, sem dependência nova |
| Repositórios administrativos | Não | Não | Interfaces por conteúdo e revisão, sem HTTP/DOM/React |
| Mocks administrativos | Não | Não | Adaptador determinístico e efêmero |

## Recursos e contratos

`AdminResourceType` discrimina:

- `banner`;
- `footer_contacts`;
- `footer_social_links`.

Todos possuem identificador, estado atual/anterior, metadados de versão e ciclo opcional de revisão. O banner contém texto, descrição, texto alternativo, referência de asset existente e CTA. Contatos contêm telefone, e-mail e endereço. Redes sociais são publicadas como configuração completa e cada item contém ID, plataforma, HTTPS, rótulo acessível, ordem e situação ativa.

Referências de imagem guardam somente ID e nome acessível; nenhum binário ou regra visual/CSS integra o contrato.

## Estados, versões e revisão

Estados editoriais:

```text
draft → review → approved → published → archived
```

Retornos controlados também permitem `review → draft` por ajustes/cancelamento e `approved → draft` quando uma edição invalida a aprovação. Publicação direta de `draft`, `review` ou `archived` é bloqueada.

Decisões: `pending`, `approved`, `changes_requested`, `cancelled` e `invalidated`. Ajustes exigem parecer; cancelamento e invalidação exigem motivo. Autor não aprova o próprio conteúdo. A decisão somente é válida para a versão e o hash submetidos; qualquer divergência exige novo ciclo.

Os metadados diferenciam:

- `editorialVersion`: versão do conteúdo em edição;
- `publicVersion`: versão já exposta publicamente, ou `null`;
- `revision`: controle de concorrência;
- `contentHash`: integridade do conteúdo;
- datas e atores de criação, atualização, submissão, aprovação, publicação e arquivamento.

## CTA e rotas

`BannerCta` é uma união discriminada:

- `{ enabled: false }`;
- interno com label e chave selecionável do catálogo;
- externo com label e URL HTTPS segura.

Campos incompatíveis ou desconhecidos são rejeitados. HTTP, `javascript:`, `data:`, URL malformada e URL com credenciais são rejeitados. A apresentação futura deverá continuar usando a proteção do `SafeLink` para externos.

O catálogo administrativo deriva os caminhos de `ROUTES`. A chave `memberArea` aparece para explicitar seu estado, mas fica desabilitada e não selecionável nesta subfase; nenhuma página ou rota foi criada.

## Capacidades e matriz de ações

Identificadores canônicos estabelecidos a partir das capacidades granulares documentadas:

- `home.banner.edit`;
- `home.review.decide`;
- `home.banner.publish`;
- `home.footer_contacts.publish`;
- `home.footer_social_links.publish`;
- `home.history.view`;
- `home.version.restore`.

A matriz avalia recurso, estado, decisão, autoria, capabilities, alterações, validade da aprovação, versão e hash. Cada ação resulta em um estado completo (`visible`, `enabled`, `blocked`, `reason`) para editar, salvar, pré-visualizar, enviar/cancelar revisão, aprovar, solicitar ajustes, publicar, consultar histórico ou restaurar.

Como a documentação não define capabilities separadas de edição para contatos/redes, a F2.1 não inventa esses identificadores: nesses recursos, o acesso preparatório usa a capability granular de publicação correspondente. A F3 deverá confirmar a matriz definitiva no servidor.

## Validação runtime

Não havia biblioteca de schema instalada. Para evitar dependência concorrente e respeitar `DEPENDENCY_POLICY.md`, a F2.1 usa parsers puros que:

- recebem `unknown`;
- rejeitam propriedades desconhecidas;
- retornam resultado discriminado e lista de issues;
- validam CTA, banner, contatos, redes, revisão, versão e erros;
- normalizam contatos somente depois de validar a entrada;
- não lançam exceção para erro de negócio esperado.

## Repositórios e mocks

`HomeAdminContentRepository` expressa listagem, detalhe, rascunho, publicação futura, histórico e restauração. `HomeAdminReviewRepository` expressa envio, cancelamento e decisão. Nenhuma interface conhece URL, endpoint ou código HTTP de transporte; números 401/403/409/422 são apenas categorias de erro que a F2.2 deverá representar.

`HomeAdminMockRepository` usa dados determinísticos e memória efêmera isolada por instância. Os cenários são sucesso, loading, vazio, validação, não autenticado, sem capacidade, conflito e indisponibilidade. Não usa timer, arquivo, storage ou rede; em cenário de erro, nenhuma mutação é aplicada.

## Responsabilidades futuras

F2.2 poderá criar telas e consumir estes contratos, sem executar publicação real. A F3 deverá implementar autenticação, autorização e validação definitiva no servidor, além dos adaptadores reais. A F4 poderá integrar publicação/consulta pública. Nenhuma dessas responsabilidades foi antecipada na F2.1.

