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
    
    const gameBoard = document.getElementById('gameBoard');
    const currentThemeDisplay = document.getElementById('currentThemeDisplay');
    const startPlayerDisplay = document.getElementById('startPlayerDisplay');

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
    
    let currentImpostorIndex = -1;
    let currentSecretWord = "";
    let currentVotes = {}; 

    // --- PERSISTENCIA (LOCALSTORAGE) ---
    function savePlayers() {
        localStorage.setItem('impostorPlayers', JSON.stringify(players));
    }

    function loadPlayers() {
        const saved = localStorage.getItem('impostorPlayers');
        if (saved) {
            try {
                players = JSON.parse(saved);
                // Reseteamos estados por si acaso
                players.forEach(p => { p.flipCount = 0; p.eliminated = false; });
                renderPlayerList();
            } catch (e) {
                console.error("Error cargando jugadores", e);
            }
        }
    }

    // --- LISTA DE ICONOS ---
    const availableIcons = [
        "🎩", "🐶", "🚗", "🚢", "🦖", "🦆", "👢", "🐱", 
        "🍔", "⚽", "🎮", "🚀", "👑", "👽", "🦄", "💩", 
        "💀", "🎸", "🌵", "🚲"
    ];
    
    // --- DATOS (PALABRAS) ---
    const wordData = {
        profesiones: ["Médico", "Bombero", "Astronauta", "Profesor", "Policía", "Fontanero", "Carpintero", "Futbolista", "Cocinero", "Jardinero", "Mecánico", "Piloto", "Dentista", "Veterinario", "Abogado"],
        objetos: ["Mesa", "Silla", "Teléfono", "Ordenador", "Cama", "Gafas", "Reloj", "Zapato", "Botella", "Libro", "Llaves", "Cuchara", "Tenedor", "Coche", "Bicicleta"],
        animales: ["Perro", "Gato", "Elefante", "León", "Tigre", "Jirafa", "Mono", "Caballo", "Vaca", "Cerdo", "Oveja", "Gallina", "Pato", "Águila", "Serpiente"],
        lugares: ["Playa", "Montaña", "Cine", "Escuela", "Hospital", "Aeropuerto", "Parque", "Supermercado", "Biblioteca", "Gimnasio"]
    };

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
        savePlayers(); // Guardar
        newPlayerInput.value = '';
        renderPlayerList();
        newPlayerInput.focus();
    }

    function removePlayer(nameToRemove) {
        players = players.filter(p => p.name !== nameToRemove);
        savePlayers(); // Guardar
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

        // RESET COMPLETO para nueva ronda
        players.forEach(p => {
            p.flipCount = 0;
            p.eliminated = false;
        });

        // 1. Elegir Temática y Palabra NUEVA
        const themes = Object.keys(wordData);
        const randomThemeKey = getRandomItem(themes);
        const themeDisplayName = randomThemeKey.charAt(0).toUpperCase() + randomThemeKey.slice(1);
        
        currentThemeDisplay.textContent = themeDisplayName;
        currentSecretWord = getRandomItem(wordData[randomThemeKey]);
        currentImpostorIndex = Math.floor(Math.random() * players.length);

        // 2. Elegir quién empieza
        const starterIndex = Math.floor(Math.random() * players.length);
        const starterPlayer = players[starterIndex];
        startPlayerDisplay.innerHTML = `${starterPlayer.icon} ${starterPlayer.name}`;

        console.log("Impostor (Debug):", players[currentImpostorIndex].name); 

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
            const isImpostor = (index === currentImpostorIndex);
            
            let backContent = "";
            if (isImpostor) {
                backContent = `<div class="role-icon">🕵️‍♀️</div><div class="impostor-text" style="font-size:0.9rem">¡ERES EL IMPOSTOR!</div>`;
            } else {
                backContent = `<div class="role-icon">🤫</div><div class="secret-word">${currentSecretWord}</div>`;
            }

            if (playerObj.eliminated) {
                const roleText = isImpostor ? "Era el Impostor" : "Era Tripulante";
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

    // --- SISTEMA DE VOTACIÓN ---
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
            alert("¡Hay un empate! Deshaced el empate añadiendo un voto a alguien.");
            return;
        }
        handleExpulsion(votedName);
    }

    function handleExpulsion(votedName) {
        votingModal.style.display = 'none';
        
        const playerIndex = players.findIndex(p => p.name === votedName);
        if (playerIndex === -1) return;

        const isImpostor = (playerIndex === currentImpostorIndex);

        if (isImpostor) {
            showResult(true, "victory", votedName);
        } else {
            players[playerIndex].eliminated = true;
            renderCards(); 

            const livingCount = players.filter(p => !p.eliminated).length;
            if (livingCount <= 2) {
                showResult(true, "impostorWin", votedName);
            } else {
                showResult(false, "continue", votedName);
            }
        }
    }

    function showResult(isGameOver, type, playerName) {
        resultModal.style.display = 'flex';
        
        continueGameBtn.style.display = 'none';
        newGameResultBtn.style.display = 'none';
        resultSecretWord.style.display = 'none';

        if (type === "victory") {
            resultIcon.textContent = "🏆";
            resultTitle.textContent = "¡IMPOSTOR CAZADO!";
            resultTitle.style.color = "#4556ac";
            resultSubtitle.innerHTML = `¡Efectivamente, <b>${playerName}</b> era el impostor!`;
            
            resultSecretWord.style.display = 'block';
            resultSecretWord.innerHTML = `La palabra secreta era: <span style="color:#4556ac; font-size:1.5rem">${currentSecretWord}</span>`;
            newGameResultBtn.style.display = 'block';

        } else if (type === "impostorWin") {
            resultIcon.textContent = "😈";
            resultTitle.textContent = "¡GANA EL IMPOSTOR!";
            resultTitle.style.color = "#ff4b2b";
            resultSubtitle.innerHTML = `¡Habéis expulsado a <b>${playerName}</b> (Tripulante)!<br>Al quedar solo 2, el Impostor domina la nave.`;

            const impostorName = players[currentImpostorIndex].name;
            resultSecretWord.style.display = 'block';
            resultSecretWord.innerHTML = `La palabra era: <b>${currentSecretWord}</b><br>El Impostor era: <b>${impostorName}</b>`;
            newGameResultBtn.style.display = 'block';

        } else if (type === "continue") {
            resultIcon.textContent = "💀";
            resultTitle.textContent = "¡FALLO!";
            resultTitle.style.color = "#666";
            resultSubtitle.innerHTML = `<b>${playerName}</b> era... <span style="color:#4556ac; font-weight:bold">¡TRIPULANTE!</span><br>El impostor sigue entre nosotros...`;
            
            continueGameBtn.style.display = 'block';
            continueGameBtn.onclick = () => {
                resultModal.style.display = 'none';
            };
        }
    }

    function goToNewGame() {
        resultModal.style.display = 'none';
        gameView.style.display = 'none';
        setupView.style.display = 'block';
    }

    // --- EVENT LISTENERS ---
    initIcons(); 
    loadPlayers(); // Cargar jugadores guardados al inicio

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
    
    // Aquí está el cambio clave: NO recargamos, llamamos a la función de ir al menú
    newGameResultBtn.addEventListener('click', goToNewGame);
});