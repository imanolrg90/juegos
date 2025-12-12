@echo off
:: Cambiamos la codificación a UTF-8 para que los acentos se vean bien
chcp 65001 >nul

set "carpeta=C:\Users\imano\PycharmProjects\BINGO MUSICAL\songs"

echo const sourceSongs = [

:: Bucle FOR para iterar sobre los archivos .mp3
:: %%~nxF = Nombre de archivo y eXtensión (ej: cancion.mp3)
:: %%~nF  = Nombre de archivo solamente (ej: cancion)
for %%F in ("%carpeta%\*.mp3") do (
    echo     { file: "%%~nxF", title: "%%~nF" },
)

echo ];

:: Pausa para que veas el resultado si le das doble clic
pause