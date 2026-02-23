Write-Host "Stopping existing Lost & Found services..."

$ports = 3000, 5000, 5173
foreach ($port in $ports) {
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($processes) {
        foreach ($proc in $processes) {
            try {
                $processId = $proc.OwningProcess
                $p = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($p) {
                    Write-Host "Killing process on port $port (PID: $processId - $($p.ProcessName))"
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                }
            }
            catch {
                Write-Host "Could not kill process on port $port"
            }
        }
    }
    else {
        Write-Host "No process found on port $port"
    }
}

Write-Host "Cleanup complete. Starting services..."
Start-Sleep -Seconds 2

& "$PSScriptRoot/start_all.ps1"
