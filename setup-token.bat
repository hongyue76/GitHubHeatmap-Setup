@echo off
chcp 65001 >nul
title 配置 GitHub Token

echo ========================================
echo   配置 GitHub Token
echo ========================================
echo.
echo 步骤:
echo 1. 访问: https://github.com/settings/tokens
echo 2. 生成新 Token (classic)
echo 3. 勾选权限: public_repo
echo 4. 复制 Token
echo.
echo ========================================
echo.

set /p TOKEN="请输入你的 GitHub Token (ghp_开头): "

if "%TOKEN%"=="" (
    echo [错误] Token 不能为空！
    pause
    exit /b 1
)

echo.
echo 正在配置...

REM 备份原文件
if exist .env copy .env .env.backup >nul

REM 创建新配置文件
(
echo # GitHub Token
echo GITHUB_TOKEN=%TOKEN%
echo.
echo # Server Port
echo PORT=3000
echo.
echo # Node Environment
echo NODE_ENV=production
echo.
echo # CORS Configuration
echo CORS_ORIGIN=*
echo.
echo # Rate Limiting
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=100
echo.
echo # Redis Cache
echo REDIS_URL=redis://localhost:6379
echo.
echo # Logging
echo LOG_LEVEL=info
) > .env

echo.
echo ✓ Token 已配置成功！
echo.
echo 提示:
echo - Token 已保存到 .env 文件
echo - 重启服务器后生效
echo - API 限额: 60次/小时 → 5000次/小时
echo.
pause
