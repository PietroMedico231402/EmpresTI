[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('Verify', 'StageLocal', 'VerifyLocal')]
    [string]$Action,
    [string]$ReviewPath,
    [string]$ReviewRoot = (Join-Path ([IO.Path]::GetTempPath()) 'EmpresTI-image-review')
)

$ErrorActionPreference = 'Stop'

$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../../..'))
$skillRoot = Split-Path $PSScriptRoot -Parent
$fixed = @(Get-Content -LiteralPath (Join-Path $skillRoot 'references/equipamentos.json') -Raw -Encoding utf8 | ConvertFrom-Json)
$reviewRoot = $ReviewRoot
$manifestPath = Join-Path $reviewRoot 'manifest.json'
$storageDir = Join-Path $projectRoot 'supabase/images/equipamentos'
$creditsPath = Join-Path $projectRoot 'docs/equipment-image-credits.json'
$configPath = Join-Path $projectRoot 'supabase/config.toml'

function Assert-PixabayPage([string]$Value) {
    $parsed = $null
    if (-not [uri]::TryCreate($Value, [UriKind]::Absolute, [ref]$parsed)) { throw 'Página de origem inválida.' }
    if ($parsed.Scheme -ne 'https' -or $parsed.Host -ne 'pixabay.com') { throw 'Página de origem fora do Pixabay.' }
}

function Assert-LocalStorageConfig {
    $config = Get-Content -LiteralPath $configPath -Raw -Encoding utf8
    $section = [regex]::Match($config, '(?ms)^\[storage\.buckets\.equipamentos\]\s*$(.*?)(?=^\[|\z)')
    if (-not $section.Success -or $section.Groups[1].Value -notmatch '(?m)^public\s*=\s*true\s*$' -or $section.Groups[1].Value -notmatch '(?m)^allowed_mime_types\s*=\s*\["image/jpeg"\]\s*$' -or $section.Groups[1].Value -notmatch '(?m)^objects_path\s*=\s*"\./images/equipamentos"\s*$') {
        throw 'Configure o bucket público local equipamentos em supabase/config.toml conforme SKILL.md.'
    }
}

if (-not $ReviewPath) { throw 'Informe -ReviewPath para o review.json aprovado.' }
$manifest = @(Get-Content -LiteralPath $manifestPath -Raw -Encoding utf8 | ConvertFrom-Json)
$review = @(Get-Content -LiteralPath $ReviewPath -Raw -Encoding utf8 | ConvertFrom-Json)
if ($manifest.Count -ne $fixed.Count -or $review.Count -ne $fixed.Count) { throw 'Manifesto e revisão devem conter exatamente 12 fotos.' }

$ids = [Collections.Generic.HashSet[int]]::new()
$hashes = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$credits = @()
foreach ($item in $fixed) {
    $row = @($manifest | Where-Object patrimonio -EQ $item.patrimonio)
    $approval = @($review | Where-Object patrimonio -EQ $item.patrimonio)
    if ($row.Count -ne 1 -or $approval.Count -ne 1) { throw "Manifesto ou revisão ausente para $($item.patrimonio)." }
    $row = $row[0]
    $approval = $approval[0]
    foreach ($field in @('nome', 'categoria', 'situacao', 'busca')) {
        if ($row.$field -cne $item.$field) { throw "Os dados fixos de $($item.patrimonio) foram alterados." }
    }
    if (-not $ids.Add([int]$row.pixabayId)) { throw 'ID Pixabay duplicado.' }
    if (-not $row.photographer -or -not $row.photographerId) { throw "Fotógrafo não registrado para $($item.patrimonio)." }
    Assert-PixabayPage $row.sourcePage
    if ($row.imageFile -cne "$($item.patrimonio).jpg") { throw "Nome de arquivo inválido para $($item.patrimonio)." }
    $file = Join-Path $reviewRoot $row.imageFile
    if (-not (Test-Path -LiteralPath $file)) { throw "Foto ausente: $($item.patrimonio)." }
    $hash = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($hash -cne $row.sha256 -or $hash -cne $approval.sha256) { throw "Hash de $($item.patrimonio) não corresponde à revisão." }
    if (-not $hashes.Add($hash)) { throw 'Foto final repetida por hash.' }
    $imageTool = Join-Path $PSScriptRoot 'image.mjs'
    $metadataJson = & node $imageTool inspect $file
    if ($LASTEXITCODE -ne 0) { throw "Não foi possível inspecionar a foto de $($item.patrimonio) com sharp." }
    $metadata = $metadataJson | ConvertFrom-Json
    if ($metadata.width -ne 800 -or $metadata.height -ne 600 -or $metadata.format -ne 'jpeg') {
        throw "Foto de $($item.patrimonio) não é JPEG 800×600."
    }
    if ($approval.pixabayId -ne $row.pixabayId -or [string]::IsNullOrWhiteSpace($approval.reviewer)) { throw "Revisão inválida para $($item.patrimonio)." }
    foreach ($flag in @('semPessoa', 'semMarcaOuLogo', 'semTexto', 'semTelaComConteudo', 'fotoDistinta')) {
        if ($approval.$flag -cne $true) { throw "Revisão de $($item.patrimonio) não aprovou $flag." }
    }
    $licenseUrl = switch ($approval.license) {
        'Pixabay Content License' { 'https://pixabay.com/service/terms/' }
        'CC0 1.0' { 'https://creativecommons.org/publicdomain/zero/1.0/' }
        default { throw "Licença não confirmada para $($item.patrimonio)." }
    }
    if ($approval.licenseUrl -cne $licenseUrl) { throw "URL da licença incorreta para $($item.patrimonio)." }
    $credits += [pscustomobject]@{
        patrimonio = $item.patrimonio
        nome = $item.nome
        categoria = $item.categoria
        situacao = $item.situacao
        busca = $item.busca
        pixabayId = $row.pixabayId
        sourcePage = $row.sourcePage
        photographer = $row.photographer
        photographerId = $row.photographerId
        license = $approval.license
        licenseUrl = $approval.licenseUrl
        sha256 = $hash
        objectPath = "$($item.patrimonio).jpg"
        reviewer = $approval.reviewer
    }
}

