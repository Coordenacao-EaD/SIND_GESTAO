# Política de Dependências — Frontend

## 1. Objetivo

Esta política orienta seleção, instalação, atualização, auditoria e remoção de dependências do frontend do SINDGESTÃO. Ela busca reduzir vulnerabilidades, duplicidades, licenças incompatíveis e crescimento desnecessário do bundle.

## 2. Escopo da F1

A F1 usa npm e mantém um único `package-lock.json`. Não há dependência de backend, banco, autenticação ou cliente HTTP.

Dependências diretas de produção atuais:

| Pacote | Finalidade |
|---|---|
| `react` | Componentes e estado da interface |
| `react-dom` | Renderização no navegador |
| `react-router-dom` | Rotas públicas e navegação SPA |
| `lucide-react` | Biblioteca principal de ícones |

As demais dependências diretas são ferramentas de desenvolvimento para TypeScript, Vite, lint e testes.

## 3. Regras para novas dependências

Uma nova dependência exige justificativa técnica e revisão dos seguintes pontos:

- necessidade real e impossibilidade razoável de usar recursos já presentes;
- ausência de pacote duplicado para a mesma capacidade;
- atividade e manutenção do projeto;
- vulnerabilidades conhecidas;
- licença e obrigações de distribuição;
- tamanho e impacto no bundle;
- compatibilidade com Node, React, TypeScript, Vite e ferramentas de teste;
- necessidade em produção ou somente em desenvolvimento;
- acesso a rede, storage, DOM ou dados do usuário.

Não adicionar bibliotecas “para uso futuro” sem uso atual aprovado.

## 4. Gerenciador, versões e lockfile

- npm é o gerenciador adotado.
- O registro confiável padrão é `https://registry.npmjs.org/`; pacote por URL, tarball externo, caminho local ou Git exige justificativa técnica e aprovação explícita.
- `package-lock.json` deve permanecer versionado e coerente com `package.json`.
- Validações reproduzíveis e CI devem instalar a árvore com `npm ci`; `npm install` fica reservado a mudanças deliberadas de dependências.
- Não criar `yarn.lock`, `pnpm-lock.yaml`, `bun.lock` ou lockfile adicional.
- Não usar versão `*`.
- Mudanças de dependência devem incluir a alteração correspondente do lockfile.
- Bibliotecas necessárias no bundle pertencem a `dependencies`; ferramentas de build, teste, lint, tipagem e auditoria pertencem a `devDependencies`.

Instalações e atualizações não devem ocorrer como efeito colateral de uma tarefa que não as autorizou.

## 5. Segurança e vulnerabilidades

Comandos de verificação:

```bash
npm audit
npm outdated
```

Regras:

- não executar `npm audit fix` automaticamente nem atualização forçada indiscriminada, especialmente `npm audit fix --force`;
- vulnerabilidade crítica ou alta deve bloquear a entrega até correção ou justificativa formal;
- atualizações de segurança devem ser testadas com lint, typecheck, testes e build;
- uma correção não pode introduzir pacote alternativo duplicado sem decisão explícita;
- resultados dependentes do registro npm devem registrar data e ambiente da consulta.

## 6. Licenças e origem

- Toda dependência deve vir do registro npm ou de origem formalmente aprovada.
- Licença e termos devem ser revisados antes da adoção.
- Pacotes sem licença clara ou com obrigação incompatível exigem avaliação formal.
- Código copiado de CDN, snippet ou repositório externo também precisa de origem e licença conhecidas.
- Bibliotecas da aplicação não devem ser carregadas de CDN sem decisão arquitetural e revisão de segurança.

## 7. Bundle e desempenho

Dependências de produção devem ser avaliadas no artefato final. A revisão deve considerar:

- tamanho bruto e comprimido;
- tree shaking;
- código carregado na rota inicial;
- duplicação de módulos;
- assets adicionados;
- impacto em redes e dispositivos mais lentos.

A F1 ainda não define um orçamento numérico formal de bundle. Um limite somente poderá ser adotado após medição e aprovação; não deve ser inventado por este documento.

## 8. Atualizações

- Atualizações devem ser pequenas, rastreáveis e acompanhadas por notas relevantes.
- Mudanças major exigem análise prévia de migração, compatibilidade, peer dependencies, notas de versão e regressão completa.
- Dependências só devem ser removidas após confirmar ausência de imports, uso por configuração, script npm, CLI, build, teste, E2E e auditoria.
- Após inclusão, remoção, movimentação, atualização ou deduplicação, executar `npm ci`, lint, typecheck, testes, build e as auditorias E2E/acessibilidade aplicáveis.
- O lockfile não deve ser regenerado sem necessidade.
- Atualização de ferramenta não deve ser misturada com mudança funcional não relacionada quando isso dificultar a revisão.

## 9. Duplicações e uso direto

- Revisar versões múltiplas com `npm ls --all` e `npm dedupe --dry-run`.
- Duplicações por faixas transitivas incompatíveis podem permanecer quando justificadas; não usar `overrides` para forçar compatibilidade não comprovada.
- Executar `npm dedupe` real somente quando o benefício estiver demonstrado e a regressão completa puder ser executada.
- Todo pacote importado ou executado diretamente pelo projeto deve estar declarado no grupo correto; não depender acidentalmente de pacote transitivo.

## 10. Controles atuais e futuros

Controles atuais:

- npm e um único lockfile;
- versões delimitadas, sem `*`;
- uma biblioteca principal de ícones;
- lint, typecheck e testes declarados;
- `npm audit` disponível para consulta;
- ausência de cliente HTTP sem uso.

Controles futuros, ainda não implementados:

- atualização automatizada por Dependabot ou Renovate;
- geração de SBOM;
- verificação automatizada de licenças;
- análise de dependências no pipeline;
- orçamento de bundle automatizado;
- política formal de prazo para correção por severidade.

## 11. Checklist de mudança

- [ ] A dependência é necessária para requisito atual.
- [ ] Não duplica capacidade já disponível.
- [ ] A licença foi verificada.
- [ ] Vulnerabilidades e manutenção foram avaliadas.
- [ ] O impacto no bundle foi medido quando aplicável.
- [ ] Produção e desenvolvimento foram classificados corretamente.
- [ ] `package.json` e `package-lock.json` permanecem coerentes.
- [ ] `npm ci` reproduz a instalação aprovada.
- [ ] Duplicações e dependências diretas não usadas ou implícitas foram revisadas.
- [ ] Não foi criado outro lockfile.
- [ ] Lint, typecheck, testes, build, E2E e acessibilidade aplicáveis foram executados.
- [ ] A documentação foi atualizada quando a arquitetura ou operação mudou.
