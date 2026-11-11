# Pacote do operador — dados iniciais

Esta rotina tem dois destinos separados. O agente prepara e verifica somente o
Supabase local. A publicação de produção é executada pelo operador, depois de
revisar o diff, aplicar as migrations e aprovar os 12 JPEGs finais.

## Antes de executar

1. Confira os 12 itens em `.agents/skills/imagens-equipamentos/references/equipamentos.json`.
2. Confira `docs/equipment-image-credits.json` e os 12 arquivos
   `supabase/images/equipamentos/TI-0001.jpg` a `TI-0012.jpg`. Eles só existem
   depois de `validate.ps1 -Action StageLocal` e da revisão humana.
3. Execute `npm test`, `npm run lint` e `npm run build` em uma cópia fora do
   OneDrive se a limpeza de `.next` retornar `EPERM`.
4. Confirme que as migrations Prisma foram aplicadas ao destino antes da
   publicação. A rotina não cria nem altera tabelas ou policies.

## Supabase local

O seed `prisma/seed.ts` prepara tenant, categorias e equipamentos. Neste
checkout, a geração do Prisma Client por `npm run db:seed` pode falhar com
`EPERM` do OneDrive; a rotina abaixo também confere e faz upsert desses dados.
Para criar a conta de Marcelo e sua membership no Supabase **local**, o
operador executa, a partir da raiz deste worktree:

```powershell
pwsh -NoProfile -File scripts/operator-initial-data.ps1 -Target Local
```

O script usa `http://127.0.0.1:54321`, lê a chave `service_role` diretamente do
`supabase status` **local** e solicita somente a senha da conta em prompt
oculto. Ele não grava os valores em arquivo, argumento de comando, log ou Git.
A URL, a chave e a senha vivem somente no ambiente do processo filho e são
removidas ao final.

O teste automatizado `test_ca_03_ca_04_login_real_e_membership_idempotente_sem_emprestimos`
usa uma conta temporária distinta da conta de Marcelo e a remove ao final.
A conferência da conta real é feita pelo operador: entrar pelo login do sistema
e confirmar papel `COLLABORATOR` em `suporte_ti` e zero empréstimos.

## Publicação pelo operador

Após os 12 objetos locais responderem publicamente com os hashes aprovados,
o operador executa:

```powershell
pwsh -NoProfile -File scripts/operator-initial-data.ps1 -Target Production
```

O script pede a URL HTTPS do projeto, exige a confirmação `PUBLICAR` e solicita
chave `service_role` **desse mesmo projeto** e senha em prompts ocultos. Ele
confere os hashes locais antes de qualquer escrita, faz upsert dos 12
equipamentos pelo par `(tenant_id, asset_tag)`, cria ou reutiliza uma única
conta Auth e membership, confere login e zero empréstimos, e envia os 12
objetos com nomes `TI-0001.jpg` a `TI-0012.jpg` ao bucket público
`equipamentos`. Objetos existentes com hash diferente interrompem a rotina;
ela não os sobrescreve. A reexecução com os mesmos dados preserva IDs e hashes.

Se uma conta com o e-mail de Marcelo já existir, a rotina não altera sua senha.
Ela somente prossegue se a senha fornecida funcionar no login e a membership
existente corresponder ao papel e ao nome aprovados. Divergências exigem
decisão do operador antes de uma nova execução.

Depois, o operador verifica no deploy as 12 URLs públicas sob
`/storage/v1/object/public/equipamentos/`, entra com a conta real e confere
zero empréstimos. A spec 005 só pode ser declarada pronta após essa conferência
e o veredito `PRONTA` do verificador da spec.
