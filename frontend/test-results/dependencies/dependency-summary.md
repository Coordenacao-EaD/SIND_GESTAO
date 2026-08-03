# Auditoria de governança de dependências — CT-HOM-LIB-001

Data: 2026-08-03  
Diretório auditado: `frontend/`  
Runtime: Node v24.13.1; npm 11.8.0  
Resultado do critério: **Pendente por risco residual formal de segurança**

## Resumo executivo

- Dependências diretas: 4 de produção e 13 de desenvolvimento.
- Lockfile: versão 3, 176 nós de pacotes, sendo 17 diretos e 159 transitivos.
- `npm ci`: aprovado e reproduzível. A primeira tentativa encontrou um processo Node preexistente carregando o binário Rolldown; após encerrar apenas esse processo, a instalação foi reproduzida. A repetição final também passou.
- `npm ls --depth=0`: exit code 0.
- `npm ls`: exit code 0.
- `npm ls --all --json`: exit code 0, sem dependência ausente, extraneous ou peer inválida.
- Origens: 176/176 resoluções do lock no registro oficial `https://registry.npmjs.org/`; sem `.npmrc`, Git, URL externa, pacote local, tarball privado, credencial ou caminho absoluto no lock.
- Licenças diretas: MIT (14), ISC (1), Apache-2.0 (1), MPL-2.0 (1); ausentes/desconhecidas: 0.
- Vulnerabilidades finais: critical 0, high 2, moderate 0, low 0. Ambas representam o mesmo advisory no caminho de produção `react-router-dom > react-router`.
- Duplicações multiversão: 4, todas transitivas de desenvolvimento; `npm dedupe --dry-run` retornou `up to date`.
- Dependências diretas sem uso: 0. Dependências implícitas: 0. Pacotes movidos: 0.
- Correções: faixa de Node declarada; política existente complementada; instrução E2E obsoleta corrigida. Nenhuma biblioteca foi adicionada, removida ou atualizada.

## Linha do tempo da vulnerabilidade

Na auditoria inicial, antes de qualquer instalação, `npm audit` e `npm audit --omit=dev` retornaram exit code 0 e zero achados porque `node_modules` estava divergente do lock e continha versões mais novas. O `npm ci` restaurou as versões bloqueadas e a consulta atualizada ao registro retornou 2 high, tanto na auditoria completa quanto em produção (exit code 1). Isso demonstra por que a validação oficial deve partir de `npm ci`.

| Pacote | Severidade | Direto/transitivo | Ambiente afetado | Caminho | Correção disponível | Decisão |
|---|---|---|---|---|---|---|
| `react-router-dom` 7.18.1 | High | Direto | Produção | raiz > `react-router-dom` | npm propõe 7.11.0 fora da faixa e marca `isSemVerMajor`; upstream corrige em React Router 8.3.0 | Não alterar sem autorização; risco residual formal |
| `react-router` 7.18.1 | High | Transitivo | Produção | `react-router-dom` > `react-router` | 8.3.0 | Não alcançável na arquitetura atual: advisory afeta somente APIs RSC instáveis, e a F1 é SPA cliente sem RSC/actions |

Advisory: `GHSA-qwww-vcr4-c8h2`, publicado em 2026-07-22. A classificação npm não é ocultada. Como a única versão corrigida upstream é major e a tarefa proíbe major upgrade sem autorização, a dimensão Vulnerabilidades e o CT permanecem pendentes apesar da não alcançabilidade atual.

## Dependências diretas

| Pacote | Tipo | Versão declarada | Versão instalada após `npm ci` | Uso identificado | Licença | Situação |
|---|---|---:|---:|---|---|---|
| `lucide-react` | Produção | ^1.27.0 | 1.27.0 | Ícones da UI | ISC | Conforme |
| `react` | Produção | ^19.2.7 | 19.2.8 | Componentes/hooks/contexto | MIT | Conforme |
| `react-dom` | Produção | ^19.2.7 | 19.2.8 | Renderização via `createRoot` | MIT | Conforme |
| `react-router-dom` | Produção | ^7.18.1 | 7.18.1 | Rotas e links SPA | MIT | High residual; ver seção anterior |
| `@testing-library/jest-dom` | Dev | ^7.0.0 | 7.0.0 | Setup de testes | MIT | Conforme |
| `@testing-library/react` | Dev | ^16.3.2 | 16.3.2 | Testes de componentes | MIT | Conforme |
| `@testing-library/user-event` | Dev | ^14.6.1 | 14.6.1 | Interações em testes | MIT | Conforme |
| `@types/node` | Dev | ^24.13.2 | 24.13.3 | Tipagem Node | MIT | Conforme |
| `@types/react` | Dev | ^19.2.17 | 19.2.17 | Tipagem React/JSX | MIT | Conforme |
| `@types/react-dom` | Dev | ^19.2.3 | 19.2.3 | Tipagem React DOM | MIT | Conforme |
| `@vitejs/plugin-react` | Dev | ^6.0.3 | 6.0.4 | Configuração Vite | MIT | Conforme |
| `axe-core` | Dev | 4.12.1 | 4.12.1 | Auditoria acessível | MPL-2.0 | Conforme como ferramenta dev; sem parecer jurídico |
| `jsdom` | Dev | ^29.1.1 | 29.1.1 | Ambiente Vitest | MIT | Conforme |
| `oxlint` | Dev | ^1.71.0 | 1.76.0 | Lint CLI | MIT | Conforme |
| `typescript` | Dev | ~6.0.2 | 6.0.3 | Build/typecheck | Apache-2.0 | Conforme |
| `vite` | Dev | ^8.1.1 | 8.1.5 | Dev/build/preview | MIT | Conforme |
| `vitest` | Dev | ^4.1.10 | 4.1.10 | Testes/a11y | MIT | Conforme |

