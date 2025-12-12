from flask import Flask, send_from_directory
import os
import webbrowser
from threading import Timer

# Configuración: definimos la carpeta actual ('.') como carpeta estática
# static_url_path='' hace que no necesites poner /static/ delante de los archivos
app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def index():
    # Sirve el index.html principal
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Sirve cualquier otro archivo (css, js, carpetas de juegos)
    return send_from_directory('.', path)

def open_browser():
    webbrowser.open_new("http://localhost:5002")

if __name__ == '__main__':
    port = 5002
    print(f"🚀 Iniciando servidor Flask en http://localhost:{port}")
    
    # Abre el navegador automáticamente después de 1 segundo
    Timer(1, open_browser).start()
    
    # Inicia la app
    app.run(port=port, debug=True)