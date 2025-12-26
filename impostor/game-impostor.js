document.addEventListener('DOMContentLoaded', () => {
    
    // --- REFERENCIAS DOM ---
    const setupView = document.getElementById('setupView');
    const gameView = document.getElementById('gameView');
    
    const newPlayerInput = document.getElementById('newPlayerInput');
    const addPlayerBtn = document.getElementById('addPlayerBtn');
    const playersList = document.getElementById('playersList');
    const startGameBtn = document.getElementById('startGameBtn');
    const backToSetupBtn = document.getElementById('backToSetupBtn');
    const iconSelector = document.getElementById('iconSelector');
    const impostorCountInput = document.getElementById('impostorCountInput'); // Nuevo selector
    
    const gameBoard = document.getElementById('gameBoard');
    const currentThemeDisplay = document.getElementById('currentThemeDisplay');
    const startPlayerDisplay = document.getElementById('startPlayerDisplay');
    const livingImpostorsDisplay = document.getElementById('livingImpostorsCount');

    // Botones Votación y Modales
    const openVotingBtn = document.getElementById('openVotingBtn');
    const votingModal = document.getElementById('votingModal');
    const votingButtonsContainer = document.getElementById('votingButtonsContainer');
    const cancelVotingBtn = document.getElementById('cancelVotingBtn');
    const confirmVotingBtn = document.getElementById('confirmVotingBtn');

    // Modal Resultado
    const resultModal = document.getElementById('resultModal');
    const resultTitle = document.getElementById('resultTitle');
    const resultSubtitle = document.getElementById('resultSubtitle');
    const resultIcon = document.getElementById('resultIcon');
    const resultSecretWord = document.getElementById('resultSecretWord');
    const continueGameBtn = document.getElementById('continueGameBtn');
    const newGameResultBtn = document.getElementById('newGameResultBtn');

    // --- ESTADO DEL JUEGO ---
    let players = []; 
    let currentSelectedIcon = "🎩"; 
    
    // Estado de la ronda
    let currentImpostorIndices = []; // AHORA ES UN ARRAY
    let currentSecretWord = "";
    let currentVotes = {}; 

    // --- PERSISTENCIA ---
    function savePlayers() {
        localStorage.setItem('impostorPlayers', JSON.stringify(players));
    }

    function loadPlayers() {
        const saved = localStorage.getItem('impostorPlayers');
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                if(Array.isArray(loaded)) {
                    players = loaded.map(p => ({
                        name: p.name,
                        icon: p.icon || "👤",
                        flipCount: 0,
                        eliminated: false
                    }));
                    renderPlayerList();
                }
            } catch (e) {
                console.error("Error cargando jugadores", e);
            }
        }
    }

    // --- LISTA DE ICONOS (AMPLIADA) ---
    const availableIcons = [
         "🦁", "🐯", "🐻", "🐨", "🐼", "🐸", "🐙", "🦄", "🐲", "🦖", 
        "🐳", "🐬", "🐞", "😺", "🐶", "🦊", "🦋", "🐌", "🐢", "🦕",
        
        // Accesorios y Ropa (LO QUE PEDISTE)
        "👓", "🕶️", "🥽", "👑", "🎀", "🧢", "🎩", "👒", "🎓", "📿", 
        "💍", "💎", "👟", "👠", "🎒", "🧳", "🧥", "👘", "🩱", "🧣",

        // Comida y Objetos
        "🚀", "🛸", "⭐", "🔥", "⚡", "🌈", "🍕", "🍔", "🍟", "🍦", 
        "🍩", "🍪", "🍫", "🍿", "⚽", "🏀", "🏈", "🎾", "🎸", "🎷", 
        "🥁", "🎤", "🎧", "👻", "👽", "🤖", "💩", "💀", "🤡", "🎃",
        "🍄", "🌵", "🌴", "🥑", "🍒", "🥝", "🥓", "🧀", "🚗", "✈️"
    ];
    
    // --- DATOS ---
   // --- DATOS MASIVOS (10 CATEGORÍAS x +100 PALABRAS) ---
    

    // --- INICIALIZAR ---
    function initIcons() {
        iconSelector.innerHTML = '';
        availableIcons.forEach(icon => {
            const btn = document.createElement('div');
            btn.className = 'icon-option';
            btn.textContent = icon;
            if (icon === currentSelectedIcon) btn.classList.add('selected');
            btn.addEventListener('click', () => {
                document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
                btn.classList.add('selected');
                currentSelectedIcon = icon;
            });
            iconSelector.appendChild(btn);
        });
    }

    // --- GESTIÓN JUGADORES ---
    function addPlayer() {
        const name = newPlayerInput.value.trim();
        if (!name) return;
        if (players.some(p => p.name === name)) {
            alert("¡Nombre repetido!");
            return;
        }
        players.push({ name: name, icon: currentSelectedIcon, flipCount: 0, eliminated: false });
        savePlayers();
        newPlayerInput.value = '';
        renderPlayerList();
        newPlayerInput.focus();
    }

    function removePlayer(nameToRemove) {
        players = players.filter(p => p.name !== nameToRemove);
        savePlayers();
        renderPlayerList();
    }

    function renderPlayerList() {
        playersList.innerHTML = '';
        if (players.length === 0) {
            playersList.innerHTML = '<p style="text-align: center; color: #888; margin-top: 20px;">Añade al menos 3 jugadores</p>';
            return;
        }
        players.forEach(player => {
            const div = document.createElement('div');
            div.className = 'player-list-item';
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.5rem;">${player.icon}</span>
                    <span>${player.name}</span>
                </div>
                <button class="btn-delete">×</button>
            `;
            div.querySelector('.btn-delete').addEventListener('click', () => removePlayer(player.name));
            playersList.appendChild(div);
        });
    }

    // --- LÓGICA DEL JUEGO ---
    function getRandomItem(array) { return array[Math.floor(Math.random() * array.length)]; }

    function startRound() {
        if (players.length < 3) {
            alert("Mínimo 3 jugadores.");
            return;
        }

        const requestedImpostors = parseInt(impostorCountInput.value);
        
        // Validación: No puede haber tantos impostores como jugadores (debe haber al menos 1 tripulante)
        if (requestedImpostors >= players.length) {
            alert(`Para jugar con ${requestedImpostors} impostores necesitas más jugadores.`);
            return;
        }

        // RESET COMPLETO
        players.forEach(p => {
            p.flipCount = 0;
            p.eliminated = false;
        });

        // 1. Elegir Temática y Palabra
        const themes = Object.keys(WORD_DATA); // Ojo: Variable global WORD_DATA
        const randomThemeKey = getRandomItem(themes);
        const themeDisplayName = randomThemeKey.charAt(0).toUpperCase() + randomThemeKey.slice(1);
        
        currentThemeDisplay.textContent = themeDisplayName;
        currentSecretWord = getRandomItem(WORD_DATA[randomThemeKey]); // Ojo: Variable global WORD_DATA

        // 2. Elegir Impostores (Múltiples)
        currentImpostorIndices = [];
        const indicesPool = Array.from({length: players.length}, (_, i) => i);
        
        for (let i = 0; i < requestedImpostors; i++) {
            if(indicesPool.length === 0) break;
            const randPos = Math.floor(Math.random() * indicesPool.length);
            currentImpostorIndices.push(indicesPool[randPos]);
            indicesPool.splice(randPos, 1);
        }

        // 3. Elegir quién empieza
        const starterIndex = Math.floor(Math.random() * players.length);
        const starterPlayer = players[starterIndex];
        startPlayerDisplay.innerHTML = `${starterPlayer.icon} ${starterPlayer.name}`;
        
        // Ocultar número de impostores reales (para suspense, poner "?")
        livingImpostorsDisplay.textContent = "?"; 

        console.log("Impostores (Indices):", currentImpostorIndices); 

        renderCards();
        setupView.style.display = 'none';
        gameView.style.display = 'block';
    }

    function renderCards() {
        gameBoard.innerHTML = '';

        players.forEach((playerObj, index) => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'flip-card';
            if (playerObj.eliminated) cardContainer.classList.add('eliminated');

            const cardInner = document.createElement('div');
            cardInner.className = 'flip-card-inner';

            // FRENTE
            const cardFront = document.createElement('div');
            cardFront.className = 'flip-card-front';
            const counterId = `counter-${index}`;
            
            const frontIcon = playerObj.eliminated ? "💀" : playerObj.icon;
            const frontStatus = playerObj.eliminated ? "ELIMINADO" : `👀 ${playerObj.flipCount}`;

            cardFront.innerHTML = `
                <div class="role-icon">${frontIcon}</div>
                <div class="player-name">${playerObj.name}</div>
                <div class="flip-count-badge" id="${counterId}">${frontStatus}</div>
            `;

            // DORSO
            const isImpostor = currentImpostorIndices.includes(index);
            
            let backContent = "";
            if (isImpostor) {
                backContent = `<div class="role-icon">🕵️‍♀️</div><div class="impostor-text" style="font-size:0.9rem">¡ERES EL IMPOSTOR!</div>`;
            } else {
                backContent = `<div class="role-icon">🤫</div><div class="secret-word">${currentSecretWord}</div>`;
            }

            if (playerObj.eliminated) {
                const roleText = isImpostor ? "Era Impostor" : "Era Tripulante";
                const roleIcon = isImpostor ? "😈" : "👼";
                backContent = `<div class="role-icon">${roleIcon}</div><div class="secret-word" style="color:#666; font-size:1rem">${roleText}</div>`;
            }

            const cardBack = document.createElement('div');
            cardBack.className = 'flip-card-back';
            cardBack.innerHTML = backContent;

            cardInner.appendChild(cardFront);
            cardInner.appendChild(cardBack);
            cardContainer.appendChild(cardInner);

            cardContainer.addEventListener('click', () => {
                if (cardContainer.classList.contains('flipped')) return;
                if (playerObj.eliminated) return; 

                playerObj.flipCount++;
                const badgeEl = document.getElementById(counterId);
                badgeEl.textContent = `👀 ${playerObj.flipCount}`;
                if (playerObj.flipCount > 1) badgeEl.classList.add('suspicious');

                cardContainer.classList.add('flipped');
                setTimeout(() => { cardContainer.classList.remove('flipped'); }, 3000); 
            });

            gameBoard.appendChild(cardContainer);
        });
    }

    // --- VOTACIÓN ---
    function openVotingModal() {
        votingButtonsContainer.innerHTML = '';
        currentVotes = {}; 

        const livingPlayers = players.filter(p => !p.eliminated);

        livingPlayers.forEach(player => {
            currentVotes[player.name] = 0;
            const row = document.createElement('div');
            row.className = 'vote-item';
            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.5rem">${player.icon}</span>
                    <span style="font-weight:bold">${player.name}</span>
                </div>
                <div class="vote-controls">
                    <button class="vote-btn vote-minus" data-name="${player.name}">-</button>
                    <span class="vote-count" id="vote-val-${player.name}">0</span>
                    <button class="vote-btn vote-plus" data-name="${player.name}">+</button>
                </div>
            `;
            votingButtonsContainer.appendChild(row);
        });

        document.querySelectorAll('.vote-plus').forEach(btn => {
            btn.addEventListener('click', (e) => updateVote(e.target.dataset.name, 1));
        });
        document.querySelectorAll('.vote-minus').forEach(btn => {
            btn.addEventListener('click', (e) => updateVote(e.target.dataset.name, -1));
        });

        votingModal.style.display = 'flex';
    }

    function updateVote(playerName, change) {
        if (!currentVotes[playerName] && change < 0) return; 
        currentVotes[playerName] = (currentVotes[playerName] || 0) + change;
        const display = document.getElementById(`vote-val-${playerName}`);
        if(display) display.textContent = currentVotes[playerName];
    }

    function resolveVoting() {
        let maxVotes = -1;
        let votedName = null;
        let isTie = false;

        for (const [name, count] of Object.entries(currentVotes)) {
            if (count > maxVotes) {
                maxVotes = count;
                votedName = name;
                isTie = false;
            } else if (count === maxVotes) {
                isTie = true;
            }
        }

        if (maxVotes === 0) {
            alert("¡Nadie ha votado!");
            return;
        }
        if (isTie) {
            alert("¡Empate! Deshaced el empate.");
            return;
        }
        handleExpulsion(votedName);
    }

    function handleExpulsion(votedName) {
        votingModal.style.display = 'none';
        
        const playerIndex = players.findIndex(p => p.name === votedName);
        if (playerIndex === -1) return;

        // EXPULSAR
        players[playerIndex].eliminated = true;
        renderCards();

        // COMPROBAR CONDICIONES DE VICTORIA MULTI-IMPOSTOR
        const livingPlayers = players.filter(p => !p.eliminated);
        const livingCount = livingPlayers.length;
        
        // Contar impostores vivos
        let livingImpostors = 0;
        players.forEach((p, idx) => {
            if(!p.eliminated && currentImpostorIndices.includes(idx)) {
                livingImpostors++;
            }
        });

        const wasImpostor = currentImpostorIndices.includes(playerIndex);

        // CASO 1: TODOS LOS IMPOSTORES CAZADOS -> GANA TRIPULACIÓN
        if (livingImpostors === 0) {
            showResult(true, "victory", votedName);
            return;
        }

        // CASO 2: QUEDAN 2 PERSONAS Y AL MENOS 1 IMPOSTOR VIVO -> GANA IMPOSTOR
        if (livingCount <= 2 && livingImpostors > 0) {
            showResult(true, "impostorWin", votedName);
            return;
        }

        // CASO 3: JUEGO CONTINÚA
        if (wasImpostor) {
            // Cazaron a uno, pero quedan más
            showResult(false, "one_caught_continue", votedName);
        } else {
            // Era inocente
            showResult(false, "innocent_continue", votedName);
        }
    }

    function showResult(isGameOver, type, playerName) {
        resultModal.style.display = 'flex';
        
        continueGameBtn.style.display = 'none';
        newGameResultBtn.style.display = 'none';
        resultSecretWord.style.display = 'none';

        if (type === "victory") {
            // Ganan Tripulantes
            resultIcon.textContent = "🏆";
            resultTitle.textContent = "¡IMPOSTORES ELIMINADOS!";
            resultTitle.style.color = "#4556ac";
            resultSubtitle.innerHTML = `¡Bien hecho! La nave está segura.`;
            resultSecretWord.style.display = 'block';
            resultSecretWord.innerHTML = `La palabra era: <span style="color:#4556ac; font-size:1.5rem">${currentSecretWord}</span>`;
            newGameResultBtn.style.display = 'block';

        } else if (type === "impostorWin") {
            // Gana Impostor (quedan 2)
            resultIcon.textContent = "😈";
            resultTitle.textContent = "¡GANAN LOS IMPOSTORES!";
            resultTitle.style.color = "#ff4b2b";
            resultSubtitle.innerHTML = `Solo quedan 2 supervivientes... Los impostores toman el control.`;
            
            // Mostrar nombres de los impostores
            const impNames = currentImpostorIndices.map(i => players[i].name).join(", ");
            resultSecretWord.style.display = 'block';
            resultSecretWord.innerHTML = `La palabra era: <b>${currentSecretWord}</b><br>Impostores: <b>${impNames}</b>`;
            newGameResultBtn.style.display = 'block';

        } else if (type === "one_caught_continue") {
            // Se cazó a uno, pero quedan más
            resultIcon.textContent = "🎯";
            resultTitle.textContent = "¡IMPOSTOR CAZADO!";
            resultTitle.style.color = "#4556ac";
            resultSubtitle.innerHTML = `<b>${playerName}</b> era un impostor.<br>¡Pero cuidado, aún quedan enemigos!`;
            continueGameBtn.style.display = 'block';
            continueGameBtn.onclick = () => resultModal.style.display = 'none';

        } else if (type === "innocent_continue") {
            // Se expulsó a un inocente
            resultIcon.textContent = "💀";
            resultTitle.textContent = "¡FALLO!";
            resultTitle.style.color = "#666";
            resultSubtitle.innerHTML = `<b>${playerName}</b> era... <span style="color:#4556ac; font-weight:bold">¡TRIPULANTE!</span><br>Los impostores siguen aquí...`;
            continueGameBtn.style.display = 'block';
            continueGameBtn.onclick = () => resultModal.style.display = 'none';
        }
    }

    function goToNewGame() {
        resultModal.style.display = 'none';
        gameView.style.display = 'none';
        setupView.style.display = 'block';
    }

    // --- EVENT LISTENERS ---
    initIcons(); 
    loadPlayers(); 

    addPlayerBtn.addEventListener('click', addPlayer);
    newPlayerInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addPlayer(); });
    startGameBtn.addEventListener('click', startRound);
    
    backToSetupBtn.addEventListener('click', () => {
        gameView.style.display = 'none';
        setupView.style.display = 'block';
    });

    openVotingBtn.addEventListener('click', openVotingModal);
    cancelVotingBtn.addEventListener('click', () => votingModal.style.display = 'none');
    confirmVotingBtn.addEventListener('click', resolveVoting);
    
    if(newGameResultBtn) newGameResultBtn.addEventListener('click', goToNewGame);
});

