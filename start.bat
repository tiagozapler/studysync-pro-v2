@echo off
title StudySync Pro - Servidor de Desarrollo
color 0A

echo ========================================
echo    StudySync Pro - Servidor de Desarrollo
echo ========================================
echo.

cd /d "%~dp0"
echo Directorio actual: %CD%
echo.

if not exist "package.json" (
    echo ERROR: No se encontro package.json
    echo Asegurate de estar en el directorio correcto
    pause
    exit /b 1
)

echo Package.json encontrado ✓
echo.

if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo ERROR: Fallo al instalar dependencias
        pause
        exit /b 1
    )
    echo Dependencias instaladas ✓
    echo.
)

echo Iniciando servidor en http://localhost:3000
echo Presiona Ctrl+C para detener
echo.

npm run start

pause
