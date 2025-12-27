from flask import Flask, send_from_directory, request, jsonify, session, redirect, url_for, render_template_string
import os
import random
import json
import time
from functools import wraps

app = Flask(__name__, static_folder='.', static_url_path='')

# --- CONFIGURACIÓN DE SEGURIDAD ---
app.secret_key = 'clave_secreta_super_segura_para_la_fiesta'  # Necesario para las sesiones
APP_PASSWORD = "kaputdraconis"  # <--- ¡CAMBIA ESTO POR TU CONTRASEÑA!

# --- CONFIGURACIÓN DE ARCHIVOS ---
RANKING_FILE = os.path.join('juegos', 'banderas', 'ranking.json')
MUSIC_RANKING_FILE = os.path.join('juegos', 'en-una-nota', 'music_ranking.json')

# ==========================================
# 0. LÓGICA DE AUTENTICACIÓN (LOGIN)
# ==========================================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        if request.form.get('password') == APP_PASSWORD:
            session['logged_in'] = True
            return redirect(url_for('index'))
        else:
            error = "Contraseña incorrecta."
    
    # Intenta leer el archivo login.html, si no existe usa uno básico
    try:
        with open('login.html', 'r', encoding='utf-8') as f:
            return render_template_string(f.read(), error=error)
    except FileNotFoundError:
        return f"""
        <form method="post">
            <p style="color:red">{error if error else ''}</p>
            <input type="password" name="password" placeholder="Contraseña">
            <button type="submit">Entrar</button>
        </form>
        """

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

# ==========================================
# 1. LÓGICA DE RANKINGS (MÚSICA Y BANDERAS)
# ==========================================

@app.route('/api/music/ranking', methods=['GET', 'POST'])
def handle_music_ranking():
    if not os.path.exists(MUSIC_RANKING_FILE):
        try:
            os.makedirs(os.path.dirname(MUSIC_RANKING_FILE), exist_ok=True)
            initial_data = {"15": [], "30": [], "50": []}
            with open(MUSIC_RANKING_FILE, 'w') as f:
                json.dump(initial_data, f)
        except OSError as e:
            return jsonify({"error": str(e)}), 500

    if request.method == 'GET':
        try:
            with open(MUSIC_RANKING_FILE, 'r') as f:
                data = json.load(f)
            return jsonify(data)
        except Exception:
            return jsonify({"15": [], "30": [], "50": []})

    if request.method == 'POST':
        new_entry = request.json
        mode = str(new_entry.get('mode', '15'))
        try:
            with open(MUSIC_RANKING_FILE, 'r') as f:
                data = json.load(f)
            if mode not in data: data[mode] = []
            data[mode].append({
                "teamName": new_entry.get('teamName'),
                "score": new_entry.get('score'),
                "date": new_entry.get('date')
            })
            data[mode].sort(key=lambda x: x.get('score', 0), reverse=True)
            data[mode] = data[mode][:10]
            with open(MUSIC_RANKING_FILE, 'w') as f:
                json.dump(data, f, indent=4)
            return jsonify(data)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route('/api/ranking', methods=['GET', 'POST'])
def handle_ranking():
    if not os.path.exists(RANKING_FILE):
        try:
            os.makedirs(os.path.dirname(RANKING_FILE), exist_ok=True)
            with open(RANKING_FILE, 'w') as f: json.dump([], f)
        except OSError: return jsonify([])

    if request.method == 'GET':
        try:
            with open(RANKING_FILE, 'r') as f: data = json.load(f)
            data.sort(key=lambda x: x.get('points', 0), reverse=True)
            return jsonify(data)
        except Exception: return jsonify([])

    if request.method == 'POST':
        new_score = request.json
        try:
            with open(RANKING_FILE, 'r') as f: data = json.load(f)
            data.append(new_score)
            data.sort(key=lambda x: x.get('points', 0), reverse=True)
            data = data[:50] 
            with open(RANKING_FILE, 'w') as f: json.dump(data, f, indent=4)
            return jsonify(data)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

