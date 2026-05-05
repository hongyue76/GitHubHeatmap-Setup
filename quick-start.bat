@echo off
title GitHub Contribution Heatmap - Quick Start

echo ========================================
echo   GitHub 热力图 - 快速启动
echo ========================================
echo.

cd /d "%~dp0"

REM 检查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Node.js！
    echo 请先安装: https://nodejs.org/
    pause
    exit /b 1
)

echo ? Node.js 已安装
echo.

REM 检查依赖
if not exist "node_modules" (
    echo [提示] 首次运行，正在安装依赖...
    call npm install --production
    if %ERRORLEVEL% NEQ 0 (
        echo [错误] 依赖安装失败！
        pause
        exit /b 1
    )
    echo ? 依赖安装完成
    echo.
)

REM 后台启动服务器
echo 正在启动服务器...
start "" cmd /k "node server.js"

echo ? 服务器已启动
echo.
echo 正在打开浏览器...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo 提示:
echo - 服务器在后台运行
echo - 访问 http://localhost:3000
echo - 关闭命令行窗口不会停止服务器
echo.
