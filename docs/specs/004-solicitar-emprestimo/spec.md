# Spec — Solicitar empréstimo

**Status:** proposta para aprovação  
**Origem:** briefing da turma de 9 de novembro de 2026 e `docs/prd.md`  
**Base:** `docs/adr/001-stack.md`, `002-modelo-dados`,
`003-sistema-funcional` e `005-dados-iniciais`

## Objetivo

Permitir que um colaborador autenticado consulte o catálogo e solicite um
equipamento disponível. A confirmação cria o empréstimo imediatamente, sem
aprovação de Operações ou fila de espera.

## Decisões confirmadas

- Limite de cinco empréstimos em aberto por pessoa no tenant.
- Vencimento no 14º dia útil **posterior** à data local da solicitação. O dia
  da solicitação não entra na contagem, mesmo quando for útil.
- Dia útil é segunda a sexta, excluídos os feriados nacionais brasileiros.
  Feriados estaduais/municipais e pontos facultativos não são excluídos.
  A referência é o calendário nacional divulgado oficialmente para cada ano;
  em 2026, a [Portaria MGI 11.460/2025](https://legis.sigepe.gov.br/sigepe-bgp-ws-legis/legis-service/download/?id=0026440285-ALPDF%2F2025)
  distingue feriados nacionais de pontos facultativos e inclui a Paixão de
  Cristo entre os feriados nacionais.
- O vencimento é no fim do minuto 23h59 do 14º dia útil em
  `America/Sao_Paulo`. A interface mostra a data e `23h59`; o instante salvo
  em `due_at` é 23:59:59.999999 no fuso local, convertido para `timestamptz`.
- O catálogo conserva busca e filtros fora dos cards. Cada card contém apenas
  a foto e os dados do equipamento, sem rodapé ou texto de crédito.
- As fotos são as preparadas pela skill `imagens-equipamentos`; a origem,
  autoria e licença continuam registradas no manifesto interno, sem crédito
  visível na tela. A licença de conteúdo do Pixabay dispensa atribuição pelo
  uso da foto; a API pede indicação da origem quando resultados de busca da
  própria API são exibidos. O catálogo usa arquivos já selecionados e
  armazenados no Supabase Storage, não resultados de busca da API.

## Pré-requisitos

- Sessão e membership `COLLABORATOR` válidas, conforme `003`.
- Tenant `suporte_ti` e categorias preparados conforme `002`; equipamentos
  e fotos preparados conforme `005-dados-iniciais`. A 005 é executada antes
  desta spec, apesar de seu número refletir a ordem de criação dos documentos.
  Nenhum empréstimo prévio é necessário.
- Fotos aprovadas pela skill `imagens-equipamentos`, uma por equipamento,
  800×600, com URLs estáveis no bucket público. O catálogo não usa imagens de
  outra origem.
- Nova migration Prisma aprovada e aplicada no Supabase **local** para
  substituir o gatilho atual que soma 14 dias corridos. Empréstimos existentes
  preservam o `due_at` gravado; a regra nova vale apenas para novas inserções.

## Fluxo e regras

1. O catálogo lista equipamentos do tenant com foto, nome, categoria e
   situação derivada do estado operacional e da existência de empréstimo
   aberto. Busca e filtros não alteram a autorização do servidor.
2. Equipamento `AVAILABLE` sem empréstimo aberto pode abrir a confirmação.
   Equipamento `MAINTENANCE`, `RETIRED` ou com empréstimo aberto não oferece
   ação de solicitação. O servidor rejeita pedidos forjados para esses casos.
3. Ao confirmar, o servidor usa a identidade e o tenant da sessão. Em uma
   transação, serializa pedidos da mesma membership, verifica o limite de
   cinco, verifica atraso e disponibilidade, cria o empréstimo e registra a
   auditoria. O cliente não informa borrower, tenant, papel ou vencimento.
4. O índice único parcial já existente impede dois empréstimos abertos para
   o mesmo equipamento. Se duas solicitações concorrem, apenas uma é criada;
   a outra recebe erro de indisponibilidade, sem registro de empréstimo extra.
5. Quem tem cinco empréstimos abertos ou qualquer empréstimo aberto com
   `due_at < now()` não pode criar outro. O bloqueio é revalidado no servidor
   na mesma transação, ainda que a interface mostre um estado antigo.
6. Depois da confirmação, o colaborador vê a lista dos próprios empréstimos
   em aberto, cada um com a data e hora de vencimento. Dados de outra pessoa
   ou tenant não aparecem.

## Fora de escopo desta entrega

- Devolução e histórico de devoluções.
- Tela e ações de Operações.
- Reserva com data futura, fila de espera ou aprovação de solicitação.
- Notificação por e-mail e renovação.
- Cadastro de equipamento pela interface e importação da planilha.
- Deploy, push, configuração da Vercel ou alteração do Supabase remoto.

## Critérios de aceitação

- **CA-01:** colaborador autenticado vê somente equipamentos do tenant, com
  foto, nome, categoria e situação correta; busca e filtros funcionam fora
  dos cards, que não têm rodapé ou crédito visível.
- **CA-02:** somente equipamento operacionalmente disponível e sem empréstimo
  aberto pode ser solicitado; chamadas diretas para itens emprestados, em
  manutenção, fora de uso ou de outro tenant são recusadas.
- **CA-03:** confirmar a solicitação cria imediatamente um empréstimo aberto,
  sem aprovação ou fila, e o item deixa de aparecer como disponível.
- **CA-04:** `due_at` de novo empréstimo corresponde ao fim do minuto 23h59
  do 14º dia útil posterior à solicitação em São Paulo, excluindo fins de
  semana e feriados nacionais, inclusive a Paixão de Cristo; testes cobrem
  cruzamento de mês/ano e fuso. Empréstimos antigos não são reescritos.
- **CA-05:** pessoa com cinco empréstimos abertos ou com empréstimo aberto em
  atraso não consegue solicitar outro, inclusive em pedidos concorrentes.
- **CA-06:** dois pedidos concorrentes ao mesmo equipamento criam exatamente
  um empréstimo; o perdedor recebe erro de indisponibilidade.
- **CA-07:** Meus empréstimos mostra apenas os empréstimos abertos do usuário
  atual e a data/hora de devolução prevista, com estado vazio quando cabível.
- **CA-08:** fotos vêm somente da skill `imagens-equipamentos`, com manifesto
  interno de origem, fotógrafo e licença; nenhuma foto repetida ou fora de
  800×600 chega ao catálogo.
- **CA-09:** testes nomeados por CA exercitam os fluxos com banco local,
  autorização, concorrência e cálculo de prazo; lint e build passam, sem
  alteração de banco ou serviço remoto.
