document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS DOM ---
    const gridContainer = document.getElementById('bingoGrid');
    const newGameBtn = document.getElementById('newGameBtn');
    const nextSongBtn = document.getElementById('nextSongBtn');
    const manualBtn = document.getElementById('manualBtn');
    const categorySelect = document.getElementById('categorySelect');
    
    // Audio
    const audioPlayer = document.getElementById('audioPlayer');
    const sidebarAudioContainer = document.getElementById('sidebarAudioContainer');
    const modalAudioContainer = document.getElementById('modalAudioContainer');
    
    // Botones Modal
    const revealResultBtn = document.getElementById('revealResultBtn');
    const confirmResultBtn = document.getElementById('confirmResultBtn');
    
    // Displays
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
    const modalBigArtist = document.getElementById('modalBigArtist');
    
    // Countdown
    const countdownDisplay = document.getElementById('countdownDisplay');
    const gameContent = document.getElementById('gameContent');

    // Patrocinador
    const sponsorContainer = document.getElementById('sponsorContainer');
    const sponsorImg = document.getElementById('sponsorImg');
    const sponsorName = document.getElementById('sponsorName');

    // Lista Modal
    const songsListBtn = document.getElementById('songsListBtn');
    const songsModal = document.getElementById('songsModal');
    const closeListModal = document.getElementById('closeListModal');
    const songsListContainer = document.getElementById('songsList');

    // --- VARIABLES DE ESTADO ---
    let fullLibrary = [];      // Todas las canciones cargadas y procesadas
    let currentPlaylist = [];  // Las 90 canciones de la partida actual
    let currentSongObj = null; // Canción sonando ahora
    let playedCount = 0;
    let isManualMode = false;
    let countdownInterval = null;

    // --- 1. CARGA Y UNIFICACIÓN DE DATOS ---
