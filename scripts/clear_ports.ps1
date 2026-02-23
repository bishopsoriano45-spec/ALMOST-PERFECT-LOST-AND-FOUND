# Restart Development Environment

Write-Host "🛑 Stopping existing services..." -ForegroundColor Yellow

# Function to kill process by port
function Kill-Port($port) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) {
        $pid = $process.OwningProcess
        Write-Host "Killing process on port $port (PID: $pid)..." -ForegroundColor Red
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

Kill-Port 3000 # Backend
Kill-Port 5000 # AI Service
Kill-Port 5173 # Frontend

# Additional cleanup for node/python if needed (Optional, sticking to ports is safer)
# Stop-Process -Name "node" -ErrorAction SilentlyContinue
# Stop-Process -Name "python" -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

Write-Host "🚀 Starting Backend Server (Port 3000)..." -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "server" -NoNewWindow
# We use Start-Process to run it in parallel? 
# Actually, run_command in the agent runs in background if it returns immediately.
# But here we want to spawn them. 
# Better: Use `start` (cmd) or `Start-Process`.
# If I use `run_command` from the agent, I can spawn 3 separate commands.
# BUT, using a script is cleaner for the USER to have.

# However, for the AGENT to run them, I should probably use 3 separate `run_command` calls
# AFTER cleaning the ports. 
# So this script will ONLY clean the ports.

Write-Host "✅ Ports cleared." -ForegroundColor Cyan
