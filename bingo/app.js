document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS DOM ---
    const gridContainer = document.getElementById('bingoGrid');
    const newGameBtn = document.getElementById('newGameBtn');
    const nextSongBtn = document.getElementById('nextSongBtn');
    const manualBtn = document.getElementById('manualBtn');
    const categorySelect = document.getElementById('categorySelect'); 
    
    // Elementos del Juego y Audio
    const audioPlayer = document.getElementById('audioPlayer');
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

    // --- GENERADOR DE PITIDO (Audio API) ---
    function playBeep(frequency = 600, duration = 100) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';       
        oscillator.frequency.value = frequency; 
        
        gainNode.gain.value = 0.1;
        oscillator.start();
        
        setTimeout(() => { oscillator.stop(); }, duration);
    }
    const pBtnPlay = document.getElementById('pBtnPlay');
    const pBtnRw = document.getElementById('pBtnRw');
    const pBtnFw = document.getElementById('pBtnFw');
    const seekSlider = document.getElementById('seekSlider');
    const volumeSlider = document.getElementById('volumeSlider');
    const currentTimeText = document.getElementById('currentTime');
    const durationText = document.getElementById('duration');

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

            return {
                ...song,
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
            active: true,
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
            playedCount = state.playedCount;
            
            if(state.selectedCategory && categorySelect) {
                categorySelect.value = state.selectedCategory;
            }

            songsPlayedDisplay.textContent = playedCount;
            gameStatusDisplay.textContent = 'Recuperado';
            nextSongBtn.disabled = false;
            
            currentPlaylist.forEach(song => {
                if (song.played) toggleCellVisuals(song.number, true);
            });

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
                audioPlayer.src = `../assets/songs/${songData.file}`;
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

        let shuffledPool = shuffleArray(pool);
        currentPlaylist = [];
        
        for (let i = 1; i <= 90; i++) {
            const song = shuffledPool[(i - 1) % shuffledPool.length];
            currentPlaylist.push({
                number: i,
                ...song, 
                played: false
            });
        }

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
        audioPlayer.src = `../assets/songs/${currentSongObj.file}`;
        
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
                        <div class="party-title">
                            🚂 ¡¡CONGA!! 💃
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
                        <div class="party-title">
                            🍾 ¡¡BRINDIS!! 🥂
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
            
            // Primer pitido de arranque
            playBeep(800, 150); 
        }

        let stepIndex = 0; 
        
        // Intervalo de 1 segundo para explotar bolas
        countdownInterval = setInterval(() => {
            if (stepIndex < balls.length) {
                // Explotar bola actual
                if(balls[stepIndex]) balls[stepIndex].classList.add('popped');
                stepIndex++;
                
                // Sonido según la bola
                if (stepIndex < balls.length) {
                    playBeep(800, 150); // Beep normal
                } else {
                    playBeep(1200, 300); // Beep final agudo
                }

            } else {
                // FIN DE LA CUENTA ATRÁS
                clearInterval(countdownInterval);
                
                // Ocultar bolas y mostrar reproductor
                if(countdownBallsContainer) countdownBallsContainer.style.display = 'none';
                
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
    loadAndProcessSongs(); 
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


    // 1. Función que ejecuta las órdenes
    // 1. Función que ejecuta las órdenes del mando
    Este error (The provided double value is non-finite) ocurre porque en algún momento el mando envía un comando de volumen (o el ordenador cree recibirlo) pero el valor (val) es undefined, NaN (Not a Number) o nulo.

El navegador intenta hacer player.volume = undefined y explota, porque el volumen obligatoriamente tiene que ser un número entre 0.0 y 1.0.

Vamos a "blindar" la función executeRemoteCommand en tu app.js para que verifique si el número es válido antes de intentar aplicarlo.

Reemplaza tu función executeRemoteCommand actual por esta versión corregida y segura:

Código corregido para app.js
JavaScript

    // 1. Función que ejecuta las órdenes del mando (VERSIÓN SEGURA)
    function executeRemoteCommand(data) {
        console.log("Comando recibido:", data);
        
        const cmd = data.cmd;
        // Aseguramos que 'val' sea un número flotante, si viene texto lo convierte
        let val = parseFloat(data.value); 
        
        const player = document.getElementById('audioPlayer');
        
        switch(cmd) {
            case 'next':
                if (!nextSongBtn.disabled) {
                    playNextSong();
                }
                break;
                
            case 'play_pause':
                if (player.paused) player.play();
                else player.pause();
                break;
                
            case 'forward':
                if (Number.isFinite(player.currentTime)) {
                     player.currentTime += 10;
                }
                break;
                
            case 'rewind':
                if (Number.isFinite(player.currentTime)) {
                    player.currentTime -= 10;
                }
                break;

            case 'volume':
                // --- AQUÍ ESTABA EL ERROR ---
                // Verificamos 3 cosas antes de aplicarlo:
                // 1. Que player exista
                // 2. Que val sea un número finito (no NaN, no Infinity)
                // 3. Que esté dentro del rango permitido (0 a 1)
                if (player && Number.isFinite(val) && val >= 0 && val <= 1) {
                    player.volume = val; 
                    
                    // Actualizar slider visual
                    const pcSlider = document.getElementById('volumeSlider');
                    if (pcSlider) {
                        pcSlider.value = val; 
                    }
                } else {
                    console.warn("⚠️ Valor de volumen inválido ignorado:", val);
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


function updateSponsorBadges() {
        console.log("--- ACTUALIZANDO ESTRELLAS DE PATROCINADORES ---");
        
        // 1. Limpiar clases de estrella anteriores (por si reiniciamos)
        document.querySelectorAll('.sponsor-star').forEach(el => {
            el.classList.remove('sponsor-star');
            el.title = ""; // Quitamos tooltip
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