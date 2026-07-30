# Cadastro, Filiação e Tratamento de Dados — Página Inicial

## 1. Objetivo

Este documento define os limites da Home F1 em relação a cadastro, filiação, autenticação e tratamento de dados pessoais. Ele não estabelece decisões jurídicas para módulos futuros.

## 2. O que a Home faz

A Página Inicial:

- apresenta informações institucionais;
- exibe notícias, comunicados, transparência e documentos demonstrativos;
- apresenta atalhos e chamadas para ação;
- navega para rotas públicas;
- direciona o visitante a módulos que poderão ser implementados em outras fases.

Os conteúdos da Home são mocks tipados e configurações locais. Não há envio ou persistência.

## 3. O que a Home não faz

A Home F1 não:

- cria conta;
- autentica usuário;
- cadastra filiado;
- efetiva filiação;
- coleta documentos;
- recebe CPF ou dados bancários;
- armazena dados pessoais;
- envia formulários;
- persiste solicitações;
- cria sessão;
- concede perfil ou permissão.

Uma rota ou botão visível não significa que o processo correspondente esteja implementado.

## 4. Botão Filie-se

O botão **Filie-se**:

- navega exclusivamente para a rota React `/filie-se`;
- não utiliza `filie-se.html`;
- não cria filiação;
- não envia cadastro;
- não coleta consentimento na Home.

O processo real de filiação, seus campos, validações, documentos e decisões jurídicas pertencem ao futuro módulo de filiação e estão fora da F1.

## 5. Área do Filiado

O acesso à **Área do Filiado**:

- navega para `/area-do-filiado`;
- não autentica na Home;
- não cria nem concede sessão;
- não verifica permissões.

Autenticação, recuperação de acesso, sessão e autorização deverão pertencer ao módulo responsável por identidade e acesso.

## 6. Contato e formulários

Formulários funcionais de contato, cadastro ou filiação não pertencem à F1. Rotas relacionadas podem apresentar placeholder demonstrativo, desde que não façam envio real nem deem a entender que uma solicitação foi registrada.

Uma fase futura que introduza formulários deverá definir contrato de API, validação, segurança, privacidade, tratamento de erros e confirmação de recebimento.

## 7. Dados mockados

Regras para mocks e demonstrações:

- usar somente dados institucionais autorizados ou dados claramente fictícios;
- não usar CPF, dados bancários ou documentos reais;
- não usar telefone, e-mail ou endereço pessoal de indivíduos;
- não representar pessoas reais sem autorização;
- não simular persistência ou confirmação de cadastro;
- não incluir segredo ou dado sensível em assets.

Mocks existem para demonstração e testes. Eles não são registros de produção.

## 8. LGPD e fases futuras

As definições abaixo dependerão de análise jurídica e do módulo que efetivamente tratar dados. Elas não estão implementadas nem decididas pela F1:

- base legal e finalidade;
- consentimento, quando aplicável;
- aviso de privacidade;
- minimização e retenção;
- direitos do titular;
- compartilhamento e operadores;
- identificação do encarregado;
- registro das operações de tratamento;
- resposta a incidentes e solicitações de titulares.

Este documento não substitui orientação jurídica nem antecipa decisões ainda não aprovadas.

## 9. Responsabilidade por módulo

| Módulo | Responsabilidade |
|---|---|
| Home F1 | Conteúdo público demonstrativo e navegação; nenhum cadastro ou tratamento persistente |
| Filiação futura | Processo de solicitação/filiação, campos, documentos, consentimentos e regras próprias |
| Autenticação futura | Identidade, credenciais, sessão, recuperação de acesso e autorização |
| Atendimento futuro | Recebimento e acompanhamento de mensagens, se formalmente aprovado |
| Administrativo futuro | Gestão, revisão, aprovação, publicação e auditoria de conteúdo |

Os módulos futuros não existem na entrega F1 apenas porque suas rotas possuem placeholders.

## 10. Checklist da F1

- [ ] O botão Filie-se navega para `/filie-se`.
- [ ] A Área do Filiado navega para `/area-do-filiado`.
- [ ] Não há uso de `filie-se.html`.
- [ ] A Home não cria conta, filiação, sessão ou permissão.
- [ ] Não há formulário funcional ou envio de dados.
- [ ] Não há CPF, documento, dado bancário ou dado pessoal real nos mocks.
- [ ] Não há persistência em API, banco ou navegador.
- [ ] Placeholders não afirmam que solicitações foram registradas.
- [ ] Requisitos LGPD futuros estão identificados como futuros, não como implementados.