function loadAndProcessSongs() {
    let rawData = [];

    // Detectar fuente de datos
    if (typeof ALL_SONGS_DATA !== 'undefined') {
        rawData = ALL_SONGS_DATA;
    } else if (typeof sourceSongs !== 'undefined') {
        rawData = sourceSongs;
    } else {
        alert("❌ ERROR: No hay canciones. Revisa songs.js");
        return;
    }

    fullLibrary = rawData.map(song => {
        // 1. Detectar Categoría
        const parts = song.file.split('/');
        let category = parts.length > 1 ? parts[0] : (song.decade || "General");

        // 2. Separar Artista y Título si vienen juntos (Formato antiguo: "Artista - Cancion")
        let finalTitle = song.title;
        let finalArtist = song.artist;

        if (!finalArtist && finalTitle && finalTitle.includes(' - ')) {
            const splitInfo = finalTitle.split(' - ');
            finalArtist = splitInfo[0]; // La primera parte es el artista
            finalTitle = splitInfo.slice(1).join(' - '); // El resto es la canción
        }

        return {
            ...song,
            category: category,
            title: finalTitle || "Título Desconocido",
            artist: finalArtist || "", // Ahora siempre tendremos artista
            file: song.file
        };
    });

    console.log(`📚 Librería procesada: ${fullLibrary.length} canciones.`);
    initCategorySelect();
}

    // --- 2. INICIALIZAR SELECTOR DE CATEGORÍAS ---
    function initCategorySelect() {
        // Limpiamos excepto la primera opción
        categorySelect.innerHTML = '<option value="all">🔄 Todas las Categorías</option>';
        
        // Obtenemos categorías únicas y las ordenamos
        const categories = [...new Set(fullLibrary.map(s => s.category))].sort();
        
        if (categories.length === 0) {
            console.warn("No se detectaron categorías.");
            return;
        }

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = `📁 ${cat}`;
            categorySelect.appendChild(option);
        });
    }

    // --- 3. PERSISTENCIA (GUARDAR PARTIDA) ---
    function saveGameState() {
        const gameState = {
            playlist: currentPlaylist,
            playedCount: playedCount,
            currentSongObj: currentSongObj,
            active: true,
            selectedCategory: categorySelect.value // Guardamos la elección
        };
        localStorage.setItem('bingoMusicalState', JSON.stringify(gameState));
    }

    function restoreGameState() {
        const savedData = localStorage.getItem('bingoMusicalState');
        if (!savedData) return;

        try {
            const state = JSON.parse(savedData);
            if (!state.playlist || state.playlist.length === 0) return;

            currentPlaylist = state.playlist;
            playedCount = state.playedCount;
            
            // Restaurar selección del dropdown si existe la opción
            if(state.selectedCategory) {
                categorySelect.value = state.selectedCategory;
            }

            songsPlayedDisplay.textContent = playedCount;
            gameStatusDisplay.textContent = 'Recuperado';
            nextSongBtn.disabled = false;
            
            // Restaurar tablero visual
            currentPlaylist.forEach(song => {
                if (song.played) toggleCellVisuals(song.number, true);
            });

            updateSongsListModal();
            console.log("Estado restaurado.");

        } catch (e) {
            console.error("Error restaurando:", e);
            localStorage.removeItem('bingoMusicalState');
        }
    }

    // --- 4. LÓGICA DEL JUEGO ---

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

    function toggleManualMode() {
        isManualMode = !isManualMode;
        manualBtn.classList.toggle('active'); 
        gridContainer.classList.toggle('manual-mode-on'); 
        manualBtn.textContent = isManualMode ? "🖐 Desactivar Manual" : "🖐 Modo Manual";
    }

    function handleManualClick(number) {
        if (!isManualMode) return;
        if (currentPlaylist.length === 0) {
            toggleCellVisuals(number);
            return;
        }
        const songData = currentPlaylist.find(s => s.number === number);
        if (songData) {
            songData.played = !songData.played;
            toggleCellVisuals(number, songData.played);
            songData.played ? playedCount++ : playedCount--;
            songsPlayedDisplay.textContent = playedCount;
            updateSongsListModal(); 
            saveGameState();
        }
    }

    function toggleCellVisuals(number, forceState = null) {
        const cell = document.getElementById(`cell-${number}`);
        if (!cell) return;
        if (forceState === true) cell.classList.add('marked');
        else if (forceState === false) cell.classList.remove('marked');
        else cell.classList.toggle('marked');
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- COMENZAR JUEGO ---
    function startNewGame() {
        if (currentPlaylist.length > 0 && !confirm('¿Borrar partida actual y empezar nueva?')) return;

        localStorage.removeItem('bingoMusicalState');
        if (countdownInterval) clearInterval(countdownInterval);
        if(sidebarAudioContainer && audioPlayer) sidebarAudioContainer.appendChild(audioPlayer);

        // Reset variables
        playedCount = 0;
        songsPlayedDisplay.textContent = '0';
        gameStatusDisplay.textContent = 'En juego';
        currentNumberDisplay.textContent = '-';
        currentSongDisplay.textContent = 'Pulsa Siguiente';
        document.querySelectorAll('.bingo-number').forEach(el => el.classList.remove('marked'));
        
        if (fullLibrary.length === 0) {
            alert("No hay canciones cargadas.");
            return;
        }

        // --- FILTRADO ---
        const selectedCat = categorySelect.value;
        let pool = [];

        if (selectedCat === 'all') {
            pool = [...fullLibrary];
        } else {
            pool = fullLibrary.filter(s => s.category === selectedCat);
        }

        if (pool.length === 0) {
            alert("Error: Esa categoría está vacía.");
            return;
        }

        // Aviso si hay pocas canciones
        if (pool.length < 90) {
            console.log(`Aviso: La categoría tiene ${pool.length} canciones. Se repetirán para llenar el bingo.`);
        }

        // Mezclar y llenar 90 huecos
        let shuffledPool = shuffleArray(pool);
        currentPlaylist = [];
        
        for (let i = 1; i <= 90; i++) {
            // Usamos módulo % para repetir si se acaban
            const song = shuffledPool[(i - 1) % shuffledPool.length];
            currentPlaylist.push({
                number: i,
                ...song, // Copia todas las propiedades (file, title, artist, patrocinador...)
                played: false
            });
        }

        nextSongBtn.disabled = false;
        updateSongsListModal();
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        saveGameState();
    }

    // --- SIGUIENTE CANCIÓN ---
function playNextSong() {
        if(isManualMode) toggleManualMode();
        if (countdownInterval) clearInterval(countdownInterval);

        const unplayed = currentPlaylist.filter(s => !s.played);
        if (unplayed.length === 0) {
            alert("¡BINGO TERMINADO!");
            nextSongBtn.disabled = true;
            return;
        }

        const randomIndex = Math.floor(Math.random() * unplayed.length);
        currentSongObj = unplayed[randomIndex];

        // --- RUTA DEL AUDIO ---
        audioPlayer.src = `../assets/songs/${currentSongObj.file}`;
        
        // UI
        guessStep1.style.display = 'block';
        guessStep2.style.display = 'none';
        guessModal.style.display = 'flex'; 
        gameContent.style.display = 'none';
        
        // --- INICIO CUENTA ATRÁS ---
        if(countdownDisplay) {
            countdownDisplay.style.display = 'block';
            countdownDisplay.textContent = "3";
            playBeep(800, 150); // 🔊 Pitido para el "3"
        }

        // Patrocinador
        if (currentSongObj.patrocinador && sponsorContainer) {
            sponsorName.textContent = currentSongObj.patrocinador;
            sponsorImg.src = `../assets/${currentSongObj.imagen}`;
            sponsorContainer.style.display = 'block';
        } else if (sponsorContainer) {
            sponsorContainer.style.display = 'none';
        }

        let secondsLeft = 3;
        countdownInterval = setInterval(() => {
            secondsLeft--;
            if (secondsLeft > 0) {
                countdownDisplay.textContent = secondsLeft;
                playBeep(800, 150); // 🔊 Pitido para el "2" y el "1"
            } else {
                // FIN DE CUENTA ATRÁS
                clearInterval(countdownInterval);
                playBeep(1200, 300); // 🔊 Pitido final más agudo y largo (opcional)
                
                countdownDisplay.style.display = 'none';
                gameContent.style.display = 'block';
                modalAudioContainer.appendChild(audioPlayer);
                
                audioPlayer.play().catch(e => {
                    console.error("Autoplay bloqueado:", e);
                    alert("Pulsa play manualmente.");
                });
            }
        }, 1000); 
    }

function showResultInModal() {
    if (!currentSongObj) return;
    
    // Referencias a los elementos del DOM
    const modalBigNumber = document.getElementById('modalBigNumber');
    const modalBigTitle = document.getElementById('modalBigTitle');
    const modalBigArtist = document.getElementById('modalBigArtist'); // Referencia al nuevo elemento

    // Asignar valores
    modalBigNumber.textContent = `#${currentSongObj.number}`;
    modalBigTitle.textContent = currentSongObj.title;
    
    // Si hay artista lo ponemos, si no, lo dejamos vacío
    if(modalBigArtist) {
        modalBigArtist.textContent = currentSongObj.artist || "";
    }
    
    // Cambiar de pantalla en el modal
    document.getElementById('guessStep1').style.display = 'none'; 
    document.getElementById('guessStep2').style.display = 'block'; 
}

    function confirmAndClose() {
        if (!currentSongObj) return;
        currentSongObj.played = true;
        guessModal.style.display = 'none';
        
        if (countdownInterval) clearInterval(countdownInterval);
        sidebarAudioContainer.appendChild(audioPlayer);

        currentNumberDisplay.textContent = currentSongObj.number;
        currentSongDisplay.textContent = currentSongObj.title;
        toggleCellVisuals(currentSongObj.number, true);
        
        playedCount++;
        songsPlayedDisplay.textContent = playedCount;
        updateSongsListModal();
        saveGameState();
    }

    function updateSongsListModal() {
        songsListContainer.innerHTML = '';
        const sortedList = [...currentPlaylist].sort((a, b) => a.number - b.number);
        
        sortedList.forEach(song => {
            const item = document.createElement('div');
            item.className = `song-item ${song.played ? 'played' : ''}`;
            item.innerHTML = `
                <span class="number">#${song.number}</span>
                <div style="flex-grow:1; text-align:left; padding-left:10px;">
                    <div class="title">${song.title}</div>
                    <div style="font-size:0.8em; color:#ccc;">${song.artist || ''}</div>
                </div>
                <span class="checkmark">${song.played ? '✓' : ''}</span>
            `;
            songsListContainer.appendChild(item);
        });
    }

    // --- INICIALIZACIÓN ---
    initGrid();
    loadAndProcessSongs(); // Carga canciones y rellena el selector
    restoreGameState();

    // Event Listeners
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

// --- FUNCIÓN PARA GENERAR PITIDO (SIN ARCHIVOS MP3) ---
    function playBeep(frequency = 600, duration = 100) {
        // Crea el contexto de audio
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return; // Si el navegador es muy viejo, no hace nada
        
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Configuración del sonido
        oscillator.type = 'sine';       // Tipo de onda (suave)
        oscillator.frequency.value = frequency; // Tono en Hz (800 es agudo, 400 grave)
        
        // Volumen y duración
        gainNode.gain.value = 0.1;      // Volumen bajito (0.1 de 1.0)
        oscillator.start();
        
        setTimeout(() => {
            oscillator.stop();
        }, duration);
    }