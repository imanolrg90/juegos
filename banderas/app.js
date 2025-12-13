// LISTA COMPLETA DE PAÍSES
const countryData = {
    "ad": "Andorra", "ae": "Emiratos Árabes", "af": "Afganistán", "ag": "Antigua y Barbuda",
    "ai": "Anguila", "al": "Albania", "am": "Armenia", "ao": "Angola", "aq": "Antártida",
    "ar": "Argentina", "as": "Samoa Americana", "at": "Austria", "au": "Australia", "aw": "Aruba",
    "ax": "Islas Åland", "az": "Azerbaiyán", "ba": "Bosnia y Herzegovina", "bb": "Barbados",
    "bd": "Bangladés", "be": "Bélgica", "bf": "Burkina Faso", "bg": "Bulgaria", "bh": "Baréin",
    "bi": "Burundi", "bj": "Benín", "bl": "San Bartolomé", "bm": "Bermudas", "bn": "Brunéi",
    "bo": "Bolivia", "bq": "Bonaire", "br": "Brasil", "bs": "Bahamas", "bt": "Bután",
    "bv": "Isla Bouvet", "bw": "Botsuana", "by": "Bielorrusia", "bz": "Belice", "ca": "Canadá",
    "cc": "Islas Cocos", "cd": "R. D. del Congo", "cf": "República Centroafricana",
    "cg": "República del Congo", "ch": "Suiza", "ci": "Costa de Marfil", "ck": "Islas Cook",
    "cl": "Chile", "cm": "Camerún", "cn": "China", "co": "Colombia", "cr": "Costa Rica",
    "cu": "Cuba", "cv": "Cabo Verde", "cw": "Curazao", "cx": "Isla de Navidad", "cy": "Chipre",
    "cz": "República Checa", "de": "Alemania", "dj": "Yibuti", "dk": "Dinamarca", "dm": "Dominica",
    "do": "República Dominicana", "dz": "Argelia", "ec": "Ecuador", "ee": "Estonia",
    "eg": "Egipto", "eh": "Sáhara Occidental", "er": "Eritrea", "es": "España", "et": "Etiopía",
    "fi": "Finlandia", "fj": "Fiyi", "fk": "Islas Malvinas", "fm": "Micronesia", "fo": "Islas Feroe",
    "fr": "Francia", "ga": "Gabón", "gb": "Reino Unido", "gb-eng": "Inglaterra",
    "gb-nir": "Irlanda del Norte", "gb-sct": "Escocia", "gb-wls": "Gales", "gd": "Granada",
    "ge": "Georgia", "gf": "Guayana Francesa", "gg": "Guernsey", "gh": "Ghana", "gi": "Gibraltar",
    "gl": "Groenlandia", "gm": "Gambia", "gn": "Guinea", "gp": "Guadalupe", "gq": "Guinea Ecuatorial",
    "gr": "Grecia", "gs": "Georgia del Sur", "gt": "Guatemala", "gu": "Guam", "gw": "Guinea-Bisáu",
    "gy": "Guyana", "hk": "Hong Kong", "hm": "Islas Heard", "hn": "Honduras", "hr": "Croacia",
    "ht": "Haití", "hu": "Hungría", "id": "Indonesia", "ie": "Irlanda", "il": "Israel",
    "im": "Isla de Man", "in": "India", "io": "Territorio Británico", "iq": "Irak", "ir": "Irán",
    "is": "Islandia", "it": "Italia", "je": "Jersey", "jm": "Jamaica", "jo": "Jordania",
    "jp": "Japón", "ke": "Kenia", "kg": "Kirguistán", "kh": "Camboya", "ki": "Kiribati",
    "km": "Comoras", "kn": "San Cristóbal y Nieves", "kp": "Corea del Norte", "kr": "Corea del Sur",
    "kw": "Kuwait", "ky": "Islas Caimán", "kz": "Kazajistán", "la": "Laos", "lb": "Líbano",
    "lc": "Santa Lucía", "li": "Liechtenstein", "lk": "Sri Lanka", "lr": "Liberia", "ls": "Lesoto",
    "lt": "Lituania", "lu": "Luxemburgo", "lv": "Letonia", "ly": "Libia", "ma": "Marruecos",
    "mc": "Mónaco", "md": "Moldavia", "me": "Montenegro", "mf": "San Martín", "mg": "Madagascar",
    "mh": "Islas Marshall", "mk": "Macedonia del Norte", "ml": "Malí", "mm": "Birmania",
    "mn": "Mongolia", "mo": "Macao", "mp": "Islas Marianas", "mq": "Martinica", "mr": "Mauritania",
    "ms": "Montserrat", "mt": "Malta", "mu": "Mauricio", "mv": "Maldivas", "mw": "Malaui",
    "mx": "México", "my": "Malasia", "mz": "Mozambique", "na": "Namibia", "nc": "Nueva Caledonia",
    "ne": "Níger", "nf": "Isla Norfolk", "ng": "Nigeria", "ni": "Nicaragua", "nl": "Países Bajos",
    "no": "Noruega", "np": "Nepal", "nr": "Nauru", "nu": "Niue", "nz": "Nueva Zelanda", "om": "Omán",
    "pa": "Panamá", "pe": "Perú", "pf": "Polinesia Francesa", "pg": "Papúa Nueva Guinea",
    "ph": "Filipinas", "pk": "Pakistán", "pl": "Polonia", "pm": "San Pedro y Miquelón",
    "pn": "Islas Pitcairn", "pr": "Puerto Rico", "ps": "Palestina", "pt": "Portugal", "pw": "Palaos",
    "py": "Paraguay", "qa": "Catar", "re": "Reunión", "ro": "Rumanía", "rs": "Serbia", "ru": "Rusia",
    "rw": "Ruanda", "sa": "Arabia Saudita", "sb": "Islas Salomón", "sc": "Seychelles", "sd": "Sudán",
    "se": "Suecia", "sg": "Singapur", "sh": "Santa Elena", "si": "Eslovenia", "sj": "Svalbard",
    "sk": "Eslovaquia", "sl": "Sierra Leona", "sm": "San Marino", "sn": "Senegal", "so": "Somalia",
    "sr": "Surinam", "ss": "Sudán del Sur", "st": "Santo Tomé y Príncipe", "sv": "El Salvador",
    "sx": "San Martín", "sy": "Siria", "sz": "Suazilandia", "tc": "Islas Turcas y Caicos",
    "td": "Chad", "tf": "Territorios Australes", "tg": "Togo", "th": "Tailandia", "tj": "Tayikistán",
    "tk": "Tokelau", "tl": "Timor Oriental", "tm": "Turkmenistán", "tn": "Túnez", "to": "Tonga",
    "tr": "Turquía", "tt": "Trinidad y Tobago", "tv": "Tuvalu", "tw": "Taiwán", "tz": "Tanzania",
    "ua": "Ucrania", "ug": "Uganda", "um": "Islas Ultramarinas", "us": "Estados Unidos", "uy": "Uruguay",
    "uz": "Uzbekistán", "va": "Ciudad del Vaticano", "vc": "San Vicente", "ve": "Venezuela",
    "vg": "Islas Vírgenes Británicas", "vi": "Islas Vírgenes EE.UU.", "vn": "Vietnam", "vu": "Vanuatu",
    "wf": "Wallis y Futuna", "ws": "Samoa", "xk": "Kosovo", "ye": "Yemen", "yt": "Mayotte",
    "za": "Sudáfrica", "zm": "Zambia", "zw": "Zimbabue"
};

