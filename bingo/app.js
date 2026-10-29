document.addEventListener('DOMContentLoaded', () => {
    const halloweenToggle = document.getElementById('halloweenToggle');
    const halloweenNotice = document.getElementById('halloweenNotice');
    const halloweenStorageKey = 'bingoHalloweenMode';

    function applyHalloweenMode(enabled) {
        document.body.classList.toggle('halloween-mode', enabled);
        halloweenToggle.setAttribute('aria-pressed', String(enabled));
        halloweenToggle.querySelector('.halloween-toggle-state').textContent = enabled ? 'ON' : 'OFF';
    }

    function reportThemeStorageError(error) {
        console.warn('No se pudo guardar o recuperar el modo Halloween:', error);
        halloweenNotice.textContent = 'No se puede recordar el modo Halloween en este navegador. Puedes cambiarlo durante esta visita.';
        halloweenNotice.hidden = false;
    }

    try {
        applyHalloweenMode(localStorage.getItem(halloweenStorageKey) === 'true');
    } catch (error) {
        reportThemeStorageError(error);
    }

    halloweenToggle.addEventListener('click', () => {
        const enabled = !document.body.classList.contains('halloween-mode');
        applyHalloweenMode(enabled);
        try {
            localStorage.setItem(halloweenStorageKey, String(enabled));
            halloweenNotice.hidden = true;
        } catch (error) {
            reportThemeStorageError(error);
        }
    });

    // --- REFERENCIAS DOM ---
    const gridContainer = document.getElementById('bingoGrid');
    const newGameBtn = document.getElementById('newGameBtn');
    const nextSongBtn = document.getElementById('nextSongBtn');
    const manualBtn = document.getElementById('manualBtn');
    const categorySelect = document.getElementById('categorySelect'); 
    const sponsorFolderSelect = document.getElementById('sponsorFolderSelect');
    const sponsorFolderNotice = document.getElementById('sponsorFolderNotice');
    let activeSponsorFolder = 'estandar';
    let sponsorFolders = [];

    function updateSponsorFolderNotice() {
        const folder = sponsorFolders.find(folder => folder.name === sponsorFolderSelect.value);
        if (!folder) return;
        const count = folder.sponsors.length;
        sponsorFolderNotice.textContent = count > 90
            ? `${count} imágenes: se elegirán 90 al azar para el nuevo bingo.`
            : `${count} patrocinadores para el nuevo bingo${count === 0 ? ' (carpeta vacía)' : ''}.`;
    }

    async function loadSponsorFolders() {
        const response = await fetch('/api/bingo/sponsors', { cache: 'no-store' });
        if (!response.ok) throw new Error('No se pudieron cargar las carpetas. Comprueba el servidor y assets/img/estandar.');
        const catalog = await response.json();
        if (!Array.isArray(catalog.folders) || !catalog.folders.some(folder => folder.name === 'estandar')) {
            throw new Error('El catálogo de patrocinadores no contiene la carpeta obligatoria estandar.');
        }
        const selected = sponsorFolderSelect.value;
        sponsorFolders = catalog.folders;
        sponsorFolderSelect.replaceChildren();
        sponsorFolders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.name;
            option.textContent = folder.name;
            sponsorFolderSelect.appendChild(option);
        });
        sponsorFolderSelect.value = sponsorFolders.some(folder => folder.name === selected) ? selected : 'estandar';
        sponsorFolderSelect.disabled = false;
        updateSponsorFolderNotice();
    }

    function reportSponsorError(error) {
        console.error('Error cargando patrocinadores:', error);
        sponsorFolderNotice.textContent = `${error.message} Pulsa Nuevo Bingo para reintentar.`;
    }

    sponsorFolderSelect.addEventListener('change', updateSponsorFolderNotice);
    
    // Elementos del Juego y Audio
    const audioPlayer = document.getElementById('audioPlayer');
    const halloweenScream = new Audio('../assets/sounds/scream.mp3');
    halloweenScream.preload = 'auto';
    const sidebarAudioContainer = document.getElementById('sidebarAudioContainer');
    const modalAudioContainer = document.getElementById('modalAudioContainer');
    
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
    const modalBigArtist = document.getElementById('modalBigArtist');
    
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
    let fullLibrary = [];      
    let currentPlaylist = []; 
    let playedCount = 0;
    let currentSongObj = null;
    let isManualMode = false;
    let countdownInterval = null;
    let lastMarkedNumber = null;

    function playCountdownSound(final = false) {
        if (document.body.classList.contains('halloween-mode')) {
            halloweenScream.pause();
            if (halloweenScream.readyState > 0) halloweenScream.currentTime = 0;
            halloweenScream.volume = audioPlayer.muted ? 0 : audioPlayer.volume;
            halloweenScream.play().catch(error => console.error('No se pudo reproducir el grito de Halloween:', error));
            return;
        }

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            console.warn('Este navegador no admite los pitidos de la cuenta atras.');
            return;
        }

        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const now = audioCtx.currentTime;
        const duration = final ? 0.3 : 0.15;
        gainNode.connect(audioCtx.destination);

        oscillator.connect(gainNode);
        oscillator.type = 'sine';
        oscillator.frequency.value = final ? 1200 : 800;
        gainNode.gain.value = 0.1;

        oscillator.onended = () => {
            audioCtx.close().catch(error => console.error('Error al cerrar el efecto de audio:', error));
        };
        audioCtx.resume().catch(error => console.error('No se pudo iniciar el sonido de la cuenta atras:', error));
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    const pBtnPlay = document.getElementById('pBtnPlay');
    const pBtnRw = document.getElementById('pBtnRw');
    const pBtnFw = document.getElementById('pBtnFw');
    const seekSlider = document.getElementById('seekSlider');
    const volumeSlider = document.getElementById('volumeSlider');
    const currentTimeText = document.getElementById('currentTime');
    const durationText = document.getElementById('duration');
    const saveSongStartBtn = document.getElementById('saveSongStartBtn');
    const songStartNotice = document.getElementById('songStartNotice');
    const useSavedStarts = document.getElementById('useSavedStarts');
    const songStartPreferenceNotice = document.getElementById('songStartPreferenceNotice');
    const savedStartsStorageKey = 'bingoUseSavedStarts';
    let loadedSong = null;
    let savingSongStart = false;
    let applySavedStartToLoadedSong = true;

    function reportStartPreferenceError(error) {
        console.warn('No se pudo recordar la preferencia de inicios:', error);
        songStartPreferenceNotice.textContent = 'No se puede recordar esta opción en el navegador. Se aplicará durante esta visita.';
        songStartPreferenceNotice.hidden = false;
    }

    try {
        useSavedStarts.checked = localStorage.getItem(savedStartsStorageKey) !== 'false';
    } catch (error) {
        reportStartPreferenceError(error);
    }

    useSavedStarts.addEventListener('change', () => {
        try {
            localStorage.setItem(savedStartsStorageKey, String(useSavedStarts.checked));
            songStartPreferenceNotice.hidden = true;
        } catch (error) {
            reportStartPreferenceError(error);
        }
    });

    function updateSaveSongStartButton() {
        saveSongStartBtn.disabled = savingSongStart || !loadedSong || audioPlayer.readyState < 1
            || !Number.isFinite(audioPlayer.duration) || audioPlayer.duration <= 0;
    }

    function loadSongAudio(song) {
        loadedSong = song;
        applySavedStartToLoadedSong = useSavedStarts.checked;
        songStartNotice.textContent = '';
        songStartNotice.dataset.error = 'false';
        saveSongStartBtn.disabled = true;
        audioPlayer.src = `../assets/songs/${song.file}`;
    }

    audioPlayer.addEventListener('loadedmetadata', () => {
        if (loadedSong && applySavedStartToLoadedSong) {
            const start = loadedSong.startTime;
            if (Number.isFinite(start) && start >= 0 && start < audioPlayer.duration) {
                audioPlayer.currentTime = start;
                songStartNotice.textContent = `Inicio guardado: ${formatTime(start)}.`;
            } else if (start !== undefined) {
                console.warn('Inicio guardado fuera de la duracion:', loadedSong.file, start);
                songStartNotice.dataset.error = 'true';
                songStartNotice.textContent = 'El inicio guardado no es válido para este audio. Guarda un nuevo punto.';
            }
        } else if (loadedSong) {
            audioPlayer.currentTime = 0;
            songStartNotice.textContent = 'Desde el principio (inicios guardados desactivados).';
        }
        updateSaveSongStartButton();
    });
    audioPlayer.addEventListener('emptied', updateSaveSongStartButton);
    audioPlayer.addEventListener('error', () => { saveSongStartBtn.disabled = true; });

    saveSongStartBtn.addEventListener('click', async () => {
        if (saveSongStartBtn.disabled || !loadedSong) return;
        const file = loadedSong.file;
        const seconds = Math.round(audioPlayer.currentTime * 1000) / 1000;
        if (!Number.isFinite(seconds) || seconds < 0 || seconds >= audioPlayer.duration) {
            songStartNotice.dataset.error = 'true';
            songStartNotice.textContent = 'Elige un punto anterior al final de la canción.';
            return;
        }
        savingSongStart = true;
        updateSaveSongStartButton();
        songStartNotice.dataset.error = 'false';
        songStartNotice.textContent = 'Guardando inicio en songs.js...';
        try {
            const response = await fetch('/api/bingo/song-start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file, startTime: seconds })
            });
            if (!response.ok) {
                const detail = response.headers.get('content-type')?.includes('application/json')
                    ? (await response.json()).error : '';
                throw new Error(detail || `No se pudo guardar el inicio (HTTP ${response.status}).`);
            }
            const saved = await response.json();
            if (saved.file !== file || !Number.isFinite(saved.startTime) || saved.startTime < 0) {
                throw new Error('El servidor no confirmó el segundo guardado.');
            }
            const source = typeof ALL_SONGS_DATA !== 'undefined' ? ALL_SONGS_DATA : sourceSongs;
            [source, fullLibrary, currentPlaylist].forEach(songs => {
                songs.filter(song => song.file === file).forEach(song => { song.startTime = saved.startTime; });
            });
            if (loadedSong?.file === file) loadedSong.startTime = saved.startTime;
            if (currentSongObj?.file === file) currentSongObj.startTime = saved.startTime;
            saveGameState();
            if (loadedSong?.file === file) {
                songStartNotice.textContent = `Inicio guardado en ${formatTime(saved.startTime)} para esta canción.`;
            }
        } catch (error) {
            console.error('Error guardando el inicio:', error);
            songStartNotice.dataset.error = 'true';
            songStartNotice.textContent = error.message;
        } finally {
            savingSongStart = false;
            updateSaveSongStartButton();
        }
    });

    // 1. Botón Play/Pause
    if(pBtnPlay) {
        pBtnPlay.addEventListener('click', () => {
            if (audioPlayer.paused) {
                audioPlayer.play();
                pBtnPlay.textContent = '⏸️'; // Cambiar icono a Pausa
            } else {
                audioPlayer.pause();
                pBtnPlay.textContent = '▶️'; // Cambiar icono a Play
            }
        });
    }

    // 2. Actualizar barra de progreso mientras suena
    audioPlayer.addEventListener('timeupdate', () => {
        if (!isNaN(audioPlayer.duration)) {
            // Calcular porcentaje
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            seekSlider.value = progress;
            
            // Actualizar textos de tiempo
            currentTimeText.textContent = formatTime(audioPlayer.currentTime);
            durationText.textContent = formatTime(audioPlayer.duration);
        }
    });

    // 3. Mover la barra de progreso (Seek)
    seekSlider.addEventListener('input', () => {
        const time = (seekSlider.value / 100) * audioPlayer.duration;
        audioPlayer.currentTime = time;
    });

    // 4. Control de Volumen
    volumeSlider.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value;
    });

    // 5. Botones de Avance/Retroceso rápido
    if(pBtnRw) pBtnRw.addEventListener('click', () => audioPlayer.currentTime -= 10);
    if(pBtnFw) pBtnFw.addEventListener('click', () => audioPlayer.currentTime += 10);

    // 6. Reseteo automático al terminar o cambiar canción
    audioPlayer.addEventListener('ended', () => {
        pBtnPlay.textContent = '▶️';
    });
    
    // Función auxiliar para formato mm:ss
    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    // ACTUALIZACIÓN EXTRA: Cuando cargamos canción nueva en playNextSong...
    // Busca dentro de tu función playNextSong() existente y añade esto al final:
    /* pBtnPlay.textContent = '▶️'; // Asegurar que el icono empieza en Play (o pausa si autoplay)
       seekSlider.value = 0;
    */
    
    // Y cuando el audio empieza a sonar automáticamente (autoplay):
    audioPlayer.addEventListener('play', () => {
        if(pBtnPlay) pBtnPlay.textContent = '⏸️';
        // Animación vinilo
        const card = document.getElementById('nowPlayingCard');
        if(card) card.classList.add('playing');
    });
    
    audioPlayer.addEventListener('pause', () => {
        if(pBtnPlay) pBtnPlay.textContent = '▶️';
        // Animación vinilo
        const card = document.getElementById('nowPlayingCard');
        if(card) card.classList.remove('playing');
    });

    // --- 1. CARGA Y PROCESAMIENTO INTELIGENTE ---
    function loadAndProcessSongs() {
        let rawData = [];

        // Detectar fuente de datos (Soporte para ambos formatos)
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

            // 2. Separar Artista y Título si vienen juntos (Formato antiguo)
            let finalTitle = song.title;
            let finalArtist = song.artist;

            if (!finalArtist && finalTitle && finalTitle.includes(' - ')) {
                const splitInfo = finalTitle.split(' - ');
                finalArtist = splitInfo[0];
                finalTitle = splitInfo.slice(1).join(' - ');
            }

            const { patrocinador, img, imagen, ...songData } = song;
            return {
                ...songData,
                category: category,
                title: finalTitle || "Título Desconocido",
                artist: finalArtist || "",
                file: song.file
            };
        });

        console.log(`📚 Librería procesada: ${fullLibrary.length} canciones.`);
        initCategorySelect();
    }

    // --- 2. INICIALIZAR SELECTOR DE CATEGORÍAS ---
    function initCategorySelect() {
        if(!categorySelect) return;
        categorySelect.innerHTML = '<option value="all">🔄 Todas las Categorías</option>';
        
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

    // --- 3. PERSISTENCIA ---
    function saveGameState() {
        const gameState = {
            playlist: currentPlaylist,
            playedCount: playedCount,
            currentSongObj: currentSongObj,
            lastMarkedNumber: lastMarkedNumber,
            active: true,
            sponsorAssignmentVersion: 1,
            selectedSponsorFolder: activeSponsorFolder,
            selectedCategory: categorySelect ? categorySelect.value : 'all'
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
            currentPlaylist.forEach(song => {
                const catalogSong = fullLibrary.find(item => item.file === song.file);
                if (catalogSong) {
                    if (catalogSong.startTime === undefined) delete song.startTime;
                    else song.startTime = catalogSong.startTime;
                }
            });
            if (state.sponsorAssignmentVersion !== 1) {
                currentPlaylist.forEach(song => {
                    delete song.patrocinador;
                    delete song.img;
                    delete song.imagen;
                });
            }
            activeSponsorFolder = state.selectedSponsorFolder || 'estandar';
            const restoredFolder = document.createElement('option');
            restoredFolder.value = activeSponsorFolder;
            restoredFolder.textContent = activeSponsorFolder;
            sponsorFolderSelect.replaceChildren(restoredFolder);
            playedCount = state.playedCount;
            
            if(state.selectedCategory && categorySelect) {
                categorySelect.value = state.selectedCategory;
            }

            songsPlayedDisplay.textContent = playedCount;
            gameStatusDisplay.textContent = 'Recuperado';
            nextSongBtn.disabled = false;
            
            currentPlaylist.forEach(song => {
                if (song.played) toggleCellVisuals(song.number, true, false);
            });
            if (currentPlaylist.some(song => song.number === state.lastMarkedNumber && song.played)) {
                lastMarkedNumber = state.lastMarkedNumber;
                document.getElementById(`cell-${lastMarkedNumber}`).classList.add('last-marked');
            }

            updateSongsListModal();
            updateSponsorBadges();
            currentPlaylist.forEach(song => {
                if (song.specialType && !song.played) {
                    const cell = document.getElementById(`cell-${song.number}`);
                    if(cell) cell.classList.add('golden-ball');
                }
                // Si ya se jugó (played: true), no le ponemos 'golden-ball' 
                // para que se vea roja (.marked) según tu regla.
            });
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
            cell.addEventListener('animationend', event => {
                if (event.animationName === 'halloweenMarkArrival') cell.classList.remove('mark-arrival');
            });
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
        // Obtenemos la referencia a la celda
        const cell = document.getElementById(`cell-${number}`);
        const isSponsor = cell && cell.classList.contains('sponsor-star');

        // --- CASO 1: NO ESTAMOS EN MODO MANUAL ---
        // (Aquí solo permitimos ver la foto, pero no marcar ni reproducir)
        if (!isManualMode) {
            if (isSponsor) {
                // Si es patrocinador, enseñamos la foto y nos vamos
                showSponsorVisual(cell.dataset.sponsorName, cell.dataset.sponsorImg);
            }
            // Si no es manual ni patrocinador, no hacemos nada más.
            return;
        }
        
        // --- CASO 2: ESTAMOS EN MODO MANUAL (Lógica de Juego) ---
        if (currentPlaylist.length === 0) {
            toggleCellVisuals(number);
            return;
        }

        const songData = currentPlaylist.find(s => s.number === number);
        
        if (songData) {
            // 1. Cambiar estado
            songData.played = !songData.played;
            
            // 2. Actualizar visuales
            toggleCellVisuals(number, songData.played);
            songData.played ? playedCount++ : playedCount--;
            songsPlayedDisplay.textContent = playedCount;
            updateSongsListModal(); 
            saveGameState();

            // 3. Acciones al marcar
            if (songData.played) {
                // A) Reproducir audio
                loadSongAudio(songData);
                if(sidebarAudioContainer && audioPlayer.parentElement !== sidebarAudioContainer) {
                    sidebarAudioContainer.appendChild(audioPlayer);
                }
                
                if(currentNumberDisplay) currentNumberDisplay.textContent = songData.number;
                if(currentSongDisplay) currentSongDisplay.textContent = songData.title;

                audioPlayer.play().catch(e => console.error("Error play:", e));

                // B) Si es patrocinador, TAMBIÉN mostramos la foto al marcarlo
                if (isSponsor) {
                    setTimeout(() => {
                        showSponsorVisual(cell.dataset.sponsorName, cell.dataset.sponsorImg);
                    }, 300);
                }
            } else {
                audioPlayer.pause();
            }
        }
    }

    function toggleCellVisuals(number, forceState = null, highlight = true) {
        const cell = document.getElementById(`cell-${number}`);
        if (!cell) return;
        if (forceState === true) cell.classList.add('marked');
        else if (forceState === false) cell.classList.remove('marked');
        else cell.classList.toggle('marked');
        if (!highlight) return;
        if (cell.classList.contains('marked')) {
            gridContainer.querySelectorAll('.last-marked').forEach(previous => {
                previous.classList.remove('last-marked', 'mark-arrival');
            });
            lastMarkedNumber = number;
            cell.classList.add('last-marked', 'mark-arrival');
        } else {
            cell.classList.remove('last-marked', 'mark-arrival');
            if (lastMarkedNumber === number) lastMarkedNumber = null;
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- COMENZAR JUEGO ---
    async function startNewGame() {
        if (newGameBtn.disabled) return;
        if (currentPlaylist.length > 0 && !confirm('¿Borrar partida actual y empezar nueva?')) return;

        if (fullLibrary.length === 0) {
            alert("No hay canciones cargadas.");
            return;
        }

        const selectedCat = categorySelect ? categorySelect.value : 'all';
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

        const selectedFolder = sponsorFolderSelect.value;
        newGameBtn.disabled = true;
        sponsorFolderSelect.disabled = true;
        if (categorySelect) categorySelect.disabled = true;
        try {
            await loadSponsorFolders();
            if (!sponsorFolders.some(folder => folder.name === selectedFolder)) {
                throw new Error('La carpeta elegida ya no existe. Selecciona otra carpeta.');
            }
        } catch (error) {
            reportSponsorError(error);
            return;
        } finally {
            newGameBtn.disabled = false;
            sponsorFolderSelect.disabled = sponsorFolders.length === 0;
            if (categorySelect) categorySelect.disabled = false;
        }

        localStorage.removeItem('bingoMusicalState');
        if (countdownInterval) clearInterval(countdownInterval);
        if(sidebarAudioContainer && audioPlayer) sidebarAudioContainer.appendChild(audioPlayer);
        currentSongObj = null;
        loadedSong = null;
        saveSongStartBtn.disabled = true;
        songStartNotice.textContent = '';
        guessModal.style.display = 'none';
        document.getElementById('sponsorVisualModal').style.display = 'none';
        playedCount = 0;
        songsPlayedDisplay.textContent = '0';
        gameStatusDisplay.textContent = 'En juego';
        currentNumberDisplay.textContent = '-';
        currentSongDisplay.textContent = 'Pulsa Siguiente';
        lastMarkedNumber = null;
        document.querySelectorAll('.bingo-number').forEach(el => el.classList.remove('marked', 'last-marked', 'mark-arrival'));

        let shuffledPool = shuffleArray(pool);
        currentPlaylist = [];
        
        for (let i = 1; i <= 90; i++) {
            const song = shuffledPool[(i - 1) % shuffledPool.length];
            currentPlaylist.push({
                ...song, 
                number: i,
                played: false
            });
        }

        activeSponsorFolder = selectedFolder;
        const sponsors = shuffleArray([...sponsorFolders.find(folder => folder.name === selectedFolder).sponsors]).slice(0, 90);
        const sponsorNumbers = shuffleArray([...currentPlaylist]);
        sponsors.forEach((sponsor, index) => {
            sponsorNumbers[index].patrocinador = sponsor.name;
            sponsorNumbers[index].img = sponsor.img;
        });

        nextSongBtn.disabled = false;
        updateSongsListModal();
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        updateSponsorBadges();
        assignGoldenBalls();
        saveGameState();
    }
// --- SIGUIENTE CANCIÓN (MODIFICADO CON BOLITAS) ---
function playNextSong() {
        // 1. Limpiezas previas
        if(isManualMode) toggleManualMode();
        if (countdownInterval) clearInterval(countdownInterval);

        // 2. Buscar canción no jugada
        const unplayed = currentPlaylist.filter(s => !s.played);
        if (unplayed.length === 0) {
            alert("¡BINGO TERMINADO!");
            nextSongBtn.disabled = true;
            return;
        }

        // 3. Selección Aleatoria
        const randomIndex = Math.floor(Math.random() * unplayed.length);
        currentSongObj = unplayed[randomIndex];

        // 4. Preparar Audio (pero no reproducir aún)
        loadSongAudio(currentSongObj);
        
        // 5. Resetear UI del Modal
        guessStep1.style.display = 'block';
        guessStep2.style.display = 'none';
        guessModal.style.display = 'flex'; 
        gameContent.style.display = 'none'; // Se oculta hasta que termine la cuenta atrás

        // --- A) LÓGICA DE BOLA DORADA (CONGA/BRINDIS) ---
        const specialMsgContainer = document.getElementById('specialEventContainer');
        
        if (specialMsgContainer) {
            // Resetear estado visual
            specialMsgContainer.style.display = 'none';
            specialMsgContainer.className = 'special-event-msg'; 
            specialMsgContainer.innerHTML = '';

            // Verificar si tiene evento especial
            if (currentSongObj.specialType) {
            specialMsgContainer.style.display = 'block';
            
            // CONGA
            if (currentSongObj.specialType === 'conga') {
                specialMsgContainer.innerHTML = `
                    <div class="party-container conga-mode">
                        <div class="party-mascot" aria-hidden="true">🧙‍♀️</div>
                        <div class="party-title">
                            <span class="party-classic-icon" aria-hidden="true">🚂</span> ¡¡CONGA!! <span class="party-classic-icon" aria-hidden="true">💃</span>
                        </div>
                        <div class="party-subtitle">
                            ¡NADIE SENTADO! ¡A BAILAR!
                        </div>
                    </div>
                `;
            } 
            // BRINDIS
            else if (currentSongObj.specialType === 'brindis') {
                specialMsgContainer.innerHTML = `
                    <div class="party-container brindis-mode">
                        <div class="party-mascot" aria-hidden="true">👻</div>
                        <div class="party-title">
                            <span class="party-classic-icon" aria-hidden="true">🍾</span> ¡¡BRINDIS!! <span class="party-classic-icon" aria-hidden="true">🥂</span>
                        </div>
                        <div class="party-subtitle">
                            ¡ARRIBA LAS COPAS! ¡SALUD!
                        </div>
                    </div>
                `;
            }
        }
        }
        
        // --- B) LÓGICA DE PATROCINADOR ---
        if (sponsorContainer) {
            if (currentSongObj.patrocinador && currentSongObj.patrocinador.trim() !== "") {
                sponsorName.textContent = currentSongObj.patrocinador;
                
                // Imagen del patrocinador
                const imagePath = currentSongObj.img || currentSongObj.imagen;
                if (imagePath) {
                    sponsorImg.src = `../assets/${imagePath}`;
                    sponsorImg.style.display = 'block';
                } else {
                    sponsorImg.style.display = 'none';
                }
                sponsorContainer.style.display = 'block';
            } else {
                sponsorContainer.style.display = 'none';
            }
        }

        // --- C) CUENTA ATRÁS CON BOLITAS ---
        const countdownBallsContainer = document.getElementById('countdownBalls');
        const balls = [
            document.getElementById('ball-3'),
            document.getElementById('ball-2'),
            document.getElementById('ball-1')
        ];

        if(countdownBallsContainer) {
            // Mostrar contenedor y resetear bolas (quitar clase 'popped')
            countdownBallsContainer.style.display = 'flex';
            balls.forEach(b => {
                if(b) b.classList.remove('popped');
            });
            
            playCountdownSound();
        }

        let stepIndex = 0; 
        
        // Intervalo de 1 segundo para explotar bolas
        countdownInterval = setInterval(() => {
            if (stepIndex < balls.length) {
                // Explotar bola actual
                if(balls[stepIndex]) balls[stepIndex].classList.add('popped');
                stepIndex++;
                
                playCountdownSound(stepIndex === balls.length);

            } else {
                // FIN DE LA CUENTA ATRÁS
                clearInterval(countdownInterval);
                
                // Ocultar bolas y mostrar reproductor
                if(countdownBallsContainer) countdownBallsContainer.style.display = 'none';
                halloweenScream.pause();
                if (halloweenScream.readyState > 0) halloweenScream.currentTime = 0;
                
                gameContent.style.display = 'block';
                
                // Mover reproductor al modal
                if(modalAudioContainer) modalAudioContainer.appendChild(audioPlayer);
                
                // REPRODUCIR
                audioPlayer.play().catch(e => {
                    console.error("Autoplay bloqueado por el navegador:", e);
                });
            }
        }, 1000); 
    }

    function showResultInModal() {
        if (!currentSongObj) return;
        modalBigNumber.textContent = `#${currentSongObj.number}`;
        const modalNumberRhyme = document.getElementById('modalNumberRhyme');
        if (modalNumberRhyme) {
            const isHalloween = document.body.classList.contains('halloween-mode');
            modalNumberRhyme.textContent = typeof getBingoRhyme === 'function'
                ? getBingoRhyme(currentSongObj.number, isHalloween)
                : '';
        }
        modalBigTitle.textContent = currentSongObj.title;
        if(modalBigArtist) modalBigArtist.textContent = currentSongObj.artist || "";
        
        guessStep1.style.display = 'none'; 
        guessStep2.style.display = 'block'; 
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
    const creatureLayer = document.querySelector('.board-creatures');
    const boardCreatures = [...creatureLayer.querySelectorAll('.board-creature')];

    function updateCreaturePaths() {
        if (!document.body.classList.contains('halloween-mode')) return;
        const gridRect = gridContainer.getBoundingClientRect();
        const layerRect = creatureLayer.getBoundingClientRect();
        const cells = [...gridContainer.children];
        const columns = getComputedStyle(gridContainer).gridTemplateColumns.split(' ').length;
        const rows = cells.filter((cell, index) => index % columns === 0);
        const left = gridRect.left - layerRect.left - 10;
        const right = gridRect.right - layerRect.left + 10;
        const gapCenters = rows.slice(0, -1).map((cell, index) =>
            gridRect.top - layerRect.top + (cell.offsetTop + cell.offsetHeight + rows[index + 1].offsetTop) / 2
        );
        boardCreatures.forEach((creature, index) => {
            const lanes = gapCenters.filter((_, lane) => lane % 2 === index % 2);
            if (index >= 2) lanes.reverse();
            const points = [];
            lanes.forEach((y, lane) => {
                const from = lane % 2 === 0 ? left : right;
                const to = lane % 2 === 0 ? right : left;
                points.push([from, y], [to, y]);
            });
            const route = points.map(([x, y], point) => `${point === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
            creature.style.offsetPath = `path("${route}")`;
        });
    }

    const creatureResizeObserver = new ResizeObserver(updateCreaturePaths);
    creatureResizeObserver.observe(gridContainer);
    halloweenToggle.addEventListener('click', () => requestAnimationFrame(updateCreaturePaths));
    loadAndProcessSongs(); 
    restoreGameState();
    loadSponsorFolders()
        .catch(reportSponsorError)
        .finally(() => { newGameBtn.disabled = false; });

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



    // 1. Función que ejecuta las órdenes del mando (VERSIÓN SEGURA)
    function executeRemoteCommand(data) {
        console.log("Comando RAW:", data);
        
        let cmd = data.cmd;
        let val = null;

        // --- AQUÍ ESTÁ EL TRUCO ---
        // Si recibimos algo tipo "volume:0.5", lo cortamos por los dos puntos
        if (cmd && typeof cmd === 'string' && cmd.startsWith('volume:')) {
            const parts = cmd.split(':'); // Cortamos
            cmd = parts[0];             // "volume"
            val = parseFloat(parts[1]); // 0.5 (El número)
        } else {
            // Si el servidor fuera bueno y enviara el value por separado
            val = data.value; 
        }

        const player = document.getElementById('audioPlayer');
        
        switch(cmd) {
            case 'next':
                if (!nextSongBtn.disabled) playNextSong();
                break;
                
            case 'play_pause':
                if (player.paused) player.play();
                else player.pause();
                break;
                
            case 'forward':
                if(Number.isFinite(player.currentTime)) player.currentTime += 10;
                break;
                
            case 'rewind':
                if(Number.isFinite(player.currentTime)) player.currentTime -= 10;
                break;

            case 'volume':
                // Ahora validamos el valor que hemos extraído del texto
                if (player && Number.isFinite(val) && val >= 0 && val <= 1) {
                    player.volume = val; 
                    
                    // Actualizar también el slider visual del PC
                    const pcSlider = document.getElementById('volumeSlider');
                    if (pcSlider) pcSlider.value = val; 
                } 
                break;
                
            case 'reveal':
                if(guessModal.style.display !== 'none' && guessStep1.style.display !== 'none') {
                    showResultInModal();
                }
                break;

            case 'confirm':
                if(guessModal.style.display !== 'none' && guessStep2.style.display !== 'none') {
                    confirmAndClose();
                }
                break;
        }
    }

    // 2. Polling (Escuchar al servidor cada 500ms)
    setInterval(() => {
        fetch('/api/bingo/get-command')
            .then(res => res.json())
            .then(data => {
                // Si hay comando, pasamos TODO el objeto 'data'
                if(data.cmd) executeRemoteCommand(data);
            })
            .catch(err => console.error("Error polling remote:", err));
    }, 500);

    const qrBtn = document.createElement('button');
    qrBtn.className = 'btn btn-outline';
    qrBtn.innerHTML = '📱 Conectar Móvil';
    qrBtn.style.marginTop = '10px';
    qrBtn.style.width = '100%';
    qrBtn.onclick = showQR;

    // 2. Añadirlo al panel de controles (debajo de los otros botones)
    const controlsGrid = document.querySelector('.controls-grid');
    if(controlsGrid) controlsGrid.appendChild(qrBtn);

    // 3. Función para mostrar el QR
    function showQR() {
        // Detectamos la dirección de tu ordenador automáticamente
        const protocol = window.location.protocol;
        const host = window.location.hostname;
        const port = window.location.port;
        
        // Construimos la URL del mando. 
        // NOTA: Si tu archivo se llama 'bingo-remote.html', usa esta línea:
        const url = `${protocol}//${host}${port ? ':' + port : ''}/bingo/remote`;
        
        // Generamos el código QR usando una API gratuita
        const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

        // Creamos el modal visual
        const modalHtml = `
            <div id="qrModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:2000; display:flex; flex-direction:column; align-items:center; justify-content:center; animation: fadeIn 0.3s;">
                <h2 style="color:white; margin-bottom:20px; font-family:'Outfit', sans-serif;">📱 Escanea para controlar</h2>
                <div style="background:white; padding:10px; border-radius:15px;">
                    <img src="${qrImage}" style="display:block; width:250px; height:250px;">
                </div>
                <p style="color:#aaa; margin-top:20px; font-family:monospace; background:rgba(255,255,255,0.1); padding:5px 10px; border-radius:5px;">${url}</p>
                <button onclick="document.getElementById('qrModal').remove()" class="btn btn-primary" style="margin-top:20px; min-width:150px;">Cerrar</button>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }


function updateSponsorBadges() {
        console.log("--- ACTUALIZANDO ESTRELLAS DE PATROCINADORES ---");
        
        // 1. Limpiar clases de estrella anteriores (por si reiniciamos)
        document.querySelectorAll('.sponsor-star').forEach(el => {
            el.classList.remove('sponsor-star');
            el.title = ""; // Quitamos tooltip
            delete el.dataset.sponsorName;
            delete el.dataset.sponsorImg;
        });

        if (!currentPlaylist || currentPlaylist.length === 0) return;

        currentPlaylist.forEach(song => {
            if (song.patrocinador && song.patrocinador.trim() !== "") {
                const cell = document.getElementById(`cell-${song.number}`);
                
                if (cell) {
                    // AÑADIMOS LA CLASE QUE LO CONVIERTE EN ESTRELLA
                    cell.classList.add('sponsor-star');
                    
                    // Añadimos el nombre como tooltip nativo
                    cell.title = `Patrocinado por: ${song.patrocinador}`;
                    
                    // IMPORTANTE: Guardamos los datos en la propia celda para usarlos al hacer click
                    cell.dataset.sponsorName = song.patrocinador;
                    cell.dataset.sponsorImg = song.img || song.imagen || "";
                }
            }
        });
    }

    // --- NUEVA FUNCIÓN: ABRIR MODAL VISUAL ---
    function showSponsorVisual(name, imgPath) {
        const modal = document.getElementById('sponsorVisualModal');
        const nameDisplay = document.getElementById('modalSponsorNameDisplay');
        const imgDisplay = document.getElementById('modalSponsorImageDisplay');
        
        if(modal && nameDisplay && imgDisplay) {
            nameDisplay.textContent = name;
            // Asumimos que las imágenes están en assets/
            // Si tu imgPath ya incluye 'assets/', quita el prefijo '../assets/' de abajo
            imgDisplay.src = imgPath ? `../assets/${imgPath}` : ''; 
            
            // Si no hay imagen, ocultamos el tag img
            imgDisplay.style.display = imgPath ? 'inline-block' : 'none';
            
            modal.style.display = 'flex';
        }
    }

    // --- CERRAR MODAL PATROCINADOR ---
    const closeSponsorBtn = document.getElementById('closeSponsorModal');
    if(closeSponsorBtn) {
        closeSponsorBtn.addEventListener('click', () => {
            document.getElementById('sponsorVisualModal').style.display = 'none';
        });
    }

    function assignGoldenBalls() {
        console.log("--- ASIGNANDO BOLAS DORADAS ---");

        // 1. Limpiar tipos anteriores en la playlist
        currentPlaylist.forEach(s => delete s.specialType);
        
        // Limpiar clases visuales en el grid
        document.querySelectorAll('.bingo-number').forEach(el => el.classList.remove('golden-ball'));

        // --- TIPO 1: CONGAS (2 bolas, entre el 1 y el 40, SIN patrocinador) ---
        // Filtramos candidatos válidos
        let congaCandidates = currentPlaylist.filter(s => 
            s.number <= 40 && 
            (!s.patrocinador || s.patrocinador.trim() === "")
        );

        // Elegimos 2 al azar
        for (let i = 0; i < 2; i++) {
            if (congaCandidates.length === 0) break;
            const randomIndex = Math.floor(Math.random() * congaCandidates.length);
            const chosen = congaCandidates[randomIndex];
            
            // Marcar en los datos
            chosen.specialType = 'conga';
            
            // Marcar visualmente en el grid
            const cell = document.getElementById(`cell-${chosen.number}`);
            if (cell) cell.classList.add('golden-ball');

            console.log(`💃 Conga asignada al número ${chosen.number}`);
            
            // Lo quitamos de candidatos para no repetirlo
            congaCandidates.splice(randomIndex, 1);
        }

        // --- TIPO 2: BRINDIS (5 bolas, cualquiera 1-90, SIN patro, SIN conga) ---
        // Filtramos candidatos: Sin patro Y que no sea ya una conga
        let brindisCandidates = currentPlaylist.filter(s => 
            (!s.patrocinador || s.patrocinador.trim() === "") && 
            s.specialType !== 'conga'
        );

        for (let i = 0; i < 5; i++) {
            if (brindisCandidates.length === 0) break;
            const randomIndex = Math.floor(Math.random() * brindisCandidates.length);
            const chosen = brindisCandidates[randomIndex];
            
            chosen.specialType = 'brindis';
            
            const cell = document.getElementById(`cell-${chosen.number}`);
            if (cell) cell.classList.add('golden-ball');

            console.log(`🥂 Brindis asignado al número ${chosen.number}`);
            
            brindisCandidates.splice(randomIndex, 1);
        }
    }
    });