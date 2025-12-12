document.addEventListener('DOMContentLoaded', () => {
    // REFERENCIAS DOM
    const audioPlayer = document.getElementById('audioPlayer');
    const playRandomBtn = document.getElementById('playRandomBtn');
    const revealBtn = document.getElementById('revealBtn');
    
    // Elementos de visualización
    const unknownState = document.getElementById('unknownSongState');
    const revealedState = document.getElementById('revealedSongState');
    const songTitleDisplay = document.getElementById('songTitleDisplay');
    const sponsorImg = document.getElementById('sponsorImg');
    const sponsorName = document.getElementById('sponsorName');

    // Referencias Equipos
    const newTeamInput = document.getElementById('newTeamName');
    const addTeamBtn = document.getElementById('addTeamBtn');
    const teamsGrid = document.getElementById('teamsGrid');

    // ESTADO
    let currentSong = null;
    let teams = []; // Array de objetos { id, name, score }

    // --- LÓGICA DE JUEGO ---

    function playRandomSong() {
        if (!sourceSongs || sourceSongs.length === 0) {
            alert("No hay canciones cargadas.");
            return;
        }

        // Reset visual
        unknownState.style.display = 'block';
        revealedState.style.display = 'none';
        revealBtn.disabled = false;
        
        // Selección aleatoria
        const randomIndex = Math.floor(Math.random() * sourceSongs.length);
        currentSong = sourceSongs[randomIndex];

        // Preparar audio
        audioPlayer.src = `../assets/songs/${currentSong.file}`;
        audioPlayer.play().catch(e => console.log("Error al reproducir:", e));
    }

    function revealSongData() {
        if (!currentSong) return;

        unknownState.style.display = 'none';
        revealedState.style.display = 'block';

        songTitleDisplay.textContent = currentSong.title;

        // Gestión patrocinador/imagen si existe en el objeto canción
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

        revealBtn.disabled = true;
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

    // Exponer funciones al scope global para los onlick inline
    window.updateScoreWrapper = updateScore;
    window.removeTeamWrapper = removeTeam;

    // EVENT LISTENERS
    playRandomBtn.addEventListener('click', playRandomSong);
    revealBtn.addEventListener('click', revealSongData);
    
    addTeamBtn.addEventListener('click', addTeam);
    newTeamInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTeam();
    });

});