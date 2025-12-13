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
    
    // Referencias Overlay y Modos
    const setupOverlay = document.getElementById('gameSetupOverlay');
    const progressDisplay = document.getElementById('progressDisplay');
    const rankingList = document.getElementById('rankingList');
    const modeButtons = document.querySelectorAll('.btn-mode');

    // --- ESTADO DEL JUEGO ---
    let currentSong = null;
    let teams = []; 
    let availableSongs = []; 
    
    let gameConfig = {
        mode: 0,
        playedCount: 0,
        isActive: false
    };

    // --- GESTIÓN DE RANKINGS (SERVIDOR) ---
    // Variable global para mantener los rankings en memoria
    let cachedRankings = { "15": [], "30": [], "50": [] };

    function loadRankingsFromServer(modeToRender = 15) {
        rankingList.innerHTML = '<li style="text-align:center;">Cargando del servidor...</li>';
        
        fetch('/api/ranking/music')
            .then(response => response.json())
            .then(data => {
                cachedRankings = data; // Guardamos en memoria
                renderRankingsInOverlay(modeToRender);
            })
            .catch(error => {
                console.error("Error cargando rankings:", error);
                rankingList.innerHTML = '<li style="color:red;">Error de conexión.</li>';
            });
    }

    function saveRankingToServer(newEntry, mode) {
        // 1. Añadimos el nuevo score a la memoria local
        if (!cachedRankings[mode]) cachedRankings[mode] = [];
        cachedRankings[mode].push(newEntry);
        
        // 2. Ordenamos
        cachedRankings[mode].sort((a, b) => b.score - a.score);
        
        // 3. Enviamos TODO el objeto actualizado al servidor
        fetch('/api/ranking/music', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cachedRankings)
        })
        .then(response => response.json())
        .then(data => {
            console.log("Ranking guardado correctamente en servidor");
            cachedRankings = data;
        })
        .catch(error => console.error("Error guardando:", error));
    }

    function renderRankingsInOverlay(modeToShow) {
        const list = cachedRankings[modeToShow] || [];
        
        // Asegurar orden
        list.sort((a, b) => b.score - a.score);

        rankingList.innerHTML = '';
        if (list.length === 0) {
            rankingList.innerHTML = '<li style="color:#777;">Sin registros aún.</li>';
            return;
        }

        list.slice(0, 5).forEach((entry, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>#${index + 1} ${entry.teamName} <small>(${entry.date})</small></span>
                <strong>${entry.score} pts</strong>
            `;
            rankingList.appendChild(li);
        });
    }

    window.switchTab = (mode) => {
        document.querySelectorAll('.rankings-tabs button').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        renderRankingsInOverlay(mode);
    };

    // --- INICIO DE JUEGO ---

    // Cargar rankings del servidor al iniciar
    loadRankingsFromServer(15);

    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = parseInt(btn.dataset.mode);
            startGame(mode);
        });
    });

    function startGame(mode) {
        if (!sourceSongs || sourceSongs.length === 0) {
            alert("Error: No hay canciones cargadas en songs.js");
            return;
        }

        gameConfig.mode = mode;
        gameConfig.playedCount = 0;
        gameConfig.isActive = true;
        
        availableSongs = [...sourceSongs];

        setupOverlay.style.display = 'none';
        
        playRandomBtn.disabled = false; 
        revealBtn.disabled = true;      
        
        updateProgress();
        alert(`¡Partida de ${mode} canciones iniciada! Añade los equipos antes de empezar.`);
    }

    function updateProgress() {
        if (gameConfig.isActive) {
            progressDisplay.textContent = `(Canción ${gameConfig.playedCount} / ${gameConfig.mode})`;
        }
    }

    function finishGame() {
        gameConfig.isActive = false;
        
        if (teams.length > 0) {
            const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
            const winner = sortedTeams[0];

            alert(`¡JUEGO TERMINADO!\n\nGanador: ${winner.name} con ${winner.score} puntos.`);

            // GUARDAR EN SERVIDOR
            const newEntry = {
                teamName: winner.name,
                score: winner.score,
                date: new Date().toLocaleDateString()
            };
            
            saveRankingToServer(newEntry, gameConfig.mode);

        } else {
            alert("Juego terminado. No hubo equipos participando.");
        }
        
        // Recargar página después de un momento para asegurar guardado
        setTimeout(() => location.reload(), 1000);
    }

    // --- LÓGICA DE REPRODUCCIÓN ---

    function playRandomSong() {
        if (!gameConfig.isActive) return;

        if (gameConfig.playedCount >= gameConfig.mode) {
            finishGame();
            return;
        }

        if (availableSongs.length === 0) {
            alert("¡Se acabaron las canciones disponibles antes de terminar el modo!");
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

        audioPlayer.src = `../assets/songs/${currentSong.file}`;
        audioPlayer.play().catch(e => console.log("Error al reproducir:", e));
    }

    function revealSongData() {
        if (!currentSong) return;

        unknownState.style.display = 'none';
        revealedState.style.display = 'block';

        songTitleDisplay.textContent = currentSong.title;

        if (currentSong.imagen) {
            sponsorImg.src = `../assets/${currentSong.imagen}`;
            sponsorImg.style.display = 'block';
        } else {
            sponsorImg.style.display = 'none';
        }

        if (currentSong.patrocinador) {
            sponsorName.textContent = `Patrocinado por: ${currentSong.patrocinador}`;
        } else {
            sponsorName.textContent = '';
        }

        playRandomBtn.disabled = false; 
        revealBtn.disabled = true;      

        if (gameConfig.playedCount === gameConfig.mode) {
            setTimeout(() => {
                alert("Última canción. Al pulsar de nuevo el botón aleatorio, se finalizará la partida.");
            }, 500);
        }
    }

    // --- LÓGICA DE EQUIPOS ---

    function addTeam() {
        const name = newTeamInput.value.trim();
        if (!name) return;

        const newTeam = {
            id: Date.now(),
            name: name,
            score: 0
        };

        teams.push(newTeam);
        newTeamInput.value = '';
        renderTeams();
    }

    function updateScore(teamId, change) {
        const team = teams.find(t => t.id === teamId);
        if (team) {
            team.score += change;
            renderTeams();
        }
    }

    function removeTeam(teamId) {
        if(confirm("¿Borrar equipo?")) {
            teams = teams.filter(t => t.id !== teamId);
            renderTeams();
        }
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
                </div>
            `;
            teamsGrid.appendChild(card);
        });
    }

    window.updateScoreWrapper = updateScore;
    window.removeTeamWrapper = removeTeam;

    // --- EVENT LISTENERS ---
    
    playRandomBtn.addEventListener('click', playRandomSong);
    revealBtn.addEventListener('click', revealSongData);
    addTeamBtn.addEventListener('click', addTeam);
    newTeamInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTeam();
    });

    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', (e) => {
            if (gameConfig.isActive) {
                const confirmLeave = confirm("⚠️ Tienes una partida en curso.\n\nSi sales ahora, se perderá el progreso y los puntos.\n\n¿Estás seguro de que quieres salir?");
                if (!confirmLeave) {
                    e.preventDefault(); 
                }
            }
        });
    }
});