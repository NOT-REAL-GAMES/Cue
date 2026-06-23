@echo off
setlocal

if "%~1"=="" (
  echo Drag one or more .cue files onto this batch file to parse and render them.
  echo.
  pause
  exit /b 1
)

:parse_next
if "%~1"=="" goto done

set "INPUT=%~1"
set "JSON_OUTPUT=%~dpn1.json"
set "HTML_OUTPUT=%~dpn1.html"

echo Parsing "%INPUT%"
node "%~dp0bin\cue.js" parse "%INPUT%" > "%JSON_OUTPUT%"

if errorlevel 1 (
  echo Failed to parse "%INPUT%"
) else (
  echo Wrote "%JSON_OUTPUT%"
  echo Rendering "%INPUT%"
  node "%~dp0bin\cue.js" html "%INPUT%" -o "%HTML_OUTPUT%"

  if errorlevel 1 (
    echo Failed to render "%INPUT%"
  ) else (
    echo Wrote "%HTML_OUTPUT%"
  )
)

shift
goto parse_next

:done
echo.
echo Done.
pause
