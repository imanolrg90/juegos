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
    
    // NUEVO: Estado para la categoría seleccionada
    let selectedCategory = null;

    let gameConfig = {
        mode: 0,
        playedCount: 0,
        isActive: false
    };

    // --- 1. CARGA DE CATEGORÍAS (Al iniciar) ---
    function fetchCategories() {
        fetch('/api/songs/categories')
            .then(res => res.json())
            .then(categories => {
                categoryContainer.innerHTML = ''; // Limpiar mensaje de carga
                
                if (categories.length === 0) {
                    categoryContainer.innerHTML = '<p style="color:orange">No se encontraron carpetas en assets/songs</p>';
                    return;
                }

                categories.forEach(cat => {
                    const btn = document.createElement('button');
                    btn.className = 'btn-mode btn-category'; // Usamos estilos similares a los modos
                    btn.style.background = '#333'; // Color por defecto más oscuro
                    btn.style.fontSize = '1em';
                    btn.textContent = cat;
                    
                    btn.addEventListener('click', () => {
                        // Desmarcar todos
                        document.querySelectorAll('.btn-category').forEach(b => {
                            b.style.background = '#333';
                            b.style.transform = 'scale(1)';
                            b.style.border = 'none';
                        });
                        // Marcar este
                        selectedCategory = cat;
                        btn.style.background = '#11998e'; // Color de selección (verde/cian)
                        btn.style.transform = 'scale(1.1)';
                        btn.style.border = '2px solid white';
                    });
                    
                    categoryContainer.appendChild(btn);
                });
            })
            .catch(err => {
                console.error("Error categorías:", err);
                categoryContainer.innerHTML = '<p style="color:red">Error conectando con servidor</p>';
            });
    }

    // --- 2. CARGA DE CANCIONES (Al elegir duración) ---
    function fetchSongsAndStart(mode) {
        if (!selectedCategory) {
            alert("⚠️ Por favor, selecciona primero una TEMÁTICA (Carpeta) arriba.");
            return;
        }

        // Pedimos al servidor las canciones de la carpeta seleccionada
        fetch(`/api/songs-list?category=${encodeURIComponent(selectedCategory)}`)
            .then(res => res.json())
            .then(data => {
                loadedSongsFromServer = data;
                console.log(`🎵 Cargadas ${data.length} canciones de la carpeta: ${selectedCategory}`);
                
                if (data.length === 0) {
                    alert(`La carpeta "${selectedCategory}" está vacía.`);
                    return;
                }

                // Una vez tenemos las canciones, iniciamos el juego
                initGameLogic(mode);
            })
            .catch(err => {
                console.error("Error cargando canciones:", err);
                alert("Error al cargar las canciones de esa carpeta.");
            });
    }

    // --- GESTIÓN DE RANKINGS ---
    let cachedRankings = { "15": [], "30": [], "50": [] };

    function loadRankingsFromServer(modeToRender = 15) {
        rankingList.innerHTML = '<li style="text-align:center;">Cargando...</li>';
        fetch('/api/ranking/music')
            .then(response => response.json())
            .then(data => {
                cachedRankings = data;
                renderRankingsInOverlay(modeToRender);
            })
            .catch(error => {
                console.error("Error rankings:", error);
                rankingList.innerHTML = '<li style="color:red;">Error conexión.</li>';
            });
    }

    function saveRankingToServer(newEntry, mode) {
        if (!cachedRankings[mode]) cachedRankings[mode] = [];
        cachedRankings[mode].push(newEntry);
        cachedRankings[mode].sort((a, b) => b.score - a.score);
        
        fetch('/api/ranking/music', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cachedRankings)
        }).then(res => res.json()).then(data => cachedRankings = data);
    }

    function renderRankingsInOverlay(modeToShow) {
        const list = cachedRankings[modeToShow] || [];
        list.sort((a, b) => b.score - a.score);
        rankingList.innerHTML = '';
        if (list.length === 0) {
            rankingList.innerHTML = '<li style="color:#777;">Sin registros.</li>';
            return;
        }
        list.slice(0, 5).forEach((entry, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>#${i+1} ${entry.teamName}</span><strong>${entry.score} pts</strong>`;
            rankingList.appendChild(li);
        });
    }

    window.switchTab = (mode) => {
        document.querySelectorAll('.rankings-tabs button').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        renderRankingsInOverlay(mode);
    };

    // --- INICIALIZACIÓN ---
    loadRankingsFromServer(15);
    fetchCategories(); // Cargar carpetas al entrar

    // Eventos de botones de duración (Paso 2)
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = parseInt(btn.dataset.mode);
            fetchSongsAndStart(mode); // Intentar iniciar
        });
    });

    function initGameLogic(mode) {
        gameConfig.mode = mode;
        gameConfig.playedCount = 0;
        gameConfig.isActive = true;
        
        availableSongs = [...loadedSongsFromServer];

        if (availableSongs.length < mode) {
            alert(`⚠️ La carpeta "${selectedCategory}" solo tiene ${availableSongs.length} canciones. Se jugarán todas.`);
        }

        setupOverlay.style.display = 'none';
        playRandomBtn.disabled = false; 
        revealBtn.disabled = true;      
        
        // Actualizar título con la categoría
        document.querySelector('.left-panel h1').innerHTML = 
            `🎤 ${selectedCategory} <span id="progressDisplay" style="font-size:0.5em; color:#888;">(0/${mode})</span>`;
        progressDisplay = document.getElementById('progressDisplay'); // Recapturar referencia
    }

    function updateProgress() {
        if (gameConfig.isActive) {
            const display = document.getElementById('progressDisplay');
            if(display) display.textContent = `(${gameConfig.playedCount} / ${gameConfig.mode})`;
        }
    }

    function finishGame() {
        gameConfig.isActive = false;
        if (teams.length > 0) {
            const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
            const winner = sortedTeams[0];
            alert(`¡JUEGO TERMINADO!\nGanador: ${winner.name} con ${winner.score} puntos.`);
            saveRankingToServer({
                teamName: winner.name,
                score: winner.score,
                date: new Date().toLocaleDateString()
            }, gameConfig.mode);
        } else {
            alert("Juego terminado.");
        }
        setTimeout(() => location.reload(), 1000);
    }

    // --- REPRODUCCIÓN ---
    function playRandomSong() {
        if (!gameConfig.isActive) return;

        if (gameConfig.playedCount >= gameConfig.mode || availableSongs.length === 0) {
            finishGame();
            return;
        }

        unknownState.style.display = 'block';
        revealedState.style.display = 'none';
        playRandomBtn.disabled = true;  
        revealBtn.disabled = false;     
        
        const randomIndex = Math.floor(Math.random() * availableSongs.length);
        currentSong = availableSongs[randomIndex];
        availableSongs.splice(randomIndex, 1);

        gameConfig.playedCount++;
        updateProgress();

        // NOTA: 'currentSong.file' ya incluye la carpeta (ej: "Pop/Cancion.mp3") gracias al backend
        audioPlayer.src = `../assets/songs/${currentSong.file}`;
        audioPlayer.play().catch(e => console.log("Click play required", e));
    }

    function revealSongData() {
        if (!currentSong) return;
        unknownState.style.display = 'none';
        revealedState.style.display = 'block';
        songTitleDisplay.textContent = currentSong.title;
        sponsorImg.style.display = 'none';
        sponsorName.textContent = '';
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
        if(confirm("¿Borrar?")) { teams = teams.filter(t => t.id !== teamId); renderTeams(); }
    }

    function renderTeams() {
        teamsGrid.innerHTML = '';
        teams.forEach(team => {
            const card = document.createElement('div');
            card.className = 'team-card';
            card.innerHTML = `
                <button class="delete-team-btn" onclick="window.removeTeamWrapper(${team.id})">×</button>
                <h3>${team.name}</h3>
                <div class="score-display">${team.score}</div>
                <div class="score-controls">
                    <button class="btn-score minus" onclick="window.updateScoreWrapper(${team.id}, -1)">-</button>
                    <button class="btn-score plus" onclick="window.updateScoreWrapper(${team.id}, 1)">+</button>
                </div>`;
            teamsGrid.appendChild(card);
        });
    }

    window.updateScoreWrapper = updateScore;
    window.removeTeamWrapper = removeTeam;

    playRandomBtn.addEventListener('click', playRandomSong);
    revealBtn.addEventListener('click', revealSongData);
    addTeamBtn.addEventListener('click', addTeam);
    newTeamInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTeam(); });
    
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', (e) => {
            if (gameConfig.isActive && !confirm("¿Salir y perder progreso?")) e.preventDefault(); 
        });
    }
});