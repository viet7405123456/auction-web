@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "PROJECT_DIR=%~dp0"
set "WRAPPER_PROPERTIES=%PROJECT_DIR%.mvn\wrapper\maven-wrapper.properties"
set "MAVEN_VERSION=3.9.12"
set "MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists\apache-maven-%MAVEN_VERSION%"
set "MAVEN_DIR=%MAVEN_HOME%\apache-maven-%MAVEN_VERSION%"
set "ZIP_FILE=%MAVEN_HOME%\apache-maven-%MAVEN_VERSION%-bin.zip"

for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b /c:"distributionUrl=" "%WRAPPER_PROPERTIES%"`) do set "DISTRIBUTION_URL=%%B"

if not defined DISTRIBUTION_URL (
  set "DISTRIBUTION_URL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip"
)

if not exist "%MAVEN_DIR%\bin\mvn.cmd" (
  if not exist "%MAVEN_HOME%" mkdir "%MAVEN_HOME%"
  echo Downloading Maven %MAVEN_VERSION%...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '%DISTRIBUTION_URL%' -OutFile '%ZIP_FILE%'"
  if errorlevel 1 goto download_failed
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%MAVEN_HOME%' -Force"
  if errorlevel 1 goto unzip_failed
)

call "%MAVEN_DIR%\bin\mvn.cmd" %*
exit /b %errorlevel%

:download_failed
echo Failed to download Maven distribution.
exit /b 1

:unzip_failed
echo Failed to unpack Maven distribution.
exit /b 1