from flask import Flask, send_from_directory, request, jsonify
import os
import random

app = Flask(__name__, static_folder='.', static_url_path='')

# --- DATOS DEL JUEGO (PALABRAS) ---
# He copiado una versión reducida de tu JS para que funcione el Python
WORD_DATA = {
    "profesiones": ["Abogado", "Astronauta", "Bombero", "Cocinero", "Dentista", "Médico", "Policía", "Profesor", "Youtuber"],
    "animales": ["Águila", "Ballena", "Caballo", "Delfín", "Elefante", "Gato", "León", "Perro", "Tigre"],
    "comida": ["Hamburguesa", "Pizza", "Sushi", "Paella", "Tacos", "Helado", "Chocolate", "Ensalada"],
    "lugares": ["Hospital", "Colegio", "Playa", "Montaña", "Cine", "Aeropuerto", "Restaurante"],
    "objetos": ["Teléfono", "Ordenador", "Silla", "Cama", "Coche", "Reloj", "Gafas", "Llave"]
}

# --- ESTADO GLOBAL (EN MEMORIA) ---
game_state = {
    "phase": "lobby",  # lobby, playing, voting, result
    "players": [],     # Lista de dicts: {name, icon, role, is_dead, votes, ip}
    "theme": "",
    "secret_word": "",
    "impostors": [],   # Lista de nombres de impostores
    "winner": None     # crew o impostor
}

def get_player(name):
    return next((p for p in game_state["players"] if p["name"] == name), None)

# --- RUTAS API (CONTROL Y TV) ---

@app.route('/api/join', methods=['POST'])
def join_game():
    data = request.json
    name = data.get('name', '').strip().upper()
    icon = data.get('icon')

    if game_state['phase'] != 'lobby':
        return jsonify({"error": "Partida ya iniciada"}), 400
    if get_player(name):
        return jsonify({"error": "Nombre ya en uso"}), 400
    
    # Crear jugador
    new_player = {
        "name": name,
        "icon": icon,
        "role": "crew",   # Se define al iniciar
        "is_dead": False,
        "votes": 0,
        "vote_target": None # A quién votó
    }
    game_state['players'].append(new_player)
    return jsonify({"success": True})

@app.route('/api/tv/state', methods=['GET'])
def get_tv_state():
    public_players = []
    for p in game_state['players']:
        public_players.append({
            "name": p["name"],
            "icon": p["icon"],
            "is_dead": p["is_dead"],
            "votes": p["votes"] if game_state['phase'] == 'voting' else 0
        })

    return jsonify({
        "phase": game_state['phase'],
        "theme": game_state['theme'],
        "players": public_players,
        "winner": game_state['winner'],
        # --- NUEVO: ENVIAR EL JUGADOR QUE EMPIEZA ---
        "starting_player": game_state.get('starting_player', '')
        # --------------------------------------------
    })

@app.route('/api/player/status', methods=['GET'])
def get_player_status():
    name = request.args.get('name', '').upper()
    player = get_player(name)
    
    if not player:
        return jsonify({"error": "Jugador no encontrado"}), 404

    # Información privada para el móvil
    return jsonify({
        "phase": game_state['phase'],
        "role": player['role'],
        "is_dead": player['is_dead'],
        "secret_word": game_state['secret_word'],
        "impostor_partners": game_state['impostors'] if player['role'] == 'impostor' else []
    })

@app.route('/api/start', methods=['POST'])
def start_game():
    data = request.json
    impostor_count = int(data.get('impostorCount', 1))
    
    # ... (tu código de validación de jugadores) ...

    # 1. Elegir tema y palabra
    theme_key = random.choice(list(WORD_DATA.keys()))
    word = random.choice(WORD_DATA[theme_key])
    
    game_state['theme'] = theme_key.upper()
    game_state['secret_word'] = word.upper()
    game_state['phase'] = 'playing'
    game_state['winner'] = None
    game_state['impostors'] = []

    # 2. Resetear jugadores y asignar roles
    players = game_state['players']
    random.shuffle(players)
    
    # --- NUEVO: ELEGIR AL JUGADOR QUE EMPIEZA ---
    # Elegimos uno al azar de la lista ya barajada
    game_state['starting_player'] = players[0]['name'] 
    # --------------------------------------------

    # Limpiar estado anterior
    for p in players:
        p['is_dead'] = False
        p['votes'] = 0
        p['role'] = 'crew'
        p['vote_target'] = None

    # Asignar impostores
    actual_impostors_count = min(impostor_count, len(players) - 1)
    for i in range(actual_impostors_count):
        players[i]['role'] = 'impostor'
        game_state['impostors'].append(players[i]['name'])
    
    return jsonify({"success": True})

