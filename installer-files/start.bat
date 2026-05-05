@echo off
chcp 65001 >nul
title GitHub Contribution Heatmap

echo ========================================
echo   GitHub Contribution Heatmap
echo ========================================
echo.
echo 正在启动服务器...
echo.

cd /d "%~dp0"

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Node.js！
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

REM 首次运行：安装依赖
if not exist "node_modules" (
    echo.
    echo [提示] 首次运行，正在安装依赖包...
    echo 这可能需要几分钟，请耐心等待...
    echo.
    call npm install --production
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [错误] 依赖安装失败！
        echo 请手动运行: npm install
        pause
        exit /b 1
    )
    echo.
    echo ✓ 依赖安装完成
    echo.
)

REM 启动服务器
start "" cmd /k "node server.js"

echo.
echo ✓ 服务器已启动！
echo.
echo 正在打开浏览器...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo 提示: 
echo - 关闭此窗口不会停止服务器
echo - 使用 stop.bat 停止服务器
echo - 访问 http://localhost:3000 使用应用
echo.
pause