if ($Action -eq 'Verify') {
    Write-Output 'Verificação aprovada: 12 JPEGs 800×600, IDs e hashes únicos, créditos e revisão completos.'
    return
}

Assert-LocalStorageConfig

if ($Action -eq 'StageLocal') {
    $newCredits = $credits | ConvertTo-Json -Depth 5
    if (Test-Path -LiteralPath $creditsPath) {
        $oldCredits = Get-Content -LiteralPath $creditsPath -Raw -Encoding utf8 | ConvertFrom-Json
        for ($i = 0; $i -lt $credits.Count; $i++) {
            if ($oldCredits[$i].sha256 -cne $credits[$i].sha256 -or $oldCredits[$i].pixabayId -ne $credits[$i].pixabayId) {
                throw 'Créditos existentes divergem; substituição exige decisão explícita.'
            }
        }
    }
    foreach ($row in $credits) {
        $dest = Join-Path $storageDir $row.objectPath
        if ((Test-Path -LiteralPath $dest) -and (Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash.ToLowerInvariant() -cne $row.sha256) {
            throw "Objeto local existente diverge: $($row.objectPath)."
        }
    }
    if (-not (Test-Path -LiteralPath $storageDir)) { New-Item -ItemType Directory -Path $storageDir -Force | Out-Null }
    foreach ($row in $credits) {
        $dest = Join-Path $storageDir $row.objectPath
        if (-not (Test-Path -LiteralPath $dest)) { Copy-Item -LiteralPath (Join-Path $reviewRoot $row.objectPath) -Destination $dest }
    }
    if (-not (Test-Path -LiteralPath $creditsPath)) { [IO.File]::WriteAllText($creditsPath, $newCredits, [Text.UTF8Encoding]::new($false)) }
    Write-Output '12 fotos colocadas em supabase/images/equipamentos, sem duplicação. Reinicie apenas o Supabase local e rode VerifyLocal.'
    return
}

$http = [Net.Http.HttpClient]::new()
$http.Timeout = [TimeSpan]::FromSeconds(15)
try {
    foreach ($row in $credits) {
        $url = "http://127.0.0.1:54321/storage/v1/object/public/equipamentos/$($row.objectPath)"
        try { $bytes = $http.GetByteArrayAsync($url).GetAwaiter().GetResult() }
        catch { throw "Objeto público local indisponível: $($row.objectPath)." }
        $remoteHash = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()
        if ($remoteHash -cne $row.sha256) { throw "Objeto público local diverge: $($row.objectPath)." }
    }
} finally { $http.Dispose() }
Write-Output 'Bucket público local verificado: 12 objetos únicos com os bytes aprovados.'
