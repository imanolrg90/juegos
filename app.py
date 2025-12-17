from flask import Flask, send_from_directory, request, jsonify
import os
import json
from datetime import datetime

# --- CONFIGURACIÓN DEL SERVIDOR ---
app = Flask(__name__, static_folder='.', static_url_path='')

# Rutas de archivos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RANKING_FILE = os.path.join(BASE_DIR, 'ranking.json')

def load_ranking():
    """Carga de forma segura los datos del ranking desde el archivo JSON."""
    if os.path.exists(RANKING_FILE):
        try:
            with open(RANKING_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error de lectura en {RANKING_FILE}: {e}")
            return []
    return []

def save_ranking(ranking_data):
    """Guarda los datos del ranking en el archivo JSON con formato legible."""
    try:
        with open(RANKING_FILE, 'w', encoding='utf-8') as f:
            json.dump(ranking_data, f, indent=4, ensure_ascii=False)
        return True
    except IOError as e:
        print(f"Error de escritura en {RANKING_FILE}: {e}")
        return False

# --- ENDPOINTS DE LA API ---

@app.route('/api/ranking', methods=['GET'])
def get_ranking():
    """
    Retorna el Top 10 del ranking.
    Ordenado por: Puntos (Descendente) y Tiempo en segundos (Ascendente).
    """
    ranking = load_ranking()
    # Lógica de ordenamiento profesional: prioriza aciertos, luego rapidez
    sorted_ranking = sorted(
        ranking, 
        key=lambda x: (-int(x.get('points', 0)), x.get('timeSeconds', 999999))
    )
    return jsonify(sorted_ranking[:10])

@app.route('/api/ranking', methods=['POST'])
def add_score():
    """
    Registra una nueva puntuación.
    Añade automáticamente metadatos como la fecha actual.
    """
    new_entry = request.json
    if not new_entry or 'name' not in new_entry:
        return jsonify({"error": "Payload inválido o nombre ausente"}), 400
    
    # Inyectar fecha del servidor para evitar manipulaciones en el cliente
    new_entry['date'] = datetime.now().strftime("%d/%m/%Y %H:%M")
        
    ranking = load_ranking()
    ranking.append(new_entry)
    
    if save_ranking(ranking):
        return jsonify({"success": True, "status": "Puntuación registrada con éxito"})
    else:
        return jsonify({"error": "No se pudo persistir la información"}), 500

# --- RUTAS DE NAVEGACIÓN ESTÁTICA ---

@app.route('/')
def index():
    """Ruta principal: sirve el punto de entrada de la aplicación."""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Sirve archivos estáticos (imágenes, fuentes, etc.)."""
    return send_from_directory('.', path)

if __name__ == '__main__':
    # Configuración de puerto profesional para desarrollo local
    PORT = 5002
    print(f"[*] FlagMaster Pro (Dark Edition) iniciado.")
    print(f"[*] Accede en: http://localhost:{PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=True)