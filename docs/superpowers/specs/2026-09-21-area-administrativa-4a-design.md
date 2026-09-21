# SIND_GESTAO — Bloco 4A: Fundação da Área Administrativa

**Data:** 21/09/2026  
**Projeto:** SIND_GESTAO — Reconstrução do Protótipo  
**Escopo de implementação:** `protótipo/`  
**Tecnologia:** HTML + CSS + JavaScript estático  
**Status:** Design aprovado para especificação

## 1. Objetivo

Construir a fundação visual e comportamental da Área Administrativa do protótipo SIND_GESTAO, sem backend, banco de dados ou autenticação real. O bloco deve estabelecer um layout administrativo reutilizável, painel inicial, navegação lateral, identificação do perfil demonstrado e representação visual de permissões.

O protótipo deve representar as regras já definidas na documentação funcional, sem reduzi-las para acomodar limitações da implementação estática.

## 2. Princípios do bloco

- Trabalhar exclusivamente dentro de `protótipo/`.
- Não criar backend fake, banco fake ou autenticação simulada como se fosse real.
- Representar visualmente o modelo `perfil-base + permissões específicas`.
- Preservar menor privilégio e segregação de funções.
- Não permitir que o perfil Administrador Geral pareça eliminar regras de segregação.
- Manter isolamento entre Conselho de Ética, Conselho Fiscal e administração geral.
- Reutilizar a paleta visual original do protótipo.
- Não criar módulos funcionais novos no Bloco 4A.

## 3. Escopo funcional do Bloco 4A

O Bloco 4A entrega somente a fundação administrativa:

- layout administrativo compartilhado;
- menu lateral;
- cabeçalho/topbar;
- painel administrativo inicial;
- seletor de perfil de demonstração;
- representação de permissões por perfil;
- persistência local do perfil de demonstração;
- responsividade desktop/mobile;
- estados visuais de acesso, bloqueio e confidencialidade.

Não fazem parte deste bloco as telas completas de Usuários, Filiados, Assembleias, Atas, Documentos, Financeiro, Solicitações, Votações, Conselhos, Relatórios ou Configurações. Essas telas serão implementadas nos blocos seguintes.

## 4. Direção visual

A Área Administrativa terá identidade de sistema de gestão, mas continuará visualmente pertencendo ao SINDPROTEC/MT.

### 4.1 Estrutura geral

- menu lateral escuro;
- área de conteúdo clara;
- topbar compacta;
- área central orientada a trabalho e pendências;
- uso exclusivo da paleta já existente no protótipo;
- sem criação de nova paleta específica para Administração.

### 4.2 Desktop

Estrutura base:

```text
┌──────────────────────┬───────────────────────────────────────────┐
│                      │ Topo                                      │
│   SINPROTEC / ADM     │ Perfil em visualização: Administrador ▼  │
│                      ├───────────────────────────────────────────┤
│   Menu lateral       │                                           │
│                      │              DASHBOARD                    │
│                      │                                           │
│                      │   Cards • Pendências • Próximos eventos  │
│                      │   Atalhos • Atividade recente             │
│                      │                                           │
└──────────────────────┴───────────────────────────────────────────┘
```

### 4.3 Mobile

- menu lateral vira drawer recolhível;
- botão de menu visível no topo;
- cards passam de múltiplas colunas para duas e depois uma coluna;
- navegação deve continuar acessível por teclado;
- conteúdo não deve gerar corte horizontal indevido;
- tabelas futuras poderão usar rolagem horizontal controlada.

## 5. Navegação administrativa

A navegação será organizada por grupos para evitar uma lista longa de itens sem hierarquia.

```text
Painel

PESSOAS
Usuários e permissões
Filiados
Solicitações de filiação

GESTÃO INSTITUCIONAL
Assembleias e reuniões
Atas
Documentos
Notícias e comunicados
Notificações
Solicitações

FINANCEIRO
Prestação de contas

PARTICIPAÇÃO
Enquetes e votações

CONSELHOS
Conselho de Ética
Conselho Fiscal

GESTÃO
Relatórios
Configurações
```

`Solicitações de filiação` permanece funcionalmente dentro de Gestão de Filiados, mesmo podendo aparecer como item próprio de navegação administrativa.

## 6. Perfis de demonstração

O protótipo terá um seletor de perfil no topo, identificado explicitamente como recurso de demonstração.

Perfis disponíveis:

- Administrador Geral;
- Diretoria;
- Presidência;
- Tesouraria;
- Secretaria;
- Conselho de Ética;
- Conselho Fiscal.

A Presidência aparece separadamente no seletor apenas para facilitar a demonstração dos processos que dependem dessa autorização, embora conceitualmente pertença à Diretoria.

