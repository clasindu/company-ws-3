@echo off
REM Serves this folder on http://localhost:8123 and opens it in your browser.
REM Use this rather than double-clicking index.html: browsers block web font
REM files loaded straight from disk, so the page would fall back to a system
REM font instead of Inter.

cd /d "%~dp0"
set PORT=8123

where py >nul 2>&1
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/"
  py -3 -m http.server %PORT%
  goto :eof
)

where python >nul 2>&1
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/"
  python -m http.server %PORT%
  goto :eof
)

where npx >nul 2>&1
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/"
  npx --yes http-server -p %PORT% -c-1
  goto :eof
)

echo Could not find Python or Node on this machine.
echo Install either one, or open index.html directly and accept the fallback font.
pause
