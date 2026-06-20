
# ==========================================
# 6. LÓGICA DEL JUEGO: PICTIONARY (ONLINE)
# ==========================================

import random
import json
import os

pictionary_state = {
    "teams": [],          # Lista de dicts: [{"name": "EQUIPO A", "score": 0}]
    "current_team": None,  # Nombre del equipo que dibuja
    "current_word": "",    # Palabra elegida al azar
    "canvas_image": "",    # Stream Base64 de la imagen del lienzo
    "phase": "lobby",      # "lobby" o "playing"
}

# Cargar la librería completa de 1000 palabras generada
WORDS_FILE = os.path.join('pictionary', 'words.json')
try:
    with open(WORDS_FILE, 'r', encoding='utf-8') as f:
        pictionary_words = json.load(f)
except Exception:
    pictionary_words = ["Mesa", "Gato", "Arbol", "Manzana", "Coche", "Avion", "Sol", "Luna", "Perro", "Casa"]

@app.route('/pictionary/tv')
def pictionary_tv_ui():
    return send_from_directory('pictionary', 'tv.html')

@app.route('/pictionary/mobile')
def pictionary_mobile_ui():
    return send_from_directory('pictionary', 'mobile.html')

@app.route('/api/pictionary/state', methods=['GET'])
def get_pictionary_state():
    role = request.args.get('role', 'tv')
    # Ocultar la palabra a la televisión para evitar trampas
    response_data = {
        "teams": pictionary_state["teams"],
        "current_team": pictionary_state["current_team"],
        "phase": pictionary_state["phase"]
    }
    if role == 'mobile':
        response_data["current_word"] = pictionary_state["current_word"]
    return jsonify(response_data)

@app.route('/api/pictionary/set_teams', methods=['POST'])
def pictionary_add_team():
    name = request.json.get('name', '').strip().upper()
    if name and not any(t['name'] == name for t in pictionary_state["teams"]):
        pictionary_state["teams"].append({"name": name, "score": 0})
    return jsonify({"success": True})

@app.route('/api/pictionary/start_round', methods=['POST'])
def pictionary_start_round():
    if not pictionary_state["teams"]:
        return jsonify({"error": "No hay equipos"}), 400
        
    pictionary_state["phase"] = "playing"
    pictionary_state["canvas_image"] = "" # Limpiar dibujo de la ronda anterior
    
    # Elegir equipo aleatorio
    pictionary_state["current_team"] = random.choice(pictionary_state["teams"])["name"]
    
    # Elegir palabra aleatoria de la base de 1000 palabras
    pictionary_state["current_word"] = random.choice(pictionary_words)
    
    return jsonify({"success": True})

@app.route('/api/pictionary/upload_canvas', methods=['POST'])
def pictionary_upload_canvas():
    pictionary_state["canvas_image"] = request.json.get('image', '')
    return jsonify({"success": True})

@app.route('/api/pictionary/get_canvas', methods=['GET'])
def pictionary_get_canvas():
    return jsonify({"image": pictionary_state["canvas_image"]})

@app.route('/api/pictionary/score', methods=['POST'])
def pictionary_add_score():
    current_team_name = pictionary_state["current_team"]
    for team in pictionary_state["teams"]:
        if team["name"] == current_team_name:
            team["score"] += 1
            break
    # Avanza automáticamente eligiendo nueva palabra y equipo
    pictionary_state["canvas_image"] = ""
    pictionary_state["current_team"] = random.choice(pictionary_state["teams"])["name"]
    pictionary_state["current_word"] = random.choice(pictionary_words)
    return jsonify({"success": True})

@app.route('/api/pictionary/reset', methods=['POST'])
def pictionary_reset_game():
    global pictionary_state
    pictionary_state = {
        "teams": [],
        "current_team": None,
        "current_word": "",
        "canvas_image": "",
        "phase": "lobby",
    }
    return jsonify({"success": True})
