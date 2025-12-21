@echo off
chcp 65001 >nul
title Lancement Gestionnaire Inspections
cls

:: CLEANUP ZOMBIES (Force Kill Old Servers)
taskkill /F /IM node.exe
timeout /t 2 >nul
cls

echo ========================================================
echo    GESTIONNAIRE D'INSPECTIONS MUNICIPALES (VAL-D'OR)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Demarrage du Serveur Backend...
start "BACKEND SERVER" /min cmd /k "cd server && node index.js"

echo [2/3] Demarrage de l'Interface Frontend...
:: Utilisation directe de Node pour contourner les restrictions PowerShell
start "FRONTEND CLIENT" /min cmd /k "node node_modules/vite/bin/vite.js"

echo [3/3] Ouverture du navigateur...
echo.
echo     Veuillez patienter 5 secondes...
timeout /t 5 >nul

:: Ouvre les ports potentiels (Vite change de port si occupe)
start http://localhost:5173/dashboard


echo.
echo ========================================================
echo    SYSTEME EN LIGNE !
echo    Minimisez les fenetres noires, mais NE LES FERMEZ PAS.
echo ========================================================
pause
