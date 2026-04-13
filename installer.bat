@echo off

REM
REM マップルナビコンポーネント(MNC) インストーラ
REM
REM 株式会社マップル
REM 2018/5/23
REM

set SRC_DATA_DIR=%~d0%~p0Data
set SRC_APP_DIR=%~d0%~p0APP
set SRC_DOC_DIR=%~d0%~p0Documents
set SRC_SAMPLE_DIR=%~d0%~p0Samples
set DST_DIR=%ALLUSERSPROFILE%\Mapple\MNC_V10.0\

goto :reg

mkdir "%DST_DIR%"    > NUL 2>&1

REM データのコピー
xcopy "%SRC_DATA_DIR%"   "%DST_DIR%"           /E /Y /D /F

REM アプリケーションのコピー
xcopy "%SRC_APP_DIR%"    "%DST_DIR%APP\"       /E /Y /D /F

REM ドキュメントのコピー
xcopy "%SRC_DOC_DIR%"    "%DST_DIR%Documents\" /E /Y /D /F

REM サンプルコードとアプリケーションのコピー
xcopy "%SRC_SAMPLE_DIR%" "%DST_DIR%Samples\"   /E /Y /D /F


:reg

REM ActiveXコントロールの登録（管理者権限必須）
regsvr32 /s "%DST_DIR%\APP\Win32\MNC.dll"
regsvr32 /s "%DST_DIR%\APP\x64\MNC.dll"

pause