# ==========================================
# 2. LÓGICA DEL JUEGO: EL IMPOSTOR (ONLINE)
# ==========================================

game_state = {
    "phase": "lobby",
    "players": [],
    "theme": "",
    "secret_word": "",
    "impostors": [],
    "winner": None,
    "starting_player": ""
}

def get_player(name):
    return next((p for p in game_state["players"] if p["name"] == name), None)

@app.route('/api/join', methods=['POST'])
def join_game():
    data = request.json
    name = data.get('name', '').strip().upper()
    icon = data.get('icon')
    if game_state['phase'] != 'lobby': return jsonify({"error": "Partida ya iniciada"}), 400
    if get_player(name): return jsonify({"error": "Nombre ya en uso"}), 400
    new_player = {
        "name": name, "icon": icon, "role": "crew",
        "is_dead": False, "votes": 0, "vote_target": None
    }
    game_state['players'].append(new_player)
    return jsonify({"success": True})

@app.route('/api/tv/state', methods=['GET'])
def get_tv_state():
    public_players = [{"name": p["name"], "icon": p["icon"], "is_dead": p["is_dead"], 
                       "votes": p["votes"] if game_state['phase'] == 'voting' else 0} 
                      for p in game_state['players']]
    return jsonify({
        "phase": game_state['phase'], "theme": game_state['theme'],
        "players": public_players, "winner": game_state['winner'],
        "starting_player": game_state.get('starting_player', ''),
        "secret_word": game_state['secret_word'] if game_state['phase'] == 'result' else None
    })

@app.route('/api/player/status', methods=['GET'])
def get_player_status():
    name = request.args.get('name', '').upper()
    player = get_player(name)
    if not player: return jsonify({"error": "Jugador no encontrado"}), 404
    return jsonify({
        "phase": game_state['phase'], "role": player['role'], "is_dead": player['is_dead'],
        "secret_word": game_state['secret_word'],
        "impostor_partners": game_state['impostors'] if player['role'] == 'impostor' else []
    })

@app.route('/api/start', methods=['POST'])
def start_game():
    data = request.json
    impostor_count = int(data.get('impostorCount', 1))
    
    theme = data.get('theme', 'DESCONOCIDO')
    secret_word = data.get('secretWord', '???')

    if len(game_state['players']) < 3:
        return jsonify({"error": "⚠️ Se necesitan mínimo 3 jugadores para empezar."}), 400

    game_state['theme'] = theme.upper()
    game_state['secret_word'] = secret_word.upper()
    game_state['phase'] = 'playing'
    game_state['winner'] = None
    game_state['impostors'] = []

    players = game_state['players']
    random.shuffle(players) 
    
    for p in players:
        p['is_dead'] = False
        p['votes'] = 0
        p['role'] = 'crew'
        p['vote_target'] = None

    actual_impostors_count = min(impostor_count, len(players) - 1)
    for i in range(actual_impostors_count):
        players[i]['role'] = 'impostor'
        game_state['impostors'].append(players[i]['name'])
    
    if players:
        game_state['starting_player'] = random.choice(players)['name']

    return jsonify({"success": True})

@app.route('/api/vote/start', methods=['POST'])
def start_voting():
    game_state['phase'] = 'voting'
    for p in game_state['players']: p['votes'] = 0; p['vote_target'] = None
    return jsonify({"success": True})

@app.route('/api/vote/cast', methods=['POST'])
def cast_vote():
    target = get_player(request.json.get('target'))
    if target and not target['is_dead']:
        target['votes'] += 1
        return jsonify({"success": True})
    return jsonify({"error": "Voto inválido"}), 400

