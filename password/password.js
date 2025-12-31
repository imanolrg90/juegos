/**
 * PASSWORD JS - Logic
 */

const STORAGE_KEY = 'password_gamestate';
const EMOJIS = ["👽", "🐲", "👾", "🤖", "🎃", "🦄", "🐉", "💣", "💎", "🎱", "🎲", "🎮", "🕹️", "🎯", "🎪"];

let words = [];
let availableWords = []; // Copia para jugar sin repetir hasta que se acaben
let teams = [];
let currentTeamIndex = 0;
let currentRound = 1; // Ronda global (cuando todos los equipos juegan 1 vez, sube)
let maxRounds = 5;
let timer;
let timeLeft;
let timeConfig = 60;
let selectedEmoji = "❓";
let currentWordStr = "";

document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    fetch('password.json')
        .then(res => res.json())
        .then(data => {
            words = data;
            // Si no hay palabras disponibles guardadas, resetear
            if (availableWords.length === 0) availableWords = [...words];
        })
        .catch(err => console.error("Error loading JSON", err));
});

/* --- PERSISTENCIA --- */
function saveGame() {
    const gameState = {
        teams, currentTeamIndex, currentRound, maxRounds, timeConfig
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            teams = data.teams || [];
            currentTeamIndex = data.currentTeamIndex || 0;
            currentRound = data.currentRound || 1;
            maxRounds = data.maxRounds || 5;
            timeConfig = data.timeConfig || 60;

            document.getElementById('time-config').value = timeConfig;
            document.getElementById('rounds-config').value = maxRounds;

            if (teams.length > 0) {
                renderScoreboard();
                document.getElementById('start-game-btn').style.display = "block";
            }
        } catch (e) { console.error(e); }
    }
}

/* --- GESTIÓN DE EQUIPOS --- */
function addTeam() {
    const name = document.getElementById('team-name').value.trim();
    if (!name) return;
    
    // Abrir modal de emojis
    const grid = document.getElementById('emojiGrid');
    grid.innerHTML = EMOJIS.map(e => `<div class="emoji-btn" onclick="selectEmoji('${e}')">${e}</div>`).join('');
    document.getElementById('emojiModal').classList.add('open');
}

function selectEmoji(emoji) {
    selectedEmoji = emoji;
    closeEmojiModal();
    const nameInput = document.getElementById('team-name');
    
    teams.push({ 
        id: Date.now(), 
        name: nameInput.value.trim(), 
        score: 0, 
        roundsPlayed: 0, // Rondas jugadas por este equipo
        emoji: selectedEmoji 
    });
    
    nameInput.value = "";
    saveGame();
    renderScoreboard();
    document.getElementById('start-game-btn').style.display = "block";
}

function closeEmojiModal() { document.getElementById('emojiModal').classList.remove('open'); }

function removeTeam(id) {
    if(confirm("¿Eliminar equipo?")) {
        teams = teams.filter(t => t.id !== id);
        if (currentTeamIndex >= teams.length) currentTeamIndex = 0;
        saveGame();
        renderScoreboard();
    }
}

function renderScoreboard() {
    const container = document.getElementById('scoreboard');
    
    // Ordenar visualmente (opcional, si quieres ver al ganador arriba)
    // const displayTeams = [...teams].sort((a,b) => b.score - a.score); 
    // Usaremos el orden de turnos por defecto para no liar la rotación, 
    // pero puedes ordenarlos si prefieres.

    container.innerHTML = teams.map((t, i) => `
        <div class="score-card ${i === currentTeamIndex ? 'active' : ''}">
            <div class="emoji">${t.emoji}</div>
            <div class="info">
                <span class="name">${t.name}</span>
                <div class="details">
                    <span>Rondas: ${t.roundsPlayed}/${maxRounds}</span>
                </div>
            </div>
            
            <div class="score-controls">
                <button class="btn-mini-control" onclick="changeScore(${i}, -1)">-</button>
                <div class="score-display">${t.score}</div>
                <button class="btn-mini-control" onclick="changeScore(${i}, 1)">+</button>
            </div>

            <button class="btn-delete" onclick="removeTeam(${t.id})">🗑️</button>
        </div>
    `).join('');
}

// NUEVA FUNCIÓN PARA MODIFICAR PUNTOS MANUALMENTE
function changeScore(index, delta) {
    teams[index].score += delta;
    saveGame();
    renderScoreboard();
}

/* --- LÓGICA DE JUEGO --- */

