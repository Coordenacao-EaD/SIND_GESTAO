# Prevenção de Injeção SQL — Separação entre Frontend e Backend

## 1. Objetivo

Este documento explica por que a F1 não executa SQL e registra regras obrigatórias para impedir que uma integração futura transfira acesso a banco para o frontend.

## 2. Situação da F1

Na F1:

- não há banco de dados;
- não há driver de banco;
- não há ORM ou query builder;
- não há string de conexão;
- não há SQL no frontend;
- não há API ativa;
- não há credencial de banco;
- o `HomeMockRepository` resolve dados locais.

O `HomeHttpRepository` é um stub sem chamada de rede. Sua existência não representa backend ou integração implementada.

## 3. Regra arquitetural

- O frontend nunca deve acessar banco diretamente.
- O bundle nunca deve receber credenciais de banco.
- O navegador deve se comunicar somente com APIs formalmente definidas.
- Apenas o backend pode acessar o banco.
- Operações de banco devem passar por serviços e repositórios do servidor.
- Validação do frontend melhora a experiência, mas não substitui validação no servidor.

Essas regras são requisitos para uma integração futura e não indicam que um backend já exista.

## 4. Práticas obrigatórias futuras

Quando houver backend, deverão ser adotados:

- consultas parametrizadas ou prepared statements;
- proibição de concatenar entrada do usuário em SQL;
- validação de tipos e limites no servidor;
- allowlist para nomes de campos, ordenação e operações não parametrizáveis;
- transações para operações que exijam atomicidade;
- credenciais com menor privilégio;
- segregação de credenciais por ambiente e serviço;
- gestão de segredos fora do código;
- erros públicos sem SQL, schema ou detalhes do banco;
- logs sem credenciais e dados sensíveis;
- testes automatizados com entradas maliciosas;
- revisão de migrations, queries manuais e permissões.

## 5. Exemplos conceituais

Exemplo inseguro — não utilizar:

```ts
const sql = `SELECT * FROM users WHERE email = '${email}'`;
```

O valor é concatenado diretamente e pode alterar a consulta.

Exemplo conceitual seguro:

```ts
const sql = "SELECT * FROM users WHERE email = ?";
const result = await database.query(sql, [email]);
```

A sintaxe exata depende do driver futuro. O requisito é separar o comando dos valores e usar a API parametrizada oficial da tecnologia escolhida.

Campos estruturais, como uma coluna de ordenação, não devem ser copiados da entrada:

```ts
const allowedOrderFields = new Set(["created_at", "name"]);
const orderBy = allowedOrderFields.has(requestedOrder) ? requestedOrder : "created_at";
```

Esses exemplos são educativos. Nenhuma biblioteca, tabela ou banco está selecionado para a F1.

## 6. Responsabilidades

| Camada | Responsabilidade futura |
|---|---|
| Frontend | Enviar dados pelo contrato da API; nunca montar SQL ou receber credencial de banco |
| API/backend | Autenticar quando necessário, autorizar, validar, parametrizar e tratar erros |
| Repositório do servidor | Encapsular acesso ao banco e aplicar a API segura do driver/ORM |
| Banco | Restringir privilégios, conexões, schemas e operações permitidas |
| Pipeline/operação | Proteger segredos, executar testes e monitorar vulnerabilidades |

## 7. Checklist da F1

- [ ] Não há SQL, driver, ORM ou query builder no frontend.
- [ ] Não há string de conexão ou credencial de banco.
- [ ] Não há chamada de API para dados da Home.
- [ ] O `HomeMockRepository` permanece como fonte local ativa.
- [ ] O stub HTTP não executa requisição.
- [ ] Nenhum exemplo documental foi copiado para código de produção.

## 8. Checklist para uma integração futura

- [ ] Backend e banco permanecem fora do bundle cliente.
- [ ] Todas as consultas usam parâmetros/prepared statements.
- [ ] Campos estruturais usam allowlist.
- [ ] Credenciais aplicam menor privilégio e segregação por ambiente.
- [ ] Erros e logs não revelam SQL, schema, credenciais ou dados sensíveis.
- [ ] Entradas maliciosas e falhas de autorização possuem testes.
- [ ] A revisão de segurança ocorre antes da ativação da API.

