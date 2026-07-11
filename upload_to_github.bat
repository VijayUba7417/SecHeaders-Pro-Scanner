@echo off
title Upload SecHeaders Pro Scanner to GitHub (by Vijay Uba)
echo =========================================================================
echo  SecHeaders Pro Scanner - Offensive Hacker Suite by Vijay Uba(TM)
echo  GitHub Upload & Repository Setup Assistant
echo =========================================================================
echo.

:: Ensure Git is in PATH
set "PATH=C:\Program Files\Git\cmd;C:\Program Files\Git\bin;%PATH%"

set /p REPO_URL="Enter your GitHub Repository URL (Press Enter to use https://github.com/VijayUba7417/SecHeaders-Pro-Scanner.git): "
if "%REPO_URL%"=="" set REPO_URL=https://github.com/VijayUba7417/SecHeaders-Pro-Scanner.git

echo.
echo Initializing Git repository and setting Vijay Uba(TM) identity...
git init
git config user.name "Vijay Uba"
git config user.email "VijayUba7417@users.noreply.github.com"

git add .
git commit -m "Update SecHeaders Pro Scanner - Offensive Hacker Suite by Vijay Uba(TM)"
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
