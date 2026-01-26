param (
    [string]$Command = ".\test.ps1"
)

# Check for API Key
if (-not $env:NEXT_PUBLIC_GEMINI_API_KEY) {
    Write-Host "----------------------------------------------------------------"
    Write-Host "Gemini API Key is required."
    $env:NEXT_PUBLIC_GEMINI_API_KEY = Read-Host "Please enter your Gemini API Key" -AsSecureString | ConvertFrom-SecureString -AsPlainText
} else {
    Write-Host "Using existing NEXT_PUBLIC_GEMINI_API_KEY from environment."
}

# Check for Model
if (-not $env:NEXT_PUBLIC_GEMINI_MODEL) {
    $model = Read-Host "Please enter the Gemini Model (default: gemini-3-flash-preview)"
    if ([string]::IsNullOrWhiteSpace($model)) { $model = "gemini-3-flash-preview" }
    $env:NEXT_PUBLIC_GEMINI_MODEL = $model
    Write-Host "Using model: $env:NEXT_PUBLIC_GEMINI_MODEL"
} else {
    Write-Host "Using existing NEXT_PUBLIC_GEMINI_MODEL from environment: $env:NEXT_PUBLIC_GEMINI_MODEL"
}
Write-Host "----------------------------------------------------------------"

# Execute the command
Write-Host "Executing: $Command"
Invoke-Expression $Command