// === GRUPOS DE BANDERAS SIMILARES PARA AUMENTAR DIFICULTAD ===
const similarGroups = [
    // Escandinavas (Cruz Nórdica)
    ["no", "se", "fi", "dk", "is", "fo", "ax"],
    // Tricolor Horizontal Rojo/Blanco/Azul
    ["nl", "lu", "fr", "ru", "py", "hr", "si", "sk", "rs"],
    // Tricolor Vertical Verde/Blanco/Rojo
    ["it", "mx", "ie", "ci", "hu", "bg", "tj"],
    // Gran Colombia (Amarillo/Azul/Rojo)
    ["co", "ec", "ve"],
    // Centroamérica (Azul/Blanco/Azul)
    ["hn", "ni", "sv", "gt", "ar", "uy"],
    // Union Jack y Colonias
    ["gb", "au", "nz", "fj", "tv", "ck", "ms", "ky", "vg", "bm"],
    // Barras y Estrellas
    ["us", "lr", "my", "pr", "cu", "cl"],
    // Colores Panárabes (Rojo/Negro/Blanco/Verde)
    ["ae", "kw", "jo", "ps", "sd", "ye", "sy", "eg", "iq", "ly"],
    // Rojo y Blanco (Círculos/Cruces/Franjas)
    ["jp", "bd", "pl", "id", "mc", "sg", "at", "ch", "dk", "tn", "tr"],
    // Panafricanos (Rojo/Amarillo/Verde)
    ["ml", "gn", "bo", "gh", "sn", "cm", "cg", "et", "bj", "gw"],
    // Azul y Amarillo
    ["ua", "se", "kz", "pw", "bb"],
    // Dragones y escudos complejos
    ["bt", "lk", "es", "pt", "me"]
];

