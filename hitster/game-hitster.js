document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS DOM ---
    const categorySelect = document.getElementById('categorySelect');
    const songsCounter = document.getElementById('songs-counter');
    const gameplayModal = document.getElementById('gameplay-modal');
    const audioPlayer = document.getElementById('audio-player');
    
    // Elementos de la respuesta
    const answerBox = document.getElementById('answer-box');
    const answerTitle = document.getElementById('answer-title');
    const answerArtist = document.getElementById('answer-artist');
    const answerYear = document.getElementById('answer-year');
    const answerDecade = document.getElementById('answer-decade');
    const folderHint = document.getElementById('folder-hint');
    const btnReveal = document.getElementById('btn-reveal');
    const btnBack = document.getElementById('btn-back');
    const rouletteInstruction = document.getElementById('roulette-instruction');
    const visualWheel = document.getElementById('visual-wheel');

    // Gestión de Jugadores
    const playerListDiv = document.getElementById('player-list');
    const newPlayerNameInput = document.getElementById('new-player-name');
    const winnerModal = document.getElementById('winner-modal');
    
    // --- ESTADO DEL JUEGO ---
    let currentSongs = [];       
    let playedSongs = [];        
    let currentSong = null;      
    let players = [];            
    let selectedEmoji = "🎤";    

    const AUDIO_BASE_PATH = "../assets/songs/"; 

    // --- 1. INICIALIZACIÓN ---
    function init() {
        if (typeof sourceSongs === 'undefined') {
            alert("Error: No se encuentra sourceSongs. Verifica que ../js/songs.js esté bien enlazado en el HTML.");
            return;
        }

        const folders = [...new Set(sourceSongs.map(s => s.file.split('/')[0]))];
        folders.sort();
        
        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder;
            option.textContent = `📂 ${folder}`;
            categorySelect.appendChild(option);
        });

        categorySelect.addEventListener('change', updateSongCounter);
        renderEmojiSelection();
        loadPlayersLocal();
        updateSongCounter();
    }

    // --- 2. GESTIÓN DE CANCIONES ---
    function updateSongCounter() {
        const category = categorySelect.value;
        currentSongs = sourceSongs.filter(s => {
            const isInFolder = category === 'all' || s.file.startsWith(category);
            const isPlayed = playedSongs.includes(s.file);
            return isInFolder && !isPlayed;
        });
        songsCounter.textContent = currentSongs.length;
    }

    window.startGameRound = function() {
        updateSongCounter(); 

        if (currentSongs.length === 0) {
            alert("¡No quedan canciones en esta categoría! Selecciona otra o reinicia.");
            return;
        }

        const randomIndex = Math.floor(Math.random() * currentSongs.length);
        currentSong = currentSongs[randomIndex];
        playedSongs.push(currentSong.file); 

        // 1. Definir categorías posibles con sus colores (usando variables CSS)
        const categories = [
            { label: "🎤 ARTISTA", color: "var(--color-artist)", hex: "#ff6b6b" },
            { label: "🎵 CANCIÓN", color: "var(--color-song)", hex: "#4ecdc4" },
            { label: "📅 AÑO", color: "var(--color-year)", hex: "#ffe66d" },
            { label: "🕰️ DÉCADA", color: "var(--color-decade)", hex: "#a38ec7" }
        ];
        
        // 2. Seleccionar una categoría al azar
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        console.log("Categoría elegida para esta ronda:", randomCategory.label);

        gameplayModal.style.display = 'flex';
        resetModalState();
        
        visualWheel.classList.add('spinning');
        // Mensaje inicial mientras gira
        rouletteInstruction.innerHTML = "BUSCANDO HIT...";
        rouletteInstruction.style.color = "var(--gold-text)";
        folderHint.textContent = "???";

        setTimeout(() => {
            visualWheel.classList.remove('spinning');
            
            // --- AQUÍ SE MUESTRA LA CATEGORÍA AL AZAR ---
            // Usamos innerHTML para dar formato rico
            rouletteInstruction.innerHTML = `
                <div style="font-size: 0.8em; color: #aaa; margin-bottom: 5px;">OBJETIVO:</div>
                <div style="
                    color: ${randomCategory.color}; 
                    font-size: 2.5em; 
                    font-weight: 900; 
                    text-shadow: 0 0 20px ${randomCategory.hex};
                    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                ">
                    ${randomCategory.label}
                </div>
            `;
            
            const folderName = currentSong.file.split('/')[0];
            folderHint.textContent = folderName;

            audioPlayer.src = AUDIO_BASE_PATH + currentSong.file;
            audioPlayer.play().catch(e => {
                console.log("Autoplay bloqueado:", e);
                // Si falla el autoplay, añadimos la instrucción de pulsar play debajo de la categoría
                rouletteInstruction.innerHTML += "<div style='font-size:0.8em; color:#fff; margin-top:10px;'>⬇️ PULSA PLAY ⬇️</div>";
            });

        }, 1500); 
    };

    function resetModalState() {
        answerBox.style.display = 'none'; 
        btnReveal.style.display = 'block';
        btnBack.style.display = 'none';
        answerTitle.textContent = "";
        answerArtist.textContent = "";
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        audioPlayer.src = "";
    }

    window.revealAnswer = function() {
        if (!currentSong) return;
        answerTitle.textContent = currentSong.title;
        answerArtist.textContent = currentSong.artist;
        answerYear.textContent = currentSong.year;
        answerDecade.textContent = currentSong.decade;
        
        answerBox.style.display = 'block'; 
        btnReveal.style.display = 'none'; 
        btnBack.style.display = 'block';  
    };

    window.closeGameModal = function() {
        audioPlayer.pause();
        gameplayModal.style.display = 'none';
        updateSongCounter();
    };

    // --- 3. GESTIÓN JUGADORES (NUEVA LÓGICA QUESITOS) ---
    window.openAddPlayerModal = function() {
        document.getElementById('player-modal').style.display = 'flex';
        newPlayerNameInput.value = '';
        newPlayerNameInput.focus();
    };

    window.addPlayer = function() {
        const name = newPlayerNameInput.value.trim();
        if (!name) return alert("Escribe un nombre");
        
        // Estructura de jugador NUEVA: Objeto wedges
        players.push({ 
            name: name, 
            emoji: selectedEmoji,
            wedges: {
                artist: false,
                song: false,
                year: false,
                decade: false
            },
            finalWedge: false // El 5º quesito
        });
        
        renderPlayers();
        savePlayersLocal();
        document.getElementById('player-modal').style.display = 'none';
    };

    function renderPlayers() {
        playerListDiv.innerHTML = '';
        if (players.length === 0) {
            playerListDiv.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.3); padding: 40px; font-style:italic;">Añade jugadores para comenzar</div>';
            return;
        }

        players.forEach((player, index) => {
            // Verificar si tiene los 4 quesitos básicos para activar el final
            const hasAllFour = player.wedges.artist && player.wedges.song && player.wedges.year && player.wedges.decade;
            const finalClass = player.finalWedge ? 'cheese-final won' : (hasAllFour ? 'cheese-final ready' : 'cheese-final');
            const finalIcon = player.finalWedge ? '🏆' : (hasAllFour ? '🔓' : '🔒');

            const div = document.createElement('div');
            div.className = 'player-card';
            div.innerHTML = `
                <button onclick="deletePlayer(${index})" class="btn-delete">×</button>
                <div class="player-avatar">${player.emoji}</div>
                <div class="player-name">${player.name}</div>
                
                <!-- QUESITOS -->
                <div class="cheeses-container">
                    <div class="cheese-wedge cheese-artist ${player.wedges.artist ? 'active' : ''}" 
                         onclick="toggleWedge(${index}, 'artist')" title="Artista">🎤</div>
                    <div class="cheese-wedge cheese-song ${player.wedges.song ? 'active' : ''}" 
                         onclick="toggleWedge(${index}, 'song')" title="Canción">🎵</div>
                    <div class="cheese-wedge cheese-year ${player.wedges.year ? 'active' : ''}" 
                         onclick="toggleWedge(${index}, 'year')" title="Año">📅</div>
                    <div class="cheese-wedge cheese-decade ${player.wedges.decade ? 'active' : ''}" 
                         onclick="toggleWedge(${index}, 'decade')" title="Década">🕰️</div>
                </div>

                <!-- QUESITO FINAL (5º) -->
                <div class="final-wedge-container">
                    <div class="${finalClass}" onclick="tryWinGame(${index})" title="Quesito Final">
                        ${finalIcon}
                    </div>
                </div>
            `;
            playerListDiv.appendChild(div);
        });
    }

    // Activar/Desactivar un quesito
    window.toggleWedge = function(index, type) {
        if (players[index].finalWedge) return; // Si ya ganó, no tocar nada

        players[index].wedges[type] = !players[index].wedges[type];
        renderPlayers();
        savePlayersLocal();
    };

    // Intentar ganar (Clic en el 5º quesito)
    window.tryWinGame = function(index) {
        const player = players[index];
        const hasAllFour = player.wedges.artist && player.wedges.song && player.wedges.year && player.wedges.decade;

        if (!hasAllFour) return; // Aún no puede ganar

        if (!player.finalWedge) {
            // Confirmación para ganar
            if(confirm(`¿${player.name} ha acertado la pregunta final para GANAR la partida?`)) {
                players[index].finalWedge = true;
                renderPlayers();
                savePlayersLocal();
                
                // Mostrar Victoria
                document.getElementById('winner-name-display').textContent = `¡Felicidades ${player.name}!`;
                winnerModal.style.display = 'flex';
            }
        }
    };

    window.deletePlayer = function(index) {
        if(confirm("¿Eliminar a " + players[index].name + "?")) {
            players.splice(index, 1);
            renderPlayers();
            savePlayersLocal();
        }
    };
    
    // --- NUEVA FUNCIÓN: Reiniciar Progreso ---
    window.resetAllProgress = function() {
        if (!confirm("¿Estás seguro de que quieres REINICIAR todos los quesitos? Los jugadores se mantendrán, pero su progreso volverá a cero.")) {
            return;
        }

        players.forEach(player => {
            player.wedges = {
                artist: false,
                song: false,
                year: false,
                decade: false
            };
            player.finalWedge = false;
        });

        renderPlayers();
        savePlayersLocal();
    };

    window.closeWinnerModal = function() {
        winnerModal.style.display = 'none';
    };

    // --- 4. UTILIDADES ---
    const emojis = ["🦁", "🦊", "🐼", "👽", "🦄", "⚡", "🔥", "💎", "🎩", "👑", "🎧", "🎸", "🎹", "🍸", "🚀"];
    
    function renderEmojiSelection() {
        const container = document.getElementById('emoji-selection-container');
        container.innerHTML = '';
        emojis.forEach(emoji => {
            const span = document.createElement('span');
            span.style.fontSize = "1.5rem";
            span.style.cursor = "pointer";
            span.style.textAlign = "center";
            span.style.padding = "10px";
            span.style.borderRadius = "5px";
            span.style.background = "rgba(255,255,255,0.1)";
            span.textContent = emoji;
            
            if (emoji === selectedEmoji) {
                span.style.background = "var(--gold-gradient)";
                span.style.color = "black";
            }
            
            span.addEventListener('click', () => {
                Array.from(container.children).forEach(child => {
                    child.style.background = "rgba(255,255,255,0.1)";
                    child.style.color = "white";
                });
                span.style.background = "var(--gold-gradient)";
                span.style.color = "black";
                selectedEmoji = emoji;
            });
            container.appendChild(span);
        });
    }

    // Estilo de animación popIn dinámico si no existe en CSS
    if (!document.getElementById('dynamic-styles')) {
        const style = document.createElement('style');
        style.id = 'dynamic-styles';
        style.innerHTML = `
            @keyframes popIn {
                0% { transform: scale(0.5); opacity: 0; }
                80% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    function savePlayersLocal() { localStorage.setItem('hitster_players_v2', JSON.stringify(players)); }
    function loadPlayersLocal() {
        const saved = localStorage.getItem('hitster_players_v2');
        if (saved) { players = JSON.parse(saved); renderPlayers(); }
    }

    init();
});