---
description: Onde cada variável de ambiente vive e qual chave usar
globs: ["**/.env*", "app/**", "components/**", "next.config.*", "prisma/**"]
alwaysApply: false
---

# Variáveis de ambiente e chaves

> Leitor: agente

## Quando

Ao criar ou usar qualquer variável de ambiente, ao instanciar o client
do banco, ou ao escrever código que lê configuração.

## Procedimento

1. Chave pública (anon): só ela pode aparecer em código que roda no
   navegador. A proteção dela são as políticas de acesso do banco.
2. Chave de serviço: ignora todas as políticas. Só em código que roda
   no servidor, nunca em componente de cliente, nunca em variável com
   prefixo público.
3. Para cada variável nova, descreva os três destinos necessários ao operador:
   `.env.local` (máquina local), `.env.example` (versionado, sem valor) e
   painel da Vercel (preview e production). A regra operacional proíbe o
   agente de alterar variáveis ou segredos nesses lugares.
4. Informe na resposta o que falta ao operador configurar; não afirme que
   a variável está pronta enquanto algum dos três destinos faltar.

## Verificação

Uma busca por "service" no código que vai para o navegador não
retorna nada. O operador confirma `.env.example` com todas as chaves
usadas pelo projeto, sem valor real, antes de publicar.

## Não faça

- Não escreva valor de chave em resposta, commit, log ou comentário.
- Não crie variável só no `.env.local`. Ela quebra o deploy e o erro
  só aparece no build da Vercel.
- Não contorne uma política de acesso trocando de chave. Se a política
  atrapalha, a política está errada — pare e me avise.
