[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('Local', 'Production')]
    [string]$Target
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$url = if ($Target -eq 'Local') {
    'http://127.0.0.1:54321'
} else {
    (Read-Host 'URL HTTPS do Supabase de produção').Trim()
}
if ($Target -eq 'Production') {
    Write-Host 'O operador publicará 12 equipamentos, a conta Marcelo Grilo e 12 fotos aprovadas no Supabase informado.'
    if ((Read-Host 'Digite PUBLICAR para confirmar o destino') -cne 'PUBLICAR') {
        throw 'Publicação cancelada.'
    }
}

$serviceKey = if ($Target -eq 'Local') {
    $localStatus = & npx supabase status -o json | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0 -or -not $localStatus.SERVICE_ROLE_KEY) {
        throw 'Não foi possível obter a chave service_role do Supabase local.'
    }
    $localStatus.SERVICE_ROLE_KEY
} else {
    $key = Read-Host 'Chave service_role do ambiente selecionado' -AsSecureString
    [Net.NetworkCredential]::new('', $key).Password
}
$password = Read-Host 'Senha da conta Marcelo Grilo' -AsSecureString
$env:EMPRES_TI_OPERATOR_URL = $url
$env:EMPRES_TI_OPERATOR_SERVICE_KEY = $serviceKey
$env:EMPRES_TI_OPERATOR_PASSWORD = [Net.NetworkCredential]::new('', $password).Password

Push-Location $projectRoot
try {
    & npx tsx scripts/operator-initial-data.ts $Target.ToLowerInvariant()
    if ($LASTEXITCODE -ne 0) { throw 'O provisionamento não terminou.' }
} finally {
    Pop-Location
    Remove-Item Env:EMPRES_TI_OPERATOR_URL -ErrorAction SilentlyContinue
    Remove-Item Env:EMPRES_TI_OPERATOR_SERVICE_KEY -ErrorAction SilentlyContinue
    Remove-Item Env:EMPRES_TI_OPERATOR_PASSWORD -ErrorAction SilentlyContinue
}
