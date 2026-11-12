[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('Search', 'Prepare')]
    [string]$Action,
    [string]$Patrimonio,
    [string]$SelectionsPath,
    [ValidateRange(1, 50)]
    [int]$Page = 1
)

$ErrorActionPreference = 'Stop'

$skillRoot = Split-Path $PSScriptRoot -Parent
$equipment = @(Get-Content -LiteralPath (Join-Path $skillRoot 'references/equipamentos.json') -Raw -Encoding utf8 | ConvertFrom-Json)
$reviewRoot = Join-Path ([IO.Path]::GetTempPath()) 'EmpresTI-image-review'
$cacheRoot = Join-Path ([IO.Path]::GetTempPath()) 'EmpresTI-pixabay-cache'
$handler = [Net.Http.HttpClientHandler]::new()
$handler.AllowAutoRedirect = $false
$http = [Net.Http.HttpClient]::new($handler)
$http.Timeout = [TimeSpan]::FromSeconds(30)
$apiKey = $null

function Get-PixabayResponse([string]$Query) {
    if (-not (Test-Path -LiteralPath $cacheRoot)) {
        New-Item -ItemType Directory -Path $cacheRoot | Out-Null
    }
    $queryBytes = [Text.Encoding]::UTF8.GetBytes($Query)
    $cacheId = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($queryBytes)).ToLowerInvariant()
    $cacheFile = Join-Path $cacheRoot "$cacheId.json"
    if ((Test-Path -LiteralPath $cacheFile) -and ((Get-Date) - (Get-Item -LiteralPath $cacheFile).LastWriteTime).TotalHours -lt 24) {
        return Get-Content -LiteralPath $cacheFile -Raw -Encoding utf8 | ConvertFrom-Json
    }
    if (-not $script:apiKey) {
        $secret = Read-Host 'Chave gratuita da API Pixabay' -AsSecureString
        $script:apiKey = [Net.NetworkCredential]::new('', $secret).Password
        if ([string]::IsNullOrWhiteSpace($script:apiKey)) { throw 'A chave da API Pixabay é obrigatória.' }
    }
    $uri = "https://pixabay.com/api/?key=$([uri]::EscapeDataString($script:apiKey))&$Query"
    try {
        $response = $http.GetAsync($uri).GetAwaiter().GetResult()
        if (-not $response.IsSuccessStatusCode) { throw 'request-failed' }
        $json = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        $parsed = $json | ConvertFrom-Json
        if ($null -eq $parsed.hits) { throw 'invalid-response' }
        [IO.File]::WriteAllText($cacheFile, $json, [Text.UTF8Encoding]::new($false))
        return $parsed
    } catch {
        throw 'A consulta à API Pixabay falhou; confira a chave, a conexão e os limites da API.'
    }
}

function Assert-PixabayUrl([string]$Value, [bool]$AllowCdn) {
    $parsed = $null
    if (-not [uri]::TryCreate($Value, [UriKind]::Absolute, [ref]$parsed)) { throw 'A API retornou URL inválida.' }
    $validHosts = if ($AllowCdn) { @('pixabay.com', 'cdn.pixabay.com') } else { @('pixabay.com') }
    if ($parsed.Scheme -ne 'https' -or $parsed.Host -notin $validHosts) { throw 'A API retornou origem diferente do Pixabay.' }
}

function Get-PixabayImageBytes([string]$SourceUrl) {
    $current = [uri]$SourceUrl
    for ($attempt = 0; $attempt -lt 4; $attempt++) {
        Assert-PixabayUrl $current.AbsoluteUri $true
        try { $response = $http.GetAsync($current).GetAwaiter().GetResult() }
        catch { throw 'Falha ao baixar a foto selecionada do Pixabay.' }
        try {
            if ([int]$response.StatusCode -ge 300 -and [int]$response.StatusCode -lt 400) {
                if (-not $response.Headers.Location) { throw 'Redirecionamento sem destino.' }
                $current = [uri]::new($current, $response.Headers.Location)
                continue
            }
            if (-not $response.IsSuccessStatusCode) { throw 'Download da foto falhou.' }
            $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
            if ($bytes.Length -gt 15000000) { throw 'Foto maior que o limite de 15 MB.' }
            return ,$bytes
        } finally { $response.Dispose() }
    }
    throw 'Foto com redirecionamentos excessivos.'
}

function Convert-To800x600([byte[]]$Bytes) {
    $start = [Diagnostics.ProcessStartInfo]::new()
    $start.FileName = 'node'
    $start.ArgumentList.Add((Join-Path $PSScriptRoot 'image.mjs'))
    $start.ArgumentList.Add('resize')
    $start.UseShellExecute = $false
    $start.RedirectStandardInput = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $process = [Diagnostics.Process]::Start($start)
    if (-not $process) { throw 'Não foi possível iniciar o redimensionamento com sharp.' }
    try {
        $process.StandardInput.Write([Convert]::ToBase64String($Bytes))
        $process.StandardInput.Close()
        $output = $process.StandardOutput.ReadToEnd()
        $errorText = $process.StandardError.ReadToEnd()
        $process.WaitForExit()
        if ($process.ExitCode -ne 0) { throw "sharp recusou a foto: $errorText" }
        return ,[Convert]::FromBase64String($output)
    } finally {
        $process.Dispose()
    }
}

