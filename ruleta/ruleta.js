// 1. Declaramos la variable en el ámbito global para que todas las funciones la vean
let savedRoulettes = [];

document.addEventListener('DOMContentLoaded', () => {
    const savedListDiv = document.getElementById('saved-list');
    const nameInput = document.getElementById('roulette-name');
    const valuesInput = document.getElementById('roulette-values');
    const noRepeatCheck = document.getElementById('mode-no-repeat');
    const dashboardGrid = document.getElementById('dashboard-grid');
    const emptyState = document.getElementById('empty-state');

    const COLORS = ["#FF5733", "#33FF57", "#3357FF", "#F033FF", "#FF33A8", "#33FFF5", "#F5FF33", "#FF8C33"];

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();

    function playTickSound() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }

    class RouletteWidget {
        constructor(data, container) {
            this.id = Date.now() + Math.random();
            this.name = data.name;
            this.items = [...data.items];
            this.originalItems = [...data.items];
            this.cycleMode = data.noRepeat || false; 
            this.container = container;
            this.startAngle = 0;
            this.arc = Math.PI * 2 / (this.items.length || 1);
            this.spinTimeout = null;
            this.isSpinning = false;
            this.previousIndex = -1;
            this.createDOM();
            this.draw();
        }

        createDOM() {
            this.element = document.createElement('div');
            this.element.className = 'roulette-widget';
            this.element.innerHTML = `
                <div class="widget-header">
                    <span class="widget-title">${this.name}</span>
                    <div class="header-controls">
                        <div class="items-counter">${this.items.length}/${this.originalItems.length}</div>
                        <button class="btn-close-widget">×</button>
                    </div>
                </div>
                <div class="canvas-wrapper">
                    <div class="widget-pointer"></div>
                    <canvas width="300" height="300"></canvas>
                </div>
                <div class="widget-result"></div>
                <div class="widget-controls">
                    <button class="btn-spin-widget">GIRAR</button>
                    <button class="btn-reset-widget" title="Reiniciar">↺</button>
                </div>
                <div class="widget-footer">
                    <label class="check-label">
                        <input type="checkbox" class="cycle-checkbox" ${this.cycleMode ? 'checked' : ''}> Modo Ciclo
                    </label>
                </div>`;
            this.canvas = this.element.querySelector('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.btnSpin = this.element.querySelector('.btn-spin-widget');
            this.btnClose = this.element.querySelector('.btn-close-widget');
            this.btnReset = this.element.querySelector('.btn-reset-widget');
            this.resultDiv = this.element.querySelector('.widget-result');
            this.checkbox = this.element.querySelector('.cycle-checkbox');
            this.counterDiv = this.element.querySelector('.items-counter');
            this.pointer = this.element.querySelector('.widget-pointer');

            this.btnSpin.onclick = () => this.spin();
            this.btnClose.onclick = () => this.destroy();
            this.btnReset.onclick = () => this.fullReset();
            this.checkbox.onchange = (e) => { this.cycleMode = e.target.checked; };
            this.container.appendChild(this.element);
            if(emptyState) emptyState.style.display = 'none';
        }

        draw() {
            this.counterDiv.textContent = `${this.items.length}/${this.originalItems.length}`;
            const centerX = 150; const centerY = 150; const radius = 135;
            this.ctx.clearRect(0,0,300,300);
            if (this.items.length === 0) {
                this.ctx.beginPath(); this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.fillStyle = "#333"; this.ctx.fill();
                this.drawDecorations(centerX, centerY, radius);
                return;
            }
            this.arc = Math.PI * 2 / this.items.length;
            this.ctx.font = 'bold 14px Outfit';
            for(let i = 0; i < this.items.length; i++) {
                const angle = this.startAngle + i * this.arc;
                this.ctx.fillStyle = COLORS[i % COLORS.length];
                this.ctx.beginPath(); this.ctx.moveTo(centerX, centerY);
                this.ctx.arc(centerX, centerY, radius, angle, angle + this.arc, false);
                this.ctx.lineTo(centerX, centerY); this.ctx.fill(); this.ctx.stroke();
                this.ctx.save(); this.ctx.fillStyle = "white";
                this.ctx.shadowColor = "rgba(0,0,0,0.5)"; this.ctx.shadowBlur = 4;
                this.ctx.translate(centerX + Math.cos(angle + this.arc / 2) * (radius - 40), centerY + Math.sin(angle + this.arc / 2) * (radius - 40));
                this.ctx.rotate(angle + this.arc / 2 + Math.PI);
                const text = this.items[i];
                const displayText = text.length > 12 ? text.substring(0, 12) + '..' : text;
                this.ctx.fillText(displayText, -this.ctx.measureText(displayText).width / 2, 4);
                this.ctx.restore();
            }
            this.drawDecorations(centerX, centerY, radius);
        }

        drawDecorations(centerX, centerY, radius) {
            const grad = this.ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius);
            grad.addColorStop(0, "rgba(0,0,0,0)"); grad.addColorStop(1, "rgba(0,0,0,0.3)");
            this.ctx.fillStyle = grad; this.ctx.beginPath(); this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.lineWidth = 12; this.ctx.strokeStyle = "#444"; 
            this.ctx.beginPath(); this.ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2); this.ctx.stroke();
            for(let i = 0; i < 24; i++) {
                const angle = (Math.PI * 2 / 24) * i;
                const dotX = centerX + (radius + 6) * Math.cos(angle);
                const dotY = centerY + (radius + 6) * Math.sin(angle);
                this.ctx.beginPath(); this.ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
                this.ctx.fillStyle = "#FFD700"; this.ctx.fill();
            }
            this.ctx.beginPath(); this.ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
            this.ctx.fillStyle = "#fff"; this.ctx.fill();
            this.ctx.beginPath(); this.ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
            this.ctx.fillStyle = "#333"; this.ctx.fill();
            this.ctx.fillStyle = "#fff"; this.ctx.font = "10px Arial"; this.ctx.textAlign = "center";
            this.ctx.fillText("PRO", centerX, centerY + 4);
        }

        spin() {
            if (this.isSpinning || this.items.length === 0) return;
            if (audioCtx.state === 'suspended') audioCtx.resume();
            this.isSpinning = true; this.btnSpin.disabled = true;
            this.resultDiv.textContent = ""; this.resultDiv.classList.remove('result-win');
            let spinAngleStart = Math.random() * 30 + 50; 
            let spinTimeTotal = Math.random() * 3000 + 5000;
            let spinTime = 0;
            const rotate = () => {
                spinTime += 30;
                if(spinTime >= spinTimeTotal) { this.stop(); return; }
                const spinAngle = spinAngleStart - this.easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
                this.startAngle += (spinAngle * Math.PI / 180);
                this.draw();
                const degrees = this.startAngle * 180 / Math.PI + 90;
                const arcd = this.arc * 180 / Math.PI;
                const currentIndex = Math.floor((360 - degrees % 360) / arcd);
                if (currentIndex !== this.previousIndex) {
                    playTickSound();
                    this.pointer.classList.remove('tick-animation');
                    void this.pointer.offsetWidth;
                    this.pointer.classList.add('tick-animation');
                    this.previousIndex = currentIndex;
                }
                this.spinTimeout = setTimeout(rotate, 30);
            };
            rotate();
        }

        stop() {
            clearTimeout(this.spinTimeout);
            const degrees = this.startAngle * 180 / Math.PI + 90;
            const arcd = this.arc * 180 / Math.PI;
            const index = Math.floor((360 - degrees % 360) / arcd);
            const winnerText = this.items[index];
            this.resultDiv.textContent = winnerText;
            this.resultDiv.classList.add('result-win');
            this.isSpinning = false; this.btnSpin.disabled = false;
            if (this.cycleMode) {
                setTimeout(() => {
                    this.items.splice(index, 1);
                    if (this.items.length === 0) {
                        this.resultDiv.textContent = "¡Completado!";
                        setTimeout(() => this.fullReset(), 1500);
                    } else { this.draw(); }
                }, 1000);
            }
        }

        fullReset() {
            this.items = [...this.originalItems];
            this.draw();
            this.resultDiv.textContent = "";
            this.resultDiv.classList.remove('result-win');
        }

        destroy() {
            this.element.remove();
            if(dashboardGrid.children.length === 0 && emptyState) emptyState.style.display = 'block';
        }

        easeOut(t, b, c, d) { t /= d; t--; return c * (t*t*t + 1) + b; }
    }

    // --- FUNCIONES DE VENTANA (API PÚBLICA) ---
    window.saveRoulette = async function() {
        const name = nameInput.value.trim();
        const rawValues = valuesInput.value.trim();
        if (!name || !rawValues) return alert("Faltan datos");
        const items = rawValues.split('\n').filter(l => l.trim());
        if (items.length < 2) return alert("Mínimo 2 opciones");

        const newR = { id: Date.now(), name, items, noRepeat: noRepeatCheck.checked };
        savedRoulettes.push(newR);
        
        await syncWithServer();
        nameInput.value = ""; valuesInput.value = "";
        renderSavedList();
    };

    window.deleteSaved = async function(index) {
        if(!confirm("¿Eliminar?")) return;
        savedRoulettes.splice(index, 1);
        await syncWithServer();
        renderSavedList();
    };

    window.addToDashboard = function(index) {
        new RouletteWidget(savedRoulettes[index], dashboardGrid);
    };

    window.clearDashboard = function() {
        dashboardGrid.innerHTML = ''; 
        if(emptyState) emptyState.style.display = 'block';
    };

    // Declaramos renderSavedList como función accesible
    window.renderSavedList = function() {
        savedListDiv.innerHTML = '';
        savedRoulettes.forEach((r, i) => {
            const div = document.createElement('div');
            div.className = 'saved-item';
            div.innerHTML = `<span onclick="addToDashboard(${i})">${r.name}</span><button onclick="deleteSaved(${i})" class="btn-delete-saved">×</button>`;
            savedListDiv.appendChild(div);
        });
    }

    // Iniciamos la carga
    init();
});

// --- FUNCIONES DE COMUNICACIÓN (FUERA DEL DOMCONTENTLOADED) ---
async function init() {
    try {
        const response = await fetch('/api/ruletas'); 
        if (response.ok) {
            savedRoulettes = await response.json();
            // Llamamos a la función global para pintar la lista
            if (window.renderSavedList) window.renderSavedList();
        }
    } catch (e) {
        console.error("Error cargando ruletas desde la API:", e);
    }
}

async function syncWithServer() {
    try {
        const res = await fetch('/api/ruletas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(savedRoulettes)
        });
        
        if (!res.ok) throw new Error("Error en el servidor");
        console.log("Sincronizado correctamente.");
    } catch (err) {
        console.error("Fallo al guardar:", err);
        alert("No se pudo guardar la ruleta en el servidor.");
    }
}