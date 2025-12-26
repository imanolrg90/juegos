// --- ESTADO DEL JUEGO ---
let players = [];
let currentPlayerIndex = 0;
let gameMode = 'normal';
let activeRosco = []; // Apuntará al rosco del jugador actual
let currentAudio = null;
let roscoSize = 5; 

document.addEventListener('DOMContentLoaded', () => {
    loadPlayersFromStorage();
});

// --- GESTIÓN DE JUGADORES ---
function loadPlayersFromStorage() {
    const saved = localStorage.getItem('pasapalabra_players');
    if (saved) {
        players = JSON.parse(saved);
        updatePlayerListUI();
    }
}

function savePlayersToStorage() {
    // Guardamos solo nombre, reseteamos datos de juego
    const namesOnly = players.map(p => ({ name: p.name }));
    localStorage.setItem('pasapalabra_players', JSON.stringify(namesOnly));
}

function addPlayer() {
    const input = document.getElementById('new-player-name');
    const name = input.value.trim().toUpperCase();
    if (name && !players.find(p => p.name === name)) {
        players.push({ name: name, score: 0, rosco: [], roscoStatus: [] });
        input.value = '';
        savePlayersToStorage();
        updatePlayerListUI();
    }
}

function removePlayer(index) {
    players.splice(index, 1);
    savePlayersToStorage();
    updatePlayerListUI();
}

function updatePlayerListUI() {
    const list = document.getElementById('player-list-lobby');
    list.innerHTML = '';
    players.forEach((p, index) => {
        const li = document.createElement('li');
        li.style.padding = "10px";
        li.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.color = "white";
        li.innerHTML = `
            <span>${p.name}</span>
            <button class="btn btn-delete" onclick="removePlayer(${index})">✕</button>
        `;
        list.appendChild(li);
    });
}

function selectMode(mode, btn) {
    gameMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

// --- PREPARACIÓN DEL JUEGO ---
async function startGame() {
    if (players.length === 0) {
        alert("Añade al menos un jugador.");
        return;
    }

    // LEER NÚMERO DE LETRAS
    const countInput = document.getElementById('letter-count');
    let count = parseInt(countInput.value);
    if (isNaN(count) || count < 5) count = 5;
    if (count > 25) count = 25;
    roscoSize = count;

    // Configurar UI según modo
    document.getElementById('mode-display').innerText = gameMode === 'normal' ? 'Cultura General' : 'Musical';
    document.getElementById('controls-reroll').style.display = gameMode === 'musical' ? 'block' : 'none';
    document.getElementById('game-audio-player').style.display = gameMode === 'musical' ? 'block' : 'none';

    // Cargar datos base
    let baseData = null;
    if (gameMode === 'normal') {
        try {
            const response = await fetch('questions.json');
            baseData = await response.json();
        } catch (e) {
            alert("Error cargando questions.json");
            return;
        }
    } else {
        if (typeof sourceSongs === 'undefined') {
            alert("Error: songs.js no cargado.");
            return;
        }
        // En modo musical, no necesitamos cargar nada externo, usaremos sourceSongs directamente en el bucle
    }

    // GENERAR ROSCO ÚNICO PARA CADA JUGADOR
    for (let player of players) {
        player.score = 0;
        player.roscoStatus = new Array(roscoSize).fill(0); // 0: pendiente, 1: bien, 2: mal

        if (gameMode === 'normal') {
            // Generar rosco de cultura
            player.rosco = generateRandomRosco(baseData, roscoSize);
        } else {
            // Generar rosco musical
            const musicPool = generateMusicPool(); // Genera pool completo
            if (musicPool.length < roscoSize) {
                alert("No hay suficientes canciones/letras para el tamaño elegido.");
                return;
            }
            player.rosco = generateRandomRosco(musicPool, roscoSize);
        }
    }

    currentPlayerIndex = 0;
    
    document.getElementById('lobby-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    
    // Cargar la primera pregunta (esto llamará a renderRosco internamente)
    loadQuestion(); 
}

// Genera el pool de opciones musicales (1 por letra, con candidatos)
function generateMusicPool() {
    let artistsMap = {};
    sourceSongs.forEach(song => {
        let cleanArtist = song.artist.split('&')[0].split('ft.')[0].trim();
        let firstLetter = cleanArtist.charAt(0).toUpperCase();
        if (/[A-Z]/.test(firstLetter)) {
            if (!artistsMap[firstLetter]) artistsMap[firstLetter] = [];
            artistsMap[firstLetter].push({
                artist: cleanArtist,
                songTitle: song.title,
                audioFile: song.file
            });
        }
    });

    let allQuestions = [];
    for (let letter in artistsMap) {
        const candidates = artistsMap[letter];
        // Elegimos uno al azar como principal
        const initialChoice = candidates[Math.floor(Math.random() * candidates.length)];
        
        allQuestions.push({
            letter: letter,
            answer: initialChoice.artist,
            question: `Artista musical que canta: "${initialChoice.songTitle}"`,
            audioFile: initialChoice.audioFile,
            candidates: candidates // Guardamos todos por si hay reroll
        });
    }
    return allQuestions;
}

// Selecciona 'size' elementos aleatorios de un pool y los ordena
function generateRandomRosco(pool, size) {
    // Hacemos una copia para no afectar al pool original
    let poolCopy = [...pool];
    let shuffled = poolCopy.sort(() => 0.5 - Math.random());
    let selected = [];
    let usedLetters = new Set();
    
    for (let item of shuffled) {
        if (!usedLetters.has(item.letter)) {
            // Clonamos el item para que las modificaciones (reroll) no afecten a otros jugadores si compartieran letra
            selected.push({ ...item }); 
            usedLetters.add(item.letter);
        }
        if (selected.length === size) break;
    }
    
    return selected.sort((a, b) => a.letter.localeCompare(b.letter));
}

// --- RENDERIZADO VISUAL ---
function renderRosco() {
    const container = document.getElementById('rosco-circle');
    container.innerHTML = '';
    
    const radius = 200; 
    const total = activeRosco.length; // Usamos el rosco del jugador actual
    const step = (2 * Math.PI) / total;

    activeRosco.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'letter-item';
        div.innerText = item.letter;
        div.id = `letter-${index}`;
        
        // Matemáticas circulares (-90deg para empezar arriba)
        const angle = (step * index) - (Math.PI / 2);
        const x = Math.round(radius * Math.cos(angle) + radius - 20); 
        const y = Math.round(radius * Math.sin(angle) + radius - 20);
        
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        
        container.appendChild(div);
    });
}

