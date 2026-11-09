# Tarefas — Sistema funcional do EmpresTI

Cada tarefa cabe em um commit feito pelo usuário. O agente executa apenas uma
por autorização, roda os checks e para.

## T01 — Concluir seed local

**Critérios:** CA-03, CA-07, CA-08  
**Dependência:** `002-modelo-dados/T03`; plano aprovado.

- Criar seed idempotente de `suporte_ti` e categorias, sem usuários ou senhas.
- Executar duas vezes no Supabase local e provar ausência de duplicação.

## T02 — Sessão, login e proteção de rotas

**Critérios:** CA-01, CA-09  
**Dependência:** T01; autorização para instalar dependências do ADR.

- Integrar Auth por cookies, login, logout e renovação.
- Proteger páginas e APIs; impedir acesso de usuário sem membership.
- Testar credenciais inválidas e redirecionamento.

## T03 — Convite e aceite

**Critérios:** CA-02, CA-09  
**Dependência:** T02 e primeira conta de Operações local criada pelo operador.

- Expor convite apenas a membros autenticados, sempre com papel COLLABORATOR.
- Enviar convite por serviço de servidor e vincular ao tenant inicial.
- Criar tela de aceite e definição de senha; testar repetição e falha parcial.

## T04 — Contexto tRPC e acesso a dados

**Critérios:** CA-01, CA-08, CA-09  
**Dependência:** T02; autorização para dependências de API/Prisma.

- Criar Prisma singleton, endpoint tRPC e contexto com sessão, tenant e papel.
- Validar configuração; barrar conexão remota durante desenvolvimento local.
- Testar que input cliente não escolhe tenant nem papel.

## T05 — Catálogo e detalhe reais

**Critérios:** CA-03, CA-09  
**Dependência:** T04.

- Consultar e filtrar equipamentos por tenant e disponibilidade derivada.
- Conectar catálogo e detalhe ao banco; cobrir estados vazios e indisponíveis.

## T06 — Devolução e histórico

**Critérios:** CA-05, CA-08
**Dependência:** T05 e conclusão de `004-solicitar-emprestimo`.

- Implementar devolução do titular com auditoria e histórico íntegro.
- Conectar a ação de devolução e o histórico real.
- Testar autorização da devolução e integridade do histórico.

## T07 — Operações e cadastro

**Critérios:** CA-06, CA-07, CA-08  
**Dependência:** T06.

- Consultar empréstimos abertos e indicadores do tenant.
- Permitir devolução por Operações e cadastro de equipamento.
- Conectar filtros, tabela, formulário e estados vazios.
- Testar acesso negado a colaborador.

## T08 — Verificação integrada

**Critérios:** CA-01 a CA-09  
**Dependência:** T01 a T07, `004-solicitar-emprestimo` e configuração local feita pelo operador.

- Exercitar convite → aceite → login → catálogo → empréstimo → devolução.
- Conferir cadastro por Operações, isolamento, ausência de mocks e segredos.
- Rodar testes, lint, build e revisar o estado do Git para handoff.
