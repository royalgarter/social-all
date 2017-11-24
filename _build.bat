if exist nwjs-v0.26.6-win-x64.zip (
    echo nwjs exists
) else (
    curl -O https://dl.nwjs.io/v0.26.6/nwjs-v0.26.6-win-x64.zip
)
rmdir /sq .\nw
7za x nwjs-v0.26.6-win-x64.zip
ren nwjs-v0.26.6-win-x64 nw
7za a -tzip webview.nw *.js *.json *.html *.css ./assets ./lib
copy /bY ".\nw\nw.exe"+webview.nw webview.exe
move /Y webview.exe .\nw
del /Q webview.nw

