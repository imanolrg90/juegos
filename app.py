from flask import Flask, send_from_directory, request, jsonify
import os
import json
import webbrowser
from threading import Timer

app = Flask(__name__, static_folder='.', static_url_path='')

# --- CONFIGURACIÓN DE ARCHIVOS ---
FLAG_RANKING_FILE = 'ranking.json'
MUSIC_RANKING_FILE = 'music_ranking.json' # Nuevo archivo para música

# --- FUNCIONES AUXILIARES ---
def load_json_file(filename, default_structure):
    if not os.path.exists(filename):
        return default_structure
    with open(filename, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return default_structure

def save_json_file(filename, data):
    with open(filename, 'w') as f:
        json.dump(data, f)

# --- API BANDERAS (Ya la tenías) ---
@app.route('/api/ranking', methods=['GET'])
def get_flag_ranking():
    return jsonify(load_json_file(FLAG_RANKING_FILE, []))

@app.route('/api/ranking', methods=['POST'])
def save_flag_score():
    new_score = request.json
    ranking = load_json_file(FLAG_RANKING_FILE, [])
    ranking.append(new_score)
    # Ordenar por puntos y luego por tiempo
    ranking.sort(key=lambda x: (-int(x['points']), x.get('time', '99:99')))
    save_json_file(FLAG_RANKING_FILE, ranking[:10])
    return jsonify(ranking[:10])

# --- NUEVA API MÚSICA (En una Nota) ---
@app.route('/api/ranking/music', methods=['GET'])
def get_music_ranking():
    # Estructura por defecto con modos
    default = {"15": [], "30": [], "50": []} 
    return jsonify(load_json_file(MUSIC_RANKING_FILE, default))

@app.route('/api/ranking/music', methods=['POST'])
def save_music_ranking():
    # Aquí recibimos el objeto completo de rankings desde JS
    # para mantener la estructura de modos (15, 30, 50)
    all_rankings = request.json
    save_json_file(MUSIC_RANKING_FILE, all_rankings)
    return jsonify(all_rankings)

# --- RUTAS DE ARCHIVOS ESTÁTICOS ---
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

def open_browser():
    webbrowser.open_new("http://localhost:5002")

if __name__ == '__main__':
    port = 5002
    print(f"🚀 Servidor Multi-Juego listo en http://localhost:{port}")
    Timer(1, open_browser).start()
    app.run(host='0.0.0.0', port=port, debug=True)