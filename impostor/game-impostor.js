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

    // --- ESTADO DEL JUEGO ---
    // Estructura: { name: "Juan", icon: "🎩", flipCount: 0 }
    let players = []; 
    let currentSelectedIcon = "🎩"; 

    // --- LISTA DE ICONOS ---
    const availableIcons = [
        "🎩", "🐶", "🚗", "🚢", "🦖", "🦆", "👢", "🐱", 
        "🍔", "⚽", "🎮", "🚀", "👑", "👽", "🦄", "💩", 
        "💀", "🎸", "🌵", "🚲"
    ];
    
    // --- DATOS (LISTAS DE PALABRAS) ---
    const wordData = {
        profesiones: [
            "Médico", "Bombero", "Astronauta", "Profesor", "Policía", 
            "Fontanero", "Carpintero", "Futbolista", "Cocinero", "Jardinero",
            "Mecánico", "Piloto", "Dentista", "Veterinario", "Abogado",
            "Arquitecto", "Electricista", "Peluquero", "Camarero", "Actor",
            "Periodista", "Juez", "Científico", "Payaso", "Mago"
        ],
        objetos: [
            "Mesa", "Silla", "Teléfono", "Ordenador", "Cama",
            "Gafas", "Reloj", "Zapato", "Botella", "Libro",
            "Llaves", "Cuchara", "Tenedor", "Coche", "Bicicleta",
            "Guitarra", "Piano", "Espejo", "Mochila", "Paraguas",
            "Ventana", "Puerta", "Lámpara", "Televisión", "Microondas"
        ],
        animales: [
            "Perro", "Gato", "Elefante", "León", "Tigre",
            "Jirafa", "Mono", "Caballo", "Vaca", "Cerdo",
            "Oveja", "Gallina", "Pato", "Águila", "Serpiente",
            "Cocodrilo", "Tiburón", "Delfín", "Ballena", "Pingüino",
            "Canguro", "Oso", "Lobo", "Zorro", "Conejo"
        ],
        cantantes: [ 
            "Rosalía", "David Bisbal", "Aitana", "Alejandro Sanz", "Julio Iglesias",
            "Raphael", "Joaquín Sabina", "Melendi", "Estopa", "C. Tangana",
            "Lola Flores", "Rocío Jurado", "Enrique Iglesias", "Amaia Montero", "Dani Martín",
            "Pablo Alborán", "Manuel Carrasco", "Bustamante", "Chenoa", "Quevedo",
            "Bad Gyal", "Ana Mena", "Miguel Bosé", "Camilo Sesto", "Nino Bravo"
        ]
    };

    // --- INICIALIZAR SELECTOR DE ICONOS ---
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

    // --- GESTIÓN DE JUGADORES ---

    function addPlayer() {
        const name = newPlayerInput.value.trim();
        if (!name) return;
        
        if (players.some(p => p.name === name)) {
            alert("¡Ese nombre ya está cogido!");
            return;
        }

        players.push({
            name: name,
            icon: currentSelectedIcon,
            flipCount: 0 // Inicializamos contador
        });

        newPlayerInput.value = '';
        renderPlayerList();
        newPlayerInput.focus();
    }

    function removePlayer(nameToRemove) {
        players = players.filter(p => p.name !== nameToRemove);
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

    // --- CONTROL DE VISTAS ---
    
    function showGameView() {
        setupView.style.display = 'none';
        gameView.style.display = 'block';
    }

    function showSetupView() {
        gameView.style.display = 'none';
        setupView.style.display = 'block';
    }

    // --- LÓGICA DEL JUEGO ---

    function getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    function startRound() {
        if (players.length < 3) {
            alert("Se necesitan al menos 3 jugadores para jugar.");
            return;
        }

        // RESETEAR CONTADORES DE TRAMPA PARA LA NUEVA RONDA
        players.forEach(p => p.flipCount = 0);

        // 1. Elegir Temática y Palabra
        const themes = Object.keys(wordData);
        const randomThemeKey = getRandomItem(themes);
        const themeDisplayName = randomThemeKey.charAt(0).toUpperCase() + randomThemeKey.slice(1);
        currentThemeDisplay.textContent = themeDisplayName;

        const secretWord = getRandomItem(wordData[randomThemeKey]);
        const impostorIndex = Math.floor(Math.random() * players.length);

        console.log("Debug - Impostor es:", players[impostorIndex].name); 

        renderCards(secretWord, impostorIndex);
        showGameView();
    }

    function renderCards(word, impostorIdx) {
        gameBoard.innerHTML = '';

        players.forEach((playerObj, index) => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'flip-card';

            const cardInner = document.createElement('div');
            cardInner.className = 'flip-card-inner';

            // PARTE DELANTERA (AÑADIDO EL CONTADOR)
            const cardFront = document.createElement('div');
            cardFront.className = 'flip-card-front';
            
            // Creamos un ID único para el contador de esta carta
            const counterId = `counter-${index}`;
            
            cardFront.innerHTML = `
                <div class="role-icon">${playerObj.icon}</div>
                <div class="player-name">${playerObj.name}</div>
                <div class="flip-count-badge" id="${counterId}">👀 0</div>
            `;

            // PARTE TRASERA
            const isImpostor = (index === impostorIdx);
            const content = isImpostor 
                ? `<div class="role-icon">🕵️‍♀️</div><div class="impostor-text" style="font-size:0.9rem">¡ERES EL IMPOSTOR!</div>` 
                : `<div class="role-icon">🤫</div><div class="secret-word">${word}</div>`;

            const cardBack = document.createElement('div');
            cardBack.className = 'flip-card-back';
            cardBack.innerHTML = content;

            cardInner.appendChild(cardFront);
            cardInner.appendChild(cardBack);
            cardContainer.appendChild(cardInner);

            // LOGICA DEL CLICK (ACTUALIZADA PARA CONTAR)
            cardContainer.addEventListener('click', () => {
                if (cardContainer.classList.contains('flipped')) return;

                // 1. Aumentar contador en datos
                playerObj.flipCount++;
                
                // 2. Actualizar visualmente el contador
                const badgeEl = document.getElementById(counterId);
                badgeEl.textContent = `👀 ${playerObj.flipCount}`;
                
                // Si ha mirado más de 1 vez, marcar como sospechoso (ROJO)
                if (playerObj.flipCount > 1) {
                    badgeEl.classList.add('suspicious');
                }

                // 3. Girar carta
                cardContainer.classList.add('flipped');

                // 4. Ocultar tras 1 segundo
                setTimeout(() => {
                    cardContainer.classList.remove('flipped');
                }, 3000); 
            });

            gameBoard.appendChild(cardContainer);
        });
    }

    // --- EVENT LISTENERS ---
    initIcons(); 

    addPlayerBtn.addEventListener('click', addPlayer);
    
    newPlayerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlayer();
    });

    startGameBtn.addEventListener('click', startRound);
    
    backToSetupBtn.addEventListener('click', showSetupView);
});