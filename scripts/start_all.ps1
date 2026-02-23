Write-Host "Starting Lost & Found Environment..."

# Start Backend (Port 3000)
Write-Host "Launching Backend Server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'server'; npm install; npm start"

# Start AI Service (Port 5000)
Write-Host "Launching AI Service..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'ai_service'; pip install -r requirements.txt; python main.py"

# Start Frontend (Port 5173)
Write-Host "Launching Frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "pnpm install; pnpm run dev"

Write-Host "All services have been launched in separate windows."
Start-Sleep -Seconds 3
Write-Host "You can access the app at http://localhost:5173"
