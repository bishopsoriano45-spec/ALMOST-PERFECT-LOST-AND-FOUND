# Start Lost & Found in Production Mode (Local)

Write-Host "Starting Lost & Found - Production Mode..." -ForegroundColor Cyan

# 1. Start Backend
Write-Host "Launching Backend Server..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd server; npm start" -WindowStyle Minimized

# 2. Start AI Service
Write-Host "Launching AI Service..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd ai_service; python main.py" -WindowStyle Minimized

# 3. Serve Frontend (Dist)
Write-Host "Serving Frontend (Production Build)..." -ForegroundColor Green
# Using npx serve to serve the 'dist' folder on port 3000 (or 5000, let's specify 4173 or 8080 to avoid conflicts)
# Vite preview uses 4173 by default
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "npx serve -s dist -l 4173"

Write-Host "All services started!" -ForegroundColor Cyan
Write-Host "App available at: http://localhost:4173" -ForegroundColor Yellow