@app.route('/api/vote/start', methods=['POST'])
def start_voting():
    game_state['phase'] = 'voting'
    # Limpiar votos previos
    for p in game_state['players']:
        p['votes'] = 0
        p['vote_target'] = None
    return jsonify({"success": True})

@app.route('/api/vote/cast', methods=['POST'])
def cast_vote():
    # Nota: En una app real usaríamos sesiones, aquí confiamos en que el cliente no hackee
    # Pero el HTML no envía "quién vota", solo "a quién". 
    # Para simplificar y que funcione con tu HTML actual:
    target_name = request.json.get('target')
    
    target = get_player(target_name)
    if target and not target['is_dead']:
        target['votes'] += 1
        return jsonify({"success": True})
    return jsonify({"error": "Voto inválido"}), 400

@app.route('/api/vote/resolve', methods=['POST'])
def resolve_votes():
    # Calcular quién muere
    players = game_state['players']
    living_players = [p for p in players if not p['is_dead']]
    
    if not living_players: return jsonify({"error": "Nadie vivo"})

    # Buscar el más votado
    sorted_players = sorted(living_players, key=lambda x: x['votes'], reverse=True)
    most_voted = sorted_players[0]
    
    # Verificar empate (si el segundo tiene los mismos votos)
    if len(sorted_players) > 1 and sorted_players[1]['votes'] == most_voted['votes']:
        # Empate: nadie muere
        eliminated = None
    else:
        # Eliminar al más votado
        if most_voted['votes'] > 0:
            most_voted['is_dead'] = True
            eliminated = most_voted['name']
        else:
            eliminated = None # Nadie votó

    # Chequear condiciones de victoria
    winner = check_win_condition()
    if winner:
        game_state['phase'] = 'result'
        game_state['winner'] = winner
    else:
        game_state['phase'] = 'playing' # Vuelve a ronda de debate

    return jsonify({
        "eliminated": eliminated,
        "winner": winner
    })

def check_win_condition():
    crew_alive = 0
    impostors_alive = 0
    
    for p in game_state['players']:
        if not p['is_dead']:
            if p['role'] == 'impostor':
                impostors_alive += 1
            else:
                crew_alive += 1
    
    if impostors_alive == 0:
        return "crew"
    if impostors_alive >= crew_alive:
        return "impostor"
    
    return None

@app.route('/api/reset', methods=['POST'])
def reset_game():
    game_state['phase'] = 'lobby'
    game_state['winner'] = None
    game_state['impostors'] = []
    game_state['theme'] = ""
    game_state['secret_word'] = ""
    # --- NUEVO: LIMPIAR EL STARTING PLAYER ---
    game_state['starting_player'] = "" 
    # -----------------------------------------

    for p in game_state['players']:
        p['is_dead'] = False
        p['votes'] = 0
        p['role'] = 'crew'
        p['vote_target'] = None

    return jsonify({"success": True})

# --- SERVIR ARCHIVOS ESTÁTICOS ---

@app.route('/api/kick', methods=['POST'])
def kick_player():
    # --- NUEVA PROTECCIÓN ---
    if game_state['phase'] != 'lobby':
        return jsonify({"error": "No se puede expulsar con la partida empezada"}), 403
    # ------------------------

    data = request.json
    name_to_kick = data.get('name', '').strip().upper()
    
    original_count = len(game_state['players'])
    
    # 1. Eliminar de la lista de jugadores
    game_state['players'] = [p for p in game_state['players'] if p['name'] != name_to_kick]
    
    # 2. Limpieza de seguridad (por si acaso)
    if name_to_kick in game_state['impostors']:
        game_state['impostors'].remove(name_to_kick)
    
    if len(game_state['players']) < original_count:
        print(f"[-] Jugador expulsado: {name_to_kick}")
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Jugador no encontrado"}), 404

@app.route('/')
def index():
    # Redirigir a la TV o servir un index
    return send_from_directory('.', 'index.html')

# Esta ruta permite acceder a archivos dentro de carpetas (ej: juegos/impostor/...)
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    port = 5002
    print(f"[*] SERVIDOR IMPOSTOR INICIADO")
    print(f"[*] TV: http://localhost:{port}/impostor/impostor-tv.html")
    print(f"[*] Mando: http://localhost:{port}/impostor/impostor-control.html")
    app.run(host='0.0.0.0', port=port, debug=True)