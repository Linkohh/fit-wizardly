$path = '\\?\c:\Users\linco\OneDrive\Desktop\GITHUB\fit-wizardly\nul'
Write-Output "Trying to remove $path" | Out-File 'c:\Users\linco\OneDrive\Desktop\GITHUB\fit-wizardly\ps_log.txt'
try {
    Remove-Item -LiteralPath $path -Force -ErrorAction Stop
    "Success" | Out-File 'c:\Users\linco\OneDrive\Desktop\GITHUB\fit-wizardly\ps_success.txt'
} catch {
    $_ | Out-File 'c:\Users\linco\OneDrive\Desktop\GITHUB\fit-wizardly\ps_error.txt'
}