try {
    if ($Action -eq 'Search') {
        $item = $equipment | Where-Object patrimonio -EQ $Patrimonio | Select-Object -First 1
        if (-not $item) { throw 'Informe um patrimônio da lista fixa TI-0001…TI-0012.' }
        $query = "q=$([uri]::EscapeDataString($item.busca))&image_type=photo&orientation=horizontal&min_width=800&min_height=600&safesearch=true&per_page=10&page=$Page"
        $result = Get-PixabayResponse $query
        @($result.hits | ForEach-Object {
            [pscustomobject]@{
                patrimonio = $item.patrimonio
                pixabayId = $_.id
                tags = $_.tags
                pageURL = $_.pageURL
                previewURL = $_.previewURL
                photographer = $_.user
                width = $_.imageWidth
                height = $_.imageHeight
            }
        }) | ConvertTo-Json -Depth 4
        return
    }

    if (-not $SelectionsPath) { throw 'Informe -SelectionsPath.' }
    $selected = @(Get-Content -LiteralPath $SelectionsPath -Raw -Encoding utf8 | ConvertFrom-Json)
    if ($selected.Count -ne $equipment.Count) { throw 'A seleção precisa conter os 12 patrimônios.' }
    $ids = [Collections.Generic.HashSet[int]]::new()
    foreach ($item in $equipment) {
        $match = @($selected | Where-Object patrimonio -EQ $item.patrimonio)
        if ($match.Count -ne 1 -or -not $match[0].pixabayId) { throw "Seleção inválida para $($item.patrimonio)." }
        if (-not $ids.Add([int]$match[0].pixabayId)) { throw 'A mesma foto Pixabay foi atribuída a dois equipamentos.' }
    }
    if (-not (Test-Path -LiteralPath $reviewRoot)) { New-Item -ItemType Directory -Path $reviewRoot | Out-Null }
    $rows = @()
    $hashes = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    foreach ($item in $equipment) {
        $id = [int](@($selected | Where-Object patrimonio -EQ $item.patrimonio)[0].pixabayId)
        try {
            $result = Get-PixabayResponse "id=$id&image_type=photo"
        } catch {
            throw "Falha ao consultar a foto de $($item.patrimonio) (Pixabay ID $id). $($_.Exception.Message)"
        }
        $hit = @($result.hits | Where-Object id -EQ $id | Select-Object -First 1)[0]
        if (-not $hit -or $hit.type -ne 'photo' -or -not $hit.user -or -not $hit.user_id) { throw "Metadados incompletos para $($item.patrimonio)." }
        Assert-PixabayUrl $hit.pageURL $false
        Assert-PixabayUrl $hit.largeImageURL $true
        try { $sourceBytes = Get-PixabayImageBytes ([string]$hit.largeImageURL) }
        catch { throw "Falha ao baixar a foto Pixabay de $($item.patrimonio)." }
        $jpg = Convert-To800x600 $sourceBytes
        $sha = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($jpg)).ToLowerInvariant()
        if (-not $hashes.Add($sha)) { throw 'Duas fotos finais são idênticas.' }
        $imageFile = Join-Path $reviewRoot "$($item.patrimonio).jpg"
        if (Test-Path -LiteralPath $imageFile) {
            $oldSha = (Get-FileHash -LiteralPath $imageFile -Algorithm SHA256).Hash.ToLowerInvariant()
            if ($oldSha -ne $sha) { throw "A foto de revisão $($item.patrimonio) já existe com outros bytes." }
        } else {
            [IO.File]::WriteAllBytes($imageFile, $jpg)
        }
        $rows += [pscustomobject]@{
            patrimonio = $item.patrimonio
            nome = $item.nome
            categoria = $item.categoria
            situacao = $item.situacao
            busca = $item.busca
            pixabayId = $id
            sourcePage = $hit.pageURL
            photographer = $hit.user
            photographerId = $hit.user_id
            sha256 = $sha
            imageFile = "$($item.patrimonio).jpg"
        }
    }
    $manifestFile = Join-Path $reviewRoot 'manifest.json'
    if (Test-Path -LiteralPath $manifestFile) {
        $old = @(Get-Content -LiteralPath $manifestFile -Raw -Encoding utf8 | ConvertFrom-Json)
        if ($old.Count -ne $rows.Count) { throw 'O manifesto de revisão existente não tem 12 itens.' }
        for ($i = 0; $i -lt $rows.Count; $i++) {
            if ($old[$i].pixabayId -ne $rows[$i].pixabayId -or $old[$i].sha256 -ne $rows[$i].sha256) {
                throw 'O manifesto de revisão já existe com outra seleção; preserve a revisão anterior.'
            }
        }
    } else {
        [IO.File]::WriteAllText($manifestFile, ($rows | ConvertTo-Json -Depth 5), [Text.UTF8Encoding]::new($false))
    }
    $reviewFile = Join-Path $reviewRoot 'review.json'
    if (-not (Test-Path -LiteralPath $reviewFile)) {
        $reviewTemplate = @($rows | ForEach-Object {
            [pscustomobject]@{
                patrimonio = $_.patrimonio
                pixabayId = $_.pixabayId
                sha256 = $_.sha256
                reviewer = ''
                license = ''
                licenseUrl = ''
                semPessoa = $false
                semTelaComConteudo = $false
                fotoDistinta = $false
            }
        })
        [IO.File]::WriteAllText($reviewFile, ($reviewTemplate | ConvertTo-Json -Depth 5), [Text.UTF8Encoding]::new($false))
    }
    Write-Output "Fotos para revisão: $reviewRoot"
    Write-Output "Manifesto: $manifestFile"
    Write-Output "Revisão pendente: $reviewFile"
} finally {
    $apiKey = $null
    $http.Dispose()
    $handler.Dispose()
}
