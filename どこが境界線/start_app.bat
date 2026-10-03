@echo off
chcp 65001 > NUL
echo ========================================================
echo   「どこが境界線？」展示アプリ 本番スタートスクリプト
echo ========================================================
echo.
echo [1/2] データ同期サーバー ＆ Webサーバーを起動しています...
cd /d "%~dp0"

start "Boundary-Server" cmd /k "npm run server"
start "Boundary-Vite-Web" cmd /k "npm run dev"

echo サーバーの準備中... (3秒待機)
timeout /t 3 > NUL

echo.
echo [2/2] ブラウザで各画面を自動起動します...
start http://localhost:5173/?mode=vessel_only
start http://localhost:5173/?mode=input
start http://localhost:5173/?mode=exhibition

echo.
echo ========================================================
echo   すべての画面が起動しました！
echo   ※黒いコマンド画面は閉じるまでアプリが動作し続けます。
echo ========================================================
