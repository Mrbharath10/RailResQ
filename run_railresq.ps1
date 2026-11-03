# RailResQ Launcher Script for PowerShell
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "      RAILRESQ: AI-POWERED RAILWAY PASSENGER SUPER APP & RESCUE" -ForegroundColor Green
Write-Host "         Smart Travel Services, RailYatri Booking & Emergency AI" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = $PSScriptRoot
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path }

Write-Host "[1/3] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass", "-NoExit", "-Command", "cd '$ProjectRoot\backend'; & '.\.venv\Scripts\python.exe' -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 3

Write-Host "[2/3] Starting React Vite Frontend on http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass", "-NoExit", "-Command", "cd '$ProjectRoot\frontend'; npm run dev"

Start-Sleep -Seconds 3

Write-Host "[3/3] Opening RailResQ in your default web browser ..." -ForegroundColor Green
Start-Process "http://localhost:5173/grocery"

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "RailResQ is now running!" -ForegroundColor Yellow
Write-Host " - Hotels & Retiring Rooms:   http://localhost:5173/hotels" -ForegroundColor White
Write-Host " - 15-Min Station Grocery:    http://localhost:5173/grocery" -ForegroundColor White
Write-Host " - Live Train Fleet Tracking: http://localhost:5173/train-tracking" -ForegroundColor White
Write-Host " - Explore Destinations:      http://localhost:5173/explore" -ForegroundColor White
Write-Host " - Passenger Super App Hub:   http://localhost:5173/passenger/dashboard" -ForegroundColor White
Write-Host " - RailYatri Train Booking:   http://localhost:5173/train-search" -ForegroundColor White
Write-Host " - PNR Status & Live Chart:   http://localhost:5173/pnr-status" -ForegroundColor White
Write-Host " - Multi-Role Authentication: http://localhost:5173/login" -ForegroundColor White
Write-Host " - Food on Train Delivery:    http://localhost:5173/food" -ForegroundColor White
Write-Host " - Rapido Cabs & Auto:        http://localhost:5173/transport" -ForegroundColor White
Write-Host " - Control-Room Dashboard:    http://localhost:5173/operator/dashboard" -ForegroundColor White
Write-Host " - Super Admin Console:       http://localhost:5173/admin/super-app" -ForegroundColor White
Write-Host " - FastAPI Interactive Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Green
