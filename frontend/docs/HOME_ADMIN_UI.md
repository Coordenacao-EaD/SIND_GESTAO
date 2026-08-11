# F2.2A/F2.2B/F2.2C/F2.2D — administração visual da Home

## Limite da entrega

A F2.2A adicionou o painel e o banner. A F2.2B ampliou a mesma interface para contatos públicos e redes sociais. A F2.2C acrescentou revisão. A F2.2D conclui o fluxo visual com publicação simulada separada, histórico e restauração para novo rascunho. Não há API, autenticação real, upload, banco, publicação real ou persistência. O estado existe apenas na memória da página e é perdido ao recarregar.

Salvar, revisar, aprovar, publicar, consultar histórico e restaurar são simulações determinísticas locais. Integrações reais permanecem fora da F2.

**Aprovar não publica.** A publicação exige uma segunda ação específica e também não altera a Home pública real nesta fase.

## Inventário inicial e estratégia de reuso da F2.2B

| Elemento | Implementação atual | Reuso previsto | Alteração necessária |
|---|---|---|---|
| Roteamento | `createBrowserRouter` em `src/app/router.tsx` | Mesmo roteador | Rota de topo `/admin/home`, sem segunda infraestrutura |
| Layout público | `AppLayout` com cabeçalho e rodapé públicos | Mantido intacto na Home | Admin usa layout próprio e não aparece no menu público |
| Catálogo de rotas | `ROUTES` e catálogo administrativo derivado | Fonte única das opções internas do CTA | `ADMIN_ROUTES.home` separado para não contaminar contratos públicos |
| Tokens visuais | `src/styles/tokens.css` | Cores, espaçamento, raios, sombras e foco | CSS Module específico do painel |
| Contrato do banner | `AdminBanner` e `BannerCta` discriminado | Formulário e prévia tipados | Nenhum tipo duplicado |
| Validação runtime | `parseAdminBanner` | Executada antes de salvar ou revisar | Erros convertidos em feedback 422 associado ao campo |
| Permissões e ações | capabilities e `buildActionMatrix` | Visibilidade/habilitação de editar, salvar e revisar | Perfil local explicitamente simulado |
| Repositório | `HomeAdminMockRepository` determinístico | Loading, vazio, 401, 403, 409, 422 e ações | Instância efêmera; nenhuma persistência |
| Imagem pública | WebP responsivo já otimizado na F1 | Prévia administrativa | Sem upload ou cópia de asset |
| Contatos públicos | `AdminFooterContacts` da F2.1 | Contrato, mock, repositório e matriz de ações | Editor com máscara, UF, validação e prévia por adaptador explícito |
| Redes sociais | `AdminSocialConfiguration` e `AdminSocialLink` da F2.1 | Contrato e fluxo editorial do recurso completo | Lista ordenável, ativação, remoção, URLs oficiais e prévia segura |

## Execução local

```bash
cd frontend
npm install
npm run dev
```

Acesse diretamente `http://localhost:5173/admin/home`, `/admin/home/contacts` ou `/admin/home/social`. As rotas não possuem link na navegação pública.

Para validar o fallback de SPA no build:

```bash
npm run build
npm run preview
```

Abra qualquer uma das três rotas em `http://localhost:4173` diretamente ou atualize a URL. O preview do Vite devolve a aplicação e o roteador resolve a página, sem 404 do servidor.

## Cenários visuais

O seletor “Visualizar estado” atualiza um parâmetro de consulta local. Os mesmos estados podem ser abertos diretamente:

- `/admin/home` — conteúdo disponível;
- `/admin/home?scenario=loading` — carregamento;
- `/admin/home?scenario=empty` — vazio;
- `/admin/home?scenario=unauthenticated` — 401 demonstrativo;
- `/admin/home?scenario=forbidden` — 403 demonstrativo;
- `/admin/home?scenario=conflict` — 409 demonstrativo;
- `/admin/home?scenario=validation` — 422 demonstrativo;
- `/admin/home?scenario=unavailable` — indisponibilidade simulada.

