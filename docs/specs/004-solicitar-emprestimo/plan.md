# Plano — Solicitar empréstimo

**Status:** revisão aprovada em 11/11/2026
**Spec:** `docs/specs/004-solicitar-emprestimo/spec.md`  
**ADR:** `docs/adr/001-stack.md`

## Restrições e dependências

- Usar Next.js App Router, tRPC, Prisma, Supabase Auth, TanStack Query,
  TypeScript strict e Vitest definidos no ADR-001. Não escolher biblioteca
  adicional de calendário sem decisão do time.
- Depender da sessão e do contexto tenant/membership de `003/T02` e `003/T04`,
  do catálogo real de `003/T05`, do seed de `002/T03` e da conclusão de
  `005-dados-iniciais/T03` para os equipamentos locais. A revisão de fotos de
  `005/T02` fica adiada e não impede o empréstimo.
- O schema já possui `due_at` e índice único parcial por equipamento aberto.
  Uma nova migration Prisma deve substituir a função de prazo atual; a
  migration inicial publicada não será editada.
- A migration exige DDL apresentado e aprovado antes da criação, conforme
  `rules/migration.md`. Nenhum banco remoto será acessado. Instalação de
  dependências exige autorização específica de `rules/operacao.md`.
- Os arquivos da T02 da spec 001 já modificados no checkout não entram no
  commit desta entrega. Commits e pushes são feitos pelo usuário.

## Sequência

1. **Prazo no banco:** criar migration Prisma que substitui o gatilho de
   `due_at`. O cálculo parte da data local em São Paulo, avança um dia de
   cada vez e conta somente segunda a sexta que não sejam feriados nacionais.
   O calendário inclui feriados nacionais de data fixa e Paixão de Cristo;
   exclui pontos facultativos. A função grava o fim do minuto 23h59 local.
   Verificar datas próximas a fins de semana, Paixão de Cristo, virada de ano
   e horário UTC. Preservar linhas existentes.
2. **Service e procedimento:** receber apenas o identificador do equipamento;
   resolver pessoa, papel e tenant da sessão; bloquear a membership durante a
   transação; conferir estado, empréstimo aberto, limite e atraso; inserir
   empréstimo e auditoria. Converter violação do índice único em erro de
   indisponibilidade, sem vazar detalhes de outro tenant.
3. **Catálogo e confirmação:** usar a consulta real do tenant e combinar status
   operacional com empréstimo aberto. Exibir ícone provisório, nome, categoria
   e situação, com busca e filtros fora dos cards. Na página de detalhe,
   permitir confirmação apenas para item disponível; chamar `loan.request`,
   mostrar progresso, sucesso e erro, e impedir envio duplo. Não carregar
   foto não revisada nem exigir objeto no Storage. A integração futura das
   fotos segue `005-dados-iniciais` e não faz parte desta tarefa.
4. **Meus empréstimos:** apresentar lista aberta filtrada pela membership,
   com vencimento em São Paulo e estado vazio. Atualizar cache do catálogo e
   da lista após confirmação, sem simular sucesso antes da resposta da API.
5. **Verificação:** testar recusa de disponibilidade, limite e atraso, dois
   pedidos simultâneos ao mesmo item e à mesma pessoa, isolamento entre
   tenants e datas de borda. Confirmar que itens sem foto continuam visíveis
   e solicitáveis e que nenhuma imagem não revisada é carregada. Rodar
   testes, lint e build com Supabase local; conferir o diff e o escopo.

## DDL a apresentar antes da primeira tarefa

Uma nova migration deve criar uma função de identificação dos feriados
nacionais brasileiros (datas fixas e Paixão de Cristo calculada para o ano),
e substituir `public.set_loan_due_at()` para contar 14 dias úteis e gravar
`due_at` no fim do minuto 23h59 em `America/Sao_Paulo`. O gatilho
`loans_set_due_at` pode permanecer apontando para a função substituída.
Nenhuma coluna, índice, policy ou empréstimo existente será alterado.

## Condição para começar o código

1. Aprovação da revisão desta spec e deste plano para a próxima tarefa T03.
2. T01 (migration) e T02 (service/procedimento) já foram implementadas; o DDL
   da migration existente não será alterado nesta revisão.
3. Execução de uma tarefa por autorização, com checks e handoff após cada uma.
