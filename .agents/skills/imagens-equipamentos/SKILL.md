---
name: imagens-equipamentos
description: Preparar, revisar e publicar localmente fotos dos 12 equipamentos do EmpresTI usando somente a API Pixabay. Use para criar ou substituir fotos de equipamentos, conferir créditos e validar o bucket público local; não use para logo, landing ou ilustrações.
---

# Imagens de equipamentos

Esta skill é a única rota para fotos de equipamentos. A lista fixa, inclusive nomes, categorias, situações e buscas, está em [references/equipamentos.json](references/equipamentos.json). Não altere os dados para adaptar uma foto encontrada.

## Limites

- Use exclusivamente `https://pixabay.com/api/` com uma chave gratuita do operador. Não use Pexels, bancos alternativos, scraping, imagens geradas ou arquivos já presentes como fonte de foto de equipamento. Se não houver chave, pare a aquisição; não peça que a chave seja colada no chat. O operador executa as ações que pedem chave em um prompt oculto; o agente não digita, lê nem armazena esse segredo. Os scripts não a gravam.
- Leia a [documentação da API Pixabay](https://pixabay.com/api/docs/) e os [termos de licença](https://pixabay.com/service/terms/) antes de uma nova rodada. Respeite o limite de requisições e o cache de 24 horas. Baixe só candidatos selecionados; URLs de imagem do Pixabay não podem ser usadas como hotlink permanente.
- Leia `AGENTS.md`, `rules/restrictions.md`, `rules/operacao.md`, `rules/secrets.md`, `docs/prd.md` e `docs/adr/001-stack.md`. Não altere segredos nem rode comandos no Supabase remoto. Os scripts usam PowerShell 7 para a API e o estágio local; `scripts/image.mjs` usa `sharp` após o download para gerar e conferir JPEGs 800×600.
- Não publique nada no Supabase do deploy. A saída final fica em `supabase/images/equipamentos/`, para o bucket público **local** `equipamentos`; o envio a qualquer ambiente remoto é tarefa do operador. Não inclua chaves nos arquivos, no Git, nos logs ou na resposta.

## Fluxo

1. Faça inventário das referências de fotos de equipamentos em código, CSS, `public/` e dados. Identifique apenas fotos de equipamento; landing, logo e ilustrações ficam fora do escopo. Se mexer nessas outras imagens, registre a decisão. Remova referências antigas só depois que a substituição estiver pronta.
2. Para cada patrimônio, consulte os candidatos com `pwsh -File .agents/skills/imagens-equipamentos/scripts/pixabay.ps1 -Action Search -Patrimonio TI-0001` (troque o patrimônio). A busca é exatamente a do JSON. O script mostra metadados e prévias retornados pela API, sem expor a chave. Escolha uma foto distinta por item. Não faça coleta em massa.
3. Crie fora do Git um JSON de seleção com exatamente 12 objetos `{"patrimonio":"TI-0001","pixabayId":123}`. Rode `pwsh -File .agents/skills/imagens-equipamentos/scripts/pixabay.ps1 -Action Prepare -SelectionsPath <caminho>`. O script busca cada ID na API, aceita somente foto do Pixabay, baixa a imagem, recorta e grava JPEG **800×600** numa pasta temporária de revisão. IDs e hashes repetidos fazem a preparação falhar.
4. Inspecione **cada JPEG final em tamanho original**, inclusive áreas de telas e superfícies do equipamento. Uma pessoa deve confirmar que não há pessoa, marca ou logo legível, texto, tela com conteúdo nem foto repetida. Confirme a licença da foto na página de origem: `Pixabay Content License` ou `CC0 1.0` para foto publicada antes de 9 de janeiro de 2019. A API não informa a data de publicação, então não presuma a licença. Se houver dúvida, escolha outra foto.
5. Complete o `review.json` gerado na pasta temporária, com uma entrada por patrimônio: `patrimonio`, `pixabayId`, `sha256`, `reviewer`, `license`, `licenseUrl` e os booleanos `semPessoa`, `semMarcaOuLogo`, `semTexto`, `semTelaComConteudo`, `fotoDistinta`, todos verdadeiros. O hash deve corresponder ao `manifest.json` gerado pelo script. Rode `pwsh -File .agents/skills/imagens-equipamentos/scripts/validate.ps1 -Action Verify -ReviewPath <caminho>`. O verificador recusa imagem sem revisão, origem/crédito incompletos, tamanho incorreto e repetição por ID ou hash.
6. Mantenha a origem, o fotógrafo e a licença no manifesto de créditos. O catálogo funcional exibe só foto e dados do equipamento, sem rodapé ou crédito visível, conforme a decisão registrada em `docs/specs/004-solicitar-emprestimo/spec.md`. Não apresente resultados da busca da API diretamente nessa tela. Resolva a integração sob a spec e o plano aplicáveis; se não houver, pare antes de integrar.
7. Configure apenas o Supabase local com o bucket público abaixo. Com revisão, verificação, manifesto interno de créditos e checks concluídos, rode `validate.ps1 -Action StageLocal -ReviewPath <caminho>`. O script usa nomes estáveis `TI-0001.jpg` etc., copia apenas se o hash coincidir ou o arquivo ainda não existir e grava o manifesto de créditos. Reinicie o Supabase **local** para carregar `objects_path` e rode `validate.ps1 -Action VerifyLocal -ReviewPath <caminho>`; só considere concluído quando os 12 URLs públicos locais responderem com os mesmos bytes.

```toml
[storage.buckets.equipamentos]
public = true
allowed_mime_types = ["image/jpeg"]
objects_path = "./images/equipamentos"
```

## Entrega

Informe os 12 patrimônios com ID Pixabay, página de origem, fotógrafo, licença, hash e URL local; o resultado da revisão, das validações 800×600/sem repetição e dos checks do projeto. Se qualquer gate falhar, não copie nem declare as fotos prontas. Relate separadamente o que o operador ainda precisa fazer para produção; nunca faça upload remoto.
