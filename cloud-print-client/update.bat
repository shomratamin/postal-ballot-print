@echo off
echo Waiting for application to close...
timeout /t 3 /nobreak >nul
echo Applying update...

:retry
echo Stopping any running processes...
taskkill /F /IM "main.exe" >nul 2>&1
timeout /t 1 /nobreak >nul

echo Copying new executable...
copy /Y "C:\Users\Adnan\AppData\Local\Temp\cloud-print-client-update.exe" "D:\projects\ec ballot\kafka\postal-ballot-print\cloud-print-client\main.exe" >nul 2>&1
if errorlevel 1 (
    echo Waiting for file to be released...
    timeout /t 2 /nobreak >nul
    goto retry
)

echo Starting updated application...
start "" "D:\projects\ec ballot\kafka\postal-ballot-print\cloud-print-client\main.exe"

echo Update completed successfully!
timeout /t 2 /nobreak >nul
echo Cleaning up...
del "D:\projects\ec ballot\kafka\postal-ballot-print\cloud-print-client\update.bat" >nul 2>&1
del "%~f0" >nul 2>&1
