// --- VARIABLES GLOBALES ---
const CATEGORIAS_RULETA = ["Año Exacto", "Década", "Artista", "Título Canción", "Sigue la letra"];
const MAX_PLAYERS = 20;

const EMOJI_POOL = [
    "🎸", "🎤", "🎹", "🎷", "🎺", 
    "🎻", "🥁", "🎧", "💿", "🎼", 
    "🦁", "🐯", "🐶", "🦊", "🐼", 
    "👽", "🤖", "👻", "🦄", "🔥"
];

let players = [];
let currentSong = null;

// Referencia a todas las canciones (Cargadas desde songs.js)
// Soportamos tanto el formato nuevo (ALL_SONGS_DATA) como el antiguo (sourceSongs)
let fullLibrary = [];
let songsList = []; // Esta es la lista activa filtrada

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    loadLibrary();
    initCategorySelect();
    filterSongs(); // Filtrado inicial (Todas)
    renderPlayers();
    
    // Abrir modal de jugador si no hay nadie
    if(players.length === 0) openAddPlayerModal();
});

// 1. Cargar librería unificada
function loadLibrary() {
    if (typeof ALL_SONGS_DATA !== 'undefined') {
        fullLibrary = ALL_SONGS_DATA;
    } else if (typeof sourceSongs !== 'undefined') {
        fullLibrary = sourceSongs;
    } else {
        alert("Error: No se ha cargado el archivo songs.js");
        return;
    }

    // Aseguramos que todas tengan la propiedad 'category'
    fullLibrary = fullLibrary.map(s => {
        if(s.category) return s;
        // Si no tiene categoría, la inferimos de la ruta del archivo
        const parts = s.file.split('/');
        return { ...s, category: parts.length > 1 ? parts[0] : "General" };
    });
}

// 2. Llenar el Select
function initCategorySelect() {
    const select = document.getElementById('categorySelect');
    if(!select) return;

    // Obtener categorías únicas
    const categories = [...new Set(fullLibrary.map(s => s.category))].sort();

    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = `📁 ${cat}`;
        select.appendChild(option);
    });

    // Escuchar cambios
    select.addEventListener('change', () => {
        filterSongs();
        // Feedback visual simple
        const counter = document.getElementById('songs-counter');
        counter.style.color = '#4556ac';
        setTimeout(() => counter.style.color = '#666', 500);
    });
}

// 3. Filtrar canciones según selección
function filterSongs() {
    const select = document.getElementById('categorySelect');
    const selectedCat = select ? select.value : 'all';

    if (selectedCat === 'all') {
        songsList = [...fullLibrary];
    } else {
        songsList = fullLibrary.filter(s => s.category === selectedCat);
    }
    
    updateSongCounter();
}

// --- JUEGO: INICIO DE RONDA ---
function startGameRound() {
    if (songsList.length === 0) {
        alert("¡Se han acabado todas las canciones de esta categoría!");
        return;
    }

    const modal = document.getElementById('gameplay-modal');
    modal.style.display = 'flex';

    document.getElementById('btn-reveal').style.display = 'block';
    document.getElementById('btn-reveal').disabled = true;
    document.getElementById('btn-back').style.display = 'none';
    document.getElementById('answer-box').classList.remove('visible');
    document.getElementById('folder-hint').innerText = "...";
    document.getElementById('roulette-instruction').innerText = "GIRANDO...";
    document.getElementById('roulette-instruction').style.color = "#aaa";

    const wheel = document.getElementById('visual-wheel');
    wheel.classList.add('is-spinning');

    // Selección aleatoria de la lista FILTRADA
    const randomIndex = Math.floor(Math.random() * songsList.length);
    currentSong = songsList[randomIndex];
    
    // Obtenemos carpeta para mostrar en el modal
    const folderName = currentSong.category || "General";
    
    const audioPlayer = document.getElementById('audio-player');
    // Ruta corregida asumiendo estructura ../assets/songs/
    audioPlayer.src = `../assets/songs/${currentSong.file}`;
    audioPlayer.load();

    setTimeout(() => {
        wheel.classList.remove('is-spinning');
        const randomCat = CATEGORIAS_RULETA[Math.floor(Math.random() * CATEGORIAS_RULETA.length)];
        const instructionDiv = document.getElementById('roulette-instruction');
        instructionDiv.innerText = randomCat;
        instructionDiv.style.color = "#333";

        document.getElementById('folder-hint').innerText = folderName;

        audioPlayer.play().catch(e => {
            console.log("Autoplay bloqueado:", e);
        });

        document.getElementById('btn-reveal').disabled = false;

    }, 2000);

    // Eliminamos la canción jugada para que no se repita
    songsList.splice(randomIndex, 1);
    updateSongCounter();
}