Antes do `npm ci`, a instalação local possuía versões aceitas pelas faixas, porém diferentes do lock (incluindo Vite 8.2.0, plugin React 6.0.5 e lucide-react 1.28.0). Isso foi corrigido apenas em `node_modules`; manifesto e lock já eram coerentes.

## Faixas, versões e runtime

- Faixas diretas: 15 com `^`, 1 com `~` e 1 exata (`axe-core`). Wildcard, `latest`, Git, URL e faixa aberta: 0.
- Dependências diretas pré-release: 0. Dois pré-releases transitivos `@emnapi/*` são opcionais e pertencem ao Rolldown.
- Pacotes deprecated no lock: 0.
- Projeto: `engines.node = ^22.13.0 || >=24.0.0`, interseção compatível com jsdom, Vite/plugin, Vitest e Testing Library. Ambiente usado: Node 24.13.1.
- Warnings de engine: 0. Peer dependencies inválidas/ausentes: 0.
- Nove itens aparecem em `npm outdated`; nenhum foi atualizado automaticamente. TypeScript 7 é major e os demais não corrigem o advisory residual.

## Scripts npm

| Script | Comando/arquivo | Resultado da auditoria |
|---|---|---|
| `dev` | `vite` | CLI declarada; sem segredo/caminho absoluto |
| `build` | `tsc -b && vite build` | Oficial preservado; aprovado |
| `lint` | `oxlint` | CLI declarada; aprovado |
| `preview` | `vite preview` | CLI declarada |
| `audit:a11y` | Vitest + `scripts/accessibility-audit.mjs` | Arquivo existe; base URL e diretório parametrizados; aprovado com orquestração temporária |
| `typecheck` | `tsc -b` | CLI declarada; aprovado |
| `test` | `vitest run` | Aprovado, 64/64 |
| `test:e2e` | `node e2e/home.spec.ts` | Arquivo existe; inicia/encerra Vite e Chrome; aprovado, 8/8 |
| `test:watch` | `vitest` | CLI declarada; modo interativo intencional |

Não há segredo ou comando destrutivo. O E2E usa portas fixas 4182/9334 com `strictPort` e encerra processos no `finally`. O auditor axe aceita portas/URLs por argumento/ambiente; na regressão, Vite 4180 e Chrome 9333 foram temporários e encerrados.

## Integridade e origem do lock

- `lockfileVersion`: 3, compatível com npm 11.8.0.
- Manifesto e nó raiz do lock: coerentes, inclusive `engines`.
- Marcadores de merge, referência `file:`/`link:`, Git, URL privada, token, segredo e caminho absoluto: não encontrados.
- Registro configurado: `https://registry.npmjs.org/`.
- `.npmrc` no projeto: ausente.
- Resoluções oficiais: 176; outras origens: 0.
- `npm ci`: exit code 0 após a correção do processo local que mantinha um binário aberto.

## Regressão final

| Verificação | Resultado |
|---|---|
| `npm ci` | Aprovado, exit 0 |
| `npm run lint` | Aprovado, exit 0 |
| `npm run typecheck` | Aprovado, exit 0 |
| `npm run test` | 7 arquivos, 64/64 testes, exit 0 |
| `npm run build` | Vite 8.1.5, 1.836 módulos, exit 0 |
| `npm run test:e2e` | 8/8 verificações, console/page/resources sem falhas, exit 0 |
| `npm run audit:a11y -- ... --enforce` | 12 cenários, WCAG 0 e best-practice 0, exit 0 |
| `npm audit` | 2 high, exit 1 |
| `npm audit --omit=dev` | 2 high, exit 1 |
| `npm ls --depth=0` / `npm ls` | Ambos exit 0 |
| `git diff --check` | Exit 0 |
| Processos/portas temporários | Nenhum listener ou processo Node do frontend remanescente; apenas conexões `TIME_WAIT` do SO |
| `protótipo` | Sem diff; não modificado |

Não foi adicionada API, backend, banco, autenticação ou persistência. O stub `HomeHttpRepository` continua inativo e a fonte da Home permanece local.

## Matriz CT-HOM-LIB-001

| Dimensão | Resultado | Evidência | Status |
|---|---|---|---|
| Origem | Registro e 176 resoluções validados | Este relatório e lockfile | Aprovado |
| Versões | Manifesto/lock coerentes; runtime formalizado | `package.json`, `package-lock.json`, `npm outdated` | Aprovado |
| Licenças | 17 diretas e 176 nós com licença | `licenses.md` | Aprovado |
| Vulnerabilidades | 0 critical, 2 high de produção, mesmo advisory RSC não alcançável; correção requer major | `audit-full.json`, `audit-production.json` | **Pendente** |
| Duplicações | 4 transitivas dev justificadas; dry-run sem mudança | `duplicates.md` | Aprovado |
| Uso | 0 não usadas e 0 implícitas | `unused-dependencies.md` | Aprovado |
| Reprodutibilidade | `npm ci` e regressão aprovados | logs e este relatório | Aprovado |

Conclusão: a governança foi auditada e formalizada, mas o **CT-HOM-LIB-001 não pode ser aprovado enquanto permanecer o high de produção ou até haver autorização/validação de migração para uma versão corrigida**. A não alcançabilidade atual reduz exposição, mas não apaga o achado do scanner.
