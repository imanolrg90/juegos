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

    // Gestión de Jugadores y Modales
    const playerListDiv = document.getElementById('player-list');
    const newPlayerNameInput = document.getElementById('new-player-name');
    const winnerModal = document.getElementById('winner-modal');
    
    // Referencias al NUEVO Modal de Grid
    const gridModal = document.getElementById('grid-modal');
    const gridModalBody = document.getElementById('grid-modal-body');
    const gridModalTitle = document.getElementById('grid-modal-title');
    
    // --- ESTADO DEL JUEGO ---
    let currentSongs = [];       
    let playedSongs = [];        
    let currentSong = null;      
    let players = [];            
    let selectedEmoji = "🎤";    
    let activeModalPlayerIndex = null; // Para saber qué jugador estamos viendo en grande

    const AUDIO_BASE_PATH = "../assets/songs/"; 
    
    // Definición de tipos para el Bingo
    const BINGO_TYPES = ['artist', 'song', 'year', 'decade'];
    const TYPE_ICONS = {
        artist: '🎤',
        song: '🎵',
        year: '📅',
        decade: '🕰️'
    };
    const TYPE_CLASSES = {
        artist: 'cell-artist',
        song: 'cell-song',
        year: 'cell-year',
        decade: 'cell-decade'
    };

    // --- 1. INICIALIZACIÓN ---
    function init() {
        if (typeof sourceSongs === 'undefined') {
            console.error("Error: sourceSongs no encontrado.");
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

    // --- 2. LÓGICA DE JUEGO (RULETA) ---
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
            alert("¡No quedan canciones! Cambia de carpeta o reinicia.");
            return;
        }

        const randomIndex = Math.floor(Math.random() * currentSongs.length);
        currentSong = currentSongs[randomIndex];
        playedSongs.push(currentSong.file); 

        // Seleccionar categoría al azar
        const categories = [
            { label: "🎤 ARTISTA", color: "var(--color-artist)", hex: "#ff6b6b" },
            { label: "🎵 CANCIÓN", color: "var(--color-song)", hex: "#4ecdc4" },
            { label: "📅 AÑO", color: "var(--color-year)", hex: "#ffe66d" },
            { label: "🕰️ DÉCADA", color: "var(--color-decade)", hex: "#a38ec7" }
        ];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];

        gameplayModal.style.display = 'flex';
        resetModalState();
        
        visualWheel.classList.add('spinning');
        rouletteInstruction.innerHTML = "BUSCANDO HIT...";
        folderHint.textContent = "???";

        setTimeout(() => {
            visualWheel.classList.remove('spinning');
            
            rouletteInstruction.innerHTML = `
                <div style="font-size: 0.8em; color: #aaa; margin-bottom: 5px;">JUGAMOS POR:</div>
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
            audioPlayer.play().catch(e => console.log("Autoplay bloqueado"));

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

    // --- 3. GENERADOR DE GRID 6x6 EQUILIBRADO ---
    function generateValidBingoGrid() {
        let grid = [];
        let isValid = false;

        while (!isValid) {
            let pool = [];
            BINGO_TYPES.forEach(type => {
                for(let i=0; i<9; i++) pool.push(type); // 9 de cada = 36
            });

            // Fisher-Yates Shuffle
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }

            grid = [];
            for (let r = 0; r < 6; r++) {
                let row = [];
                for (let c = 0; c < 6; c++) {
                    let type = pool[r * 6 + c];
                    row.push({ type: type, active: false });
                }
                grid.push(row);
            }

            isValid = true;
            // Validar Filas
            for (let r = 0; r < 6; r++) {
                const rowTypes = grid[r].map(cell => cell.type);
                if (!BINGO_TYPES.every(t => rowTypes.includes(t))) { isValid = false; break; }
            }
            if (!isValid) continue;

            // Validar Columnas
            for (let c = 0; c < 6; c++) {
                const colTypes = grid.map(row => row[c].type);
                if (!BINGO_TYPES.every(t => colTypes.includes(t))) { isValid = false; break; }
            }
        }
        return grid;
    }

    // --- 4. GESTIÓN JUGADORES ---
    window.openAddPlayerModal = function() {
        document.getElementById('player-modal').style.display = 'flex';
        newPlayerNameInput.value = '';
        newPlayerNameInput.focus();
    };

    window.addPlayer = function() {
        const name = newPlayerNameInput.value.trim();
        if (!name) return alert("Escribe un nombre");
        
        players.push({ 
            name: name, 
            emoji: selectedEmoji,
            grid: generateValidBingoGrid(), 
            canWin: false, 
            finalWedge: false 
        });
        
        renderPlayers();
        savePlayersLocal();
        document.getElementById('player-modal').style.display = 'none';
    };

    function renderPlayers() {
        playerListDiv.innerHTML = '';
        if (players.length === 0) {
            playerListDiv.innerHTML = '<div style="color: #666; padding: 40px; grid-column: 1/-1; text-align: center;">Sin jugadores</div>';
            return;
        }

        players.forEach((player, pIndex) => {
            const finalClass = player.finalWedge ? 'cheese-final won' : (player.canWin ? 'cheese-final ready' : 'cheese-final');
            const finalIcon = player.finalWedge ? '🏆' : (player.canWin ? '🔓' : '🔒');

            // Generamos el grid pequeño (solo lectura visualmente, aunque clickeable)
            let gridHTML = '<div class="bingo-grid">';
            player.grid.forEach((row, rIndex) => {
                row.forEach((cell, cIndex) => {
                    const activeClass = cell.active ? 'active' : '';
                    const typeClass = TYPE_CLASSES[cell.type];
                    const icon = TYPE_ICONS[cell.type];
                    
                    gridHTML += `
                        <div class="bingo-cell ${typeClass} ${activeClass}" 
                             onclick="toggleCell(${pIndex}, ${rIndex}, ${cIndex})"
                             title="${cell.type.toUpperCase()}">
                            ${icon}
                        </div>
                    `;
                });
            });
            gridHTML += '</div>';

            const div = document.createElement('div');
            div.className = 'player-card';
            div.innerHTML = `
                <button onclick="deletePlayer(${pIndex})" class="btn-delete" title="Eliminar">×</button>
                <button onclick="openGridModal(${pIndex})" class="btn-maximize" title="Ver en Grande">👁️</button>
                
                <div class="player-avatar">${player.emoji}</div>
                <div class="player-name">${player.name}</div>
                
                ${gridHTML}

                <div class="final-wedge-container">
                    <div class="${finalClass}" onclick="tryWinGame(${pIndex})" title="Botón Victoria">
                        ${finalIcon}
                    </div>
                </div>
            `;
            playerListDiv.appendChild(div);
        });
    }

    // --- LÓGICA DEL MODAL GIGANTE ---
    window.openGridModal = function(pIndex) {
        activeModalPlayerIndex = pIndex;
        const player = players[pIndex];
        
        gridModalTitle.innerHTML = `${player.emoji} Tablero de ${player.name}`;
        renderGridInModal(player);
        
        gridModal.style.display = 'flex';
    };

    window.closeGridModal = function() {
        gridModal.style.display = 'none';
        activeModalPlayerIndex = null;
    };

    // Renderiza el grid dentro del modal (clase large-view)
    function renderGridInModal(player) {
        let gridHTML = '<div class="bingo-grid large-view">'; // Clase clave para CSS
        player.grid.forEach((row, rIndex) => {
            row.forEach((cell, cIndex) => {
                const activeClass = cell.active ? 'active' : '';
                const typeClass = TYPE_CLASSES[cell.type];
                const icon = TYPE_ICONS[cell.type];
                
                // Usamos el mismo toggleCell, funciona igual
                gridHTML += `
                    <div class="bingo-cell ${typeClass} ${activeClass}" 
                         onclick="toggleCell(${players.indexOf(player)}, ${rIndex}, ${cIndex})">
                        ${icon}
                    </div>
                `;
            });
        });
        gridHTML += '</div>';
        gridModalBody.innerHTML = gridHTML;
    }

    // --- ACCIÓN: CLIC EN CELDA (Funciona para ambos grids) ---
    window.toggleCell = function(pIndex, rIndex, cIndex) {
        if (players[pIndex].finalWedge) return; 

        // Alternar estado
        players[pIndex].grid[rIndex][cIndex].active = !players[pIndex].grid[rIndex][cIndex].active;
        
        // Comprobar victoria
        players[pIndex].canWin = checkLineCompletion(players[pIndex].grid);

        // Guardar
        savePlayersLocal();

        // Actualizar UI: Siempre actualizamos la lista principal
        renderPlayers();

        // Si el modal gigante está abierto y corresponde a este jugador, actualizarlo también
        if (activeModalPlayerIndex === pIndex && gridModal.style.display === 'flex') {
            renderGridInModal(players[pIndex]);
        }
    };

    function checkLineCompletion(grid) {
        // Filas
        for (let r = 0; r < 6; r++) {
            if (grid[r].every(cell => cell.active)) return true;
        }
        // Columnas
        for (let c = 0; c < 6; c++) {
            let colComplete = true;
            for (let r = 0; r < 6; r++) {
                if (!grid[r][c].active) { colComplete = false; break; }
            }
            if (colComplete) return true;
        }
        return false;
    }

    window.tryWinGame = function(index) {
        const player = players[index];
        if (!player.canWin) return; 

        if (!player.finalWedge) {
            if(confirm(`¿${player.name} ha acertado la pregunta FINAL?`)) {
                players[index].finalWedge = true;
                
                // Si estaba en el modal grande, cerrar o actualizar
                if(activeModalPlayerIndex === index) closeGridModal();

                renderPlayers();
                savePlayersLocal();
                
                document.getElementById('winner-name-display').textContent = `¡${player.name} GANA!`;
                winnerModal.style.display = 'flex';
            }
        }
    };

    window.deletePlayer = function(index) {
        if(confirm("¿Eliminar jugador?")) {
            players.splice(index, 1);
            if(activeModalPlayerIndex === index) closeGridModal();
            renderPlayers();
            savePlayersLocal();
        }
    };

    window.resetAllProgress = function() {
        if (!confirm("¿Reiniciar tableros a cero?")) return;
        players.forEach(p => {
            p.grid.forEach(row => row.forEach(c => c.active = false));
            p.canWin = false;
            p.finalWedge = false;
        });
        if(activeModalPlayerIndex !== null) renderGridInModal(players[activeModalPlayerIndex]);
        renderPlayers();
        savePlayersLocal();
    };
    
    window.closeWinnerModal = function() { winnerModal.style.display = 'none'; };

    // --- UTILIDADES ---
    const emojis = ["🦁","🐯","🐻","👽","🤖","💀","🤠","🎃","👻","🦄","🐲","🍕","🍔","🍟","⚽","🏀","🎸","🎮","🚀","💎"];
    
    function renderEmojiSelection() {
        const container = document.getElementById('emoji-selection-container');
        container.innerHTML = '';
        emojis.forEach(emoji => {
            const span = document.createElement('span');
            span.style.cssText = "font-size:1.5rem; cursor:pointer; padding:5px; border-radius:5px;";
            span.textContent = emoji;
            span.onclick = () => {
                selectedEmoji = emoji;
                Array.from(container.children).forEach(c => c.style.background = 'transparent');
                span.style.background = 'rgba(255,255,255,0.3)';
            };
            container.appendChild(span);
        });
    }

    function savePlayersLocal() { localStorage.setItem('hitster_pro_bingo', JSON.stringify(players)); }
    function loadPlayersLocal() {
        const saved = localStorage.getItem('hitster_pro_bingo');
        if (saved) { players = JSON.parse(saved); renderPlayers(); }
    }

    init();
});