Os mesmos parâmetros funcionam em `/admin/home/contacts` e `/admin/home/social`. Também existem `scenario=readonly` para leitura sem edição e `scenario=unexpected` para erro inesperado.

## Comportamento editorial da F2.2B

- contatos são salvos e enviados para revisão como um único recurso versionado;
- telefone e CEP têm formatação visual sem persistência externa;
- e-mail, endereço, município, UF e horário alimentam somente a prévia administrativa;
- redes sociais aceitam Facebook, Instagram, YouTube, LinkedIn e X, sem duplicidade mesmo quando inativas;
- URLs exigem HTTPS e domínio oficial da plataforma;
- reordenação, ativação e remoção mantêm IDs estáveis e normalizam a ordem;
- somente links ativos e válidos aparecem na prévia, sempre com `noopener noreferrer`;
- sair por outra seção com alterações pendentes pede confirmação do navegador.

Recarregar a página, trocar para outro cenário após confirmar o descarte ou criar uma nova instância do mock reinicializa os dados. A F2.2C poderá completar revisão e histórico; a F3 será responsável por integrações reais, quando contratadas, sem antecipação nesta interface.

Os códigos representam contratos e estados visuais. Não existe sessão, login ou chamada HTTP por trás deles.

## Capabilities simuladas

- contatos: `site.footer.contacts.edit`;
- redes sociais: `site.footer.social_links.edit`;
- prévias: `site.home.preview`.

A matriz da F2.1 decide se editar, salvar, visualizar, enviar ou cancelar está visível e habilitado. Nenhuma capability de publicação é usada nesta entrega, e o nome do perfil não concede permissão.

## F2.2C — fila, detalhe e decisões de revisão

### Rotas

| Rota | Página | Carregamento |
|---|---|---|
| `/admin/home/reviews` | Fila de revisões da Página Inicial | `lazy` via `LazyReviewPages` |
| `/admin/home/reviews/:reviewId` | Detalhe da revisão | `lazy` via `LazyReviewPages` |

As duas rotas respondem diretamente no preview e sobrevivem a um refresh, sem 404 de servidor. Nenhuma delas aparece na navegação pública. Revisões, Publicação e Histórico são itens reais do menu administrativo.

Um `reviewId` desconhecido não gera tela branca: a página mostra o estado contextual “Revisão não encontrada” com um link de volta para a fila.

### Inventário de reuso da F2.2C

| Recurso | Implementação atual | Reuso | Alteração necessária |
|---|---|---|---|
| Ciclo de revisão | `ReviewCycle` e `ReviewDecision` da F2.1 | Fonte única de decisão, versão e hash | Nenhum tipo paralelo; apenas a junção de leitura `ReviewQueueEntry` |
| Matriz de ações | `buildActionMatrix` da F2.1 | Visibilidade, habilitação, bloqueio e motivo | Motivos traduzidos em texto acessível, sem reimplementar a regra |
| Capabilities | `HOME_ADMIN_CAPABILITIES` da F2.1 | `site.home.review` | Nenhuma capability nova |
| Repositório mock | `HomeAdminMockRepository` | Cenários, erros e decisões simuladas | Fila determinística e decisões em memória |
| Layout e feedback | `AdminHomeLayout`, `AdminFeedback`, `EditorialStatusBadge` | Reaproveitados na fila e no detalhe | `ReviewStatusBadge` específico da decisão |
| Adaptadores de prévia | `contacts-preview.adapter`, `social-preview.adapter` | Prévia da submissão | Nenhum acoplamento a componentes públicos |

### Fila

A fila lista os três tipos de conteúdo — banner, contatos e redes sociais — usando os identificadores discriminados da F2.1. Cada item mostra identificador, tipo, resumo, situação, versão editorial, versão pública vigente, autor, responsável pelo envio, data de envio, hash resumido, indicação de conflito e a ação **Analisar revisão**.