@app.route('/api/vote/resolve', methods=['POST'])
def resolve_votes():
    living_players = [p for p in game_state['players'] if not p['is_dead']]
    if not living_players: return jsonify({"error": "Nadie vivo"})
    sorted_players = sorted(living_players, key=lambda x: x['votes'], reverse=True)
    most_voted = sorted_players[0]
    
    eliminated = None
    if len(sorted_players) > 1 and sorted_players[1]['votes'] == most_voted['votes']:
        eliminated = None
    elif most_voted['votes'] > 0:
        most_voted['is_dead'] = True
        eliminated = most_voted['name']

    winner = check_win_condition()
    game_state['phase'] = 'result' if winner else 'playing'
    game_state['winner'] = winner
    return jsonify({"eliminated": eliminated, "winner": winner})

def check_win_condition():
    crew_alive = sum(1 for p in game_state['players'] if not p['is_dead'] and p['role'] == 'crew')
    impostors_alive = sum(1 for p in game_state['players'] if not p['is_dead'] and p['role'] == 'impostor')
    if impostors_alive == 0: return "crew"
    if impostors_alive >= crew_alive: return "impostor"
    return None

@app.route('/api/reset', methods=['POST'])
def reset_game():
    game_state.update({"phase": "lobby", "winner": None, "impostors": [], "theme": "", 
                       "secret_word": "", "starting_player": ""})
    for p in game_state['players']:
        p.update({"is_dead": False, "votes": 0, "role": "crew", "vote_target": None})
    return jsonify({"success": True})

@app.route('/api/kick', methods=['POST'])
def kick_player():
    if game_state['phase'] != 'lobby': return jsonify({"error": "Prohibido durante partida"}), 403
    name = request.json.get('name', '').strip().upper()
    game_state['players'] = [p for p in game_state['players'] if p['name'] != name]
    if name in game_state['impostors']: game_state['impostors'].remove(name)
    return jsonify({"success": True})

# ==========================================
# 3. LÓGICA DE BINGO Y OTROS
# ==========================================

bingo_command_queue = []

@app.route('/api/bingo/send-command', methods=['POST'])
def bingo_send_command():
    bingo_command_queue.append(request.json.get('cmd'))
    return jsonify({"status": "ok"})

@app.route('/api/bingo/get-command', methods=['GET'])
def bingo_get_command():
    cmd = bingo_command_queue.pop(0) if bingo_command_queue else None
    return jsonify({"cmd": cmd})

# ==========================================
# 4. LÓGICA DE PULSADORES (BUZZER)
# ==========================================

buzzer_state = {
    "queue": [], "start_time": 0.0, "is_active": False, "valid_teams": [],
    "failed_teams": [], "devices": {}, "current_song_info": {"title": "Esperando...", "artist": ""},
    "remote_command": None
}

@app.route('/api/buzz/set_teams', methods=['POST'])
def set_buzzer_teams():
    buzzer_state['valid_teams'] = [t.strip().upper() for t in request.json.get('teams', [])]
    return jsonify({"success": True})

@app.route('/api/buzz/check_team', methods=['POST'])
def check_team_login():
    team = request.json.get('team', '').strip().upper()
    return jsonify({"valid": team in buzzer_state['valid_teams']})

@app.route('/api/buzz/heartbeat', methods=['POST'])
def buzzer_heartbeat():
    team = request.json.get('team'); dev_id = request.json.get('id')
    if team and dev_id:
        if team not in buzzer_state['devices']: buzzer_state['devices'][team] = {}
        buzzer_state['devices'][team][dev_id] = time.time()
    return jsonify({"status": "ok"})

def get_active_counts():
    now = time.time(); counts = {}
    for team, devices in list(buzzer_state['devices'].items()):
        active = {d: t for d, t in devices.items() if now - t < 5}
        buzzer_state['devices'][team] = active
        if active: counts[team] = len(active)
    return counts

@app.route('/api/host/set_song', methods=['POST'])
def set_song_info():
    buzzer_state['current_song_info'] = request.json
    return jsonify({"success": True})