Exemplo de identificação:

```text
PERFIL DE DEMONSTRAÇÃO
Administrador Geral ▼
```

O seletor não representa login real.

## 7. Modelo visual de permissões

A interface terá três comportamentos distintos.

### 7.1 Acesso permitido

- item exibido normalmente;
- ação clicável;
- cards, atalhos e pendências pertinentes ao escopo podem ser apresentados.

### 7.2 Sem permissão

- item pode continuar visível quando for útil demonstrar a matriz de acesso;
- item fica desabilitado;
- apresenta ícone de cadeado ou outro indicador equivalente;
- texto de apoio: `Sem permissão neste perfil de demonstração`.

### 7.3 Conteúdo confidencial

- não é exibido para perfis sem autorização;
- não deve haver card, contador, resumo ou indício de demanda confidencial.

Essa regra se aplica especialmente às manifestações dos Conselhos.

## 8. Comportamento por perfil

### 8.1 Administrador Geral

Acesso administrativo amplo para gestão de usuários, permissões, configurações e demais áreas conforme escopo, mas sem quebrar segregações específicas.

Não deve receber acesso automático ao conteúdo confidencial de Conselho de Ética ou Conselho Fiscal.

### 8.2 Diretoria

Visualização institucional e acesso a filiados, assembleias, documentos, comunicados e processos conforme permissões específicas.

### 8.3 Presidência

Perfil de demonstração usado para representar ações que exigem Presidência, especialmente:

- criação/liberação de enquetes e votações;
- validação financeira cruzada quando o lançamento tiver sido realizado pela Tesouraria.

### 8.4 Tesouraria

Painel orientado ao escopo financeiro, com destaque para:

- prestação de contas;
- lançamentos e comprovantes;
- pendências de conferência/validação compatíveis com seu papel;
- relatórios financeiros quando permitidos.

### 8.5 Secretaria

Painel orientado a:

- reuniões;
- atas;
- documentos;
- cadastros;
- comunicados;
- solicitações.

### 8.6 Conselho de Ética

A interface deve mudar substancialmente e restringir a visão ao universo do Conselho de Ética.

Possíveis áreas demonstradas posteriormente:

- painel do Conselho;
- manifestações destinadas ao Conselho de Ética;
- documentos relacionados;
- histórico.

Não deve exibir conteúdo do Conselho Fiscal nem a rotina administrativa geral sem permissão específica.

### 8.7 Conselho Fiscal

Mesmo princípio do Conselho de Ética, com isolamento de conteúdo e escopo próprio.

## 9. Painel Administrativo

O painel inicial deve priorizar trabalho e pendências, evitando gráficos decorativos.

### 9.1 Resumo no topo

Cards pequenos e objetivos, variando conforme o perfil. Exemplos demonstrativos:

```text
Filiados ativos        428
Filiações pendentes      6
Solicitações abertas    12
Próximas assembleias     2
```

Esses números são dados fictícios de protótipo e devem ser tratados visualmente como demonstração.

### 9.2 Pendências que exigem ação

Área principal do painel, com itens como:

- filiações aguardando análise;
- conteúdos aguardando revisão;
- prestações de contas aguardando conferência;
- solicitações em análise;
- documentos pendentes.

Cada linha deve poder direcionar futuramente para o módulo correspondente.

Estados devem reutilizar os ciclos já definidos no projeto, sem inventar novos status.

### 9.3 Próximos eventos

Lista compacta de assembleias e reuniões próximas, com data e horário.

### 9.4 Atividade recente

Registro visual de ações recentes, por exemplo:

- ata atualizada;
- solicitação respondida;
- comunicado publicado;
- prestação de contas enviada para conferência.

No Bloco 4A, a atividade é demonstrativa e estática.

### 9.5 Acesso rápido

Atalhos reduzidos e condicionados ao perfil, como:

- cadastrar filiado;
- criar assembleia;
- novo documento;
- novo comunicado.

### 9.6 Conselhos no painel

Demandas de Conselho de Ética ou Conselho Fiscal não aparecem no painel administrativo comum.

Quando um perfil de Conselho for selecionado, o painel deve ser substituído por uma visão compatível com aquele Conselho.

## 10. Arquitetura técnica

### 10.1 Arquivos do Bloco 4A

```text
protótipo/
│
├─ html/
│  └─ admin-painel.html
│
├─ assets/
│  ├─ css/
│  │  └─ styles.css
│  │
│  └─ js/
│     └─ area-admin.js
```

Somente um novo HTML e um novo JS serão criados neste bloco. O CSS existente será ampliado com uma seção isolada para Administração.

### 10.2 CSS

