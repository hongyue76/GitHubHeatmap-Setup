; GitHub Contribution Heatmap - Windows Installer
; NSIS Script

Unicode true
!include "MUI2.nsh"
!include "FileFunc.nsh"

; ============================================
; Basic Configuration
; ============================================
Name "GitHub Contribution Heatmap"
OutFile "GitHubHeatmap-Setup.exe"
InstallDir "$PROGRAMFILES\GitHubHeatmap"
InstallDirRegKey HKLM "Software\GitHubHeatmap" ""
RequestExecutionLevel admin

; Version Info
VIProductVersion "1.2.0.0"
VIFileVersion "1.2.0.0"
VIAddVersionKey "ProductName" "GitHub Contribution Heatmap"
VIAddVersionKey "CompanyName" "GitHub Heatmap Team"
VIAddVersionKey "LegalCopyright" "(c) 2026"
VIAddVersionKey "FileDescription" "GitHub Contribution Heatmap Generator"
VIAddVersionKey "FileVersion" "1.2.0"

; ============================================
; UI Configuration
; ============================================
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; Welcome Page
!insertmacro MUI_PAGE_WELCOME
; Directory Selection
!insertmacro MUI_PAGE_DIRECTORY
; Installation Process
!insertmacro MUI_PAGE_INSTFILES
; Finish Page
!define MUI_FINISHPAGE_RUN "$INSTDIR\start.bat"
!define MUI_FINISHPAGE_RUN_TEXT "Launch GitHub Contribution Heatmap"
!insertmacro MUI_PAGE_FINISH

; Uninstall Confirmation
!insertmacro MUI_UNPAGE_CONFIRM
; Uninstall Process
!insertmacro MUI_UNPAGE_INSTFILES

; Language
!insertmacro MUI_LANGUAGE "SimpChinese"

; ============================================
; Installation Section
; ============================================
Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  
  ; Copy project files (exclude node_modules)
  File "package.json"
  File "server.js"
  File ".env.example"
  File "README.md"
  File "docs\API_DOCUMENTATION.md"
  
  ; Copy subdirectories
  SetOutPath "$INSTDIR\services"
  File /r "services\*.*"
  
  SetOutPath "$INSTDIR\middleware"
  File /r "middleware\*.*"
  
  SetOutPath "$INSTDIR\config"
  File /r "config\*.*"
  
  SetOutPath "$INSTDIR\public"
  File /r "public\*.*"
  
  ; Create startup scripts
  SetOutPath "$INSTDIR"
  File "installer-files\start.bat"
  File "installer-files\stop.bat"
  File "installer-files\uninstall.bat"
  
  ; Create .env config file
  IfFileExists "$INSTDIR\.env" skip_env
    File "installer-files\.env.template"
    Rename "$INSTDIR\.env.template" "$INSTDIR\.env"
  skip_env:
  
  ; Write registry for uninstall
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\GitHubHeatmap" \
                   "DisplayName" "GitHub Contribution Heatmap"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\GitHubHeatmap" \
                   "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\GitHubHeatmap" \
                   "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\GitHubHeatmap" \
                   "DisplayVersion" "1.2.0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\GitHubHeatmap" \
                   "Publisher" "GitHub Heatmap Team"
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"
  
  ; Create Start Menu shortcuts
  CreateDirectory "$SMPROGRAMS\GitHub Heatmap"
  CreateShortCut "$SMPROGRAMS\GitHub Heatmap\Start.lnk" "$INSTDIR\start.bat"
  CreateShortCut "$SMPROGRAMS\GitHub Heatmap\Stop.lnk" "$INSTDIR\stop.bat"
  CreateShortCut "$SMPROGRAMS\GitHub Heatmap\Uninstall.lnk" "$INSTDIR\uninstall.exe"
  CreateShortCut "$SMPROGRAMS\GitHub Heatmap\Open Browser.lnk" "http://localhost:3000"
  
  ; Create Desktop shortcut
  CreateShortCut "$DESKTOP\GitHub Heatmap.lnk" "$INSTDIR\start.bat"
  
SectionEnd

; ============================================
; Uninstall Section
; ============================================
Section "Uninstall"
  ; Stop running service
  ExecWait 'taskkill /F /IM node.exe'
  
  ; Delete installed files
  RMDir /r "$INSTDIR\node_modules"
  RMDir /r "$INSTDIR\services"
  RMDir /r "$INSTDIR\middleware"
  RMDir /r "$INSTDIR\config"
  RMDir /r "$INSTDIR\public"
  RMDir /r "$INSTDIR\logs"
  
  Delete "$INSTDIR\package.json"
  Delete "$INSTDIR\server.js"
  Delete "$INSTDIR\.env"
  Delete "$INSTDIR\.env.example"
  Delete "$INSTDIR\README.md"
  Delete "$INSTDIR\API_DOCUMENTATION.md"
  Delete "$INSTDIR\start.bat"
  Delete "$INSTDIR\stop.bat"
  Delete "$INSTDIR\uninstall.bat"
  Delete "$INSTDIR\uninstall.exe"
  
  ; Delete shortcuts
  Delete "$SMPROGRAMS\GitHub Heatmap\Start.lnk"
  Delete "$SMPROGRAMS\GitHub Heatmap\Stop.lnk"
  Delete "$SMPROGRAMS\GitHub Heatmap\Uninstall.lnk"
  Delete "$SMPROGRAMS\GitHub Heatmap\Open Browser.lnk"
  RMDir "$SMPROGRAMS\GitHub Heatmap"
  
  Delete "$DESKTOP\GitHub Heatmap.lnk"
  
  ; Delete registry keys
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\GitHubHeatmap"
  DeleteRegKey HKLM "Software\GitHubHeatmap"
  
  ; Delete installation directory
  RMDir "$INSTDIR"
  
  MessageBox MB_ICONINFORMATION|MB_OK "GitHub Contribution Heatmap has been successfully uninstalled!"
  
SectionEnd

; ============================================
; Description
; ============================================
!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SEC01} "GitHub Contribution Heatmap Main Program"
!insertmacro MUI_FUNCTION_DESCRIPTION_END
