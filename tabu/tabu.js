/**
 * TABÚ JS - Versión Final con Tiempo Ajustable y Persistencia
 */

const STORAGE_KEY = 'tabu_gamestate';
const EMOJIS = ["👑", "🦁", "🐯", "🐻", "🚀", "🛸", "🔥", "⚡", "🌈", "🍕", "🍔", "🍦", "💎", "👻", "🤖"];

let words = [];
let teams = [];
let currentTeamIndex = 0;
let strikes = 0;
let timer;
let timeLeft = 90;
let timePerTurn = 90; // Tiempo ajustable
let currentWordIndex = 0;
let selectedEmoji = "❓";

document.addEventListener('DOMContentLoaded', () => {
    loadGame();
    fetch('words.json')
        .then(res => res.json())
        .then(data => {
            words = data.sort(() => Math.random() - 0.5);
        });
});

/* --- PERSISTENCIA --- */

function saveGame() {
    const gameState = {
        teams: teams,
        currentTeamIndex: currentTeamIndex,
        currentWordIndex: currentWordIndex,
        timePerTurn: timePerTurn
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
            currentWordIndex = data.currentWordIndex || 0;
            timePerTurn = data.timePerTurn || 90;
            
            // Actualizar el input de tiempo con el valor guardado
            document.getElementById('time-config').value = timePerTurn;

            if (teams.length > 0) {
                renderScoreboard();
                document.getElementById('start-btn').style.display = "block";
            }
        } catch (e) { console.error(e); }
    }
}

/* --- JUEGO --- */

function startGame() {
    // Capturar el tiempo configurado antes de empezar
    timePerTurn = parseInt(document.getElementById('time-config').value) || 90;
    saveGame();
    
    document.getElementById('setup-area').style.display = "none";
    document.getElementById('start-btn').style.display = "none";
    document.getElementById('stop-btn').style.display = "block";
    showPrep();
}

function startTurn() {
    hideAll();
    document.getElementById('game-screen').style.display = "flex";
    strikes = 0;
    timeLeft = timePerTurn; // Usar el tiempo configurado
    document.getElementById('timer').innerText = timeLeft;
    updateStats();
    loadWord();

    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            endTurn();
        }
    }, 1000);
}

/**
 * Terminar turno antes de tiempo (Botón Parar)
 */
function stopGame() {
    if (confirm("¿Terminar el turno antes de tiempo?")) {
        clearInterval(timer);
        teams[currentTeamIndex].turns++;
        currentTeamIndex = (currentTeamIndex + 1) % teams.length;
        saveGame();
        showPrep();
    }
}

function endTurn() {
    // Al terminar el turno (por tiempo o manual)
    teams[currentTeamIndex].turns++;
    
    // Pasar al siguiente equipo
    currentTeamIndex = (currentTeamIndex + 1) % teams.length;
    
    saveGame();
    showPrep(); // Volver a pantalla de SIGUIENTE TURNO
}

/* --- GESTIÓN DE EQUIPOS (RESTO IGUAL) --- */

function addTeam() {
    const name = document.getElementById('team-name').value.trim();
    if (!name) return;
    
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
        turns: 0, 
        emoji: selectedEmoji 
    });
    nameInput.value = "";
    saveGame();
    renderScoreboard();
    document.getElementById('start-btn').style.display = "block";
}

function closeEmojiModal() { document.getElementById('emojiModal').classList.remove('open'); }

function removeTeam(id, event) {
    event.stopPropagation();
    if (confirm("¿Eliminar equipo?")) {
        teams = teams.filter(t => t.id !== id);
        if (currentTeamIndex >= teams.length) currentTeamIndex = 0;
        saveGame();
        renderScoreboard();
        if (teams.length === 0) {
            document.getElementById('start-btn').style.display = "none";
            document.getElementById('setup-area').style.display = "block";
        }
    }
}

function renderScoreboard() {
    const container = document.getElementById('scoreboard');
    const activeTeamId = teams[currentTeamIndex]?.id;

    teams.sort((a, b) => b.score - a.score);
    if (activeTeamId) currentTeamIndex = teams.findIndex(t => t.id === activeTeamId);

    container.innerHTML = teams.map((t, i) => `
        <div class="score-card ${i === currentTeamIndex ? 'active' : ''}" onclick="assignTurn(${i})">
            <div style="font-size: 2.2rem;">${t.emoji}</div>
            <div style="flex-grow:1; margin-left:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:900; text-transform:uppercase;">${t.name}</span>
                    <button class="btn-delete" onclick="removeTeam(${t.id}, event)">🗑️</button>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="color:var(--primary); font-weight:900; font-size:1.2rem;">${t.score}</span>
                        <div style="display:flex; flex-direction:column;">
                             <button class="btn-mini-score" onclick="event.stopPropagation(); changeScore(${i}, 1)">▲</button>
                             <button class="btn-mini-score" onclick="event.stopPropagation(); changeScore(${i}, -1)">▼</button>
                        </div>
                    </div>
                    <span style="font-size:0.7rem; color:rgba(255,255,255,0.4);">TURNOS: ${t.turns}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function assignTurn(index) {
    currentTeamIndex = index;
    saveGame();
    renderScoreboard();
}

function changeScore(index, delta) {
    teams[index].score += delta;
    saveGame();
    renderScoreboard();
}

function showPrep() {
    hideAll();
    document.getElementById('prep-screen').style.display = "flex";
    document.getElementById('next-team-label').innerText = teams[currentTeamIndex] ? teams[currentTeamIndex].name : "---";
    renderScoreboard();
}

function loadWord() {
    if (currentWordIndex >= words.length) {
        words.sort(() => Math.random() - 0.5);
        currentWordIndex = 0;
    }
    const wordData = words[currentWordIndex];
    
    // Palabra Principal
    document.getElementById('target-word').innerText = wordData.word;
    
    // Palabras Prohibidas
    const list = document.getElementById('forbidden-list');
    list.innerHTML = wordData.forbidden.map(w => `
        <div class="forbidden-word" onclick="markForbidden(this)">${w}</div>
    `).join('');
}

function markForbidden(el) {
    if (!el.classList.contains('clicked')) {
        el.classList.add('clicked');
        strikes++;
        updateStats();
        if (strikes >= 3) {
            handleFailure();
        }
    }
}

function successWord() {
    teams[currentTeamIndex].score++;
    currentWordIndex++;
    strikes = 0;
    saveGame();
    updateStats();
    loadWord();
    renderScoreboard();
}

function handleFailure() {
    currentWordIndex++; 
    strikes = 0;
    saveGame();
    updateStats();
    loadWord();
}

function updateStats() {
    document.getElementById('strikes').innerText = `${strikes}/3`;
}

function hideAll() {
    document.querySelectorAll('.game-display').forEach(d => d.style.display = "none");
}