document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS DOM ---
    const startModal = document.getElementById('startModal');
    const nameInput = document.getElementById('nameInput');
    const btnSurvival = document.getElementById('btnSurvival');
    const btnClassic = document.getElementById('btnClassic');
    const showConfigBtn = document.getElementById('showConfigBtn');
    
    const welcomeScreen = document.getElementById('welcomeScreen');
    const gameScreen = document.getElementById('gameScreen');
    const feedbackDisplay = document.getElementById('feedbackDisplay');
    
    const flagImg = document.getElementById('flagImg');
    const optionsContainer = document.getElementById('optionsContainer');
    
    // Stats
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    const currentScoreDisplay = document.getElementById('currentScore');
    const timerDisplay = document.getElementById('timerDisplay');
    const classicStats = document.getElementById('classicStats');
    const wrongCountDisplay = document.getElementById('wrongCount');
    const restartBtn = document.getElementById('restartBtn');
    const rankingList = document.getElementById('rankingList');

    // Game Over Modal
    const gameOverModal = document.getElementById('gameOverModal');
    const gameOverTitle = document.getElementById('gameOverTitle');
    const gameOverMessage = document.getElementById('gameOverMessage');
    const finalScoreDisplay = document.getElementById('finalScore');
    const finalTimeDisplay = document.getElementById('finalTime');
    const playAgainBtn = document.getElementById('playAgainBtn');

    // --- VARIABLES DE ESTADO ---
    let currentPlayer = "";
    let currentMode = ""; 
    let score = 0;
    let wrongAnswers = 0;
    let currentCorrectCode = "";
    let isRoundActive = false;
    
    let availableCountries = []; 
    
    let startTime;
    let timerInterval;
    let elapsedTimeString = "00:00";

    // --- INICIALIZACIÓN ---
    renderRanking(); 

    showConfigBtn.addEventListener('click', () => startModal.style.display = 'flex');
    btnSurvival.addEventListener('click', () => initGame('survival'));
    btnClassic.addEventListener('click', () => initGame('classic'));
    
    restartBtn.addEventListener('click', () => {
        if(confirm("¿Reiniciar partida?")) {
            stopTimer();
            startModal.style.display = 'flex';
            gameScreen.classList.add('hidden');
        }
    });

    playAgainBtn.addEventListener('click', () => {
        gameOverModal.style.display = 'none';
        initGame(currentMode); 
    });

    // --- FUNCIONES DEL JUEGO ---

    function initGame(mode) {
        const name = nameInput.value.trim();
        if (!name) {
            alert("¡Escribe tu nombre!");
            return;
        }

        currentPlayer = name;
        currentMode = mode;
        score = 0;
        wrongAnswers = 0;
        elapsedTimeString = "00:00";

        // Llenar bolsa de países
        availableCountries = Object.keys(countryData);

        // Reset UI
        playerNameDisplay.textContent = currentPlayer;
        currentScoreDisplay.textContent = '0';
        timerDisplay.textContent = "00:00";
        feedbackDisplay.textContent = "";
        feedbackDisplay.className = "";
        
        if (mode === 'classic') {
            classicStats.classList.remove('hidden');
            wrongCountDisplay.textContent = '0';
        } else {
            classicStats.classList.add('hidden');
        }

        startModal.style.display = 'none';
        welcomeScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');

        startTimer();
        newRound();
    }

    // --- LÓGICA DEL CRONÓMETRO ---
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        startTime = Date.now();
        
        timerInterval = setInterval(() => {
            const now = Date.now();
            const diff = Math.floor((now - startTime) / 1000);
            
            const minutes = Math.floor(diff / 60);
            const seconds = diff % 60;
            
            elapsedTimeString = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            timerDisplay.textContent = elapsedTimeString;
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) clearInterval(timerInterval);
    }

    function newRound() {
        if (availableCountries.length === 0) {
            finishGame(true);
            return;
        }

        isRoundActive = true;
        optionsContainer.innerHTML = '';
        
        // 1. Elegir país correcto y eliminarlo de disponibles
        const randomIndex = Math.floor(Math.random() * availableCountries.length);
        currentCorrectCode = availableCountries[randomIndex];
        availableCountries.splice(randomIndex, 1);

        // 2. BUSCAR DISTRACTORES INTELIGENTES (SIMILARES)
        let potentialDistractors = [];
        
        // Buscar si el país actual está en algún grupo de similitud
        for (const group of similarGroups) {
            if (group.includes(currentCorrectCode)) {
                // Copiamos el grupo entero como candidatos
                potentialDistractors = [...group];
                break; // Solo necesitamos un grupo
            }
        }

        // Filtramos para que la respuesta correcta no esté en los distractores
        potentialDistractors = potentialDistractors.filter(c => c !== currentCorrectCode);

        // 3. LLENAR OPCIONES
        let options = [currentCorrectCode];
        const allCodes = Object.keys(countryData);

        // Primero intentamos llenar con banderas parecidas
        while (options.length < 4 && potentialDistractors.length > 0) {
            const randIdx = Math.floor(Math.random() * potentialDistractors.length);
            const similarCode = potentialDistractors[randIdx];
            
            // Verificamos que exista en countryData (por seguridad) y no esté ya
            if (countryData[similarCode] && !options.includes(similarCode)) {
                options.push(similarCode);
            }
            // Quitamos de potenciales para no repetir intento
            potentialDistractors.splice(randIdx, 1);
        }

        // Si faltan huecos (porque el grupo era pequeño o no había grupo), rellenamos con aleatorios
        while (options.length < 4) {
            const randomCode = allCodes[Math.floor(Math.random() * allCodes.length)];
            if (!options.includes(randomCode)) options.push(randomCode);
        }
        
        // Barajar opciones
        options.sort(() => Math.random() - 0.5);

        // Render
        flagImg.src = `img/${currentCorrectCode}.png`;
        
        options.forEach(code => {
            const btn = document.createElement('button');
            btn.className = 'btn option-btn btn-primary'; 
            btn.textContent = countryData[code];
            btn.onclick = () => checkAnswer(code, btn);
            optionsContainer.appendChild(btn);
        });
    }

    function checkAnswer(selectedCode, btnElement) {
        if (!isRoundActive) return;

        const isCorrect = selectedCode === currentCorrectCode;
        
        if (isCorrect) {
            btnElement.classList.add('btn-correct');
            score++;
            currentScoreDisplay.textContent = score;
            
            feedbackDisplay.textContent = "¡ACERTASTE! 🎉";
            feedbackDisplay.className = "msg-success";

            isRoundActive = false;
            setTimeout(() => {
                feedbackDisplay.textContent = ""; 
                newRound();
            }, 1000);

        } else {
            btnElement.classList.add('btn-wrong');
            
            const allButtons = optionsContainer.querySelectorAll('button');
            allButtons.forEach(b => {
                if (b.innerText === countryData[currentCorrectCode]) b.classList.add('btn-correct');
            });

            if (currentMode === 'survival') {
                isRoundActive = false;
                stopTimer();
                feedbackDisplay.textContent = "¡FALLASTE! 💀";
                feedbackDisplay.className = "msg-error";
                setTimeout(() => finishGame(false), 1500);
            } else {
                wrongAnswers++;
                wrongCountDisplay.textContent = wrongAnswers;
                feedbackDisplay.textContent = "¡FALLASTE!";
                feedbackDisplay.className = "msg-error";
                isRoundActive = false;
                setTimeout(() => {
                    feedbackDisplay.textContent = "";
                    newRound();
                }, 1500);
            }
        }
    }

    function finishGame(isVictory) {
        stopTimer();

        if (isVictory) {
            gameOverTitle.textContent = "¡JUEGO COMPLETADO! 🏆";
            gameOverTitle.style.color = "#28a745";
            gameOverMessage.innerHTML = "¡Increíble! Has acertado todas las banderas.";
            if (currentMode === 'survival') saveScore(currentPlayer, score, elapsedTimeString);
        } else {
            gameOverTitle.textContent = "¡JUEGO TERMINADO!";
            gameOverTitle.style.color = "#ff4b2b";
            gameOverMessage.innerHTML = `La bandera era: <strong>${countryData[currentCorrectCode]}</strong>`;
            if (currentMode === 'survival') saveScore(currentPlayer, score, elapsedTimeString);
        }
        
        finalScoreDisplay.textContent = score;
        finalTimeDisplay.textContent = elapsedTimeString;
        gameOverModal.style.display = 'flex';
    }

    // --- API RANKING ---
    function saveScore(name, points, timeStr) {
        const newScore = { 
            name: name, 
            points: points, 
            time: timeStr,
            date: new Date().toLocaleDateString() 
        };

        fetch('/api/ranking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newScore)
        })
        .then(res => res.json())
        .then(data => renderRanking(data))
        .catch(err => console.error(err));
    }

    function renderRanking(rankingData = null) {
        if (rankingData) {
            updateRankingUI(rankingData);
        } else {
            fetch('/api/ranking')
                .then(res => res.json())
                .then(data => updateRankingUI(data))
                .catch(err => console.error(err));
        }
    }

    function updateRankingUI(ranking) {
        rankingList.innerHTML = '';
        if (!ranking || ranking.length === 0) {
            rankingList.innerHTML = '<li style="padding:10px; color:#777;">Sin récords aún.</li>';
            return;
        }

        ranking.forEach((entry, index) => {
            const li = document.createElement('li');
            li.className = 'ranking-item';
            if (index === 0) li.classList.add('gold'); 
            
            li.innerHTML = `
                <span>${index + 1}. <strong>${entry.name}</strong></span>
                <span>
                    <span class="score">${entry.points} pts</span>
                    <span class="time-badge">⏱ ${entry.time || '??:??'}</span>
                </span>
            `;
            rankingList.appendChild(li);
        });
    }
});