# Spec — Dados iniciais de equipamentos e conta de teste

**Status:** aprovada em 09/11/2026; revisão de ordem proposta em 11/11/2026
**Vínculo:** prática SDD; `docs/prd.md`; `docs/adr/001-stack.md`;
`docs/specs/002-modelo-dados/spec.md` e `docs/specs/003-sistema-funcional/spec.md`.

## Objetivo

Preparar os 12 equipamentos com fotos revisadas e a conta de Marcelo Grilo,
de modo que o operador possa reproduzir os dados localmente e publicá-los em
produção sem duplicação.

## Decisões do time

- A lista de patrimônio, nome, categoria e busca é a de
  `.agents/skills/imagens-equipamentos/references/equipamentos.json`.
  `TI-0004` e `TI-0007` ficam em manutenção; os outros dez, inclusive
  `TI-0010`, ficam disponíveis. Esta decisão corrige a contradição entre a
  lista original e o briefing de dados iniciais.
- Todas as unidades pertencem ao tenant `suporte_ti` e têm `pickup_location`
  igual a **Help Desk**.
- A conta `marcelo.grilo@institutojef.org.br` tem nome de exibição
  **Marcelo Grilo** e papel `COLLABORATOR`. A senha é informada ao operador
  por prompt oculto durante o provisionamento; não aparece em arquivo,
  argumento de comando, log ou Git. A conta começa com zero empréstimos.
- As fotos vêm exclusivamente da API Pixabay, conforme a decisão expressa do
  time que substituiu a origem Pexels do enunciado. Cada foto requer revisão
  visual, registro de origem, fotógrafo e licença, e JPEG final de 800×600.
  `sharp` foi aprovado pelo time para o redimensionamento após o download.
- O agente prepara e verifica no Supabase **local**. Apenas o operador executa
  as etapas de escrita no banco e no Storage de produção. O pacote de operação
  deve usar os mesmos IDs, caminhos de objeto e critérios de revisão.
- Não se criam empréstimos nem se altera empréstimo existente. Reexecutar
  dados e upload com o mesmo conteúdo não cria novos equipamentos, contas,
  memberships ou objetos.

## Contrato afetado

- Equipamentos e categorias do tenant `suporte_ti`, Supabase Auth, membership
  do professor e bucket público `equipamentos`.
- O vínculo foto–equipamento é pelo patrimônio único: objeto
  `equipamentos/TI-0001.jpg` até `TI-0012.jpg`. Quando a etapa de fotos for
  retomada, o catálogo poderá derivar a URL pública do patrimônio após
  validar que o objeto aprovado existe. Até lá, a spec 004 usa ícones
  provisórios e não exige objeto no Storage. Isso evita migration apenas
  para guardar uma URL calculável.
- O manifesto de créditos guarda patrimônio, ID Pixabay, URL de origem,
  fotógrafo, licença, hash, revisão e caminho do objeto.

## Critérios de aceitação

- **CA-01:** há exatamente 12 equipamentos do tenant `suporte_ti` com os
  patrimônios e dados fixos da referência; `TI-0004` e `TI-0007` estão em
  manutenção e os outros dez disponíveis, todos com retirada em Help Desk.
- **CA-02:** cada patrimônio resolve para um JPEG público de 800×600,
  preparado pela skill a partir da API Pixabay; 12 IDs e 12 imagens finais
  são distintos e todos têm origem, fotógrafo, licença e revisão registrados.
- **CA-03:** a conta de Marcelo Grilo entra pelo login do sistema com a senha
  fornecida ao operador em prompt oculto, possui membership `COLLABORATOR`
  em `suporte_ti` e zero empréstimos; nenhuma credencial é persistida no Git.
- **CA-04:** executar o processo duas vezes com os mesmos dados preserva 12
  equipamentos, uma conta, uma membership e 12 objetos, sem duplicação nem
  alterar os hashes das fotos aprovadas.
- **CA-05:** o pacote para o operador separa preparação local e publicação;
  o agente não precisa de acesso de escrita ao Supabase do deploy.
- **CA-06:** testes nomeados por CA verificam os dados e a idempotência no
  banco local; testes, lint e build passam antes de pedir publicação.

## Fora de escopo e pendências

- Tela de catálogo, solicitação e devolução, cadastro pela interface e
  importação da planilha.
- O seed local de T03 pode preceder a revisão de fotos de T02, conforme a
  prioridade definida pelo usuário em 11/11/2026. CA-02 e a parte de fotos
  de CA-04 continuam pendentes e não bloqueiam o fluxo local da spec 004.
- Nenhuma publicação é autorizada por esta spec; a verificação de produção
  depende da execução do operador.