function startGame() {
    // Leer configuraciones
    timeConfig = parseInt(document.getElementById('time-config').value) || 60;
    maxRounds = parseInt(document.getElementById('rounds-config').value) || 5;

    // Resetear contadores de ronda si es partida nueva (si todos tienen 0)
    const totalRoundsPlayed = teams.reduce((acc, t) => acc + t.roundsPlayed, 0);
    if (totalRoundsPlayed === 0) currentRound = 1;

    saveGame();
    
    // UI Updates
    document.getElementById('setup-area').style.display = "none";
    document.getElementById('start-game-btn').style.display = "none";
    document.getElementById('stop-btn').style.display = "block";
    
    showPrepScreen();
}

function showPrepScreen() {
    hideAllScreens();
    
    // Verificar Fin del Juego antes de mostrar prep
    // El juego acaba si el último equipo ha jugado la última ronda
    const allFinished = teams.every(t => t.roundsPlayed >= maxRounds);
    
    if (allFinished) {
        showGameOver();
        return;
    }

    document.getElementById('prep-screen').style.display = "flex";
    
    const team = teams[currentTeamIndex];
    document.getElementById('next-team-label').innerText = team.name;
    document.getElementById('current-round-display').innerText = `${team.roundsPlayed + 1} / ${maxRounds}`;
    
    renderScoreboard();
}

function startTurn() {
    hideAllScreens();
    document.getElementById('game-screen').style.display = "flex";
    
    timeLeft = timeConfig;
    updateTimerDisplay();
    nextWord(); // Cargar primera palabra

    // Iniciar Intervalo
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timer);
            endTurn();
        }
    }, 1000);
}

function updateTimerDisplay() {
    document.getElementById('timer-text').innerText = timeLeft;
    const percentage = (timeLeft / timeConfig) * 100;
    document.getElementById('timer-fill').style.width = percentage + "%";
}

function nextWord() {
    if (availableWords.length === 0) {
        // Recargar si se acaban
        availableWords = [...words]; 
    }
    // Aleatorio
    const randIndex = Math.floor(Math.random() * availableWords.length);
    currentWordStr = availableWords[randIndex];
    
    // Eliminar para no repetir en breve
    availableWords.splice(randIndex, 1);
    
    document.getElementById('current-word').innerText = currentWordStr;
    
    // Animación simple
    const wordEl = document.getElementById('current-word');
    wordEl.style.opacity = 0;
    setTimeout(() => wordEl.style.opacity = 1, 100);
}

function handleAction(type) {
    const team = teams[currentTeamIndex];
    
    if (type === 'success') {
        team.score++;
    } else if (type === 'fail') {
        team.score--;
    } 
    // 'pass' no cambia score
    
    saveGame();
    renderScoreboard(); // Actualizar mini marcador visualmente si quieres
    nextWord();
}

function endTurnManual() {
    if(confirm("¿Terminar turno actual?")) {
        clearInterval(timer);
        endTurn();
    }
}

function endTurn() {
    // Aumentar ronda jugada del equipo actual
    teams[currentTeamIndex].roundsPlayed++;
    
    // Pasar al siguiente equipo
    currentTeamIndex = (currentTeamIndex + 1) % teams.length;
    
    saveGame();
    showPrepScreen();
}

/* --- FIN DEL JUEGO --- */

function showGameOver() {
    hideAllScreens();
    document.getElementById('game-over-screen').style.display = "flex";
    document.getElementById('stop-btn').style.display = "none";
    
    // Calcular ganador
    // Ordenar copia de equipos
    const sortedTeams = [...teams].sort((a,b) => b.score - a.score);
    const winner = sortedTeams[0];
    
    document.getElementById('winner-name').innerText = winner.name;
    
    const resultsHTML = sortedTeams.map(t => `
        <div class="final-item">
            <span>${t.emoji} ${t.name}</span>
            <span style="font-weight:bold; color:var(--primary)">${t.score} pts</span>
        </div>
    `).join('');
    
    document.getElementById('final-scores').innerHTML = resultsHTML;
}

function resetGameFull() {
    // Reiniciar datos de partida pero mantener equipos (opcional, aquí reseteo scores)
    teams.forEach(t => {
        t.score = 0;
        t.roundsPlayed = 0;
    });
    currentTeamIndex = 0;
    currentRound = 1;
    saveGame();
    
    document.getElementById('game-over-screen').style.display = "none";
    document.getElementById('setup-area').style.display = "block";
    document.getElementById('start-game-btn').style.display = "block";
    renderScoreboard();
}

/* --- UTILIDADES --- */
function hideAllScreens() {
    document.querySelectorAll('.game-display').forEach(el => el.style.display = 'none');
}