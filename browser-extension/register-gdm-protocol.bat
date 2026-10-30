@echo off
echo ============================================================
echo   Goat Download Manager (GDM) - Windows Protocol Registration
echo ============================================================
echo.

set "APP_EXE=%LOCALAPPDATA%\Goat Download Manager\gdm.exe"

if not exist "%APP_EXE%" (
    echo [INFO] Searching for gdm.exe in standard locations...
    if exist "%ProgramFiles%\Goat Download Manager\gdm.exe" set "APP_EXE=%ProgramFiles%\Goat Download Manager\gdm.exe"
    if exist "%ProgramFiles(x86)%\Goat Download Manager\gdm.exe" set "APP_EXE=%ProgramFiles(x86)%\Goat Download Manager\gdm.exe"
)

if exist "%APP_EXE%" (
    reg add "HKCU\Software\Classes\gdm" /ve /d "URL:Goat Download Manager Protocol" /f >nul
    reg add "HKCU\Software\Classes\gdm" /v "URL Protocol" /d "" /f >nul
    reg add "HKCU\Software\Classes\gdm\shell\open\command" /ve /d "\"%APP_EXE%\" \"%%1\"" /f >nul

    reg add "HKCU\Software\Classes\parrot" /ve /d "URL:Parrot Protocol" /f >nul
    reg add "HKCU\Software\Classes\parrot" /v "URL Protocol" /d "" /f >nul
    reg add "HKCU\Software\Classes\parrot\shell\open\command" /ve /d "\"%APP_EXE%\" \"%%1\"" /f >nul

    echo [SUCCESS] gdm:// protocol registered successfully!
    echo Target executable: "%APP_EXE%"
) else (
    echo [WARNING] gdm.exe not found at standard path. It will automatically register on first app launch.
)

echo.
echo ============================================================
echo   Browser Extension Installation Instructions:
echo ============================================================
echo 1. Open Google Chrome, Brave, or Microsoft Edge.
echo 2. Navigate to: chrome://extensions or edge://extensions
echo 3. Enable 'Developer mode' (toggle in top-right corner).
echo 4. Click 'Load unpacked'.
echo 5. Select this folder (browser-extension).
echo ============================================================
pause
