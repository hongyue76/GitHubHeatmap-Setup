@echo off
chcp 65001 >nul

REM 直接调用卸载程序
start "" "%~dp0uninstall.exe"
exit