Adicionar seção claramente delimitada:

```css
/* ==================================================
   ÁREA ADMINISTRATIVA
   ================================================== */
```

Usar seletores específicos, por exemplo:

```text
.admin-page
.admin-shell
.admin-sidebar
.admin-topbar
.admin-workspace
.admin-main
.admin-dashboard
```

Evitar seletores genéricos que possam alterar Área Pública ou Área do Filiado.

### 10.3 `area-admin.js`

Responsabilidades principais:

1. montar a navegação administrativa;
2. controlar o seletor de perfil de demonstração;
3. aplicar regras visuais de permissão;
4. atualizar o conteúdo do painel conforme o perfil;
5. controlar abertura/fechamento do menu mobile;
6. persistir o perfil selecionado em `localStorage`.

### 10.4 Não usar `fetch()` para componentes compartilhados

Não criar `admin-sidebar.html`, `admin-header.html` ou fragmentos equivalentes carregados via `fetch()`.

Motivo: o protótipo deve funcionar quando aberto diretamente pelo navegador via `file://`, sem exigir servidor local.

O `area-admin.js` montará os componentes compartilhados diretamente no DOM.

### 10.5 Persistência do perfil

O perfil selecionado será salvo em `localStorage` para preservar a demonstração durante a navegação entre páginas administrativas futuras.

Essa persistência não representa sessão autenticada.

## 11. Estrutura esperada do HTML

Modelo base:

```html
<body class="admin-page">
  <a class="skip-link" href="#conteudo">Ir para o conteúdo principal</a>

  <div class="admin-shell">
    <aside class="admin-sidebar" data-admin-sidebar>
      <!-- preenchido pelo JS -->
    </aside>

    <div class="admin-workspace">
      <header class="admin-topbar" data-admin-topbar>
        <!-- preenchido pelo JS -->
      </header>

      <main id="conteudo" class="admin-main">
        <!-- conteúdo específico da página -->
      </main>
    </div>
  </div>

  <script src="../assets/js/area-admin.js" defer></script>
</body>
```

## 12. Acessibilidade e estados

O Bloco 4A deve prever:

- link de salto para conteúdo;
- foco visível por teclado;
- contraste compatível com a paleta existente;
- `aria-label` onde necessário;
- estado ativo do menu;
- item disponível;
- item sem permissão;
- item confidencial não exibido;
- estado vazio;
- menu mobile aberto/fechado;
- seletor de perfil acessível por teclado;
- sem dependência exclusiva de cor para comunicar bloqueios ou estados.

## 13. Dados demonstrativos

Os dados exibidos no painel serão estáticos e fictícios, apenas para representar os processos do sistema.

Não devem ser apresentados como dados reais do sindicato.

Quando possível, nomes e números devem ser claramente genéricos e coerentes entre si.

## 14. Critérios de validação do Bloco 4A

O bloco será considerado concluído quando:

1. `admin-painel.html` abrir e funcionar diretamente no navegador;
2. não houver dependência de backend ou servidor local;
3. a Área Administrativa permanecer dentro da paleta original;
4. desktop e mobile funcionarem adequadamente;
5. o seletor de perfil funcionar;
6. o perfil selecionado persistir via `localStorage`;
7. menu, cards, pendências e atalhos reagirem ao perfil selecionado;
8. itens sem permissão forem representados corretamente;
9. conteúdo confidencial dos Conselhos permanecer isolado;
10. nenhuma alteração quebrar Área Pública ou Área do Filiado;
11. `git diff --check` não apresentar erros;
12. todas as alterações permanecerem dentro de `protótipo/`;
13. não existir backend fake, banco fake ou autenticação fake;
14. a interface deixar explícito que o seletor é de demonstração.

## 15. Fora do escopo

Não implementar neste bloco:

- autenticação real;
- autorização real no backend;
- banco de dados;
- APIs;
- telas completas dos demais módulos;
- publicação editorial completa;
- fluxo financeiro completo;
- tratamento completo de manifestações dos Conselhos;
- relatórios analíticos;
- gráficos avançados;
- integração externa de notificações.

## 16. Continuidade após o 4A

Após concluir e validar a fundação administrativa, seguir a sequência já definida:

- **4B** — Usuários e Permissões + Filiados + Solicitações de filiação;
- **4C** — Assembleias/Reuniões + Atas + Documentos;
- **4D** — Notícias/Comunicados + Conteúdo institucional + Notificações;
- **4E** — Prestação de Contas;
- **4F** — Solicitações dos filiados;
- **4G** — Enquetes e Votações;
- **4H** — Conselhos de Ética/Fiscal;
- **4I** — Relatórios + Configurações + auditoria final.

