@echo off
chcp 65001 >nul
title 停止 GitHub Contribution Heatmap

echo ========================================
echo   停止 GitHub Contribution Heatmap
echo ========================================
echo.
echo 正在停止服务器...
echo.

REM 停止 Node.js 进程
taskkill /F /IM node.exe 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✓ 服务器已停止
) else (
    echo ⚠ 服务器未运行或已停止
)

echo.
pause
