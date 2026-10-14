@echo off
TITLE Health Risk Intelligence Platform - Launcher
echo ========================================================
echo  Launching Health Risk Intelligence Platform (v2.1)
echo ========================================================
echo.

echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Health Risk - Backend" cmd /k "cd /d "%~dp0backend" && ..\venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo Starting React Frontend on http://localhost:5173 ...
start "Health Risk - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo  Both services launched!
echo  - Frontend Dashboard: http://localhost:5173
echo  - Swagger API Docs:   http://127.0.0.1:8000/docs
echo ========================================================
pause