function revealAnswer() {
    document.getElementById('answer-title').innerText = currentSong.title;
    document.getElementById('answer-artist').innerText = currentSong.artist || "Desconocido"; // Fallback
    document.getElementById('answer-year').innerText = "Año: " + (currentSong.year || "?");
    document.getElementById('answer-decade').innerText = "Década: " + (currentSong.decade || "?");
    
    document.getElementById('answer-box').classList.add('visible');
    document.getElementById('btn-reveal').style.display = 'none';
    document.getElementById('btn-back').style.display = 'block';
}

function closeGameModal() {
    const audioPlayer = document.getElementById('audio-player');
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    document.getElementById('gameplay-modal').style.display = 'none';
}

// --- GESTIÓN DE JUGADORES Y EMOJIS ---

function renderPlayers() {
    const list = document.getElementById('player-list');
    list.innerHTML = '';
    // Ordenar por puntuación descendente
    players.sort((a, b) => b.score - a.score);

    if (players.length === 0) {
         list.innerHTML = '<div style="text-align: center; color: #777;">Añade concursantes.</div>';
         return;
    }

    players.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card'; 
        card.innerHTML = `
            <div class="player-info">
                <span style="font-size:1.5em">${player.emoji}</span>
                <span class="name" style="font-size:1.2em; font-weight:bold">${player.name}</span>
            </div>
            <div class="player-score">${player.score}</div>
            <div class="score-buttons" style="justify-content:center; display:flex; gap:10px">
                <button class="btn-minus" onclick="updateScore(${player.id}, -1)">-</button>
                <button class="btn-add" onclick="updateScore(${player.id}, 1)">+</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function updateScore(id, delta) {
    const player = players.find(x => x.id === id);
    if(player) { 
        player.score += delta;
        if(player.score < 0) player.score = 0; // Evitar negativos
        
        renderPlayers();

        // CHECK DE GANADOR
        const targetScoreElement = document.getElementById('target-score-input');
        const targetScore = targetScoreElement ? parseInt(targetScoreElement.value) : 10;
        
        if (delta > 0 && player.score >= targetScore) {
            showWinner(player);
        }
    }
}

// --- LÓGICA DE GANADOR ---
function showWinner(player) {
    const modal = document.getElementById('winner-modal');
    document.getElementById('winner-emoji-display').innerText = player.emoji;
    document.getElementById('winner-name-display').innerText = player.name;
    modal.style.display = 'flex';
}

function closeWinnerModal() {
    document.getElementById('winner-modal').style.display = 'none';
}

// --- MODAL JUGADORES ---
function openAddPlayerModal() {
    const container = document.getElementById('emoji-selection-container');
    const hiddenInput = document.getElementById('selected-emoji-value');
    
    container.innerHTML = '';
    hiddenInput.value = '';
    document.getElementById('new-player-name').value = '';

    const usedEmojis = players.map(p => p.emoji);

    EMOJI_POOL.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-option';
        btn.innerText = emoji;
        
        if (usedEmojis.includes(emoji)) {
            btn.classList.add('taken');
            btn.disabled = true;
        } else {
            btn.onclick = () => {
                document.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                hiddenInput.value = emoji;
            };
        }
        container.appendChild(btn);
    });

    document.getElementById('player-modal').style.display = 'flex';
}

function addPlayer() {
    const nameInput = document.getElementById('new-player-name');
    const name = nameInput.value.trim();
    let selectedEmoji = document.getElementById('selected-emoji-value').value;

    if (!name) {
        alert("Por favor, escribe un nombre.");
        return;
    }

    if (!selectedEmoji) {
        const usedEmojis = players.map(p => p.emoji);
        const availableEmojis = EMOJI_POOL.filter(e => !usedEmojis.includes(e));
        
        if (availableEmojis.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableEmojis.length);
            selectedEmoji = availableEmojis[randomIndex];
        } else {
            selectedEmoji = "👤"; 
        }
    }

    players.push({ id: Date.now(), name, emoji: selectedEmoji, score: 0 });
    document.getElementById('player-modal').style.display = 'none';
    renderPlayers();
}

function updateSongCounter() {
    const counter = document.getElementById('songs-counter');
    if(counter) counter.innerText = songsList.length;
}