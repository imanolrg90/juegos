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
let songsList = typeof ALL_SONGS_DATA !== 'undefined' ? [...ALL_SONGS_DATA] : [];

// --- INICIO DE RONDA ---
function startGameRound() {
    if (songsList.length === 0) {
        alert("¡Se han acabado todas las canciones!");
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

    const randomIndex = Math.floor(Math.random() * songsList.length);
    currentSong = songsList[randomIndex];
    
    const pathParts = currentSong.file.split('/'); 
    const folderName = pathParts.length > 1 ? pathParts[0] : "General";
    
    const audioPlayer = document.getElementById('audio-player');
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

    songsList.splice(randomIndex, 1);
    updateSongCounter();
}

function revealAnswer() {
    document.getElementById('answer-title').innerText = currentSong.title;
    document.getElementById('answer-artist').innerText = currentSong.artist;
    document.getElementById('answer-year').innerText = "Año: " + currentSong.year;
    document.getElementById('answer-decade').innerText = "Década: " + currentSong.decade;
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
        const targetScore = parseInt(document.getElementById('target-score-input').value) || 10;
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
    
    // Efecto de sonido opcional (aplausos)
    // const audio = new Audio('aplausos.mp3'); audio.play(); 
    
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
    const name = document.getElementById('new-player-name').value.trim();
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

    if(name) {
        players.push({ id: Date.now(), name, emoji: selectedEmoji, score: 0 });
        document.getElementById('player-modal').style.display = 'none';
        renderPlayers();
    }
}

function updateSongCounter() {
    const counter = document.getElementById('songs-counter');
    if(counter) counter.innerText = songsList.length;
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    renderPlayers();
    updateSongCounter();
    if(players.length === 0) openAddPlayerModal();
});