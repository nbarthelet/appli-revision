@echo off
chcp 65001 >nul
title Atelier HGGSP - Editeur
cd /d "%~dp0"

echo.
echo   ============================================
echo     Atelier HGGSP  -  Editeur de revisions
echo   ============================================
echo.
echo   Le navigateur va s'ouvrir sur http://localhost:5173/
echo   Pour arreter le serveur : fermez cette fenetre.
echo.

start "" cmd /c "timeout /t 4 >nul & start http://localhost:5173/"

call npm.cmd run dev