set WORKDIR=\\fsdat01\D\DM\SETUP_AVM

set INDIR=\\fsdat01\D\ama\DATA\Mp\map
set OLDDIR=%WORKDIR%\oldFiles
set OUTDIR=%WORKDIR%

set ZIPDIR=%WORKDIR%\zip
set BINPATH=%WORKDIR%\bin

set MSTPATH_AVM=\\avmcent\e\FLOEX\FTP\naviwork\naviupdate\mst2

del %ZIPDIR%\usrlay.zip

%BINPATH%\CopyDiffImage.exe %INDIR%\usrlay %OLDDIR%\usrlay %OUTDIR%\usrlay

%BINPATH%\CCLZip.exe %OUTDIR%\usrlay %ZIPDIR%\usrlay.zip

rem AVMサーバと各署所にコピー

:copy

if not exist %ZIPDIR%\usrlay.zip goto :list

copy %ZIPDIR%\usrlay.zip %MSTPATH_AVM%
for /f %%I in (syo.txt ) do copy %ZIPDIR%\usrlay.zip %%I\D\FTP\naviwork\naviupdate\mst2


:list

rem AVMサーバのCreateUsrLayVersionを実行

@echo CCL_CreateUserLayVersion.exeを実行
call %MSTPATH_AVM%\CCL_CreateUserLayVersion.exe


