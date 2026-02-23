
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   LOST AND FOUND - LOCAL DEPLOYMENT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. CLEANUP OLD PROCESSES
Write-Host "`n[1/4] Cleaning up old processes..." -ForegroundColor Yellow

function Kill-Port ($port, $name) {
    $p = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($p) {
        $pid_to_kill = $p.OwningProcess
        Write-Host "  - Killing $name on port $port (PID: $pid_to_kill)..." -ForegroundColor Red
        Stop-Process -Id $pid_to_kill -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "  - Port $port ($name) is free." -ForegroundColor Green
    }
}

Kill-Port 5000 "AI Service"
Kill-Port 3000 "Backend Server"
Kill-Port 5173 "Frontend"
Kill-Port 5001 "Test Service"

# 2. START AI SERVICE
Write-Host "`n[2/4] Starting AI Service (Port 5000)..." -ForegroundColor Yellow
$ai_cmd = "cd ai_service && python main.py"
Start-Process cmd -ArgumentList "/k $ai_cmd" -WindowStyle Normal
Write-Host "  - AI Service launched in new window." -ForegroundColor Green

# 3. START BACKEND
Write-Host "`n[3/4] Starting Backend (Port 3000)..." -ForegroundColor Yellow
$be_cmd = "cd server && npm start"
Start-Process cmd -ArgumentList "/k $be_cmd" -WindowStyle Normal
Write-Host "  - Backend launched in new window." -ForegroundColor Green

# 4. START FRONTEND
Write-Host "`n[4/4] Starting Frontend (Port 5173)..." -ForegroundColor Yellow
$fe_cmd = "npm run dev"
Start-Process cmd -ArgumentList "/k $fe_cmd" -WindowStyle Normal
Write-Host "  - Frontend launched in new window." -ForegroundColor Green

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "   DEPLOYMENT LAUNCHED!" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:5173"
Write-Host "   - Backend:  http://localhost:3000"
Write-Host "   - AI API:   http://localhost:5000"
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "NOTE: AI Training (if running) was NOT touched." -ForegroundColor Gray
