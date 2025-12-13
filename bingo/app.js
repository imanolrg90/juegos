document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS DOM ---
    const gridContainer = document.getElementById('bingoGrid');
    const newGameBtn = document.getElementById('newGameBtn');
    const nextSongBtn = document.getElementById('nextSongBtn');
    const manualBtn = document.getElementById('manualBtn');
    
    // Elementos del Juego y Audio
    const audioPlayer = document.getElementById('audioPlayer');
    const sidebarAudioContainer = document.getElementById('sidebarAudioContainer'); // Contenedor Original
    const modalAudioContainer = document.getElementById('modalAudioContainer');     // Contenedor Modal
    
    const revealResultBtn = document.getElementById('revealResultBtn');
    const confirmResultBtn = document.getElementById('confirmResultBtn');
    
    // Elementos de Info
    const currentNumberDisplay = document.getElementById('currentNumber');
    const currentSongDisplay = document.getElementById('currentSong');
    const songsPlayedDisplay = document.getElementById('songsPlayed');
    const gameStatusDisplay = document.getElementById('gameStatus');
    
    // Elementos del Modal Resultado
    const guessModal = document.getElementById('guessModal');
    const guessStep1 = document.getElementById('guessStep1');
    const guessStep2 = document.getElementById('guessStep2');
    const modalBigNumber = document.getElementById('modalBigNumber');
    const modalBigTitle = document.getElementById('modalBigTitle');
    
    // Elementos Cuenta Atrás y Contenido
    const countdownDisplay = document.getElementById('countdownDisplay');
    const gameContent = document.getElementById('gameContent');

    // Elementos del Patrocinador
    const sponsorContainer = document.getElementById('sponsorContainer');
    const sponsorImg = document.getElementById('sponsorImg');
    const sponsorName = document.getElementById('sponsorName');

    // Elementos Modal Lista
    const songsListBtn = document.getElementById('songsListBtn');
    const songsModal = document.getElementById('songsModal');
    const closeListModal = document.getElementById('closeListModal');
    const songsListContainer = document.getElementById('songsList');

    // --- ESTADO DEL JUEGO ---
    let currentPlaylist = []; 
    let playedCount = 0;
    let currentSongObj = null;
    let isManualMode = false;
    let countdownInterval = null;

    // --- SISTEMA DE GUARDADO (PERSISTENCIA) ---

    function saveGameState() {
        const gameState = {
            playlist: currentPlaylist,
            playedCount: playedCount,
            currentSongObj: currentSongObj,
            active: true
        };
        localStorage.setItem('bingoMusicalState', JSON.stringify(gameState));
    }

    function restoreGameState() {
        const savedData = localStorage.getItem('bingoMusicalState');
        if (!savedData) return;

        try {
            const state = JSON.parse(savedData);
            
            // Si la playlist guardada está vacía, ignoramos
            if (!state.playlist || state.playlist.length === 0) return;

            // Restauramos variables de estado
            currentPlaylist = state.playlist;
            playedCount = state.playedCount;
            // No restauramos el audio activo para evitar autoplay al recargar

            // Restauramos la Interfaz
            songsPlayedDisplay.textContent = playedCount;
            gameStatusDisplay.textContent = 'Partida Recuperada';
            nextSongBtn.disabled = false;

            // Restauramos el Grid Visual
            currentPlaylist.forEach(song => {
                if (song.played) {
                    toggleCellVisuals(song.number, true); // true = forzar marcado
                }
            });

            // Restauramos la Lista de Canciones (El Log)
            updateSongsListModal();
            console.log("Estado del bingo recuperado correctamente.");

        } catch (e) {
            console.error("Error recuperando partida:", e);
            localStorage.removeItem('bingoMusicalState');
        }
    }

    function clearGameState() {
        localStorage.removeItem('bingoMusicalState');
    }

    // --- FUNCIONES DE INICIO Y TABLERO ---

    function initGrid() {
        gridContainer.innerHTML = '';
        gridContainer.classList.remove('manual-mode-on');
        
        for (let i = 1; i <= 90; i++) {
            const cell = document.createElement('div');
            cell.className = 'bingo-number';
            cell.id = `cell-${i}`;
            cell.textContent = i;
            cell.addEventListener('click', () => handleManualClick(i));
            gridContainer.appendChild(cell);
        }
    }

    // --- LÓGICA MODO MANUAL ---

    function toggleManualMode() {
        isManualMode = !isManualMode;
        if (isManualMode) {
            manualBtn.textContent = "🖐 Desactivar Manual";
            manualBtn.classList.add('active'); 
            gridContainer.classList.add('manual-mode-on'); 
        } else {
            manualBtn.textContent = "🖐 Activar Modo Manual";
            manualBtn.classList.remove('active');
            gridContainer.classList.remove('manual-mode-on');
        }
    }

    function handleManualClick(number) {
        if (!isManualMode) return;
        if (currentPlaylist.length === 0) {
            // Si no hay partida iniciada, solo pintamos visualmente
            toggleCellVisuals(number);
            return;
        }

        const songData = currentPlaylist.find(s => s.number === number);
        if (songData) {
            songData.played = !songData.played;
            toggleCellVisuals(number, songData.played);

            if (songData.played) playedCount++;
            else playedCount--;
            
            songsPlayedDisplay.textContent = playedCount;
            updateSongsListModal(); 
            
            // GUARDAMOS EL ESTADO TRAS EL CAMBIO MANUAL
            saveGameState();
        }
    }

    function toggleCellVisuals(number, forceState = null) {
        const cell = document.getElementById(`cell-${number}`);
        if (!cell) return;
        
        // Limpiamos la clase primero si vamos a forzar estado
        if (forceState === true) {
            cell.classList.add('marked');
        } else if (forceState === false) {
            cell.classList.remove('marked');
        } else {
            cell.classList.toggle('marked');
        }
    }

    // --- LÓGICA JUEGO AUTOMÁTICO ---

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function startNewGame() {
        if (!confirm('¿Empezar nuevo bingo? Se borrará el historial actual.')) return;

        // Borramos el estado guardado anterior
        clearGameState();

        if (countdownInterval) clearInterval(countdownInterval);

        // RESETEAR UBICACIÓN DEL PLAYER
        if(sidebarAudioContainer && audioPlayer) {
            sidebarAudioContainer.appendChild(audioPlayer);
        }

        playedCount = 0;
        songsPlayedDisplay.textContent = '0';
        gameStatusDisplay.textContent = 'En juego';
        currentNumberDisplay.textContent = '-';
        currentSongDisplay.textContent = 'Dale a Siguiente Canción';
        
        document.querySelectorAll('.bingo-number').forEach(el => el.classList.remove('marked'));
        if(isManualMode) toggleManualMode();

        if (typeof sourceSongs === 'undefined' || sourceSongs.length === 0) {
            alert("Error: No se han cargado las canciones (songs.js no encontrado o vacío).");
            return;
        }

        let songsToShuffle = [...sourceSongs]; 
        songsToShuffle = shuffleArray(songsToShuffle);

        currentPlaylist = [];
        for (let i = 1; i <= 90; i++) {
            const sourceIndex = (i - 1) % songsToShuffle.length;
            currentPlaylist.push({
                number: i,
                file: songsToShuffle[sourceIndex].file,
                title: songsToShuffle[sourceIndex].title,
                patrocinador: songsToShuffle[sourceIndex].patrocinador || null, 
                imagen: songsToShuffle[sourceIndex].imagen || null,
                played: false
            });
        }

        nextSongBtn.disabled = false;
        updateSongsListModal();
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        
        // GUARDAMOS EL INICIO DE LA PARTIDA
        saveGameState();
    }

    function playNextSong() {
        if(isManualMode) toggleManualMode();
        if (countdownInterval) clearInterval(countdownInterval);

        const unplayed = currentPlaylist.filter(s => !s.played);
        if (unplayed.length === 0) {
            alert("¡Bingo finalizado!");
            nextSongBtn.disabled = true;
            return;
        }

        // Selección de canción
        const randomIndex = Math.floor(Math.random() * unplayed.length);
        currentSongObj = unplayed[randomIndex];

        // RUTA CORREGIDA: Apunta a ../assets/songs/
        audioPlayer.src = `../assets/songs/${currentSongObj.file}`;

        // Mostrar Modal Paso 1
        guessStep1.style.display = 'block';
        guessStep2.style.display = 'none';
        guessModal.style.display = 'flex'; 

        // LÓGICA DE PATROCINADOR
        if (currentSongObj.patrocinador && sponsorContainer) {
            sponsorName.textContent = currentSongObj.patrocinador;
            // RUTA CORREGIDA: Apunta a ../assets/
            sponsorImg.src = `../assets/${currentSongObj.imagen}`;
            sponsorContainer.style.display = 'block';
        } else if (sponsorContainer) {
            sponsorContainer.style.display = 'none';
        }

        // CUENTA ATRÁS
        if(gameContent) gameContent.style.display = 'none';
        
        if(countdownDisplay) {
            countdownDisplay.style.display = 'block';
            countdownDisplay.textContent = "3";
        }

        let secondsLeft = 3;
        
        countdownInterval = setInterval(() => {
            secondsLeft--;
            
            if (secondsLeft > 0) {
                if(countdownDisplay) countdownDisplay.textContent = secondsLeft;
            } else {
                // FIN DE CUENTA ATRÁS
                clearInterval(countdownInterval);
                
                if(countdownDisplay) countdownDisplay.style.display = 'none';
                if(gameContent) gameContent.style.display = 'block';
                
                // --- MOVEMOS EL PLAYER AL MODAL ---
                modalAudioContainer.appendChild(audioPlayer);
                
                // REPRODUCIR
                audioPlayer.play().catch(e => console.log("Error audio:", e));
            }
        }, 1000); 
    }

    function showResultInModal() {
        if (!currentSongObj) return;
        modalBigNumber.textContent = currentSongObj.number;
        modalBigTitle.textContent = currentSongObj.title;
        guessStep1.style.display = 'none'; 
        guessStep2.style.display = 'block'; 
    }

    function confirmAndClose() {
        if (!currentSongObj) return;
        currentSongObj.played = true;
        guessModal.style.display = 'none';
        
        if (countdownInterval) clearInterval(countdownInterval);

        // --- DEVOLVEMOS EL PLAYER A LA BARRA LATERAL ---
        sidebarAudioContainer.appendChild(audioPlayer);

        currentNumberDisplay.textContent = currentSongObj.number;
        currentSongDisplay.textContent = currentSongObj.title;
        toggleCellVisuals(currentSongObj.number, true);
        playedCount++;
        songsPlayedDisplay.textContent = playedCount;
        updateSongsListModal();
        
        // GUARDAMOS EL PROGRESO TRAS CONFIRMAR
        saveGameState();
    }

    function updateSongsListModal() {
        songsListContainer.innerHTML = '';
        // Ordenamos por número para que sea fácil de revisar
        const sortedList = [...currentPlaylist].sort((a, b) => a.number - b.number);
        
        sortedList.forEach(song => {
            const item = document.createElement('div');
            // Añadimos clase 'played' si ya salió
            item.className = `song-item ${song.played ? 'played' : ''}`;
            
            item.innerHTML = `
                <span class="number">#${song.number}</span>
                <span class="title">${song.title}</span>
                <span class="checkmark">✓</span>
            `;
            songsListContainer.appendChild(item);
        });
    }

    // --- LISTENERS E INICIALIZACIÓN ---
    initGrid();
    
    // INTENTAMOS RECUPERAR DATOS AL CARGAR LA PÁGINA
    restoreGameState();

    if(newGameBtn) newGameBtn.addEventListener('click', startNewGame);
    if(nextSongBtn) nextSongBtn.addEventListener('click', playNextSong);
    if(manualBtn) manualBtn.addEventListener('click', toggleManualMode);
    
    if(revealResultBtn) revealResultBtn.addEventListener('click', showResultInModal);
    if(confirmResultBtn) confirmResultBtn.addEventListener('click', confirmAndClose);

    if(songsListBtn) songsListBtn.addEventListener('click', () => songsModal.style.display = 'block');
    if(closeListModal) closeListModal.addEventListener('click', () => songsModal.style.display = 'none');
    
    window.addEventListener('click', (event) => {
        if (event.target == songsModal) songsModal.style.display = 'none';
    });
});