# Entrega da prática — EmpresTI

**Estado em 09/11/2026:** relatório factual em preparação. As specs da prática
(`005-dados-iniciais` e `004-solicitar-emprestimo`) ainda não estão concluídas,
e as provas de verificação pedidas na seção 6 ainda não existem.
`sem commit` significa alteração presente apenas no checkout; não atribui a
ela um commit que ainda não existe.

## Links

- Repositório: [PietroMedico231402/EmpresTI](https://github.com/PietroMedico231402/EmpresTI). Este checkout é um monolito Next.js; não há dois repositórios REST, back e front, configurados aqui.
- Produção (Vercel): [empres-ti-xi.vercel.app/login](https://empres-ti-xi.vercel.app/login),
  URL informada pelo time e aberta no navegador em 09/11/2026. A tela de
  login ainda mostra **3 itens por pessoa** e **14 dias de prazo**; portanto,
  ela não demonstra a regra nova de 5 itens e 14 dias úteis. A conexão Vercel
  retornou 403 para a equipe vinculada, então não foi possível relacionar
  essa página a um commit ou deployment específico.

## 1. Conflitos: o que foi pedido contra o que já existia

| pedido | contrariava o quê | o que foi feito | por quê | onde ficou registrado | commit |
|---|---|---|---|---|---|
| Deixar o verificador corrigir um teste quando esta fosse a única falha | O papel independente do subagente e `rules/spec-flow.md` atribuem correções ao agente principal. | O atalho não foi aceito; o verificador apenas devolve CA, evidência e veredito. | Corrigir o próprio teste destruiria o contexto limpo usado para conferir a spec. | `agents/verificador-spec.md`; `rules/spec-flow.md` | `9dcad14` para a regra original; ajustes locais sem commit |
| Fotos somente da API Pixabay, embora o enunciado da prática peça Pexels | O contrato original da prática nomeia Pexels como fonte e crédito; o pedido expresso do time substituiu a fonte por Pixabay. | A skill foi escrita para Pixabay e a spec 005 registra a substituição. | A decisão expressa do time define a fonte desta entrega; misturar APIs impediria rastrear origem e licença. | `.agents/skills/imagens-equipamentos/SKILL.md`; `docs/specs/005-dados-iniciais/spec.md` | sem commit |
| Catálogo sem rodapé nem crédito visível | A decisão anterior exigia “Fotos: Pixabay” na tela. | A spec 004 registra o catálogo limpo, e o gate de crédito visível foi retirado da skill e do validador. | O catálogo exibe fotos já selecionadas e armazenadas, não resultados da busca da API; origem, fotógrafo e licença permanecem no manifesto interno. | `docs/specs/004-solicitar-emprestimo/spec.md`; `.agents/skills/imagens-equipamentos/scripts/validate.ps1` | sem commit |
| `TI-0010` em manutenção na lista fixa | O briefing de dados iniciais dizia que só `TI-0004` e `TI-0007` estavam em manutenção e que havia dez disponíveis. | O time confirmou `TI-0010` disponível; a referência da skill e a spec 005 foram corrigidas. | Preservar a contagem e a situação escolhidas pelo time. | `.agents/skills/imagens-equipamentos/references/equipamentos.json`; `docs/specs/005-dados-iniciais/spec.md` | sem commit |
| Cinco empréstimos e 14 dias úteis | PRD, specs 001–003, layout e trigger da migration usavam três itens e 14 dias corridos; o login em produção ainda mostra 3 itens e “14 dias”. | Após confirmação do time, PRD e specs foram ajustados; a spec 004 propõe nova migration. Nenhuma migration foi criada ou aplicada; a produção ainda mostra 3/14. | O briefing novo altera a regra de negócio; o trigger existente ainda impede implementá-la corretamente. | `docs/prd.md`, `docs/layout.md`, `docs/specs/001-interface-inicial/spec.md`, `docs/specs/002-modelo-dados/spec.md`, `docs/specs/003-sistema-funcional/spec.md`, `docs/specs/004-solicitar-emprestimo/` | sem commit |
| Senha do professor escrita no arquivo de seed | `rules/operacao.md` e `rules/secrets.md` proíbem segredos em código ou Git. | O time escolheu prompt oculto ao operador. O provisionamento ainda não existe. | Evitar credencial versionada e exposta. | `docs/specs/005-dados-iniciais/spec.md` | sem commit |
| Instalar `sharp` para redimensionar imagens | `rules/restrictions.md` exige decisão antes de biblioteca fora do ADR-001; a primeira versão da skill usava `System.Drawing`. | O time aprovou `sharp`; a T01 da spec 005 declarou a dependência direta e converteu o processamento. Testes, lint e build passaram no checkout isolado; a T01 ainda não foi encerrada formalmente. | O processamento precisa ocorrer após download e garantir 800×600; a exceção foi limitada à skill. | `docs/specs/005-dados-iniciais/plan.md`; `package.json`; `.agents/skills/imagens-equipamentos/scripts/image.mjs` | sem commit; T01 não concluída |
| Popular dados e imagens no sistema em produção | `rules/restrictions.md` restringe o agente ao banco local e veda Supabase remoto de produção. | O plano 005 separa pacote local e execução pelo operador; pacote e execução ainda não existem. | Respeitar a fronteira operacional do projeto. | `docs/specs/005-dados-iniciais/spec.md`, `plan.md` | sem commit |
| Entrega “turma REST: back e front” | ADR-001 escolhe monolito Next.js com tRPC, em um repositório. | Não houve migração de arquitetura nem criação de back/front separados. | A decisão técnica vigente continua sendo o ADR-001; a exigência de dois repositórios precisa de decisão do time se for obrigatória para esta turma. | `docs/adr/001-stack.md` | `298bec0` (ADR-001) |
| Devolução e tela de Operações fora do briefing de solicitação | O PRD as inclui na primeira versão e a spec 003 as planeja. | A spec 004 limita **esta entrega** à solicitação; a spec 003 conserva devolução e Operações como etapas posteriores. | “Fora de escopo” foi aplicado à entrega atual, sem apagar requisitos do produto. | `docs/specs/004-solicitar-emprestimo/spec.md`; `docs/specs/003-sistema-funcional/tasks.md` | sem commit |

## 1b. Lacunas: o que foi pedido de forma incompleta

| spec | o que faltava | alternativas | decisão | por quê | commit |
|---|---|---|---|---|---|
| `005-dados-iniciais` | Local de retirada obrigatório no schema, ausente da lista. | Informar um local por item; usar um local comum. | O time definiu **Help Desk** para os 12. | Atende ao campo obrigatório sem inventar locais diferentes. | sem commit; `spec.md` |
| `005-dados-iniciais` | Papel e nome de exibição do professor. | `COLLABORATOR` ou `OPERATIONS`; nome a confirmar. | O time definiu `COLLABORATOR` e **Marcelo Grilo**. | A conta é para testar o fluxo do colaborador; `display_name` é obrigatório. | sem commit; `spec.md` |
| `005-dados-iniciais` | Como prover a senha sem colocá-la no arquivo. | Valor no seed; variável de ambiente; prompt oculto ao operador. | O time escolheu prompt oculto e pacote para execução pelo operador. | Não versionar segredo. | sem commit; `spec.md` |
| `004-solicitar-emprestimo` | Quais dias não contam nos 14 dias úteis. | Apenas fins de semana; também feriados nacionais; também feriados locais. | O time escolheu fins de semana e feriados nacionais do Brasil. | Regra explícita para o cálculo. | sem commit; `spec.md` |
| `004-solicitar-emprestimo` | Fuso e instante de vencimento. | Mesmo horário do pedido; fim do dia em São Paulo; outro. | O time escolheu o fim do minuto 23h59 em São Paulo. | Torna verificável quando começa o atraso. | sem commit; `spec.md` |
| `004-solicitar-emprestimo` | Se o dia da solicitação entra na contagem. | Contar se útil; começar no próximo dia útil. | O agente assumiu a segunda opção; na revisão, pediu confirmação e o time a confirmou. | Evitar prazo diferente conforme horário de retirada. | sem commit; `spec.md` |
| `004-solicitar-emprestimo` | Se “catálogo limpo” excluía busca e filtros. | Manter ambos fora dos cards; retirar ambos; manter só busca. | O time manteve busca e filtros fora dos cards. | Preserva descoberta sem adicionar rodapé aos cards. | sem commit; `spec.md` |

## 2. Onde o agente tentou decidir por você

Ao escrever a spec 004, o agente tomou como certo que **o dia da solicitação
não contaria** entre os 14 dias úteis. O briefing não dizia isso. A revisão da
spec revelou a suposição; o agente perguntou ao time, que confirmou a contagem
a partir do próximo dia útil. A decisão está na spec 004. Nenhum código de
cálculo foi escrito antes dessa confirmação.

## 3. Uma decisão que merece (ou não) um ADR

**Usar `sharp` ou manter `System.Drawing` na preparação das fotos.** As duas
alternativas conseguem gerar 800×600; a primeira acompanha o ecossistema
Node do projeto, e a segunda já estava no script PowerShell. O time escolheu
`sharp` após identificar a divergência. A decisão ficou no plano da spec 005,
sem novo ADR: afeta apenas o processamento da skill, não a arquitetura do
sistema. O plano foi aprovado e a conversão foi feita. O build passou em uma
cópia isolada do checkout.

## 4. A skill imagens-equipamentos

- `SKILL.md` contém o gatilho, os limites, a ordem de trabalho e os pontos de
  revisão humana. `references/equipamentos.json` guarda os 12 dados fixos para
  não repetir a lista em instruções e scripts. `scripts/pixabay.ps1` consulta
  a API; `scripts/image.mjs` processa os JPEGs com `sharp`, e
  `scripts/validate.ps1` confere artefatos e faz o estágio no Storage
  **local**. O critério foi deixar orientação no texto,
  dados estáveis na referência e verificações repetíveis nos scripts. A
  referência externa é a [documentação da API Pixabay](https://pixabay.com/api/docs/)
  e seus [termos de licença](https://pixabay.com/service/terms/).
- O código atual restringe os hosts de origem a Pixabay, recorta e redimensiona para
  800×600, rejeita IDs e hashes repetidos, confere manifesto, licença declarada,
  revisão e objetos públicos locais. A ausência de pessoa, marca/logo legível,
  texto e tela com conteúdo depende de inspeção visual humana e dos campos
  assinados no `review.json`. Fotos semanticamente iguais com bytes distintos
  também dependem dessa revisão.
- Os scripts só preparam arquivos temporários e fazem estágio em
  `supabase/images/equipamentos/`; `VerifyLocal` consulta `127.0.0.1`.
  `rules/restrictions.md` proíbe o agente de enviar ao Supabase de produção.
  Isso é uma barreira de procedimento e de escopo do script, **não** uma
  garantia de sandbox somente leitura para toda credencial de produção.
- **Fotos reprovadas:** contagem não apurada. Nenhuma seleção de 12 fotos,
  `review.json` preenchido ou revisão visual foi encontrada no projeto.
- **Lacuna atual:** o gate de crédito visível foi removido e a skill usa
  `sharp`. Testes locais com arquivos de amostra aprovaram JPEG 800×600 e
  recusaram ID/hash repetido, revisão incompleta e dimensão incorreta. A
  dependência foi declarada usando a cópia já instalada pelo Next.js, porque
  o registry npm estava inacessível (`ENOTFOUND`). Não há fotos selecionadas
  nem publicadas. A fonte Open Sans foi incorporada como arquivo local e o
  build passou em uma cópia isolada do checkout, sem arquivos `.env`.

## 5. O subagente verificador

- O gatilho em `rules/spec-flow.md` é depois de todas as tarefas de uma spec e
  antes de chamá-la pronta; também pode ser acionado por pedido expresso de
  revisão. Assim ele verifica uma implementação completa, sem bloquear cada
  pequena tarefa.
- `agents/verificador-spec.md` exige o caminho da spec e o intervalo de commits
  ou arquivos. Ele manda ler `AGENTS.md`, `rules/restrictions.md`,
  `rules/operacao.md`, `rules/secrets.md`, `rules/checks.md`,
  `rules/tests.md`, `spec.md`, `plan.md` e `tasks.md` nessa ordem. O objetivo é
  avaliar os critérios escritos e os testes, sem depender
  das justificativas da conversa de quem implementou.
- O harness contém `.codex/agents/verificador-spec.toml`, criado no commit
  `9dcad14`, com instruções que proíbem editar, corrigir e commitar. A revisão
  local desabilitou `apps`, `plugins`, `memories` e pedidos de ampliação de
  permissão para o verificador; ele conserva o shell para os checks. O arquivo
  **não prova bloqueio técnico de escrita no workspace**. A
  [documentação oficial de subagentes do Codex](https://learn.chatgpt.com/docs/agent-configuration/subagents)
  informa que eles herdam sandbox e aprovações da sessão principal e que um
  arquivo TOML não cria sandbox próprio de leitura. O verificador só deverá
  rodar quando o ambiente de testes for comprovadamente local. Os comandos
  de teste e build podem gerar artefatos ignorados, sem alterar código.
- Este projeto é monolito. O verificador deve conferir tela, API e banco no
  mesmo checkout. `OUTRO REPOSITÓRIO` não substitui prova de CA aqui.

## 6. O verificador em ação

| prova pedida | estado observado |
|---|---|
| Rodadas reais que reprovaram um CA, causa e correção | Nenhuma rodada registrada no repositório ou nesta execução; não há CA/correção a atribuir. |
| Erro plantado, tabela devolvida e reversão com dois commits | Não realizado. Não existem os dois commits nem a tabela; o agente não faz commits por `rules/operacao.md`. |
| Tabela final da spec 005 | Indisponível: a spec e o plano foram aprovados, mas seed, fotos e testes de integração ainda faltam. O build do checkout isolado passou; não houve veredito do subagente. |
| Tabela final da spec 004 | Indisponível: spec e plano ainda são propostas; não há migration nova nem implementação. |

Essas linhas **não são tabelas de verificação**. Não devem ser apresentadas
como `Veredito: PRONTA` ou como prova de erro plantado.

## 7. Uma regra sua que esta prática pôs à prova

`rules/checks.md` ainda mandava rodar `<COMANDO-TESTES>` e
`<COMANDO-BUILD>`, além de `supabase db reset`. Os placeholders não davam ao
verificador comandos executáveis; o reset contrariava o ADR-001, que entrega
as migrations ao Prisma. Corrigi a rule para `npm test`, `npm run lint`,
`npm run build` e `npx prisma migrate reset --force` apenas quando a tarefa
tocou em migration e o destino local foi confirmado. Corrigi também o
ponteiro `rules/check.md` em `rules/spec-flow.md`. As alterações não têm commit.
Também ajustei `rules/secrets.md`: ela mandava o agente configurar três
destinos de variáveis, embora `rules/operacao.md` lhe proíba alterar segredos
ou variáveis. Agora a rule manda identificar o que o operador precisa fazer,
sem declarar configuração inexistente como pronta.

## 8. O que ficou de fora e o que faria diferente

Faltam a conclusão da interface e dos seeds, a conta de teste, as 12 fotos
selecionadas e revisadas, o bucket público local validado, a migration de dias
úteis aprovada/aplicada, Auth/API/catalogação reais, e os testes de
concorrência. A T02 da interface tem mudanças locais; testes, lint e build
passaram em cópia isolada, mas a tarefa ainda não foi declarada pronta. Faltam
também a publicação da regra nova na produção verificada, a revisão da
skill e da interface, rodadas do verificador e a prova com erro
plantado. O
arquivo `.env` está rastreado no Git desde `298bec0`; as regras do projeto
proíbem o agente de alterar segredos, então a remoção do histórico e eventual
rotação de credenciais cabem ao operador.

Na próxima execução, fecharia cada tarefa com checks e commit do usuário antes
de iniciar a seguinte; prepararia imagens e dados com revisão documentada;
executaria o verificador em contexto limpo sobre um intervalo real de commits;
e guardaria integralmente as tabelas de reprovação e aprovação. O erro plantado
seria feito em branch isolada, com commits de introdução e reversão do usuário,
sem tocar em produção.
