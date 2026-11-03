@echo off
title RailResQ Super App Platform Launcher
color 0A
echo =====================================================================
echo       RAILRESQ: AI-POWERED RAILWAY PASSENGER SUPER APP ^& RESCUE
echo          Smart Travel Services, RailYatri Booking ^& Emergency AI
echo =====================================================================
echo.

set "ROOT=%~dp0"

echo [1/3] Starting FastAPI Backend on http://localhost:8000 ...
start "RailResQ Backend Server" cmd /k "cd /d %ROOT%backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/3] Starting React Vite Frontend on http://localhost:5173 ...
start "RailResQ Frontend Server" cmd /k "cd /d %ROOT%frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening RailResQ in your default web browser ...
start http://localhost:5173/grocery

echo.
echo =====================================================================
echo RailResQ is now running!
echo - Hotels ^& Retiring Rooms:       http://localhost:5173/hotels
echo - 15-Min Station Grocery:        http://localhost:5173/grocery
echo - Live Train Fleet Tracking:     http://localhost:5173/train-tracking
echo - Explore Destinations:          http://localhost:5173/explore
echo - Passenger Super App Hub:       http://localhost:5173/passenger/dashboard
echo - RailYatri Train Booking:       http://localhost:5173/train-search
echo - PNR Status ^& Live Chart:       http://localhost:5173/pnr-status
echo - Multi-Role Authentication:     http://localhost:5173/login
echo - Food on Train (Berth Delivery):http://localhost:5173/food
echo - Rapido Bikes ^& Cabs:           http://localhost:5173/transport
echo - Control-Room Command Center:   http://localhost:5173/operator/dashboard
echo - Super Admin ^& API Registry:    http://localhost:5173/admin/super-app
echo - FastAPI Interactive Docs:      http://localhost:8000/docs
echo =====================================================================
echo Servers are running in their respective windows. Keep those windows open!
pause