function updateScoreboard() {
    const container = document.getElementById('players-ranking');
    container.innerHTML = '';

    players.forEach((p, index) => {
        const hits = p.roscoStatus.filter(s => s === 1).length;
        const misses = p.roscoStatus.filter(s => s === 2).length;
        const pending = p.roscoStatus.filter(s => s === 0).length;

        const div = document.createElement('div');
        div.className = `player-card ${index === currentPlayerIndex ? 'active-turn' : ''}`;
        
        div.innerHTML = `
            <div class="player-info">
                <h4>${p.name}</h4>
                <span>${pending} pendientes</span>
            </div>
            <div style="text-align:right">
                <div class="score-pill" style="background:#2ed573; margin-bottom:2px; color:#000;">${hits} ✔</div>
                <div class="score-pill" style="background:#ff4757; color:#fff; font-size:0.8em;">${misses} ✕</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function updateRoscoVisuals() {
    const player = players[currentPlayerIndex];
    let currentQIndex = player.roscoStatus.indexOf(0);
    
    if (currentQIndex === -1) {
        stopAudio();
        nextPlayer();
        return;
    }

    // Limpiamos estilos anteriores
    document.querySelectorAll('.letter-item').forEach(el => el.classList.remove('current'));

    activeRosco.forEach((_, idx) => {
        const el = document.getElementById(`letter-${idx}`);
        const status = player.roscoStatus[idx];
        
        if (status === 1) el.className = 'letter-item correct';
        else if (status === 2) el.className = 'letter-item incorrect';
        else el.className = 'letter-item'; 
        
        // Iluminamos la bola actual (esto es importante para saber qué letra toca)
        if (idx === currentQIndex) el.classList.add('current');
    });

    // --- CAMBIO: AHORA MOSTRAMOS EL NOMBRE DEL JUGADOR ---
    const centerText = document.getElementById('big-letter');
    centerText.innerText = player.name; 
    
    // Ajustamos el tamaño si el nombre es muy largo (opcional, pero recomendado)
    if (player.name.length > 8) {
        centerText.style.fontSize = "2.5em";
    } else {
        centerText.style.fontSize = "3.5em"; // Tamaño normal para nombres
    }
}

// --- AUDIO ---
function playAudio(filename) {
    const player = document.getElementById('game-audio-player');
    if (!filename) {
        player.pause();
        return;
    }
    const safeFilename = filename.split('/').map(part => encodeURIComponent(part)).join('/');
    const audioPath = `/assets/songs/${safeFilename}`;
    player.src = audioPath;
    player.load();
    player.play().catch(e => console.log("Autoplay bloqueado:", e));
}

function stopAudio() {
    const player = document.getElementById('game-audio-player');
    player.pause();
    player.currentTime = 0;
}

function changeMusicQuestion() {
    if (gameMode !== 'musical') return;
    
    const player = players[currentPlayerIndex];
    const currentQIndex = player.roscoStatus.indexOf(0);
    if (currentQIndex === -1) return;

    // Accedemos al ítem del rosco del jugador
    const activeItem = player.rosco[currentQIndex];
    
    if (activeItem.candidates && activeItem.candidates.length > 1) {
        const currentFile = activeItem.audioFile;
        const otherCandidates = activeItem.candidates.filter(c => c.audioFile !== currentFile);
        const newChoice = otherCandidates[Math.floor(Math.random() * otherCandidates.length)];
        
        // Actualizamos datos en el rosco del jugador
        activeItem.audioFile = newChoice.audioFile;
        activeItem.answer = newChoice.artist;
        activeItem.question = `Artista musical que canta: "${newChoice.songTitle}"`;
        
        console.log("Canción cambiada a:", newChoice.songTitle);
        // Recargamos la pregunta para que suene la nueva canción
        loadQuestion();
    } else {
        alert("No hay más canciones alternativas para esta letra.");
    }
}

// --- JUGABILIDAD ---
let currentQuestionIndex = 0;

function loadQuestion() {
    // 1. Establecer el jugador y su rosco como activos
    const player = players[currentPlayerIndex];
    activeRosco = player.rosco; // CRUCIAL: Cambiamos la referencia global al rosco de este jugador

    // 2. IMPORTANTE: Redibujar el rosco porque las letras pueden ser diferentes a las del jugador anterior
    renderRosco();

    // 3. Resetear interfaz de respuesta
    document.getElementById('answer-reveal').style.display = 'none';
    document.getElementById('answer-reveal').innerText = '';
    document.getElementById('controls-phase-1').style.display = 'flex';
    document.getElementById('controls-phase-2').style.display = 'none';
    
    if(gameMode === 'musical') document.getElementById('controls-reroll').style.display = 'block';

    updateScoreboard();
    
    // 4. Buscar siguiente pregunta pendiente
    currentQuestionIndex = player.roscoStatus.indexOf(0);
    
    if (currentQuestionIndex === -1) {
        if (checkGameOver()) showResults();
        else nextPlayer();
        return;
    }

    updateRoscoVisuals();
    
    // 5. Cargar datos de la pregunta
    const q = activeRosco[currentQuestionIndex];
    const qText = document.getElementById('question-text');
    
    if (gameMode === 'musical') {
        qText.innerText = `Empieza por ${q.letter}: ¿Quién canta esta canción?`;
        playAudio(q.audioFile);
    } else {
        qText.innerText = `Empieza por ${q.letter}: ${q.question}`;
        stopAudio();
    }
}

function revealAnswer() {
    stopAudio(); 
    const correct = activeRosco[currentQuestionIndex].answer;
    const ansDisplay = document.getElementById('answer-reveal');
    ansDisplay.innerText = correct;
    ansDisplay.style.display = 'block';
    document.getElementById('controls-phase-1').style.display = 'none';
    document.getElementById('controls-reroll').style.display = 'none';
    document.getElementById('controls-phase-2').style.display = 'flex';
}

function manualResult(isCorrect) {
    const player = players[currentPlayerIndex];
    if (isCorrect) {
        player.roscoStatus[currentQuestionIndex] = 1;
        player.score++;
        setTimeout(loadQuestion, 300);
    } else {
        player.roscoStatus[currentQuestionIndex] = 2;
        setTimeout(nextPlayer, 1000);
    }
    updateScoreboard();
}

function pasapalabra() {
    stopAudio();
    nextPlayer();
}

function nextPlayer() {
    let attempts = 0;
    do {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        attempts++;
    } while (isPlayerFinished(currentPlayerIndex) && attempts < players.length);

    if (attempts >= players.length && isPlayerFinished(currentPlayerIndex)) {
        showResults();
    } else {
        loadQuestion();
    }
}

function isPlayerFinished(pIndex) {
    return !players[pIndex].roscoStatus.includes(0);
}

function checkGameOver() {
    return players.every((_, i) => isPlayerFinished(i));
}

function showResults() {
    stopAudio();
    document.getElementById('result-screen').style.display = 'flex';
    const list = document.getElementById('final-ranking-list');
    list.innerHTML = '';
    
    players.forEach(p => {
        p.finalHits = p.roscoStatus.filter(s => s === 1).length;
    });

    const sorted = [...players].sort((a, b) => b.finalHits - a.finalHits);

    sorted.forEach(p => {
        const li = document.createElement('li');
        li.style.background = "#2c2d4a";
        li.style.margin = "10px 0";
        li.style.padding = "20px";
        li.style.borderRadius = "10px";
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.color = "white";
        li.style.fontSize = "1.2em";
        li.innerHTML = `<strong>${p.name}</strong> <span style="color:#2ed573;">${p.finalHits} / ${roscoSize}</span>`;
        list.appendChild(li);
    });
}

function returnToLobby() {
    stopAudio();
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('lobby-screen').classList.add('active');
}