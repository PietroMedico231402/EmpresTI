# Spec — Sistema funcional do EmpresTI

**Status:** proposta para aprovação  
**Origem:** `docs/prd.md`, decisões do usuário nesta conversa  
**Base técnica:** `docs/adr/001-stack.md` e `docs/specs/002-modelo-dados/spec.md`

## Objetivo

Trocar a navegação e os dados demonstrativos por autenticação, consultas e
operações reais no Supabase local. As seis telas de
`docs/specs/001-interface-inicial/spec.md` continuam como referência visual;
esta spec substitui o comportamento fictício delas após a integração.

## Decisões confirmadas

- Login com e-mail e senha pelo Supabase Auth; cadastro público fechado.
- Qualquer usuário autenticado com vínculo ao tenant pode convidar **somente
  colaboradores**. Convites para o papel de Operações não são oferecidos no app.
- A primeira conta de Operações e seu vínculo serão criados manualmente no
  Supabase **local**. O app não possui uma tela de instalação pública.
- Apenas o tenant inicial `suporte_ti` será usado nesta entrega. O modelo
  multi-tenant existente continua a filtrar e proteger todos os dados.
- As telas passam a mostrar dados reais, inclusive estados vazios.

## Fluxos

### Identidade e convite

1. Usuário com sessão válida e membership em `suporte_ti` entra no app.
2. Usuário sem sessão vai para `/login`; credenciais inválidas mostram erro sem
   revelar se o e-mail existe.
3. Usuário autenticado pode convidar um colaborador por e-mail e nome. O
   servidor cria o convite pelo Supabase Auth e o vínculo `COLLABORATOR` no
   tenant; convites duplicados ou falhas de entrega retornam erro legível.
4. O convidado abre o link do e-mail, define a senha e passa a poder entrar.
5. Usuário autenticado sem membership válida não acessa dados nem rotas
   protegidas. Sair encerra a sessão e retorna ao login.

### Catálogo e equipamentos

- Catálogo mostra equipamentos do tenant, categoria, patrimônio e
  disponibilidade calculada por estado operacional e empréstimo aberto.
- Busca e filtros usam dados reais. Item em manutenção, fora de uso ou já
  emprestado não pode ser solicitado. O detalhe usa o patrimônio da rota.
- Operações cadastra equipamentos com os campos do layout e pode escolher
  `AVAILABLE`, `MAINTENANCE` ou `RETIRED`. Colaborador não acessa a ação nem
  a mutação.

### Empréstimos e devoluções

- Solicitar um item disponível cria imediatamente o empréstimo com vencimento
  em 14 dias. O servidor bloqueia pessoa com três itens ou item em atraso.
- A criação ocorre em transação com bloqueio para o limite por pessoa, índice
  único para impedir empréstimo concorrente do mesmo equipamento e auditoria.
- Meus empréstimos mostra somente os itens e o histórico do usuário atual.
- O titular pode devolver item próprio; Operações pode registrar a devolução
  de qualquer empréstimo do tenant. Devolução preserva histórico e ator.
- A tela de Operações mostra empréstimos abertos do tenant, filtros, contagens
  e atrasos reais. Colaboradores não acessam essa tela nem seus procedimentos.

## Arquitetura e segurança

- Supabase Auth com `@supabase/ssr` e cookies; Route Handlers e proteção de
  rotas conforme o ADR. Cliente Supabase no navegador apenas para identidade.
- tRPC com `createContext` que resolve sessão, `tenant_id`, papel e Prisma.
  Procedimentos chamam Service; a Service usa Prisma e valida as regras.
- Toda consulta ou mutação recebe o tenant do contexto, nunca do cliente.
  Autorização é feita no servidor; RLS segue como defesa adicional.
- Chave administrativa usada para convites fica exclusivamente no servidor.
  Nenhuma credencial de banco ou `service_role` entra em código cliente.
- O desenvolvimento, seed, testes e verificação usam somente Supabase local.
  Nenhum comando desta spec altera Supabase remoto ou Vercel.
- A configuração de ambiente é responsabilidade do operador enquanto
  `rules/operacao.md` proibir o agente de alterá-la. O código deve recusar
  explicitamente execução local configurada para banco remoto.

## Pré-requisitos

- Concluir o seed idempotente de `002-modelo-dados` para criar `suporte_ti` e
  categorias. O banco atual tem as tabelas, mas não possui tenant nem usuários.
- Configurar as variáveis locais de Supabase Auth, Prisma e convite fora do
  repositório. Publicar apenas nomes sem valores em `.env.example`, conforme
  `rules/secrets.md`, quando a política de operação permitir.
- Corrigir o `.env` versionado com valores reais e trocar quaisquer credenciais
  comprometidas antes de usar ambiente remoto ou publicar o sistema.

## Fora de escopo

- Criação de tenants pelo app, convites para Operações, cadastro público.
- Reserva futura, notificações próprias do produto e importação da planilha.
- Deploy, alterações na Vercel e mudanças no Supabase remoto.

## Critérios de aceitação

- **CA-01:** login, renovação, logout e proteção de rotas funcionam com Auth
  local; visitante e usuário sem membership não recebem dados.
- **CA-02:** qualquer membro convida apenas colaborador para `suporte_ti`, e o
  convidado aceita, define senha e entra; erros não deixam acesso indevido.
- **CA-03:** catálogo, detalhe, busca e filtros exibem registros reais do tenant
  e disponibilidade coerente com empréstimos abertos.
- **CA-04:** solicitação respeita disponibilidade, limite de três, atraso e
  prazo de 14 dias, inclusive sob concorrência, com auditoria.
- **CA-05:** titular vê e devolve apenas os próprios itens; histórico permanece
  íntegro e registra quem fez a devolução.
- **CA-06:** Operações vê os empréstimos abertos, atrasos e contagens reais e
  pode registrar devolução de qualquer item do tenant.
- **CA-07:** só Operações cadastra equipamento; formulário persiste os campos
  do layout e reflete o estado no catálogo.
- **CA-08:** testes exercitam fluxo navegador → API → banco local, permissões
  entre usuários e tenants, estados vazios e erros; lint e build passam.
- **CA-09:** nenhuma tela usa mocks após a integração; nenhum segredo entra no
  bundle do navegador ou em novos arquivos versionados.
