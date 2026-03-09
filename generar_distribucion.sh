#!/bin/bash
# Script de empaquetado automático para Linux/Mac

echo "=========================================="
echo "Iniciando compilación para DISTRIBUCIÓN..."
echo "=========================================="

# 1. Crear o limpiar la carpeta DISTRIBUCION
rm -rf DISTRIBUCION
mkdir DISTRIBUCION
echo "Carpeta DISTRIBUCION preparada."

# 2. Compilar el cliente React
echo "Compilando aplicación de React..."
cd client
npm install
npm run build
cd ..

# 3. Copiar archivos compilados del cliente (index.html, assets, etc.)
echo "Copiando archivos compilados del cliente..."
cp -r client/dist/* DISTRIBUCION/

# 4. Copiar la API de PHP
echo "Copiando API de PHP..."
mkdir -p DISTRIBUCION/api
# Usamos un punto al final para asegurar que se copien los archivos ocultos (.htaccess)
cp -r php_server/api/. DISTRIBUCION/api/

# 5. Asegurar permisos locales (opcional)
chmod -R 755 DISTRIBUCION

echo "=========================================="
echo "¡Completado!"
echo "Tu aplicación está lista en la carpeta DISTRIBUCION."
echo "Puedes subir el CONTENIDO de esa carpeta por SFTP a la raíz de tu servidor."
echo "IMPORTANTE: Recuerda dar permisos de escritura (chmod 777 o 775) a la carpeta 'DISTRIBUCION/api/db' en tu servidor para que SQLite pueda funcionar."
echo "=========================================="