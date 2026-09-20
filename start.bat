@echo off
title ArhatPro Mandi ERP - Full Stack Server
echo ====================================================
echo Starting ArhatPro Mandi ERP (React + Node + SQL)
echo ====================================================
cd /d "%~dp0"
set "PATH=C:\Users\Admin\AppData\Local\Programs\NodeJS;C:\Users\Admin\AppData\Local\Programs\Git\cmd;%PATH%"

echo Starting server on http://localhost:5000 ...
start "" "http://localhost:5000"
node server/index.js
pause
