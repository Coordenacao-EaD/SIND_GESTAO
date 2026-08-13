# Backend SINDGESTÃO — infraestrutura F3.1B2

Este diretório contém a infraestrutura PostgreSQL e as tabelas editoriais iniciais da Home. Não existe servidor HTTP, API, endpoint, autenticação, service, controller ou repository de domínio nesta fase.

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

`npm test` cobre configuração sem iniciar Docker. `npm run test:db` inicia `postgres:18.4-bookworm` sem volume, executa queries reais, valida `status/up/down/up` da migration e encerra conexão/container. Ele não lê a `DATABASE_URL` de desenvolvimento.

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

`db:status`, `db:up` e `db:down` exigem uma `DATABASE_URL` PostgreSQL explicitamente configurada. A migration timestampada em `db/migrations/` cria `app_users`, banners, contatos públicos, configurações sociais e links sociais. Reviews e versões permanecem reservadas para F3.1B3. O dbmate gera `db/schema.sql` quando executado com um `pg_dump` compatível disponível.

## Estrutura

- `src/config/`: validação tardia do ambiente;
- `src/database/`: pool, timeouts e contexto seguro para diagnóstico;
- `db/migrations/`: fonte SQL versionada das alterações estruturais;
- `test/config/`: testes sem banco;
- `test/database/`: configuração e PostgreSQL real efêmero;
- `test-results/`: relatórios da fase.

`app_users` é somente a âncora UUID mínima das FKs editoriais, sem credenciais, roles, sessão ou seed de produção. Fastify permanece reservado para F3.3 e não está instalado.
