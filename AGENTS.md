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
- `npm run build` — gera o build de produção do Next.js com Webpack.

Só registre nesta seção comandos que já tenham sido executados com sucesso neste ambiente.
O build passou numa cópia isolada sem `.env`, fora da pasta sincronizada pelo
OneDrive; nesta pasta, a limpeza de `.next` pode falhar com `EPERM`.

## Ambiente

- Banco: Supabase. O desenvolvimento acontece no banco local.
- Deploy: Vercel, ligada ao repositório remoto. Push publica.
- A configuração vem de variáveis de ambiente.
- Os arquivos `.env` e `.env.example` estão rastreados no Git; a remoção de
  eventual segredo do histórico e a rotação de credenciais cabem ao operador.
- Segredos não podem ser expostos no código cliente nem em arquivos versionados.

## Precedência

- `docs/prd.md` tem a maior precedência para requisitos e regras de negócio.
- Se uma spec de feature e o código discordarem sobre comportamento, a spec vence o código, desde que não contrarie o PRD.
- O ADR aceito orienta decisões técnicas quando o PRD e a spec não determinarem algo.
- `docs/layout.md` orienta as decisões visuais quando o PRD e a spec não determinarem algo.
- Se algo não estiver escrito em lugar nenhum ou estiver ambíguo, pergunte antes de decidir ou codificar.

## Estado atual do projeto

- Existe um scaffold Next.js com App Router, TypeScript strict, Tailwind CSS e componentes-base do shadcn/ui.
- Existem tela de login demonstrativa, shell autenticado, rotas de catálogo,
  detalhe, meus empréstimos e Operações ainda com conteúdo demonstrativo ou
  placeholders, além de testes com Vitest e Testing Library.
- Prisma possui schema e uma migration inicial; ainda não há seed nem integração
  da aplicação com Auth/banco.
- O remoto Git `origin` está configurado. Não há vínculo local em
  `.vercel/project.json` neste checkout.
- A T02 de `docs/specs/001-interface-inicial/tasks.md` tem alterações locais
  ainda não concluídas; as specs 002–005 também não estão prontas.

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
