@echo off
echo ============================================================
echo   GM Downloader - Parrot Protocol & Extension Setup
echo ============================================================
echo.

set "APP_EXE=%LOCALAPPDATA%\GM Downloader\gm-downloader.exe"

if not exist "%APP_EXE%" (
    echo [WARNING] gm-downloader.exe not found at standard location:
    echo   "%APP_EXE%"
    echo If you have a portable version, please specify the path.
    set /p APP_EXE="Enter full path to gm-downloader.exe (or press Enter to skip): "
)

if exist "%APP_EXE%" (
    reg add "HKCU\Software\Classes\parrot" /ve /d "URL:Parrot Protocol" /f >nul
    reg add "HKCU\Software\Classes\parrot" /v "URL Protocol" /d "" /f >nul
    reg add "HKCU\Software\Classes\parrot\shell\open\command" /ve /d "\"%APP_EXE%\" \"%%1\"" /f >nul

    reg add "HKCU\Software\Classes\gmdownloader" /ve /d "URL:GM Downloader Protocol" /f >nul
    reg add "HKCU\Software\Classes\gmdownloader" /v "URL Protocol" /d "" /f >nul
    reg add "HKCU\Software\Classes\gmdownloader\shell\open\command" /ve /d "\"%APP_EXE%\" \"%%1\"" /f >nul

    echo [SUCCESS] parrot:// and gmdownloader:// protocols registered successfully!
    echo Target executable: "%APP_EXE%"
) else (
    echo [ERROR] Could not register protocol because executable path was invalid.
)

echo.
echo ============================================================
echo   Browser Extension Installation Instructions:
echo ============================================================
echo 1. Open Google Chrome, Brave, or Microsoft Edge.
echo 2. Navigate to: chrome://extensions or brave://extensions
echo 3. Enable 'Developer mode' (toggle in top-right corner).
echo 4. Click 'Load unpacked'.
echo 5. Select this folder:
echo    D:\Extensions\download-with-parrot
echo.
echo Now you can right-click any video or link and click "Download with Parrot"!
echo ============================================================
pause
