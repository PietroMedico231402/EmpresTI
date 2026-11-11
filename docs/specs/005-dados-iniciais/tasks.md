# Tarefas — Dados iniciais

Cada tarefa cabe em um commit do usuário. Executar apenas uma tarefa por
autorização e parar após os checks.

## T01 — Corrigir a skill de imagens

**Critérios:** CA-02, CA-05, CA-06  
**Pré-condição:** spec e plano aprovados.

- Instalar `sharp` e converter o processamento após download.
- Testar dimensão, formato, IDs/hashes únicos e revisão obrigatória.
- Manter o validador alinhado ao catálogo sem crédito visível.

## T02 — Selecionar e revisar as 12 fotos

**Critérios:** CA-02, CA-04

**Situação:** adiada a pedido do usuário; não bloqueia T03 nem o fluxo local
da spec 004 com ícones provisórios.

- Consultar a API Pixabay com a chave fornecida ao operador por prompt oculto.
- Revisar cada JPEG final e registrar candidatos recusados com motivo.
- Verificar 12 URLs e hashes distintos no bucket público local.

## T03 — Criar seed idempotente dos equipamentos

**Critérios:** CA-01, CA-04, CA-06  
**Dependência:** schema e seed de categorias da spec 002.

- Fazer upsert por tenant e patrimônio com os dados fixos da spec.
- Rodar duas vezes em PostgreSQL local e provar contagem, estados e ausência
  de empréstimos.

## T04 — Preparar a conta e o pacote do operador

**Critérios:** CA-03, CA-04, CA-05  
**Dependência:** integração de Auth da spec 003.

- Preparar provisionamento idempotente de Auth e membership com prompt oculto.
- Preparar instruções e artefatos para o operador publicar dados e objetos
  aprovados, sem executar contra o deploy.
- Testar login e zero empréstimos no ambiente local com conta de teste
  distinta da conta do professor; a conferência da conta real fica ao operador.

## T05 — Verificação final

**Critérios:** CA-01 a CA-06  
**Dependência:** T01 a T04.

- Rodar `npm test`, `npm run lint`, `npm run build` e conferir o Git.
- Delegar ao verificador-spec com a spec e os commits do usuário. Não declarar
  pronta sem veredito PRONTA e conferência operacional de produção.
