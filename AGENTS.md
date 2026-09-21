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

Ainda não há comandos da aplicação validados nesta máquina.
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

- Existem apenas documentação, este arquivo de instruções e a configuração local de ambiente.
- Ainda não existem código de aplicação, manifesto de dependências, estrutura de pastas da aplicação, testes ou migrations.
- Ainda não existem `docs/specs/`, `rules/` nem `.env.example`.
- Este checkout ainda não possui remoto Git configurado nem vínculo local em `.vercel/project.json`.
- Nenhum comando de desenvolvimento, teste ou build foi validado nesta máquina.

## Procedimentos
