# Plano — Sistema funcional do EmpresTI

**Status:** aguardando aprovação  
**Spec:** `docs/specs/003-sistema-funcional/spec.md`  
**ADR:** `docs/adr/001-stack.md`

## Sequência

1. Preparar dados locais: concluir o seed idempotente já definido em
   `002-modelo-dados/T03`. Confirmar tenant e categorias sem criar credenciais.
2. Integrar Supabase Auth ao Next.js com `@supabase/ssr`: clientes próprios de
   navegador/servidor, cookies, renovação, login, logout e proteção de rotas.
3. Criar convite administrativo apenas no servidor, limitado a
   `COLLABORATOR` e `suporte_ti`; implementar aceite e definição de senha.
4. Criar cliente Prisma singleton e endpoint tRPC. Resolver identidade,
   membership, tenant e papel uma vez por requisição. Validar configuração no
   boot e impedir que execução local alcance host remoto.
5. Implementar Services e procedimentos tipados de catálogo e equipamentos.
   O fluxo de solicitação, a transação, o limite e o prazo seguem a spec 004.
   Devolução e Operações serão implementadas depois dessa entrega.
6. Conectar as telas ao tRPC/TanStack Query e seus formulários. Trocar números,
   filtros e mensagens fictícios por dados reais e estados vazios.
7. Verificar o fluxo completo com o Supabase local: convite, aceite, login,
   catálogo, empréstimo, devolução e cadastro por Operações; testar negativas
   de permissão, concorrência, lint e build.

## Limites operacionais

- Uma tarefa de `tasks.md` por autorização; checks e handoff após cada uma.
- Instalação de dependências requer autorização específica de
  `rules/operacao.md`. Pacotes previstos pelo ADR: `@supabase/ssr`,
  `@supabase/supabase-js`, tRPC, TanStack Query, Zod, superjson,
  React Hook Form e `zodResolver`; o adaptador de PostgreSQL necessário à
  versão instalada do Prisma será identificado antes da instalação.
- Mudança de migration exige DDL mostrado e aprovado antes da edição.
  Nenhuma mudança de schema é planejada para a primeira tarefa.
- O agente não altera `.env`, `.env.local`, `.env.example` nem Vercel enquanto
  `rules/operacao.md` proibir mudanças de variáveis. O operador deve ajustar
  essas configurações manualmente. Sem elas, não se declara o fluxo concluído.
- Não fazer commit, push ou deploy. Testes de dados usam somente o banco local.
- Não misturar os arquivos já alterados de T02/T03 da interface com commits
  das tarefas desta spec; o usuário mantém o controle dos commits.

## Dependências e riscos

- A spec 001 descreve mocks. Depois de aprovada esta spec, os comportamentos
  reais aqui definidos substituem os mocks, mantendo o layout.
- `004-solicitar-emprestimo` detalha e entrega a solicitação antes das tarefas
  de devolução e Operações desta spec.
- O `.env` versionado contém URLs e valores de conexão preenchidos; o operador
  precisa removê-lo do histórico publicado e trocar credenciais potencialmente
  expostas. O agente não manipulará o arquivo por causa da regra operacional.
- Auth convite e gravação de membership cruzam serviços diferentes. O fluxo
  deve tratar repetição e falha parcial sem conceder acesso por engano.
- O banco atual não tem tenant, usuários ou memberships; login completo só
  poderá ser verificado após seed e criação manual da primeira conta de
  Operações no Supabase local.

## Condição para iniciar código

Aprovação desta spec e deste plano. A primeira autorização cobre somente a
primeira tarefa pendente; as demais exigem autorização separada, conforme
`rules/restrictions.md`.
