@echo off
echo Listing file:
dir /a "\\?\c:\Users\linco\OneDrive\Desktop\GITHUB\fit-wizardly\nul"
echo.
echo Attempting delete:
del /F /Q "\\?\c:\Users\linco\OneDrive\Desktop\GITHUB\fit-wizardly\nul"
echo.
echo Git Status:
git status
echo.
echo Done.
