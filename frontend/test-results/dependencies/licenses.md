# Inventário de licenças diretas

Coleta em 2026-08-03 a partir do `package.json` local de cada pacote após `npm ci`.

| Pacote | Versão | Licença | Uso | Produção/dev | Observação |
|---|---:|---|---|---|---|
| `lucide-react` | 1.27.0 | ISC | Ícones dos componentes | Produção | Incluído no bundle por imports explícitos |
| `react` | 19.2.8 | MIT | Componentes, hooks e contexto | Produção | Runtime da UI |
| `react-dom` | 19.2.8 | MIT | `createRoot` | Produção | Renderização no navegador |
| `react-router-dom` | 7.18.1 | MIT | Rotas, links e navegação SPA | Produção | Dependência direta do bundle |
| `@testing-library/jest-dom` | 7.0.0 | MIT | Matchers configurados em `src/test/setup.ts` | Dev | Testes |
| `@testing-library/react` | 16.3.2 | MIT | Renderização e queries nos testes | Dev | Testes |
| `@testing-library/user-event` | 14.6.1 | MIT | Interações de usuário nos testes | Dev | Testes |
| `@types/node` | 24.13.3 | MIT | Tipos Node no `tsconfig.node.json` | Dev | Tipagem de configuração/ferramentas |
| `@types/react` | 19.2.17 | MIT | Tipos React/JSX | Dev | Tipagem |
| `@types/react-dom` | 19.2.3 | MIT | Tipos React DOM | Dev | Tipagem |
| `@vitejs/plugin-react` | 6.0.4 | MIT | Plugin em `vite.config.ts` | Dev | Build/desenvolvimento |
| `axe-core` | 4.12.1 | MPL-2.0 | Teste Vitest e auditoria no Chrome | Dev | Copyleft em nível de arquivo; não integra o bundle de produção. Validar obrigações se houver redistribuição modificada |
| `jsdom` | 29.1.1 | MIT | Ambiente `test.environment` do Vitest | Dev | Testes |
| `oxlint` | 1.76.0 | MIT | Script `lint` | Dev | CLI |
| `typescript` | 6.0.3 | Apache-2.0 | Scripts `build` e `typecheck` | Dev | Compilação/tipagem |
| `vite` | 8.1.5 | MIT | `dev`, `build`, `preview` e E2E | Dev | Build e servidor local |
| `vitest` | 4.1.10 | MIT | `test`, `test:watch` e `audit:a11y` | Dev | Testes |

Todas as 17 dependências diretas têm licença declarada. Distribuição dos 176 nós do lock: MIT 145, MPL-2.0 13, Apache-2.0 5, ISC 4, MIT-0 2, BSD-2-Clause 2, BSD-3-Clause 2, BlueOak-1.0.0 1, CC0-1.0 1 e 0BSD 1. Metadados de licença ausentes: 0. Pacotes marcados como deprecated no lock: 0.

Este inventário é técnico e não constitui parecer jurídico.
