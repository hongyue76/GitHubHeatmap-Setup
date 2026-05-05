@echo off
chcp 65001 >nul
title 构建 GitHub Heatmap 安装程序

echo ========================================
echo   构建安装程序
echo ========================================
echo.

REM 检查 NSIS 是否安装
where makensis >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 NSIS！
    echo 请先安装 NSIS: winget install NSIS.NSIS
    pause
    exit /b 1
)

echo [1/3] 清理旧文件...
if exist "GitHubHeatmap-Setup.exe" del "GitHubHeatmap-Setup.exe"
echo ✓ 清理完成
echo.

echo [2/3] 编译安装程序...
makensis installer.nsi

if %ERRORLEVEL% EQU 0 (
    echo ✓ 编译成功
) else (
    echo ✗ 编译失败
    pause
    exit /b 1
)
echo.

echo [3/3] 验证文件...
if exist "GitHubHeatmap-Setup.exe" (
    for %%A in ("GitHubHeatmap-Setup.exe") do set size=%%~zA
    echo ✓ 安装程序已生成
    echo   文件: GitHubHeatmap-Setup.exe
    echo   大小: %size% bytes
) else (
    echo ✗ 文件生成失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo   构建完成！
echo ========================================
echo.
echo 下一步:
echo 1. 运行 GitHubHeatmap-Setup.exe 测试安装
echo 2. 分发给用户
echo.
pause
