@echo off
setlocal EnableDelayedExpansion

REM ─────────────────────────────────────────────────────────────────
REM  CONFIGURATION
REM ─────────────────────────────────────────────────────────────────
set "SCRIPT_DIR=%~dp0"
REM Remove trailing backslash if present
if "%SCRIPT_DIR:~-1%" == "\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "FRONTEND_DIR=%SCRIPT_DIR%\frontend"
set "HASH_FILE=%SCRIPT_DIR%\.package_hash"

echo [INFO] Using frontend directory: "%FRONTEND_DIR%"

REM ─────────────────────────────────────────────────────────────────
REM  1) CD into your frontend folder
REM ─────────────────────────────────────────────────────────────────
pushd "%FRONTEND_DIR%" >nul 2>&1 || (
  echo [ERROR] Cannot find "%FRONTEND_DIR%"
  pause & exit /b 1
)

REM ─────────────────────────────────────────────────────────────────
REM  2) Pick the lock file (npm↓ / pnpm / yarn)
REM ─────────────────────────────────────────────────────────────────
if exist package-lock.json (
  set "LOCK_FILE=package-lock.json"
) else if exist pnpm-lock.yaml (
  set "LOCK_FILE=pnpm-lock.yaml"
) else if exist yarn.lock (
  set "LOCK_FILE=yarn.lock"
) else (
  echo [ERROR] No lock file found.
  popd & pause & exit /b 1
)

REM ─────────────────────────────────────────────────────────────────
REM  3) Compute current SHA-256 of the lock file
REM ─────────────────────────────────────────────────────────────────
set "current_hash="
for /f "usebackq tokens=* delims=" %%H in (`
  certutil -hashfile "%LOCK_FILE%" SHA256 ^
  ^| findstr /v "CertUtil: -hashfile command" ^
  ^| findstr /v "SHA256"
`) do (
  set "current_hash=%%H"
)
set "current_hash=!current_hash: =!"
if "!current_hash!" == "" (
  echo [ERROR] Failed to compute hash for "%LOCK_FILE%"
  popd & pause & exit /b 1
)

REM ─────────────────────────────────────────────────────────────────
REM  4) Read the saved hash (strips CR/LF)
REM ─────────────────────────────────────────────────────────────────
set "saved_hash="
if exist "%HASH_FILE%" (
  for /f "usebackq tokens=* delims=" %%H in ("%HASH_FILE%") do (
    set "saved_hash=%%H"
  )
)

REM Debug information
echo [DEBUG] Current lock file: "%LOCK_FILE%"
echo [DEBUG] Current hash: !current_hash!
echo [DEBUG] Saved hash: !saved_hash!

REM ─────────────────────────────────────────────────────────────────
REM  5) Only install if hash changed
REM ─────────────────────────────────────────────────────────────────
if /i "!current_hash!" neq "!saved_hash!" (
  echo [INFO] 📦 Installing/updating node modules...
  echo [INFO] Running 'npm ci'...
  call npm ci
  if errorlevel 1 (
    echo [INFO] npm ci failed, trying 'npm install'...
    call npm install
    if errorlevel 1 (
      echo [ERROR] npm install failed. Please check your package.json and try again.
      popd & pause & exit /b 1
    )
  )
  echo [INFO] ✅ Packages installed successfully.
  echo !current_hash!>"%HASH_FILE%"
) else (
  echo [INFO] ✅ Dependencies unchanged. Skipping install.
)

REM ─────────────────────────────────────────────────────────────────
REM  6) Start the dev server (foreground—this window becomes your server)
REM ─────────────────────────────────────────────────────────────────
echo [INFO] 🚀 Starting frontend development server...
call npm run dev

REM once the server exits, we return here
popd
echo [INFO] Server stopped. Press any key to exit.
pause

