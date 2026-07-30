# Segurança do Frontend — Página Inicial

## 1. Objetivo

Este documento registra os controles de segurança aplicáveis à Fase F1 da Página Inicial do SINDGESTÃO. Ele diferencia o que está implementado no frontend atual, o que é uma regra de desenvolvimento e o que dependerá de infraestrutura ou módulos futuros.

## 2. Escopo atual

A F1 é um frontend público em React e TypeScript. A aplicação apresenta a Home, rotas públicas e páginas de placeholder. Os dados demonstrativos da Home são resolvidos localmente pelo `HomeMockRepository`; assets e configurações institucionais compartilhadas também são locais.

Nesta fase não existem:

- backend ou servidor próprio da aplicação;
- API de dados ativa;
- banco de dados;
- autenticação ou autorização;
- upload real;
- persistência de dados da Home;
- painel ou fluxo administrativo.

O `HomeHttpRepository` é somente um ponto de extensão não implementado. Ele não realiza requisições e não é a fonte ativa de dados.

## 3. Segredos e credenciais

O frontend não pode conter:

- senhas, tokens ou chaves privadas;
- credenciais e strings de conexão de banco;
- segredos em mocks, testes ou assets;
- credenciais incorporadas ao bundle;
- dados sensíveis em arquivos versionados.

Variáveis com prefixo `VITE_*` são incorporadas ao código cliente e podem ser lidas por quem acessa a aplicação. Portanto, elas são apropriadas apenas para configuração pública e nunca devem armazenar segredos.

Antes de uma entrega, a fonte e o bundle devem ser inspecionados para evitar publicação acidental de credenciais.

## 4. Proteção contra XSS

Controles e regras da F1:

- não utilizar `dangerouslySetInnerHTML`;
- não injetar HTML legado ou remoto;
- renderizar valores dos mocks como texto pelo React;
- não executar scripts obtidos de dados;
- não importar JavaScript da pasta `protótipo`;
- não incluir widgets ou scripts remotos sem revisão formal.

Se uma fase futura precisar exibir conteúdo rico, ela deverá adotar formato restrito, sanitização revisada e testes específicos. Essa capacidade não existe na F1.

## 5. Links externos

O componente `SafeLink` centraliza o tratamento de destinos configuráveis:

- rotas iniciadas por `/` usam o roteador da aplicação;
- destinos externos somente são acionáveis quando usam HTTPS;
- links externos usam `target="_blank"` e `rel="noopener noreferrer"`;
- destinos inválidos ou desabilitados não se tornam links acionáveis.

CTAs opcionais desabilitados do Hero não são montados. Links estáticos externos também devem seguir as mesmas regras.

## 6. Armazenamento no navegador

A F1 não utiliza, para dados da Home:

- `localStorage`;
- `sessionStorage`;
- IndexedDB;
- cookies;
- cache persistente contendo dados pessoais ou sensíveis.

Dados demonstrativos permanecem em módulos locais e em memória durante a execução. A introdução futura de armazenamento exige análise de finalidade, minimização, retenção e segurança.

## 7. Chamadas de rede

Não há chamada de API para obter ou persistir dados da Home. A fonte de negócio não invoca `fetch`, Axios, GraphQL, `XMLHttpRequest` ou WebSocket.

O navegador e o Vite podem solicitar arquivos locais necessários à aplicação, como JavaScript, CSS, imagens e fontes. Essas requisições de assets não representam integração com uma API.

## 8. Tratamento de erros

Mensagens exibidas ao público devem ser breves e não podem revelar:

- stack trace;
- caminhos locais;
- nomes de tabelas, serviços ou componentes internos;
- detalhes de implementação;
- credenciais ou tokens;
- dados pessoais.

O hook da Home converte falhas do repositório em mensagem pública genérica, e os estados de seção usam mensagens amigáveis. Informações técnicas destinadas ao desenvolvimento não devem ser incorporadas à interface de produção.

## 9. Assets e conteúdo

- Assets executados pela F1 devem ser locais ou possuir origem formalmente autorizada.
- Imagens informativas devem receber texto alternativo adequado.
- Se uma imagem falhar, o placeholder deve preservar um nome acessível equivalente sem exibir o ícone quebrado do navegador.
- Imagens decorativas devem usar alternativa vazia ou ser ocultadas da árvore de acessibilidade.
- Assets não podem conter scripts remotos, credenciais ou dados pessoais não autorizados.

## 10. Dependências

Seleção, atualização, vulnerabilidades e licenças de pacotes seguem [Política de Dependências](./DEPENDENCY_POLICY.md).

## 11. Controles futuros

Os itens abaixo não são controles implementados pela F1. Eles deverão ser definidos nas fases responsáveis por hospedagem, backend, identidade e operação:

- Content Security Policy;
- cabeçalhos HTTP de segurança;
- HSTS e redirecionamento forçado para HTTPS;
- autenticação e autorização;
- proteção contra CSRF;
- rate limiting;
- proteção e validação de APIs;
- logs e monitoramento de segurança;
- gestão centralizada de segredos;
- SAST e DAST no pipeline;
- resposta a incidentes.

Nenhum desses itens deve ser considerado entregue apenas por estar documentado aqui.

## 12. Checklist de segurança da F1

- [ ] A Home usa somente dados locais e o `HomeMockRepository` como repositório ativo.
- [ ] Não há chamada de API, cliente HTTP ou endpoint de dados.
- [ ] Não há `dangerouslySetInnerHTML` ou HTML remoto.
- [ ] Não há segredo, token, senha ou string de conexão na fonte, mocks, assets ou bundle.
- [ ] Não há armazenamento de dados pessoais em storage, IndexedDB ou cookies.
- [ ] Links externos são HTTPS e usam proteção de nova aba.
- [ ] Rotas internas usam o roteador.
- [ ] Erros públicos não revelam detalhes técnicos.
- [ ] Imagens informativas possuem alternativa e fallback acessível.
- [ ] Dependências foram revisadas conforme a política do projeto.
- [ ] Lint, typecheck e testes existentes terminam com sucesso.

