@echo off
setlocal EnableDelayedExpansion

REM ─────────────────────────────────────────────────────────────────
REM  CONFIGURATION
REM ─────────────────────────────────────────────────────────────────
set "SCRIPT_DIR=%~dp0"
set "FRONTEND_DIR=%SCRIPT_DIR%frontend"
set "HASH_FILE=%SCRIPT_DIR%.package_hash"

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
for /f "usebackq delims=" %%H in (`
  certutil -hashfile "%LOCK_FILE%" SHA256 ^
  ^| findstr /iv "sha256" ^
  ^| findstr /iv "certutil"
`) do (
  set "current_hash=%%H"
)
set "current_hash=!current_hash: =!"

REM ─────────────────────────────────────────────────────────────────
REM  4) Read the saved hash (strips CR/LF)
REM ─────────────────────────────────────────────────────────────────
set "saved_hash="
if exist "%HASH_FILE%" for /f "delims=" %%H in ('type "%HASH_FILE%"') do (
  set "saved_hash=%%H"
)

REM (optional) debug
echo current_hash = !current_hash!
echo saved_hash   = !saved_hash!

REM ─────────────────────────────────────────────────────────────────
REM  5) Only install if hash changed
REM ─────────────────────────────────────────────────────────────────
if /i "!current_hash!" neq "!saved_hash!" (
  echo 📦  Installing / updating node modules…
  call npm ci || call npm install || (
    echo [ERROR] npm install failed.
    popd & pause & exit /b 1
  )
  >"%HASH_FILE%" echo !current_hash!
) else (
  echo ✅  Dependencies unchanged. Skipping install.
)

REM ─────────────────────────────────────────────────────────────────
REM  6) Start the dev server (foreground—this window becomes your server)
REM ─────────────────────────────────────────────────────────────────
echo 🚀  Launching frontend…
call npm run dev

REM once the server exits, we return here
popd
pause

