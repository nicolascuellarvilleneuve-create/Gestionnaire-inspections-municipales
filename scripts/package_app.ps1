$source = "C:\Users\cuellarn\Documents\GIM\Gestionnaire-inspections-municipales"
$dest = "$env:USERPROFILE\Desktop\GIM_Portable"

Write-Host "Creating portable copy at $dest..."
if (Test-Path $dest) {
    Remove-Item -Recurse -Force $dest
}
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$exclude = @(".git", ".github", ".gemini", "tmp", ".vscode")

Write-Host "Copying files (this may take a minute)..."
# Use Robocopy for speed and exclude ability
# /E = Recursive including empty
# /XD = Exclude Directories
# /XF = Exclude Files
# /MT = Multi-threaded
$excludeDirs = $exclude | ForEach-Object { "$source\$_" }
$logFile = "$source\packaging_log.txt"

# Construct Robocopy command
# Note: Robocopy is weird with trailing slashes in arguments, be careful.
$cmdArgs = @(
    "robocopy",
    "`"$source`"",
    "`"$dest`"",
    "/E",
    "/XD", ".git", ".github", ".gemini", "node_modules\.cache",
    "/XF", ".gitignore", "packaging_log.txt"
)

# Run Robocopy
& $cmdArgs[0] $cmdArgs[1..($cmdArgs.Count - 1)]

# Create a customized Launch script for the portable version if needed
# We already have LANCER_APP.bat which is relative path based, so it should work 100%.

Write-Host "Packaging Complete!"
Write-Host "Folder is ready at: $dest"
Start-Process "explorer.exe" $dest
