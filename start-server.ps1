# Script robusto para iniciar el servidor de desarrollo
param(
    [switch]$Force
)

# Función para verificar si el puerto está en uso
function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    }
    catch {
        return $false
    }
}

# Función para matar procesos en un puerto
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        foreach ($processId in $processes) {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "Proceso $processId detenido en puerto $Port" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "No se pudieron detener procesos en puerto $Port" -ForegroundColor Red
    }
}

# Cambiar al directorio del proyecto
$projectPath = "C:\Users\tiago\studysync-pro"
Set-Location $projectPath

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json en $projectPath" -ForegroundColor Red
    Write-Host "Directorio actual: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Directorio del proyecto: $(Get-Location)" -ForegroundColor Green
Write-Host "✅ Package.json encontrado" -ForegroundColor Green

# Verificar dependencias
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Instalando dependencias..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
        exit 1
    }
}

# Verificar si el puerto 3000 está en uso
if (Test-Port -Port 3000) {
    Write-Host "⚠️  Puerto 3000 está en uso" -ForegroundColor Yellow
    if ($Force) {
        Write-Host "🔄 Deteniendo procesos en puerto 3000..." -ForegroundColor Yellow
        Stop-ProcessOnPort -Port 3000
        Start-Sleep -Seconds 2
    } else {
        Write-Host "❌ Puerto 3000 está ocupado. Usa -Force para liberarlo" -ForegroundColor Red
        exit 1
    }
}

# Iniciar el servidor
Write-Host "🚀 Iniciando servidor de desarrollo..." -ForegroundColor Green
Write-Host "📍 URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "⏹️  Presiona Ctrl+C para detener" -ForegroundColor Yellow
Write-Host ""

try {
    npm run dev
}
catch {
    Write-Host "❌ Error ejecutando npm run dev: $_" -ForegroundColor Red
    exit 1
}
