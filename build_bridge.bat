@echo off
echo ===================================
echo 🏗️  Building Auth Bridge Executable
echo ===================================

echo.
echo 📦 Installing PyInstaller...
pip install pyinstaller pycryptodome
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies.
    pause
    exit /b %errorlevel%
)

echo.
echo 🔨 Compiling auth_bridge.py...
pyinstaller --noconsole --onefile --name auth_bridge app/auth_bridge.py
if %errorlevel% neq 0 (
    echo ❌ Compilation failed.
    pause
    exit /b %errorlevel%
)

echo.
echo 📂 Moving Executable to app/bin/...
if not exist "app\bin" mkdir "app\bin"
move /Y "dist\auth_bridge.exe" "app\bin\auth_bridge.exe"

echo.
echo 🧹 Cleaning up...
rmdir /s /q build
rmdir /s /q dist
del /q auth_bridge.spec

echo.
echo ===================================
echo ✅ Build Complete!
echo 📍 app/bin/auth_bridge.exe created.
echo ===================================
pause
