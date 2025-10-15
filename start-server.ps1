#!/usr/bin/env pwsh

# Backend API Startup Script
# Starts the Schulmanager Backend API server

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Schulmanager Backend API Server" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Warning: .env file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Please edit .env file with your credentials before running the server." -ForegroundColor Red
        exit 1
    } else {
        Write-Host "Error: .env.example not found!" -ForegroundColor Red
        exit 1
    }
}

# Build TypeScript
Write-Host "Building TypeScript..." -ForegroundColor Yellow
yarn build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green
Write-Host ""

# Start server
Write-Host "Starting server..." -ForegroundColor Yellow
Write-Host "Server will run on http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

yarn start
