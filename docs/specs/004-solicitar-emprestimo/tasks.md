# Tarefas — Solicitar empréstimo

Cada tarefa cabe em um commit do usuário. Executar apenas uma por autorização,
rodar os checks e parar antes da próxima.

## T01 — Corrigir o cálculo de vencimento no banco local

**Critérios:** CA-04, CA-09  
**Pré-condição:** spec, plano e DDL aprovados; Supabase local confirmado.

- Criar uma nova migration Prisma para os feriados nacionais e 14 dias úteis.
- Manter os `due_at` existentes e validar o banco local recriado do zero.
- Testar fim de semana, Paixão de Cristo, virada de ano e instante em São Paulo.

## T02 — Criar solicitação segura e concorrente

**Critérios:** CA-02, CA-03, CA-05, CA-06, CA-09  
**Dependência:** T01 e contexto de Auth/tRPC de `003`.

- Implementar Service e procedimento com transação e bloqueio da membership.
- Criar empréstimo e auditoria apenas quando todas as regras passarem.
- Testar limite, atraso, disponibilidade, tenant e duas solicitações simultâneas.

## T03 — Exibir catálogo funcional e foto revisada

**Critérios:** CA-01, CA-03, CA-08  
**Dependência:** T02, catálogo real de `003` e fotos aprovadas em
`005-dados-iniciais`.

- Mostrar imagem, nome, categoria e situação; manter busca/filtros fora dos
  cards e retirar rodapé/crédito visível.
- Integrar somente as fotos 800×600 aprovadas, com créditos no manifesto
  interno, ajustando o gate da skill para a nova decisão visual.
- Testar estados e ausência de ação indevida.

## T04 — Exibir os empréstimos próprios em aberto

**Critérios:** CA-03, CA-07, CA-09  
**Dependência:** T02 e T03.

- Mostrar apenas os empréstimos abertos da membership e vencimento local.
- Atualizar catálogo e lista após a confirmação; cobrir estado vazio.
- Testar isolamento entre pessoas e tenants.

## T05 — Verificar o fluxo completo

**Critérios:** CA-01 a CA-09  
**Dependência:** T01 a T04.

- Exercitar catálogo → confirmação → empréstimo aberto → lista própria.
- Conferir concorrência, calendário, fotos, ausência de crédito visível,
  escopo, testes, lint, build e estado do Git.
- Passar a spec ao verificador-spec com caminho e intervalo de commits antes
  de declará-la pronta.