Filtros disponíveis: **Situação**, **Tipo de conteúdo**, **Responsável pelo envio** e **Somente itens que posso revisar**. A fila abre priorizando `pending`. “Limpar filtros” restaura a lista completa do cenário atual e um filtro sem resultados mostra estado vazio contextual. Os filtros vivem apenas na memória da página — não há `localStorage`, `sessionStorage` nem paginação de servidor.

### Detalhe

O detalhe é dividido em regiões nomeadas: **Dados da submissão**, **Conteúdo submetido**, **Versão pública atual**, **Diferenças**, **Decisão** e **Informações de integridade**. Ele exibe tipo, status da revisão, status editorial, versão, hash submetido, autor, responsável pelo envio, data de envio, revisor atual, decisão, parecer, data da decisão e a versão pública vigente, sempre com o aviso de que a decisão não publica.

### Comparação

A comparação usa rótulos textuais “Versão pública” e “Conteúdo submetido”, e marca cada linha como **Alterado**, **Adicionado** ou **Removido** — nunca apenas por cor. O conteúdo submetido é tratado como dado: nada vindo dele é executado como HTML, e a comparação não é um editor.

- **Banner**: título, subtítulo, texto complementar, imagem demonstrativa, texto alternativo, CTA habilitado, rótulo do CTA, tipo de destino e rota interna ou URL externa.
- **Contatos**: telefone, e-mail, endereço, município, UF, CEP e horário de atendimento, formatados para leitura. Campos opcionais vazios aparecem como “Não informado”; a comparação não normaliza silenciosamente o conteúdo submetido.
- **Redes sociais**: comparadas como **unidade completa**, indicando plataformas adicionadas e removidas, URLs e rótulos alterados, links ativados e inativados e mudanças de ordem, respeitando os IDs estáveis da F2.2B. Nenhum link é tratado como revisão independente.

### Prévia

A prévia da submissão é rotulada “Prévia da submissão — não publicada” e funciona para os três tipos, reutilizando os adaptadores explícitos. CTA e links externos permanecem protegidos com `noopener noreferrer`. A prévia não altera a Home pública nem acopla contratos administrativos aos componentes públicos.

### Segregação de funções

O revisor não pode ser o autor do conteúdo nem o responsável pelo envio. A regra compara identificadores estáveis (`authorUserId`, `submittedByUserId`, `currentUserId`), nunca o nome exibido, e vale mesmo quando o cenário possui a capability de revisão. Motivos exibidos:

- “Você é o autor deste conteúdo.”
- “Você enviou este conteúdo para revisão.”
- “A segregação de funções impede esta decisão.”

Não há autoaprovação e não existe exceção implícita para administrador.

### Capability

A capability usada é **`site.home.review`**, conforme a especificação oficial. Ela é necessária, mas não suficiente: a decisão também exige revisão `pending`, ausência de decisão anterior, versão compatível, hash compatível, revisor diferente do autor e do responsável pelo envio, conteúdo ainda existente e ação permitida pela matriz. O nome do perfil nunca concede permissão.

### Decisões

**Aprovar** — exige decisão `pending`, capability, segregação respeitada, `version` igual à submetida e `contentHash` igual ao `submittedContentHash`. Após o sucesso: `decision = approved`, o conteúdo editorial passa para `approved`, revisor e data simulados são registrados, novas decisões ficam bloqueadas e a versão pública anterior permanece intacta. A mensagem exibida é “Conteúdo aprovado. A publicação exige uma ação separada.” O parecer de aprovação é opcional; se informado, é texto simples de 10 a 1000 caracteres.

**Solicitar ajustes** — a justificativa é obrigatória, de 10 a 1000 caracteres, não aceita apenas espaços e é texto simples. O contador é acessível, o erro é associado por `aria-describedby` e o foco volta ao campo quando inválido. Após o sucesso: `decision = changes_requested`, o conteúdo volta para `draft`, revisor e data são registrados, o parecer fica visível ao editor e a versão pública permanece inalterada. O ciclo de revisão não é apagado.

Os dois diálogos são modais acessíveis: recebem foco ao abrir, fecham com `Escape` e devolvem o foco ao disparador.

### Cancelamento

