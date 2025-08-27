@echo off
cd /d "C:\Users\tiago\studysync-pro"
echo Iniciando servidor de desarrollo desde: %CD%
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
npm run dev
pause
