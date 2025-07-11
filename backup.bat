set zippath="C:\Program Files\7-Zip\"

set yyyy=%date:~0,4%
set mm=%date:~5,2%
set dd=%date:~8,2%
set time2=%time: =0%
 
set hh=%time2:~0,2%
set mn=%time2:~3,2%
set ss=%time2:~6,2%


set foldername=%yyyy%-%mm%%dd%-%hh%%mn%%ss%

set DIST=backup\%foldername%

mkdir %DIST%

xcopy MapAPISample %DIST%\MapAPISample  /e /I /Y /h
xcopy WebGIS-OA %DIST%\WebGIS-OA /e /I /Y /h
xcopy WebGIS %DIST%\WebGIS /e /I /Y /h
xcopy Sample %DIST%\Sample /e /I /Y /h
xcopy StreamList %DIST%\StreamList /e /I /Y /h

%zippath%7z.exe a backup\%USERDOMAIN%_%foldername%.zip %DIST%