O cancelamento continua pertencendo ao autor da submissão, no editor correspondente, como implementado na F2.2B. Nesta etapa a fila reflete revisões canceladas, o detalhe cancelado é somente leitura, e uma revisão `cancelled` não pode ser aprovada nem receber solicitação de ajustes. Um conflito entre cancelamento e decisão resulta em 409. Nunca são simuladas duas decisões para o mesmo ciclo.

### Hash e versão

Antes de qualquer decisão são validados `editorialVersion`, `revisionVersion`, `contentHash` e `submittedContentHash`. O hash não é recalculado com algoritmo diferente do definido na F2.1. Em divergência a decisão é bloqueada, o motivo é exibido, o estado 409 é apresentado, nem a decisão nem o status editorial mudam, a versão pública é preservada e a ação **Recarregar dados** fica disponível.

### Concorrência

Casos simulados: outro revisor aprovou antes, outro revisor solicitou ajustes antes, o autor cancelou antes da decisão, a versão mudou e o hash mudou. A resposta 409 encerra o carregamento, não mostra sucesso, preserva o estado anterior até o recarregamento e informa que a revisão já sofreu alteração. Depois de recarregar, o estado mais recente é exibido.

### Estados da revisão

`Pendente`, `Aprovada`, `Ajustes solicitados`, `Cancelada` e `Invalidada`. Cada estado tem texto, descrição e elemento não cromático, com contraste AA. Uma revisão decidida é somente leitura.

### Identidade simulada

A tela exibe o usuário atual, a função demonstrativa, as capabilities simuladas e a relação com o conteúdo (autor, responsável pelo envio, revisor independente ou nenhuma relação), sempre acompanhada do aviso:

> “Identidade simulada para demonstração. A autorização real será implementada na F3.”

Não há login, token ou perfil persistido.

### Cenários simulados

Aceitos em `?scenario=` nas duas rotas de revisão:

| Cenário | Efeito |
|---|---|
| `success` | Revisor independente (padrão) |
| `author` | Usuário atual é o autor do conteúdo |
| `submitter` | Usuário atual enviou o conteúdo |
| `no_review_capability` | Perfil sem `site.home.review` |
| `readonly` | Somente leitura |
| `hash_mismatch` | Hash divergente |
| `version_mismatch` | Versão divergente |
| `concurrent` | Decisão concorrente (409) |
| `loading` | Carregamento |
| `empty` | Fila sem revisões |
| `unauthenticated` | 401 |
| `forbidden` | 403 |
| `validation` | 422 |
| `unavailable` | Serviço indisponível |
| `unexpected` | Erro inesperado |

### Fila determinística do mock

| ID | Tipo | Situação | Autor | Envio |
|---|---|---|---|---|
| `review-banner-1` | Banner | Pendente | Ana Editora | Bruno Editor |
| `review-contacts-1` | Contatos | Pendente | Ana Editora | Ana Editora |
| `review-social-1` | Redes sociais | Pendente | Bruno Editor | Bruno Editor |
| `review-banner-2` | Banner | Aprovada | Ana Editora | Bruno Editor |
| `review-contacts-2` | Contatos | Ajustes solicitados | Ana Editora | Bruno Editor |
| `review-social-2` | Redes sociais | Cancelada | Bruno Editor | Bruno Editor |
| `review-banner-3` | Banner | Invalidada | Ana Editora | Bruno Editor |

Usuários simulados: `actor-editor-1` (Ana Editora, autora), `actor-editor-2` (Bruno Editor, responsável pelo envio), `actor-reviewer-1` (Carla Revisora, revisora independente) e `actor-reader-1` (Diego Leitor, somente leitura).

### Ausência de publicação e de persistência

Aprovar e solicitar ajustes alteram apenas o ciclo de revisão e o status editorial em memória. A versão pública vigente nunca muda, a Home pública não é afetada e não existe `fetch`, Axios, `localStorage`, `sessionStorage`, IndexedDB ou gravação em arquivo. Recarregar a página reinicializa o mock e descarta as decisões simuladas.

### Como visualizar

