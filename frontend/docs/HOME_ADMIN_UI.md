# F2.2A — painel administrativo e banner da Home

## Limite da entrega

A F2.2A adiciona uma interface local e demonstrativa para administrar somente o banner principal da Home. Não há API, autenticação, autorização, upload, banco, publicação ou persistência. O estado editado existe apenas na memória da página e é perdido ao recarregar.

Contatos, redes sociais, fila completa de revisão, histórico, restauração e publicação pertencem a etapas futuras e não possuem formulários nesta interface.

## Inventário inicial e estratégia de reuso

| Elemento | Implementação encontrada | Reuso na F2.2A | Alteração realizada |
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

## Execução local

```bash
cd frontend
npm install
npm run dev
```

Acesse diretamente `http://localhost:5173/admin/home`. A rota não possui link na navegação pública.

Para validar o fallback de SPA no build:

```bash
npm run build
npm run preview
```

Abra `http://localhost:4173/admin/home` diretamente ou atualize essa URL. O preview do Vite devolve a aplicação e o roteador resolve a página, sem 404 do servidor.

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

Os códigos representam contratos e estados visuais. Não existe sessão, login ou chamada HTTP por trás deles.

## Verificação

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run audit:a11y
```

O E2E acessa `/admin/home` diretamente no preview, edita o título, confirma a prévia, salva em memória, verifica erros simulados e testa responsividade. O gate de acessibilidade cobre a edição e os estados administrativos em jsdom e Chrome headless.
