@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     Установка системы мониторинга отключений АЭС          ║
echo ║     Автоматическая настройка окружения                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: Проверка прав администратора
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ОШИБКА] Требуются права администратора!
    echo          Запустите скрипт от имени администратора.
    echo.
    pause
    exit /b 1
)

echo [1/6] Проверка Node.js...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo        Node.js не найден. Устанавливаю...
    
    :: Скачиваем Node.js installer
    echo        Скачивание Node.js v20 LTS...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%TEMP%\node_installer.msi'}"
    
    if exist "%TEMP%\node_installer.msi" (
        echo        Установка Node.js...
        msiexec /i "%TEMP%\node_installer.msi" /qn /norestart
        
        :: Обновляем PATH для текущей сессии
        set "PATH=%PATH%;C:\Program Files\nodejs"
        
        :: Ждём завершения установки
        timeout /t 10 /nobreak >nul
        
        del "%TEMP%\node_installer.msi"
        echo        [OK] Node.js установлен
    ) else (
        echo        [ОШИБКА] Не удалось скачать Node.js
        echo        Скачайте вручную: https://nodejs.org
        pause
        exit /b 1
    )
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
    echo        [OK] Node.js !NODE_VER! уже установлен
)

echo.
echo [2/6] Установка зависимостей клиента...
cd /d "%~dp0client"
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo        [ОШИБКА] Не удалось установить зависимости клиента
        pause
        exit /b 1
    )
)
echo        [OK] Зависимости клиента установлены

echo.
echo [3/6] Установка зависимостей сервера...
cd /d "%~dp0server"
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo        [ОШИБКА] Не удалось установить зависимости сервера
        pause
        exit /b 1
    )
)
echo        [OK] Зависимости сервера установлены

echo.
echo [4/6] Генерация Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo        [ПРЕДУПРЕЖДЕНИЕ] Prisma client уже сгенерирован или ошибка
)
echo        [OK] Prisma Client готов

echo.
echo [5/6] Сборка клиента...
cd /d "%~dp0client"
call npm run build
if errorlevel 1 (
    echo        [ОШИБКА] Не удалось собрать клиент
    pause
    exit /b 1
)
echo        [OK] Клиент собран

echo.
echo [6/6] Проверка базы данных...
cd /d "%~dp0server"
if not exist "dev.db" (
    echo        База данных не найдена. Создаю...
    call npx prisma db push
    call npm run seed
    echo        [OK] База данных создана
) else (
    echo        [OK] База данных существует
)

cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                   УСТАНОВКА ЗАВЕРШЕНА!                     ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  Для запуска сервера выполните: start_server.bat           ║
echo ║  Затем откройте в браузере: http://localhost:3001          ║
echo ║                                                            ║
echo ║  Для доступа из сети используйте IP этого компьютера       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: Показать IP адреса
echo Доступные адреса в локальной сети:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do echo   http://%%b:3001
)
echo.

set /p RUNSERVER="Запустить сервер сейчас? (Y/N): "
if /i "%RUNSERVER%"=="Y" (
    call "%~dp0start_server.bat"
)

pause