```bash
cd frontend
npm run dev
```

Com o servidor Vite ativo, use a porta informada no terminal (por padrão `5173`):

- fila: `/admin/home/reviews`
- revisão pendente: `/admin/home/reviews/review-banner-1`
- cenário de autor: `/admin/home/reviews/review-banner-1?scenario=author`
- hash divergente: `/admin/home/reviews/review-banner-1?scenario=hash_mismatch`

Para voltar à fila, use o breadcrumb, o link “Voltar para a fila” ou o item **Revisões** do menu administrativo. Para reinicializar o mock, recarregue a página.

## F2.2D — publicação simulada, histórico e restauração

### Rotas

- `/admin/home/publication`: três cartões e três dialogs independentes para banner, contatos e configuração social;
- `/admin/home/history`: histórico somente leitura com filtros por tipo, status, período simulado e versão pública atual;
- `/admin/home/history/:versionId`: detalhe imutável e restauração como novo rascunho.

As rotas são lazy-loaded, não aparecem no menu público e preservam o fallback de SPA.

### Capabilities

- banner: `site.home.banner.publish`;
- contatos: `site.footer.contacts.publish`;
- redes sociais: `site.footer.social_links.publish`;
- histórico: `site.home.history.view`;
- restauração: `site.home.version.restore`.

O nome textual do perfil não autoriza ações. A matriz F2.1 continua sendo a fonte de `visible`, `enabled`, `blocked` e `reason`.

### Publicação simulada

`approved` é diferente de `published`. Cada publicação exige aprovação vigente, mesma versão, mesmo hash, ausência de edição ou revisão posterior e capability específica. O mock arquiva a versão pública anterior, registra `publishedAt`/`publishedBy`, incrementa a versão pública e cria a entrada histórica somente após sucesso. Redes sociais são uma unidade indivisível; links não possuem status editorial próprio.

Dialogs identificam o conteúdo, versão, hash, aprovação, revisor, versão pública vigente e dados do recurso. Eles suportam cancelamento, Escape, retorno de foco, loading e bloqueio de duplo acionamento. Falhas 401, 403, 409, indisponibilidade e erro inesperado nunca exibem sucesso falso.

### Histórico e restauração

Cada registro mostra tipo, versão, status, autor, revisor, decisão, publicador, datas, hash e indicação textual da versão pública atual. O detalhe não possui campos editáveis.

Restaurar segue exclusivamente `versão histórica → novo draft`. O novo recurso recebe ID, versão e hash novos; `review`, `approvedAt`, `publishedAt` e aprovação ficam vazios. A versão pública permanece intacta e o link “Abrir novo rascunho” leva ao editor correspondente. O draft precisa passar novamente por validação, revisão, aprovação e publicação.

### Conflitos e limites

Aprovação expirada, estado já publicado, versão/hash divergentes e concorrência resultam em 409 sem alterar status, histórico ou versão pública. “Recarregar dados” permite reinicializar o cenário. Toda a F2.2D é memória efêmera: não existe `fetch`, Axios, endpoint, banco, storage do navegador, cache real ou alteração da Home pública.

### Responsabilidades futuras

- **F3**: autenticação e autorização reais, auditoria persistida e integração com serviços, substituindo a identidade e o repositório simulados sem alterar os contratos da F2.1/F2.2.

## Verificação

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run audit:a11y
```

O E2E acessa as cinco rotas administrativas diretamente no preview, edita banner e contatos, alterna redes sociais, confirma as prévias, salva em memória, preserva alterações em 409/422 e testa responsividade. Na F2.2C ele ainda abre a fila, filtra por tipo, confirma que autor e responsável pelo envio não decidem, aprova como revisor independente, valida a justificativa dos ajustes, exercita hash divergente e conflito concorrente e confirma que a Home pública permaneceu inalterada.

O gate de acessibilidade cobre os editores, a fila, o detalhe, os diálogos de decisão e os estados administrativos em jsdom e Chrome headless. Na F2.2C a auditoria em Chrome passou de 34 para 59 cenários.
