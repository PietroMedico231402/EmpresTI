# Plano — Dados iniciais

**Status:** aprovado para T01 em 09/11/2026; revisão de ordem aguardando aprovação
**Spec:** `docs/specs/005-dados-iniciais/spec.md`

## Restrições

- Preservar Prisma Migrate como dono do schema e usar o schema existente.
- Usar a API Pixabay e `sharp`, aprovado pelo time para esta skill. Registrar
  `sharp` como dependência de desenvolvimento; não adicionar outra biblioteca.
- Não ler nem alterar segredos, `.env` ou Supabase remoto; o operador fornece
  chave da API e senha em prompts ocultos e executa a publicação remota.
- Não criar empréstimos. Executar uma tarefa por vez, com os checks da rule.

## Sequência

O seed de equipamentos da etapa 3 pode ser executado antes da seleção de
fotos da etapa 2 para liberar o fluxo local. A numeração das tarefas foi
preservada; a etapa 2 fica pendente e não bloqueia a spec 004.

1. Corrigir a skill para usar `sharp` após o download, preservar os gates de
   dimensão, origem, unicidade, crédito e revisão, e testar o processamento
   com arquivos locais de amostra. Não baixar fotos sem a chave do operador.
2. Selecionar 12 IDs distintos pela API, preparar e revisar visualmente cada
   JPEG final; registrar inclusive os candidatos reprovados e seus motivos.
   Fazer estágio idempotente no bucket público **local**.
3. Criar seed idempotente dos equipamentos por `(tenant_id, asset_tag)`,
   associando categorias pelo nome. O nome estável do objeto é derivado do
   patrimônio. Não criar empréstimos. Testar duas execuções no banco local.
4. Preparar procedimento separado para o operador provisionar a identidade
   via Supabase Auth, membership e objetos no deploy, com senha em prompt
   oculto e recusa de sobrescrever hashes divergentes. O agente não executa
   esse procedimento contra o remoto.
5. Rodar testes, lint, build e inspeção do Git; solicitar verificação ao
   subagente depois de todas as tarefas e dos commits do usuário. Uma prova
   em produção depende da execução e conferência do operador.

## Por que esta forma

O patrimônio já é único no tenant e define o nome do objeto. Guardar uma URL
derivável no schema exigiria migration sem acrescentar identidade à foto. O
manifesto e o hash preservam a prova da imagem aprovada. A publicação por
operador mantém o agente sem credenciais de escrita em produção.

## Condição para executar

A spec, o plano, `sharp` e a execução da T01 foram aprovados pelo time. O seed
local da T03 foi autorizado e executado depois, sem fotos. Cada nova tarefa
continua exigindo autorização própria após os checks da anterior.
