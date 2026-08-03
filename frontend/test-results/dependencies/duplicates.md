# Duplicações de dependências

Auditoria em 2026-08-03 sobre `package-lock.json`, `npm ls --all --json` e `npm dedupe --dry-run`.

- `npm ls --all --json`: exit code 0, sem peer dependency inválida ou pacote ausente.
- `npm dedupe --dry-run`: exit code 0, resultado `up to date`; nenhuma alteração proposta.
- Duplicações relevantes para o bundle de produção: 0.
- Duplicações corrigidas: 0.

| Pacote | Versões | Ambiente | Causa | Decisão |
|---|---|---|---|---|
| `@emnapi/core` | 2.0.0-alpha.3 / 1.11.1 | Dev, opcional | Bindings WASM de Rolldown com faixas transitivas incompatíveis | Manter; não deduplicável com segurança |
| `@emnapi/runtime` | 2.0.0-alpha.3 / 1.11.1 | Dev, opcional | Bindings WASM de Rolldown com faixas transitivas incompatíveis | Manter; não deduplicável com segurança |
| `@emnapi/wasi-threads` | 2.0.1 / 1.2.2 | Dev, opcional | Bindings WASM de Rolldown com faixas transitivas incompatíveis | Manter; não deduplicável com segurança |
| `dom-accessibility-api` | 0.6.3 / 0.5.16 | Dev | `@testing-library/jest-dom` requer `^0.6.3`; `@testing-library/dom` requer `^0.5.9` | Manter; faixas incompatíveis e apenas testes |

As duas versões pré-release (`@emnapi/core` e `@emnapi/runtime` 2.0.0-alpha.3) são transitivas, opcionais, exclusivas da ferramenta de build e não foram declaradas diretamente pelo projeto. Nenhum `override` foi criado.
