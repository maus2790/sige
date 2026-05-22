$logPath = "C:\Users\STS_758X\.gemini\antigravity\brain\f89e5315-4901-458b-998e-b78fd6e5899f\.system_generated\tasks\task-827.log"
$lines = Get-Content $logPath
$filtered = $lines | Where-Object {
    $_ -match "\[PAGE |Cache:|MISS|PURGE|Owner|Ready|Started"
}
$filtered | Select-Object -Last 60
