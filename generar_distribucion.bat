@echo off
rem Script de empaquetado automático para Windows

echo ==========================================
echo Iniciando compilacion para DISTRIBUCION...
echo ==========================================

rem 1. Crear o limpiar la carpeta DISTRIBUCION
if exist DISTRIBUCION rmdir /s /q DISTRIBUCION
mkdir DISTRIBUCION
echo Carpeta DISTRIBUCION preparada.

rem 2. Compilar el cliente React
echo Compilando aplicacion de React...
cd client
call npm install
call npm run build
cd ..

rem 3. Copiar archivos compilados del cliente (index.html, assets, etc.)
echo Copiando archivos compilados del cliente...
xcopy /s /e /h /i "client\dist\*" "DISTRIBUCION\"

rem 4. Copiar la API de PHP
echo Copiando API de PHP...
mkdir "DISTRIBUCION\api"
rem El flag /h asegura que se copien los archivos ocultos (.htaccess)
xcopy /s /e /h /i "php_server\api\*" "DISTRIBUCION\api\"

echo ==========================================
echo ¡Completado!
echo Tu aplicacion esta lista en la carpeta DISTRIBUCION.
echo Puedes subir el CONTENIDO de esa carpeta por SFTP a la raiz de tu servidor.
echo IMPORTANTE: Recuerda dar permisos de escritura (chmod 777 o 775) al archivo 'DISTRIBUCION/api/db/nutrition.db' (una vez que se cree) en tu servidor para que SQLite pueda funcionar.
echo ==========================================
pause