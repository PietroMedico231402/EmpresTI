# EmpresTI

Sistema web interno para controlar empréstimos de equipamentos usados por colaboradores e pela equipe de Operações.
Negócio em `docs/prd.md`. Stack decidida em `docs/adr/001-stack.md`.

## Onde olhar

- `docs/prd.md` — o que o negócio precisa. Não é uma spec e tem a maior precedência.
- `docs/adr/` — decisões técnicas já tomadas e os motivos delas.
- `docs/layout.md` — regras visuais, componentes e telas do produto.
- `docs/specs/<NNN-funcionalidade>/` — spec, plano e tarefas de cada feature, quando essa estrutura existir.
- `rules/` — como se trabalha aqui, quando essa estrutura existir. Leia `rules/restrictions.md` sempre que o arquivo estiver disponível.
- Ignore `docs/stack_H.md`; ele é um rascunho histórico.

## Comandos

- `npm run lint` — valida o código com ESLint.
- `npm test` — executa os testes uma vez com Vitest.
- `npm run build` — gera o build de produção do Next.js.

Só registre nesta seção comandos que já tenham sido executados com sucesso neste ambiente.

## Ambiente

- Banco: Supabase. O desenvolvimento acontece no banco local.
- Deploy: Vercel, ligada ao repositório remoto. Push publica.
- A configuração vem de variáveis de ambiente.
- O arquivo `.env` existe localmente, mas `.env.example` ainda não existe.
- Segredos não podem ser expostos no código cliente nem em arquivos versionados.

## Precedência

- `docs/prd.md` tem a maior precedência para requisitos e regras de negócio.
- Se uma spec de feature e o código discordarem sobre comportamento, a spec vence o código, desde que não contrarie o PRD.
- O ADR aceito orienta decisões técnicas quando o PRD e a spec não determinarem algo.
- `docs/layout.md` orienta as decisões visuais quando o PRD e a spec não determinarem algo.
- Se algo não estiver escrito em lugar nenhum ou estiver ambíguo, pergunte antes de decidir ou codificar.

## Estado atual do projeto

- Existe um scaffold Next.js com App Router, TypeScript strict, Tailwind CSS e componentes-base do shadcn/ui.
- Existe configuração de Vitest e Testing Library com um teste do componente Button.
- A interface das telas ainda não foi implementada; a execução parou ao concluir a T01 de `docs/specs/001-interface-inicial/tasks.md`.
- Ainda não existem integrações, acesso a banco, migrations nem `.env.example`.
- Existem `docs/specs/` e `rules/`.
- Este checkout ainda não possui remoto Git configurado nem vínculo local em `.vercel/project.json`.

## Procedimentos

- Leia `rules/restrictions.md` e a regra acionada pela tarefa.
- Antes de dizer que uma tarefa ou spec está pronta, siga `rules/checks.md`
  e `rules/spec-flow.md`.
## Subagentes
- Ficam em agents/<nome>.md. O frontmatter diz quando delegar; o
  corpo é a instrução completa do subagente.
- Subagente não herda esta conversa: ao delegar, passe tudo que o
  arquivo dele pede como entrada.
- Se o harness não tiver subagentes, abra uma sessão nova e comece
  com: "Aja conforme agents/<nome>.md." e as entradas pedidas.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
