@echo off
title Upload SecHeaders Pro Scanner to GitHub (by Vijay Uba)
echo =========================================================================
echo  SecHeaders Pro Scanner - Offensive Hacker Suite by Vijay Uba(TM)
echo  GitHub Upload & Repository Setup Assistant
echo =========================================================================
echo.
echo Please create a new empty repository on GitHub named:
echo   SecHeaders-Pro-Scanner
echo (Go to https://github.com/new and create it without a README or License)
echo.
set /p REPO_URL="Enter your GitHub Repository URL (e.g., https://github.com/YourUsername/SecHeaders-Pro-Scanner.git): "

if "%REPO_URL%"=="" (
    echo Error: No repository URL provided. Exiting.
    pause
    exit /b
)

echo.
echo Initializing Git repository and committing Vijay Uba(TM) Suite...
git init
git add .
git commit -m "Initial commit of SecHeaders Pro Scanner - Offensive Hacker Suite by Vijay Uba(TM)"
git branch -M main
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo.
echo Pushing files to GitHub repository (%REPO_URL%)...
git push -u origin main

echo.
echo =========================================================================
echo Upload Complete! Your repository is now live at:
echo %REPO_URL%
echo =========================================================================
pause
