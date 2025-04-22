@echo off
setlocal enabledelayedexpansion

:: 1. Move into backend folder (assumes script is placed one folder above it)
cd /d "%~dp0backend"

:: 2. Create virtual environment if not exists
if not exist "venv" (
    echo Creating virtual environment...
    py -m venv venv
)

:: 3. Activate virtual environment
call venv\Scripts\activate

:: 4. Check for changes in requirements.txt using hash
set "HASH_FILE=.req_hash"

:: Get current hash
for /f "delims=" %%i in ('certutil -hashfile requirements.txt SHA256 ^| find /i /v "SHA256" ^| find /i /v "certutil"') do (
    set "current_hash=%%i"
    goto :next
)
:next

:: Read saved hash if exists
if exist %HASH_FILE% (
    set /p saved_hash=<%HASH_FILE%
) else (
    set saved_hash=
)

:: Compare and install if different
if not "!current_hash!"=="!saved_hash!" (
    echo 📦 Changes detected in requirements.txt. Installing...
    pip install -r requirements.txt
    echo !current_hash! > %HASH_FILE%
) else (
    echo ✅ requirements.txt unchanged. Skipping pip install.
)

:: 5. Navigate one folder up
cd ..

:: 6. Run the backend server
echo 🚀 Starting backend server...
uvicorn backend.main:app --reload

pause
