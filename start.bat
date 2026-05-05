@echo off
echo ========================================
echo GitHub 贡献热力图生成器
echo ========================================
echo.

echo [1/3] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)
echo ✅ Node.js 已安装

echo.
echo [2/3] 检查依赖...
if not exist node_modules (
    echo 📦 安装依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在
)

echo.
echo [3/3] 启动服务器...
echo.
echo 🚀 服务即将启动...
echo 📱 访问地址: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo.

call npm start
