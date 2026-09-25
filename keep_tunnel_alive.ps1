$env:Path = "C:\Windows\System32\OpenSSH;" + $env:Path
$urlFile = Join-Path $PSScriptRoot "tunnel_url.txt"
$logOut = Join-Path $PSScriptRoot "tunnel_out.log"
$logErr = Join-Path $PSScriptRoot "tunnel_err.log"

while ($true) {
    if (Test-Path $logOut) { Remove-Item -Force $logOut -ErrorAction SilentlyContinue }
    if (Test-Path $logErr) { Remove-Item -Force $logErr -ErrorAction SilentlyContinue }
    
    Write-Host "Starting SSH tunnel to localhost.run..."
    $process = Start-Process -FilePath "ssh" -ArgumentList "-o StrictHostKeyChecking=no -o ServerAliveInterval=15 -o ServerAliveCountMax=6 -R 80:localhost:5000 nokey@localhost.run" -PassThru -NoNewWindow -RedirectStandardOutput $logOut -RedirectStandardError $logErr
    
    $tunnelUrl = ""
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Path $logOut) {
            $content = Get-Content $logOut -Raw
            if ($content -match 'https://([a-zA-Z0-9]+)\.lhr\.life') {
                $tunnelUrl = $matches[0]
                Set-Content -Path $urlFile -Value $tunnelUrl
                Write-Host "Tunnel URL established: $tunnelUrl"
                break
            }
        }
    }
    
    while (-not $process.HasExited) {
        Start-Sleep -Seconds 45
        if ($tunnelUrl) {
            try {
                Invoke-WebRequest -Uri $tunnelUrl -UseBasicParsing -TimeoutSec 10 | Out-Null
                Write-Host "Heartbeat ping sent to $tunnelUrl at $(Get-Date -Format 'HH:mm:ss')"
            } catch {
                # Ignore transient network errors
            }
        }
    }
    
    Write-Host "SSH process exited. Reconnecting in 5 seconds..."
    Start-Sleep -Seconds 5
}
