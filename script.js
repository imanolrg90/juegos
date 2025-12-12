// --- VARIABLES GLOBALES ---
let numerosSacados = [];
let modoManualActivo = false;
let juegoPausado = false; // Útil si usas reproducción automática

// Al cargar la página, generamos el tablero vacío
document.addEventListener('DOMContentLoaded', () => {
    generarTablero();
});

// --- FUNCIONES DEL TABLERO ---

function generarTablero() {
    const tablero = document.getElementById('tablero');
    tablero.innerHTML = ''; // Limpiar tablero previo

    for (let i = 1; i <= 90; i++) {
        const celda = document.createElement('div');
        celda.className = 'board-cell';
        celda.innerText = i;
        celda.id = `celda-${i}`;

        // ASIGNAMOS EL EVENTO DE CLIC A CADA CELDA
        // Esto permite que el Modo Manual funcione
        celda.onclick = function() {
            manejarClickCelda(i, celda);
        };

        tablero.appendChild(celda);
    }
}

// --- LOGICA DEL MODO MANUAL ---

function toggleModoManual() {
    modoManualActivo = !modoManualActivo;
    
    const btn = document.getElementById('btn-manual');
    const celdas = document.querySelectorAll('.board-cell');

    if (modoManualActivo) {
        // ACTIVAR
        btn.innerHTML = "🖐 Desactivar Manual";
        btn.classList.add('manual-active'); // Clase definida en CSS
        
        // Añadir indicador visual a las celdas
        celdas.forEach(c => c.classList.add('manual-mode-cursor'));
        
    } else {
        // DESACTIVAR
        btn.innerHTML = "🖐 Modo Manual";
        btn.classList.remove('manual-active');
        
        // Quitar indicador visual
        celdas.forEach(c => c.classList.remove('manual-mode-cursor'));
    }
}

function manejarClickCelda(numero, elementoDiv) {
    // Si NO está activo el modo manual, ignoramos el clic
    if (!modoManualActivo) return;

    // Verificamos si el número ya estaba marcado
    const index = numerosSacados.indexOf(numero);

    if (index > -1) {
        // --- CASO 1: YA ESTABA MARCADO -> DESMARCAR (Corregir error) ---
        numerosSacados.splice(index, 1); // Borrar del array
        elementoDiv.classList.remove('active'); // Quitar color
        actualizarBolaPrincipal("-"); // Limpiar bola grande
        console.log(`Manual: Número ${numero} desmarcado.`);
    } else {
        // --- CASO 2: NO ESTABA MARCADO -> MARCAR ---
        numerosSacados.push(numero); // Añadir al array
        elementoDiv.classList.add('active'); // Poner color
        actualizarBolaPrincipal(numero); // Mostrar en bola grande
        console.log(`Manual: Número ${numero} marcado.`);
    }
}

// --- LOGICA DEL JUEGO AUTOMÁTICO ---

function sacarBola() {
    // Si estamos en modo manual, avisamos o bloqueamos (opcional)
    if (modoManualActivo) {
        alert("Desactiva el Modo Manual para sacar bolas automáticamente.");
        return;
    }

    if (numerosSacados.length >= 90) {
        alert("¡Se han sacado todos los números!");
        return;
    }

    let numero;
    let repetido = true;

    // Buscar un número que no haya salido (ni automática ni manualmente)
    while (repetido) {
        numero = Math.floor(Math.random() * 90) + 1;
        if (!numerosSacados.includes(numero)) {
            repetido = false;
        }
    }

    // Registrar y marcar
    numerosSacados.push(numero);
    marcarEnTablero(numero);
    actualizarBolaPrincipal(numero);
}

function marcarEnTablero(numero) {
    const celda = document.getElementById(`celda-${numero}`);
    if (celda) {
        celda.classList.add('active');
    }
}

function reiniciarJuego() {
    if(!confirm("¿Seguro que quieres reiniciar la partida?")) return;

    numerosSacados = [];
    actualizarBolaPrincipal("-");
    
    // Limpiar clases visuales
    const celdas = document.querySelectorAll('.board-cell');
    celdas.forEach(c => c.classList.remove('active'));
    
    // Si estaba en modo manual, lo reseteamos o lo dejamos (a tu gusto)
    if(modoManualActivo) toggleModoManual();
}

// --- UTILIDADES ---

function actualizarBolaPrincipal(texto) {
    // Asegúrate de tener un div con id="bola-actual" en tu HTML
    const bola = document.getElementById('bola-actual');
    if(bola) bola.innerText = texto;
}