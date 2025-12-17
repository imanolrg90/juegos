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

    let gameConfig = {
        mode: 0,
        playedCount: 0,
        isActive: false
    };

    // --- DATOS DEMO (PARA CUANDO FALLA EL SERVIDOR) ---
    const DEMO_CATEGORIES = ["Demo: Pop 2000", "Demo: Rock Clásico", "Demo: Verano 2023"];
    const DEMO_SONGS = [
        { title: "Canción de Prueba 1", artist: "Artista Demo", file: "demo1.mp3" },
        { title: "Hit del Verano", artist: "La Banda", file: "demo2.mp3" },
        { title: "Clásico Inolvidable", artist: "Leyenda", file: "demo3.mp3" }
    ];

    // --- 1. CARGA DE CATEGORÍAS (Al iniciar) ---
    function fetchCategories() {
        categoryContainer.innerHTML = '<p style="color:#aaa">Conectando...</p>';
        
        fetch('/api/songs/categories')
            .then(res => {
                if (!res.ok) throw new Error("Server response not ok");
                return res.json();
            })
            .then(categories => {
                if (categories.length === 0) {
                    categoryContainer.innerHTML = '<p style="color:orange">No se encontraron carpetas.</p>';
                    return;
                }
                renderCategories(categories);
            })
            .catch(err => {
                console.warn("⚠️ Servidor no detectado o sin rutas. Activando MODO DEMO.", err);
                categoryContainer.innerHTML = ''; 
                // Usar datos demo para que la UI no se rompa
                renderCategories(DEMO_CATEGORIES);
                // Aviso visual discreto
                const warning = document.createElement('p');
                warning.style.color = '#ff6b6b';
                warning.style.fontSize = '0.8em';
                warning.style.width = '100%';
                warning.innerHTML = '⚠️ Modo Demo (Sin conexión al servidor)';
                categoryContainer.appendChild(warning);
            });
    }

    function renderCategories(list) {
        categoryContainer.innerHTML = '';
        list.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'btn-mode btn-category'; 
            btn.style.background = '#333';
            btn.style.fontSize = '1em';
            btn.textContent = cat;
            
            btn.addEventListener('click', () => {
                // Desmarcar todos
                document.querySelectorAll('.btn-category').forEach(b => {
                    b.style.background = '#333';
                    b.style.transform = 'scale(1)';
                    b.style.border = '1px solid rgba(255,255,255,0.2)';
                });
                // Marcar este
                selectedCategory = cat;
                btn.style.background = '#4ecdc4'; // Color Primary
                btn.style.color = '#1e1e2f';
                btn.style.fontWeight = '800';
                btn.style.transform = 'scale(1.05)';
                btn.style.border = '2px solid white';
                btn.style.boxShadow = '0 0 15px rgba(78, 205, 196, 0.4)';
            });
            
            categoryContainer.appendChild(btn);
        });
    }

    // --- 2. CARGA DE CANCIONES (Al elegir duración) ---
    function fetchSongsAndStart(mode) {
        if (!selectedCategory) {
            alert("⚠️ Por favor, selecciona primero una TEMÁTICA.");
            return;
        }

        // Si es una categoría Demo, cargamos canciones demo directamente
        if (selectedCategory.startsWith("Demo:")) {
            loadedSongsFromServer = DEMO_SONGS;
            initGameLogic(mode);
            return;
        }

        fetch(`/api/songs-list?category=${encodeURIComponent(selectedCategory)}`)
            .then(res => {
                if(!res.ok) throw new Error("Error fetching songs");
                return res.json();
            })
            .then(data => {
                loadedSongsFromServer = data;
                if (data.length === 0) {
                    alert(`La carpeta "${selectedCategory}" está vacía.`);
                    return;
                }
                initGameLogic(mode);
            })
            .catch(err => {
                console.error("Error cargando canciones reales, usando demo:", err);
                loadedSongsFromServer = DEMO_SONGS;
                alert("⚠️ Error de conexión: Usando canciones de prueba.");
                initGameLogic(mode);
            });
    }

    // --- GESTIÓN DE RANKINGS ---
    let cachedRankings = { "15": [], "30": [], "50": [] };

    function loadRankingsFromServer(modeToRender = 15) {
        rankingList.innerHTML = '<li style="text-align:center; color:#888;">Cargando...</li>';
        fetch('/api/ranking/music')
            .then(res => {
                if(!res.ok) throw new Error("No ranking api");
                return res.json();
            })
            .then(data => {
                cachedRankings = data;
                renderRankingsInOverlay(modeToRender);
            })
            .catch(error => {
                // Si falla, mostramos rankings ficticios para que se vea bonito
                console.warn("No hay API de ranking, usando local.");
                cachedRankings = {
                    "15": [{teamName: "Los Primos", score: 12}, {teamName: "Campeones", score: 8}],
                    "30": [],
                    "50": []
                };
                renderRankingsInOverlay(modeToRender);
            });
    }

    function saveRankingToServer(newEntry, mode) {
        if (!cachedRankings[mode]) cachedRankings[mode] = [];
        cachedRankings[mode].push(newEntry);
        cachedRankings[mode].sort((a, b) => b.score - a.score);
        
        // Intentar guardar, si falla no pasa nada
        fetch('/api/ranking/music', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cachedRankings)
        }).catch(e => console.log("No se pudo guardar online"));
    }

    function renderRankingsInOverlay(modeToShow) {
        const list = cachedRankings[modeToShow] || [];
        list.sort((a, b) => b.score - a.score);
        rankingList.innerHTML = '';
        if (list.length === 0) {
            rankingList.innerHTML = '<li style="color:#777; text-align:center;">Sin registros aún.</li>';
            return;
        }
        list.slice(0, 5).forEach((entry, i) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span style="font-weight:500; color:white;">
                    <span style="color:#ffe66d; margin-right:10px;">#${i+1}</span> ${entry.teamName}
                </span>
                <strong style="color:#4ecdc4;">${entry.score} pts</strong>`;
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
    fetchCategories(); 

    // Eventos de botones de duración
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = parseInt(btn.dataset.mode);
            fetchSongsAndStart(mode); 
        });
    });

    function initGameLogic(mode) {
        gameConfig.mode = mode;
        gameConfig.playedCount = 0;
        gameConfig.isActive = true;
        
        // Clonar array para no modificar el original
        availableSongs = JSON.parse(JSON.stringify(loadedSongsFromServer));

        // Animación de salida del overlay
        setupOverlay.style.opacity = '0';
        setupOverlay.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            setupOverlay.style.display = 'none';
            setupOverlay.style.opacity = '1'; // Reset para la próxima
        }, 500);

        playRandomBtn.disabled = false; 
        revealBtn.disabled = true;      
        
        // Actualizar título
        const titleEl = document.querySelector('.left-panel h1');
        titleEl.innerHTML = `En una Nota <span style="font-size:0.4em; display:block; color:var(--primary); letter-spacing:2px; margin-top:5px;">${selectedCategory.toUpperCase()}</span>`;
        
        // Resetear visualización
        updateProgress();
        unknownState.style.display = 'flex'; // Usar flex para centrar
        revealedState.style.display = 'none';
        
        // Limpiar info anterior
        songTitleDisplay.textContent = "Título Canción";
        sponsorName.textContent = "Artista";
    }

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
            
            saveRankingToServer({
                teamName: winner.name,
                score: winner.score,
                date: new Date().toLocaleDateString()
            }, gameConfig.mode);
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
        availableSongs.splice(randomIndex, 1);

        gameConfig.playedCount++;
        updateProgress();

        // Intentar reproducir
        // Si es demo, no sonará nada real, pero no dará error fatal
        const src = currentSong.file.includes('demo') ? '' : `../assets/songs/${currentSong.file}`;
        
        if(src) {
            audioPlayer.src = src;
            audioPlayer.play().catch(e => console.log("Error play:", e));
        } else {
            console.log("Canción demo simulada (sin audio real)");
        }
    }

    function revealSongData() {
        if (!currentSong) return;
        
        unknownState.style.display = 'none';
        revealedState.style.display = 'block';
        
        // Efecto de entrada
        revealedState.style.animation = 'none';
        revealedState.offsetHeight; /* trigger reflow */
        revealedState.style.animation = 'fadeIn 0.5s ease';

        songTitleDisplay.textContent = currentSong.title || "Título Desconocido";
        sponsorName.textContent = currentSong.artist || "Artista Desconocido";
        
        sponsorImg.style.display = 'none'; // Por defecto oculto si no hay img
        
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
        if(confirm("¿Eliminar este equipo?")) { teams = teams.filter(t => t.id !== teamId); renderTeams(); }
    }

    function renderTeams() {
        teamsGrid.innerHTML = '';
        teams.forEach(team => {
            const card = document.createElement('div');
            card.className = 'team-card';
            // Animación de entrada
            card.style.animation = 'slideIn 0.3s ease';
            
            card.innerHTML = `
                <button class="delete-team-btn" onclick="window.removeTeamWrapper(${team.id})">×</button>
                <h3 class="team-name">${team.name}</h3>
                <div class="score-box">${team.score}</div>
                <div class="score-actions">
                    <button class="btn-score btn-minus" onclick="window.updateScoreWrapper(${team.id}, -1)">-</button>
                    <button class="btn-score btn-plus" onclick="window.updateScoreWrapper(${team.id}, 1)">+</button>
                </div>`;
            teamsGrid.appendChild(card);
        });
    }

    // Exponer funciones globales para los onclick del HTML generado
    window.updateScoreWrapper = updateScore;
    window.removeTeamWrapper = removeTeam;

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