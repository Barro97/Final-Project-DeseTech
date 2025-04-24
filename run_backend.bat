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

:: ---------- 4. Hash check on requirements.txt ---------------
set "HASH_FILE=%~dp0.req_hash"

:: Calculate current hash (one long string, no spaces)
for /f "delims=" %%i in ('
    certutil -hashfile requirements.txt SHA256 ^
    ^| find /i /v "sha256" ^
    ^| find /i /v "certutil"
') do set "current_hash=%%i"

set "current_hash=!current_hash: =!"  & rem strip all spaces

if exist "%HASH_FILE%" (
    set /p saved_hash=<"%HASH_FILE%"
    set "saved_hash=!saved_hash: =!"
) else (
    set "saved_hash="
)

if /i "!current_hash!" neq "!saved_hash!" (
    echo   Changes detected in requirements.txt. Installing...
    "%PYTHON%" -m pip install -r requirements.txt
    echo !current_hash!>"%HASH_FILE%"
) else (
    echo   requirements.txt unchanged. Skipping pip install.
)


:: 5. Navigate one folder up
cd ..

:: 6. Run the backend server
echo 🚀 Starting backend server...
uvicorn backend.main:app --reload --env-file backend/.env


pause
