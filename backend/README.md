# Backend SINDGESTÃO — infraestrutura de banco F3.1

Este diretório contém a infraestrutura PostgreSQL, as tabelas F3.1 e a primeira camada de persistência da Home. Não existe servidor HTTP, API, endpoint, autenticação, service de workflow ou controller nesta fase.

## Requisitos

- Node.js 24 LTS e npm;
- Docker (ou runtime compatível com Testcontainers) operacional para `test:db`;
- PostgreSQL local apenas se os comandos dbmate forem usados fora dos testes.

## Instalação e validações

```powershell
npm install
npm run lint
npm run typecheck
npm test
npm run test:db
npm audit
npm audit --omit=dev
```

`npm test` cobre configuração, canonicalização e SHA-256 sem iniciar Docker. `npm run test:db` inicia `postgres:18.4-bookworm` sem volume, executa as suítes F3.1 e os testes reais de repositories/transações, e encerra conexão/container. Ele não lê a `DATABASE_URL` de desenvolvimento.

## Ambiente local

Copie `.env.example` para `.env` e substitua somente por credenciais locais. `.env` é ignorado pelo Git. Nunca use credenciais institucionais em arquivo versionado ou logs.

O Compose é exclusivo para desenvolvimento manual:

```powershell
docker compose up -d postgres
docker compose down
```

O volume nomeado preserva apenas o banco local de desenvolvimento. Testes automatizados usam Testcontainers e nunca esse volume.

## Banco e migrations

O acesso futuro usa somente `pg` e SQL parametrizado (`$1`, `$2`, ...). Valores dinâmicos não podem ser interpolados no texto SQL. O pool central e seus timeouts estão em `src/database/`.

dbmate é o runner oficial. A versão 2.35.0 instalada não expõe a opção `--strict` em seu binário, apesar de referências documentais anteriores; por isso os scripts não usam uma flag inválida:

```powershell
npm run db:help
npm run db:version
npm run db:status
npm run db:up
npm run db:down
npm run db:new -- descricao_da_migration
```

`db:status`, `db:up` e `db:down` exigem uma `DATABASE_URL` PostgreSQL explicitamente configurada. As migrations timestampadas em `db/migrations/` criam `app_users`, banners, contatos públicos, configurações/links sociais, reviews com FKs reais e versões consolidadas append-only. O dbmate gera `db/schema.sql` quando executado com um `pg_dump` compatível disponível.

## Estrutura

- `src/config/`: validação tardia do ambiente;
- `src/database/`: pool, timeouts, transação explícita e contexto seguro para diagnóstico;
- `src/modules/site-home/`: tipos de persistência, repositories SQL e integridade canônica de conteúdo;
- `db/migrations/`: fonte SQL versionada das alterações estruturais;
- `test/config/`: testes sem banco;
- `test/database/`: configuração e PostgreSQL real efêmero;
- `test-results/`: relatórios da fase.

`app_users` é somente a âncora UUID mínima das FKs editoriais, sem credenciais, roles, sessão ou seed de produção. Fastify permanece reservado para F3.3 e não está instalado.

## Persistência F3.2A

Os repositories aceitam um `Pool` ou `PoolClient` explícito. `withTransaction` executa `BEGIN`, callback, `COMMIT` ou `ROLLBACK`, sempre liberando o client. Isso permite adicionar `SELECT ... FOR UPDATE` em operações concretas futuras sem criar locks ou transações globais antecipadamente.

O módulo de integridade seleciona somente campos funcionais, ordena links sociais por `display_order` e `platform`, serializa uma estrutura canônica e produz `sha256:` seguido de 64 caracteres hexadecimais minúsculos. Ele não implementa invalidação, aprovação, publicação ou restauração.

## Versionamento e restauração F3.2B

`SiteHomeVersionService` monta e valida snapshots funcionais consolidados, registra versões por meio do repository e restaura banner, contatos ou a configuração social completa como novos drafts. A restauração usa transação única e locks consultivos transacionais por entidade para reservar `version_number` sem colisões concorrentes. Ela não altera a versão histórica, o conteúdo publicado, a versão corrente nem ciclos de review.

Esta camada não implementa publicação, aprovação, invalidação, API HTTP ou autenticação. A restauração social cria uma nova configuração e novos links atomicamente; qualquer falha reverte todo o novo conjunto.
