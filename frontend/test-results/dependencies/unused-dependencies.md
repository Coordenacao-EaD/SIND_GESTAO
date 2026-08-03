# Uso, dependências não utilizadas e implícitas

Foram pesquisados imports em `src`, testes, `vite.config.ts`, `e2e`, `scripts`, configurações TypeScript e comandos de todos os scripts npm.

| Pacote | Evidência de uso | Decisão |
|---|---|---|
| `lucide-react` | Imports de ícones em componentes | Manter em `dependencies` |
| `react` | Componentes, hooks, contexto e tipos | Manter em `dependencies` |
| `react-dom` | `createRoot` em `src/main.tsx` | Manter em `dependencies` |
| `react-router-dom` | Roteador, links e navegação | Manter em `dependencies` |
| `@testing-library/jest-dom` | `src/test/setup.ts` | Manter em `devDependencies` |
| `@testing-library/react` | Imports nos testes | Manter em `devDependencies` |
| `@testing-library/user-event` | Imports nos testes | Manter em `devDependencies` |
| `@types/node` | `types: ["node"]` no tsconfig de ferramentas | Manter em `devDependencies` |
| `@types/react` | Tipagem de React/JSX e peer de ferramentas de teste | Manter em `devDependencies` |
| `@types/react-dom` | Tipagem de React DOM e peer de Testing Library | Manter em `devDependencies` |
| `@vitejs/plugin-react` | Import e uso em `vite.config.ts` | Manter em `devDependencies` |
| `axe-core` | Import no teste de acessibilidade e arquivo lido pelo auditor CDP | Manter em `devDependencies` |
| `jsdom` | Ambiente configurado no Vitest | Manter em `devDependencies` |
| `oxlint` | CLI do script `lint` | Manter em `devDependencies` |
| `typescript` | CLI dos scripts `build` e `typecheck` | Manter em `devDependencies` |
| `vite` | CLI/configuração e preview iniciado pelo E2E | Manter em `devDependencies` |
| `vitest` | CLI/imports de testes e primeira etapa de `audit:a11y` | Manter em `devDependencies` |

Resultado: dependências diretas não utilizadas = 0; pacotes usados diretamente e não declarados = 0; pacotes movidos entre grupos = 0. Imports `node:*` pertencem ao runtime Node e não são pacotes npm. Chrome é pré-requisito externo configurável por `CHROME_PATH`, não uma dependência npm.
