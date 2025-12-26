document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Iniciando En una Nota (Versión COLA EN TIEMPO REAL)...");

    // REFERENCIAS
    const audioPlayer = document.getElementById('audioPlayer');
    const playRandomBtn = document.getElementById('playRandomBtn');
    const revealBtn = document.getElementById('revealBtn');
    const resetGameBtn = document.getElementById('resetGameBtn');
    const unknownState = document.getElementById('unknownSongState');
    const revealedState = document.getElementById('revealedSongState');
    const songTitleDisplay = document.getElementById('songTitleDisplay');
    const sponsorName = document.getElementById('sponsorName');
    const sponsorImg = document.getElementById('sponsorImg');
    const newTeamInput = document.getElementById('newTeamName');
    const addTeamBtn = document.getElementById('addTeamBtn');
    const teamsGrid = document.getElementById('teamsGrid');
    const setupOverlay = document.getElementById('gameSetupOverlay');
    let progressDisplay = document.getElementById('progressDisplay');
    const rankingList = document.getElementById('rankingList');
    const modeButtons = document.querySelectorAll('.btn-mode');
    const categoryContainer = document.getElementById('categoryButtonsContainer');
    const titleEl = document.querySelector('.left-panel h1');
    
    // Pulsador y Presentador
    const showQRBtn = document.getElementById('showQRBtn');
    const qrContainer = document.getElementById('qrContainer');
    const winnerOverlay = document.getElementById('buzzerWinnerOverlay');
    const winnerNameEl = document.getElementById('buzzerWinnerName');
    const winnerTimeEl = document.getElementById('buzzerWinnerTime');
    const btnCorrect = document.getElementById('btnBuzzerCorrect');
    const btnIncorrect = document.getElementById('btnBuzzerIncorrect');

    // ESTADO
    let teams = []; 
    let currentSong = null;
    let loadedSongsFromServer = [];
    let availableSongs = []; 
    let selectedCategory = null;
    let isRevealedState = false;
    let gameConfig = { mode: 0, playedCount: 0, isActive: false };
    
    // ESTADO PULSADOR
    let buzzerInterval = null; 
    let localQueue = [];       
    let processingIndex = 0;   
    let isOverlayOpen = false; 
    let isBuzzerActive = false;

    let pendingTeamName = ""; 
    let editingTeamId = null; 
    let cachedRankings = { "15": [], "30": [], "50": [] };
    const STORAGE_KEY = 'enUnaNota_GameState';
    const EMOJIS = ["👓", "🕶️", "🥽", "👑", "🎀", "🧢", "🎩", "👒", "🎓", "📿", "🦁", "🐯", "🐻", "🐨", "🐼", "🐸", "🐙", "🦄", "🐲", "🦖", "🚀", "🛸", "⭐", "🔥", "⚡", "🌈", "🍕", "🍔", "🍟", "🍦"];

    // --- COMUNICACIÓN SERVIDOR ---
    async function syncTeamsWithServer() {
        const teamNames = teams.map(t => t.name);
        try {
            await fetch('/api/buzz/set_teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teams: teamNames })
            });
        } catch (e) { console.error("Error sync teams", e); }
    }

    async function sendSongToHost() {
        if (!currentSong) return;
        const titleSafe = currentSong.title || currentSong.name || currentSong.cancion || "Título Desconocido";
        const artistSafe = currentSong.artist || currentSong.author || currentSong.artista || "Artista Desconocido";
        try {
            await fetch('/api/host/set_song', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: titleSafe, artist: artistSafe })
            });
        } catch (e) { console.error("Error sync host", e); }
    }

    // --- MODAL ---
    function createModalHTML() {
        if (document.getElementById('emojiModal')) return;
        const modalDiv = document.createElement('div');
        modalDiv.id = 'emojiModal';
        modalDiv.className = 'emoji-modal-overlay';
        let emojisHTML = EMOJIS.map(emoji => `<div class="emoji-btn" onclick="window.selectEmojiWrapper('${emoji}')">${emoji}</div>`).join('');
        modalDiv.innerHTML = `<div class="emoji-modal-content"><div class="emoji-modal-header"><h2 id="modalTitle">Elige un Icono</h2></div><div class="emoji-grid-select">${emojisHTML}</div><button class="btn-close-modal" onclick="window.closeEmojiModal()">Cancelar</button></div>`;
        document.body.appendChild(modalDiv);
    }
    createModalHTML();

    function openEmojiModal(isEditing = false) {
        document.getElementById('modalTitle').textContent = isEditing ? "Cambiar Icono" : `Icono para: ${pendingTeamName}`;
        document.getElementById('emojiModal').classList.add('open');
    }
    window.closeEmojiModal = () => { document.getElementById('emojiModal').classList.remove('open'); pendingTeamName=""; editingTeamId=null; }
    window.selectEmojiWrapper = (emoji) => {
        if (editingTeamId) {
            const team = teams.find(t => t.id === editingTeamId);
            if (team) { team.emoji = emoji; renderTeams(); saveGame(); }
        } else if (pendingTeamName) {
            if (!Array.isArray(teams)) teams = [];
            teams.push({ id: Date.now(), name: pendingTeamName, score: 0, emoji: emoji });
            newTeamInput.value = '';
            renderTeams();
            saveGame();
        }
        syncTeamsWithServer();
        window.closeEmojiModal();
    }

    // --- EQUIPOS ---
    function initiateAddTeam() {
        if (!newTeamInput) return;
        const name = newTeamInput.value.trim();
        if (!name) return alert("⚠️ Escribe un nombre primero.");
        pendingTeamName = name; editingTeamId = null; openEmojiModal(false);
    }
    function editTeamEmoji(teamId) { editingTeamId = teamId; openEmojiModal(true); }
    function updateScore(teamId, change) { 
        const team = teams.find(t => t.id === teamId); 
        if(team) { team.score += change; renderTeams(); saveGame(); }
    }
    function removeTeam(teamId) {
        if(confirm("¿Eliminar este equipo?")) { 
            teams = teams.filter(t => t.id !== teamId); 
            renderTeams(); syncTeamsWithServer(); saveGame(); 
        }
    }

    function renderTeams() {
        if (!teamsGrid) return;
        const prevPositions = {};
        teamsGrid.querySelectorAll('.team-card').forEach(c => prevPositions[c.dataset.id] = c.getBoundingClientRect());
        
        if (!Array.isArray(teams)) teams = [];
        const sortedTeams = [...teams].sort((a, b) => (b.score !== a.score) ? b.score - a.score : a.id - b.id);

        teamsGrid.innerHTML = '';
        sortedTeams.forEach((team, index) => {
            if (!team.emoji) team.emoji = "❓";
            const total = sortedTeams.length;
            let hue = 150; 
            if (total > 1) hue = 150 - ((index / (total - 1)) * 150); 
            
            const teamNameUpper = team.name.toUpperCase();
            const connCount = (window.teamConnections && window.teamConnections[teamNameUpper]) || 0;
            const connColor = connCount > 0 ? '#2ecc71' : '#7f8c8d';

            const card = document.createElement('div');
            card.className = 'team-card';
            card.dataset.id = team.id;
            card.style.background = `linear-gradient(145deg, hsla(${hue}, 70%, 35%, 0.85), hsla(${hue}, 80%, 15%, 0.8))`;
            card.style.borderColor = `hsla(${hue}, 80%, 60%, 0.5)`;
            card.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.6s ease';

            card.innerHTML = `
                <button class="btn-delete-team" onclick="window.removeTeamWrapper(${team.id})">×</button>
                <div style="position:absolute; top:10px; left:10px; background:rgba(0,0,0,0.6); padding:4px 8px; border-radius:12px; font-size:0.8rem; color:${connColor}; border:1px solid ${connColor}; display:flex; align-items:center; gap:5px;">
                    📱 ${connCount}
                </div>
                <div class="team-emoji" onclick="window.editEmojiWrapper(${team.id})" title="Clic para cambiar">${team.emoji}</div>
                <h3 class="team-name">${team.name}</h3>
                <div class="score-box">${team.score}</div>
                <div class="score-actions">
                    <button class="btn-score btn-minus" onclick="window.updateScoreWrapper(${team.id}, -1)">-</button>
                    <button class="btn-score btn-plus" onclick="window.updateScoreWrapper(${team.id}, 1)">+</button>
                </div>`;
            teamsGrid.appendChild(card);
        });

        requestAnimationFrame(() => {
            teamsGrid.querySelectorAll('.team-card').forEach(card => {
                const prev = prevPositions[card.dataset.id];
                if (prev) {
                    const current = card.getBoundingClientRect();
                    const dx = prev.left - current.left, dy = prev.top - current.top;
                    if (dx || dy) {
                        card.style.transition = 'none';
                        card.style.transform = `translate(${dx}px, ${dy}px)`;
                        requestAnimationFrame(() => {
                            card.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.6s ease';
                            card.style.transform = '';
                        });
                    }
                } else { card.style.animation = 'popIn 0.5s ease backwards'; }
            });
        });
    }

    // --- PULSADOR ---
    if(showQRBtn) {
        showQRBtn.addEventListener('click', () => {
            if(qrContainer.style.display === 'none') {
                qrContainer.innerHTML = ''; qrContainer.style.display = 'block'; showQRBtn.textContent = 'Ocultar QR';
                new QRCode(qrContainer, { text: `${window.location.protocol}//${window.location.hostname}:${window.location.port}/buzzer`, width: 128, height: 128 });
            } else { qrContainer.style.display = 'none'; showQRBtn.textContent = '📱 Mostrar QR Pulsador'; }
        });
    }

    async function resetServerBuzzer() { 
        processingIndex = 0; localQueue = [];
        try { await fetch('/api/buzz/reset', { method: 'POST' }); } catch(e){} 
    }

    function startBuzzerPolling() {
        if(buzzerInterval) clearInterval(buzzerInterval);
        buzzerInterval = setInterval(async () => {
            try {
                const res = await fetch('/api/buzz/status');
                const data = await res.json();
                
                // 1. COLA DE JUEGO
                if (data.queue && isBuzzerActive) { 
                    localQueue = data.queue;
                    
                    // --- AQUÍ ESTÁ LA MAGIA DE ACTUALIZACIÓN EN VIVO ---
                    if (!isOverlayOpen) {
                        checkQueueStatus(); // Si está cerrado, vemos si hay que abrir
                    } else {
                        renderQueueList();  // Si YA está abierto, solo actualizamos la lista
                    }
                }

                // 2. MONITOR CONEXIONES
                if (data.connections) {
                    window.teamConnections = data.connections;
                    renderTeams(); 
                }

                // 3. COMANDOS REMOTOS (PRESENTADOR)
                if (data.command && isOverlayOpen) {
                    console.log("📲 Comando:", data.command);
                    if (data.command === 'correct' && btnCorrect) btnCorrect.click();
                    else if (data.command === 'fail' && btnIncorrect) btnIncorrect.click();
                    await fetch('/api/host/clear_command', { method: 'POST' });
                }

            } catch(e) { console.error(e); }
        }, 500); // Polling más rápido para que se vea fluido (0.5s)
    }

    function checkQueueStatus() {
        if (isBuzzerActive && localQueue.length > processingIndex && !isOverlayOpen) {
            const currentTurn = localQueue[processingIndex];
            openWinnerOverlay(currentTurn.team, currentTurn.time);
        }
    }

    // --- NUEVA FUNCIÓN: SOLO PINTA LA LISTA ---
    function renderQueueList() {
        const queueListEl = document.getElementById('queueList');
        if (!queueListEl) return;

        // Cogemos solo los que van DESPUÉS del actual
        const nextInLine = localQueue.slice(processingIndex + 1);
        
        queueListEl.innerHTML = ''; 
        if (nextInLine.length === 0) {
            queueListEl.innerHTML = '<div style="text-align:center; color:#555; font-style:italic;">Nadie más ha pulsado (aún)</div>';
        } else {
            nextInLine.forEach((item, index) => {
                const row = document.createElement('div');
                row.style.padding = "5px 10px";
                row.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
                row.style.display = "flex"; row.style.justifyContent = "space-between";
                const pos = processingIndex + index + 2; 
                row.innerHTML = `<span><b style="color:#4ecdc4">${pos}º</b> ${item.team}</span><span style="color:#aaa">${item.time}s</span>`;
                queueListEl.appendChild(row);
            });
        }
    }

    function openWinnerOverlay(winnerName, time) {
        isOverlayOpen = true;
        audioPlayer.pause(); 
        winnerNameEl.textContent = winnerName;
        winnerTimeEl.textContent = `Tiempo: ${time}s`;
        if (processingIndex > 0) winnerTimeEl.textContent += ` (Rebote #${processingIndex})`;

        // Pintamos la lista inicialmente
        renderQueueList();

        winnerOverlay.style.display = 'flex';
        winnerOverlay.style.animation = 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }

    // ACCIONES BOTONES
    if (btnCorrect) {
        btnCorrect.onclick = () => {
            const winnerName = winnerNameEl.textContent.trim();
            const team = teams.find(t => t.name.toUpperCase() === winnerName);
            if (team) updateScore(team.id, 1);
            winnerOverlay.style.display = 'none';
            isOverlayOpen = false;
            isBuzzerActive = false; 
        };
    }

    if (btnIncorrect) {
        btnIncorrect.onclick = async () => {
            const winnerName = winnerNameEl.textContent.trim();
            try { await fetch('/api/buzz/fail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ team: winnerName }) }); } catch(e) {}
            const team = teams.find(t => t.name.toUpperCase() === winnerName);
            if (team) updateScore(team.id, -1);
            
            processingIndex++; 
            winnerOverlay.style.display = 'none'; 
            isOverlayOpen = false;
            
            if (processingIndex < localQueue.length) checkQueueStatus(); 
            else audioPlayer.play().catch(e => console.error(e));
        };
    }

    // --- GAME FLOW ---
    async function playRandomSong() {
        if (!gameConfig.isActive) return;
        winnerOverlay.style.display = 'none';
        isOverlayOpen = false;
        if (gameConfig.playedCount >= gameConfig.mode || availableSongs.length === 0) return finishGame();
        
        isRevealedState = false; showUnknownUI();
        
        await syncTeamsWithServer();
        await resetServerBuzzer();
        
        isBuzzerActive = true; 
        startBuzzerPolling();

        const rand = Math.floor(Math.random() * availableSongs.length);
        currentSong = availableSongs[rand];
        availableSongs.splice(rand, 1);
        await sendSongToHost();
        
        gameConfig.playedCount++;
        updateProgress();
        
        audioPlayer.src = `../../assets/songs/${currentSong.file}`;
        audioPlayer.play().catch(e => console.error(e));
        saveGame();
    }

    function revealSongData() {
        if (!currentSong) return;
        isBuzzerActive = false; 
        isRevealedState = true; showRevealedUI(); saveGame();
    }

    function finishGame() {
        gameConfig.isActive = false;
        let msg = "Juego terminado.";
        
        if (teams.length > 0) {
            const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
            const winner = sortedTeams[0];
            msg = `¡VICTORIA!\n\n👑 ${winner.name}\n⭐ ${winner.score} puntos`;
            saveRankingToServer(winner.name, winner.score, gameConfig.mode);
        }
        
        alert(msg);

        // --- CAMBIO: NO BORRAMOS TODO, SOLO RESETEAMOS PARA LA SIGUIENTE ---
        // clearSave(); <--- BORRAMOS ESTA LÍNEA ANTIGUA
        
        // Reseteamos marcadores para la próxima
        teams.forEach(t => t.score = 0);
        gameConfig = { mode: 0, playedCount: 0, isActive: false };
        currentSong = null;
        
        saveGame(); // Guardamos los equipos listos para la próxima
        location.reload();
    }

    // --- UTILS ---
    function saveGame() { if (gameConfig.isActive || teams.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify({teams, gameConfig, currentSong, availableSongs, selectedCategory, isRevealedState})); }
    function clearSave() { localStorage.removeItem(STORAGE_KEY); }
    function tryRestoreGame() {
        const d = localStorage.getItem(STORAGE_KEY); if(!d) return false;
        try {
            const s = JSON.parse(d);
            teams = s.teams||[]; gameConfig = s.gameConfig||{mode:0,playedCount:0,isActive:false};
            currentSong = s.currentSong; availableSongs = s.availableSongs||[]; selectedCategory=s.selectedCategory||"";
            isRevealedState = s.isRevealedState||false; loadedSongsFromServer = s.loadedSongsFromServer||[];
            renderTeams(); updateProgress();
            if(gameConfig.isActive) {
                setupOverlay.style.display = 'none';
                if(currentSong) { audioPlayer.src = `../../assets/songs/${currentSong.file}`; isRevealedState ? showRevealedUI() : showUnknownUI(); }
                if(titleEl) titleEl.innerHTML = `En una Nota <br><span style="font-size:0.5em; color:#4ecdc4;">${selectedCategory}</span>`;
            } else if (teams.length > 0) renderTeams();
            syncTeamsWithServer();
            return gameConfig.isActive;
        } catch(e) { clearSave(); return false; }
    }

    function showUnknownUI() { unknownState.style.display = 'flex'; revealedState.style.display = 'none'; playRandomBtn.disabled = false; revealBtn.disabled = true; }
    function showRevealedUI() { unknownState.style.display = 'none'; revealedState.style.display = 'block'; if(currentSong){ songTitleDisplay.textContent=currentSong.title; sponsorName.textContent=currentSong.artist; sponsorImg.style.display='none'; } playRandomBtn.disabled=false; revealBtn.disabled=true; }
    function updateProgress() { if(gameConfig.isActive) progressDisplay.textContent = `Ronda ${gameConfig.playedCount} / ${gameConfig.mode}`; }

    function fetchCategories() {
        if (!categoryContainer) return;
        try {
            const cats = [...new Set(sourceSongs.map(s => s.file.split('/')[0]))];
            categoryContainer.innerHTML = '';
            cats.forEach(c => {
                const b = document.createElement('button'); b.className = 'btn-mode btn-category'; b.textContent = c; b.style.margin="5px";
                b.onclick = () => { selectedCategory = c; document.querySelectorAll('.btn-category').forEach(x=>x.classList.remove('selected')); b.classList.add('selected'); };
                categoryContainer.appendChild(b);
            });
        } catch(e){}
    }
    
    function fetchSongsAndStart(mode) {
        if (!selectedCategory) return alert("Selecciona categoría");
        loadedSongsFromServer = sourceSongs.filter(s => s.file.startsWith(selectedCategory + "/"));
        if(loadedSongsFromServer.length===0) return alert("Categoría vacía");
        gameConfig.mode = mode; gameConfig.playedCount = 0; gameConfig.isActive = true;
        isRevealedState = false; availableSongs = JSON.parse(JSON.stringify(loadedSongsFromServer));
        setupOverlay.style.display = 'none';
        if(titleEl) titleEl.innerHTML = `En una Nota <br><span style="font-size:0.5em; color:#4ecdc4;">${selectedCategory}</span>`;
        updateProgress(); showUnknownUI(); playRandomBtn.disabled = false; revealBtn.disabled = true;
        syncTeamsWithServer(); saveGame();
    }
    
    // Rankings
    function getCurrentDate() { const d = new Date(); return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`; }
    async function loadRankingsFromServer(modeToShow) { try { const res = await fetch('/api/music/ranking'); cachedRankings = (await res.json()) || { "15": [], "30": [], "50": [] }; renderRankingsList(modeToShow); } catch (e) {} }
    function renderRankingsList(mode) {
        if (!rankingList) return; rankingList.innerHTML = '';
        const list = cachedRankings[String(mode)] || [];
        if (list.length === 0) { rankingList.innerHTML = '<li style="text-align:center;color:#777">Sin datos</li>'; return; }
        list.forEach((entry, i) => { const li = document.createElement('li'); li.innerHTML = `<span style="color:white"><b>${i+1}.</b> ${entry.teamName}</span><span style="color:#4ecdc4">${entry.score} pts</span>`; rankingList.appendChild(li); });
    }
    async function saveRankingToServer(winnerName, score, mode) { try { await fetch('/api/music/ranking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: String(mode), teamName: winnerName, score: score, date: getCurrentDate() }) }); } catch(e){} }

    // GLOBALES
    window.updateScoreWrapper = updateScore; window.removeTeamWrapper = removeTeam; window.editEmojiWrapper = editTeamEmoji; window.selectEmojiWrapper = selectEmojiWrapper;
    window.switchTab = (mode) => { document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); if(event && event.target) event.target.classList.add('active'); renderRankingsList(mode); };

    if(addTeamBtn) addTeamBtn.addEventListener('click', initiateAddTeam);
    if(newTeamInput) newTeamInput.addEventListener('keypress', e=>{if(e.key==='Enter')initiateAddTeam()});
    if(playRandomBtn) playRandomBtn.addEventListener('click', playRandomSong);
    if(revealBtn) revealBtn.addEventListener('click', revealSongData);
    // BOTÓN DE REINICIAR (MANTENIENDO EQUIPOS)
    if(resetGameBtn) resetGameBtn.onclick = () => {
        if(confirm("⚠️ ¿Reiniciar partida?\n\nLos equipos se mantendrán, pero los puntos volverán a 0.")) {
            // 1. Resetear puntuaciones
            teams.forEach(t => t.score = 0);
            
            // 2. Resetear configuración del juego
            gameConfig = { mode: 0, playedCount: 0, isActive: false };
            currentSong = null;
            availableSongs = [];
            selectedCategory = null; // Opcional: si quieres obligar a elegir categoría de nuevo
            isRevealedState = false;

            // 3. Guardar este estado "limpio"
            saveGame();
            
            // 4. Recargar
            location.reload(); 
        }
    };

    const active = tryRestoreGame();
    loadRankingsFromServer(15); 
    startBuzzerPolling(); 
    if (!active) {
        fetchCategories(); 
        modeButtons.forEach(b => b.onclick = () => { if(b.id!=='btnBackToCategories') fetchSongsAndStart(parseInt(b.dataset.mode)) }); 
    }
});