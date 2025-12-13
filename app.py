from flask import Flask, send_from_directory, request, jsonify
import os
import json
import webbrowser
from threading import Timer

app = Flask(__name__, static_folder='.', static_url_path='')

# --- CONFIGURACIÓN DE ARCHIVOS ---
FLAG_RANKING_FILE = 'ranking.json'
MUSIC_RANKING_FILE = 'music_ranking.json'
BASE_SONGS_DIR = os.path.join('.', 'assets', 'songs') # Ruta base definida

# --- FUNCIONES AUXILIARES (Igual que antes) ---
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

# --- API BANDERAS (Igual que antes) ---
@app.route('/api/ranking', methods=['GET'])
def get_flag_ranking():
    return jsonify(load_json_file(FLAG_RANKING_FILE, []))

@app.route('/api/ranking', methods=['POST'])
def save_flag_score():
    new_score = request.json
    ranking = load_json_file(FLAG_RANKING_FILE, [])
    ranking.append(new_score)
    ranking.sort(key=lambda x: (-int(x['points']), x.get('time', '99:99')))
    save_json_file(FLAG_RANKING_FILE, ranking[:10])
    return jsonify(ranking[:10])

# --- API MÚSICA (RANKING) ---
@app.route('/api/ranking/music', methods=['GET'])
def get_music_ranking():
    default = {"15": [], "30": [], "50": []} 
    return jsonify(load_json_file(MUSIC_RANKING_FILE, default))

@app.route('/api/ranking/music', methods=['POST'])
def save_music_ranking():
    all_rankings = request.json
    save_json_file(MUSIC_RANKING_FILE, all_rankings)
    return jsonify(all_rankings)

# --- NUEVA API: LISTAR CATEGORIAS (CARPETAS) ---
@app.route('/api/songs/categories', methods=['GET'])
def get_song_categories():
    if not os.path.exists(BASE_SONGS_DIR):
        return jsonify([])
    
    # Listar solo directorios dentro de assets/songs
    categories = [d for d in os.listdir(BASE_SONGS_DIR) 
                  if os.path.isdir(os.path.join(BASE_SONGS_DIR, d))]
    return jsonify(categories)

# --- API MODIFICADA: OBTENER CANCIONES DE UNA CATEGORÍA ---
@app.route('/api/songs-list', methods=['GET'])
def get_songs_from_folder():
    # Obtenemos el parámetro 'category' de la URL (?category=Pop)
    category = request.args.get('category')
    
    if not category:
        return jsonify([])

    # Construimos la ruta: assets/songs/NOMBRE_CATEGORIA
    target_dir = os.path.join(BASE_SONGS_DIR, category)
    
    songs_list = []
    
    if not os.path.exists(target_dir):
        return jsonify([])

    for filename in os.listdir(target_dir):
        if filename.lower().endswith(('.mp3', '.opus', '.wav', '.m4a')):
            name_without_ext = os.path.splitext(filename)[0]
            parts = name_without_ext.split(' - ')
            
            if len(parts) >= 2:
                title_display = name_without_ext 
            else:
                title_display = name_without_ext

            # IMPORTANTE: Ahora el 'file' debe incluir la carpeta para que el frontend lo encuentre
            # Ejemplo: "Pop/Madonna - Holiday.mp3"
            # Pero como servimos estáticos desde la raíz, enviaremos la ruta relativa dentro de assets/songs
            
            relative_path = f"{category}/{filename}"

            songs_list.append({
                "file": relative_path, 
                "title": title_display,
                "patrocinador": None,
                "imagen": None
            })
            
    return jsonify(songs_list)

# --- RUTAS ESTÁTICAS (Igual que antes) ---
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