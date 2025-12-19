document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS DOM ---
    const audioPlayer = document.getElementById('audioPlayer');
    const playRandomBtn = document.getElementById('playRandomBtn');
    const revealBtn = document.getElementById('revealBtn');
    const backToMenuBtn = document.getElementById('backToMenuBtn');
    
    const unknownState = document.getElementById('unknownSongState');
    const revealedState = document.getElementById('revealedSongState');
    const songTitleDisplay = document.getElementById('songTitleDisplay');
    const sponsorImg = document.getElementById('sponsorImg');
    const sponsorName = document.getElementById('sponsorName');

    const newTeamInput = document.getElementById('newTeamName');
    const addTeamBtn = document.getElementById('addTeamBtn');
    const teamsGrid = document.getElementById('teamsGrid');
    
    // Referencias Overlay
    const setupOverlay = document.getElementById('gameSetupOverlay');
    let progressDisplay = document.getElementById('progressDisplay');
    const rankingList = document.getElementById('rankingList');
    const modeButtons = document.querySelectorAll('.btn-mode');
    const categoryContainer = document.getElementById('categoryButtonsContainer');

    // --- ESTADO DEL JUEGO ---
    let currentSong = null;
    let teams = []; 
    let loadedSongsFromServer = [];
    let availableSongs = []; 
    let selectedCategory = null;
    
    // Corrección: Inicializar variable de rankings que faltaba
    let cachedRankings = { 15: [], 30: [], 50: [] }; 

    let gameConfig = {
        mode: 0,
        playedCount: 0,
        isActive: false
    };

    // --- 1. CARGA DE CATEGORÍAS ---
    function fetchCategories() {
        categoryContainer.innerHTML = ''; // Borrar "Cargando..."
        
        // Verificamos si la variable sourceSongs (de songs.js) existe
        if (typeof sourceSongs === 'undefined') {
            console.error("sourceSongs no está definido. Revisa si songs.js se cargó antes.");
            categoryContainer.innerHTML = '<p style="color:red">Error: No se cargó songs.js</p>';
            return;
        }

        // Extraer carpetas únicas. Ejemplo: "Bingo 2026/cancion.mp3" -> "Bingo 2026"
        const categories = [...new Set(sourceSongs.map(song => song.file.split('/')[0]))];

        if (categories.length === 0) {
            categoryContainer.innerHTML = '<p style="color:orange">No se encontraron categorías.</p>';
            return;
        }

        renderCategories(categories);
    }

    function renderCategories(list) {
        categoryContainer.innerHTML = '';
        list.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'btn-mode btn-category'; 
            btn.textContent = cat;
            
            // Estilos básicos para el botón generado por JS
            btn.style.margin = "5px";
            
            btn.addEventListener('click', () => {
                // Desmarcar todos visualmente
                document.querySelectorAll('.btn-category').forEach(b => {
                    b.classList.remove('selected');
                    b.style.background = 'rgba(255,255,255,0.05)';
                    b.style.color = 'white';
                });
                // Marcar el seleccionado
                selectedCategory = cat;
                btn.classList.add('selected');
                btn.style.background = '#4ecdc4'; // Color Primary
                btn.style.color = '#1e1e2f';
            });
            
            categoryContainer.appendChild(btn);
        });
    }

    // --- 2. INICIAR JUEGO ---
    function fetchSongsAndStart(mode) {
        if (!selectedCategory) {
            alert("⚠️ Selecciona una categoría primero.");
            return;
        }

        // Filtrar canciones: Solo las que empiezan con la carpeta seleccionada
        loadedSongsFromServer = sourceSongs.filter(s => s.file.startsWith(selectedCategory + "/"));

        if (loadedSongsFromServer.length === 0) {
            alert("No hay canciones en esta categoría.");
            return;
        }

        initGameLogic(mode);
    }

    function initGameLogic(mode) {
        gameConfig.mode = mode;
        gameConfig.playedCount = 0;
        gameConfig.isActive = true;
        
        // Copia profunda para no modificar el original
        availableSongs = JSON.parse(JSON.stringify(loadedSongsFromServer));

        // Ocultar overlay
        setupOverlay.style.opacity = '0';
        setTimeout(() => {
            setupOverlay.style.display = 'none';
            setupOverlay.style.opacity = '1'; 
        }, 500);

        playRandomBtn.disabled = false; 
        revealBtn.disabled = true;      
        
        // Actualizar título en el panel izquierdo
        const titleEl = document.querySelector('.left-panel h1');
        if(titleEl) {
            titleEl.innerHTML = `En una Nota <br><span style="font-size:0.5em; color:#4ecdc4;">${selectedCategory}</span>`;
        }
        
        updateProgress();
        unknownState.style.display = 'flex';
        revealedState.style.display = 'none';
        
        songTitleDisplay.textContent = "Título Canción";
        sponsorName.textContent = "Artista";
    }

    // --- RANKINGS (Simplificado localmente para evitar errores) ---
    function renderRankingsInOverlay(modeToShow) {
        // Si no existe el modo en cache, inicializarlo
        if (!cachedRankings[modeToShow]) cachedRankings[modeToShow] = [];
        
        const list = cachedRankings[modeToShow];
        rankingList.innerHTML = '';
        
        if (list.length === 0) {
            rankingList.innerHTML = '<li style="color:#777; text-align:center;">Sin registros en esta sesión.</li>';
            return;
        }
        
        // Ordenar y mostrar
        list.sort((a, b) => b.score - a.score).slice(0, 5).forEach((entry, i) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span style="font-weight:500; color:white;">
                    <span style="color:#ffe66d; margin-right:10px;">#${i+1}</span> ${entry.teamName}
                </span>
                <strong style="color:#4ecdc4;">${entry.score} pts</strong>`;
            rankingList.appendChild(li);
        });
    }

    // Guardar ranking en memoria local (se borra al refrescar)
    function saveLocalRanking(winnerName, score, mode) {
        if (!cachedRankings[mode]) cachedRankings[mode] = [];
        cachedRankings[mode].push({ teamName: winnerName, score: score });
    }

    // Función global para cambiar tabs en el HTML
    window.switchTab = (mode) => {
        document.querySelectorAll('.rankings-tabs button').forEach(b => b.classList.remove('active'));
        // Buscar el botón clickeado si es posible, o usar el evento
        if(event && event.target) event.target.classList.add('active');
        renderRankingsInOverlay(mode);
    };

    // --- INICIALIZACIÓN ---
    fetchCategories(); 
    renderRankingsInOverlay(15); // Cargar ranking inicial vacío

    // Eventos de botones de duración
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Si es botón de volver, no hacemos nada aquí (ya tiene su lógica en HTML)
            if (btn.id === 'btnBackToCategories') return;
            
            const mode = parseInt(btn.dataset.mode);
            if (mode) fetchSongsAndStart(mode); 
        });
    });

    function updateProgress() {
        if (gameConfig.isActive) {
            progressDisplay.textContent = `Ronda ${gameConfig.playedCount} / ${gameConfig.mode}`;
        }
    }

    function finishGame() {
        gameConfig.isActive = false;
        let msg = "Juego terminado.";
        
        if (teams.length > 0) {
            const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
            const winner = sortedTeams[0];
            msg = `¡VICTORIA!\n\n👑 ${winner.name}\n⭐ ${winner.score} puntos`;
            
            saveLocalRanking(winner.name, winner.score, gameConfig.mode);
        }
        
        alert(msg);
        location.reload();
    }

    // --- REPRODUCCIÓN ---
    function playRandomSong() {
        if (!gameConfig.isActive) return;

        if (gameConfig.playedCount >= gameConfig.mode || availableSongs.length === 0) {
            finishGame();
            return;
        }

        unknownState.style.display = 'flex';
        revealedState.style.display = 'none';
        playRandomBtn.disabled = true;  
        revealBtn.disabled = false;     
        
        const randomIndex = Math.floor(Math.random() * availableSongs.length);
        currentSong = availableSongs[randomIndex];
        // Quitar la canción de disponibles para no repetir
        availableSongs.splice(randomIndex, 1);

        gameConfig.playedCount++;
        updateProgress();

        // RUTA CORREGIDA: subir un nivel (../) para ir a assets
        const src = `../assets/songs/${currentSong.file}`;
        
        if(src) {
            audioPlayer.src = src;
            audioPlayer.play().catch(e => console.log("Error al reproducir:", e));
        }
    }

    function revealSongData() {
        if (!currentSong) return;
        
        unknownState.style.display = 'none';
        revealedState.style.display = 'block';
        
        // Reiniciar animación
        revealedState.style.animation = 'none';
        revealedState.offsetHeight; /* trigger reflow */
        revealedState.style.animation = 'fadeIn 0.5s ease';

        songTitleDisplay.textContent = currentSong.title || "Título Desconocido";
        sponsorName.textContent = currentSong.artist || "Artista Desconocido";
        
        sponsorImg.style.display = 'none'; // Ocultar imagen si no hay
        
        playRandomBtn.disabled = false; 
        revealBtn.disabled = true;      
    }

    // --- EQUIPOS ---
    function addTeam() {
        const name = newTeamInput.value.trim();
        if (!name) return;
        teams.push({ id: Date.now(), name: name, score: 0 });
        newTeamInput.value = '';
        renderTeams();
    }

    function updateScore(teamId, change) {
        const team = teams.find(t => t.id === teamId);
        if (team) { team.score += change; renderTeams(); }
    }

    function removeTeam(teamId) {
        if(confirm("¿Eliminar este equipo?")) { 
            teams = teams.filter(t => t.id !== teamId); 
            renderTeams(); 
        }
    }

    function renderTeams() {
        teamsGrid.innerHTML = '';
        teams.forEach(team => {
            const card = document.createElement('div');
            card.className = 'team-card';
            card.style.animation = 'slideIn 0.3s ease';
            
            card.innerHTML = `
                <button class="btn-delete-team" onclick="window.removeTeamWrapper(${team.id})">×</button>
                <h3 class="team-name">${team.name}</h3>
                <div class="score-box">${team.score}</div>
                <div class="score-actions">
                    <button class="btn-score btn-minus" onclick="window.updateScoreWrapper(${team.id}, -1)">-</button>
                    <button class="btn-score btn-plus" onclick="window.updateScoreWrapper(${team.id}, 1)">+</button>
                </div>`;
            teamsGrid.appendChild(card);
        });
    }

    // Exponer funciones globales para los botones generados dinámicamente
    window.updateScoreWrapper = updateScore;
    window.removeTeamWrapper = removeTeam;

    // Listeners principales
    playRandomBtn.addEventListener('click', playRandomSong);
    revealBtn.addEventListener('click', revealSongData);
    addTeamBtn.addEventListener('click', addTeam);
    newTeamInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTeam(); });
    
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', (e) => {
            if (gameConfig.isActive && !confirm("¿Salir de la partida actual?")) e.preventDefault(); 
        });
    }
});