@app.route('/api/host/action', methods=['POST'])
def host_action():
    buzzer_state['remote_command'] = request.json.get('action')
    return jsonify({"success": True})

@app.route('/api/host/status', methods=['GET'])
def host_status():
    winner = buzzer_state['queue'][0]['team'] if buzzer_state['queue'] else None
    return jsonify({"song": buzzer_state['current_song_info'], "winner": winner})

@app.route('/api/host/clear_command', methods=['POST'])
def clear_host_command():
    buzzer_state['remote_command'] = None
    return jsonify({"success": True})

@app.route('/api/buzz/reset', methods=['POST'])
def reset_buzzer():
    buzzer_state.update({"queue": [], "failed_teams": [], "is_active": True, 
                         "start_time": time.time(), "remote_command": None})
    return jsonify({"success": True})

@app.route('/api/buzz/fail', methods=['POST'])
def fail_buzzer_team():
    team = request.json.get('team')
    if team and team not in buzzer_state['failed_teams']: buzzer_state['failed_teams'].append(team)
    return jsonify({"success": True})

@app.route('/api/buzz/press', methods=['POST'])
def press_buzzer():
    if not buzzer_state['is_active']: return jsonify({"success": False, "status": "closed"})
    team = request.json.get('team')
    if team in buzzer_state['failed_teams']: return jsonify({"success": False, "status": "banned"})
    current_q = [x['team'] for x in buzzer_state['queue']]
    if team in current_q: return jsonify({"success": True, "position": current_q.index(team)+1, "time": 0})
    t = round(time.time() - buzzer_state['start_time'], 2)
    buzzer_state['queue'].append({"team": team, "time": t})
    return jsonify({"success": True, "position": len(buzzer_state['queue']), "time": t})

@app.route('/api/buzz/status', methods=['GET'])
def check_buzzer():
    return jsonify({"queue": buzzer_state['queue'], "connections": get_active_counts(),
                    "command": buzzer_state['remote_command']})

# ==========================================
# 5. SERVIDOR DE ARCHIVOS ESTÁTICOS (PROTEGIDOS)
# ==========================================

@app.route('/')
@login_required
def index():
    return send_from_directory('.', 'index.html')

@app.route('/presenter')
@login_required
def presenter_ui(): return send_from_directory('en-una-nota', 'presenter.html')

@app.route('/buzzer')
@login_required
def buzzer_ui(): return send_from_directory('en-una-nota', 'buzzer.html')

@app.route('/bingo/remote')
@login_required
def bingo_remote_ui(): return send_from_directory('.', 'bingo/bingo-remote.html')

@app.route('/pasapalabra')
@login_required
def pasapalabra_ui():
    return send_from_directory('pasapalabra', 'pasapalabra.html')

@app.route('/pasapalabra/<path:filename>')
def serve_pasapalabra_assets(filename):
    # Protegemos solo si es HTML, dejamos pasar imágenes o scripts
    if filename.endswith('.html') and not session.get('logged_in'):
        return redirect(url_for('login'))
    return send_from_directory('pasapalabra', filename)

# RUTA GENÉRICA INTELIGENTE
# Permite cargar CSS/JS/IMG sin loguearse (para que el login se vea bien)
# pero bloquea HTML o carpetas si no estás autenticado.
@app.route('/<path:path>')
def serve_static(path):
    # Extensiones permitidas siempre (recursos)
    allowed_extensions = ('.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.mp3', '.wav', '.json')
    
    # Si es un recurso, lo servimos sin preguntar
    if path.endswith(allowed_extensions):
        return send_from_directory('.', path)
    
    # Si es una página web (HTML o carpeta) y no hay sesión, al login
    if not session.get('logged_in'):
         return redirect(url_for('login'))
         
    return send_from_directory('.', path)

if __name__ == '__main__':
    port = 5002
    print(f"[*] SERVIDOR MULTIJUEGOS INICIADO EN PUERTO {port}")
    app.run(host='0.0.0.0', port=port, debug=True)