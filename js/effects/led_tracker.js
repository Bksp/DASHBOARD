import { registerEffect, Config, MouseInput } from '../core.js';

// --- ESTADO PERSISTENTE ---
let decayMatrix = []; 

// Variables para el modo "Screensaver" (Rebote)
let idleFrames = 0;
const IDLE_THRESHOLD = 120; 
let lastMouseC = -1;
let lastMouseR = -1;

// Objeto que rebota (Bouncer)
let bouncer = {
    x: 16, y: 16,
    vx: 0.2, vy: 0.15, // <--- VELOCIDAD REDUCIDA (Antes 0.4, 0.3)
    color: 'on',
    pulsePhase: 0 
};

// Ondas de click
let clickWaves = []; 

// Configuración
const DECAY_RATE = 0.02; 
const INITIAL_BRIGHTNESS = 1.0; 
const BRUSH_RADIUS = 1; 

// --- GESTIÓN LOCAL DEL MOUSE (1:1 DETECTION) ---
let localMouse = { c: -1, r: -1 };

function updateLocalMouse(clientX, clientY) {
    const gridElement = document.getElementById('pixel-grid');
    if (!gridElement) return;

    const rect = gridElement.getBoundingClientRect();
    
    const style = getComputedStyle(document.documentElement);
    const visualCols = parseInt(style.getPropertyValue('--grid-cols')) || Config.COLS;
    const visualRows = parseInt(style.getPropertyValue('--grid-rows')) || Config.ROWS;

    const pixelSizeX = rect.width / visualCols;
    const pixelSizeY = rect.height / visualRows;

    const rawVisualC = (clientX - rect.left) / pixelSizeX;
    const rawVisualR = (clientY - rect.top) / pixelSizeY;

    const offsetX = Math.floor((visualCols - Config.COLS) / 2);
    const offsetY = Math.floor((visualRows - Config.ROWS) / 2);

    const logicalC = Math.floor(rawVisualC) - offsetX;
    const logicalR = Math.floor(rawVisualR) - offsetY;

    if (logicalC >= 0 && logicalC < Config.COLS) localMouse.c = logicalC;
    else localMouse.c = -1;

    if (logicalR >= 0 && logicalR < Config.ROWS) localMouse.r = logicalR;
    else localMouse.r = -1;
}

document.addEventListener('mousemove', (e) => updateLocalMouse(e.clientX, e.clientY));
document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) updateLocalMouse(e.touches[0].clientX, e.touches[0].clientY);
}, {passive: true});

document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (localMouse.c >= 0 && localMouse.r >= 0) {
        clickWaves.push({
            x: localMouse.c,
            y: localMouse.r,
            radius: 0,
            active: true
        });
    }
});

function led_tracker(matrix, frameCount) {
    const { COLS, ROWS, ON_COLOR_CLASS, NOISE_CLASS } = Config;

    // 1. INICIALIZACIÓN
    if (decayMatrix.length !== ROWS || (decayMatrix[0] && decayMatrix[0].length !== COLS)) {
        decayMatrix = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));
        bouncer.x = COLS / 2;
        bouncer.y = ROWS / 2;
    }

    const mouseC = localMouse.c;
    const mouseR = localMouse.r;

    // 2. DETECCIÓN DE INACTIVIDAD
    if (mouseC !== lastMouseC || mouseR !== lastMouseR) {
        idleFrames = 0;
        lastMouseC = mouseC;
        lastMouseR = mouseR;
        
        if (mouseC >= 0 && mouseR >= 0) {
            bouncer.x = mouseC;
            bouncer.y = mouseR;
        }
    } else {
        idleFrames++;
    }

    let sourceX = -1;
    let sourceY = -1;
    let useSource = false;
    let currentBrightness = INITIAL_BRIGHTNESS;

    if (idleFrames < IDLE_THRESHOLD && mouseC >= 0 && mouseR >= 0) {
        // MODO INTERACTIVO
        sourceX = mouseC;
        sourceY = mouseR;
        useSource = true;
        currentBrightness = 1.0; 
    } else {
        // MODO REBOTE (SCREENSAVER)
        bouncer.x += bouncer.vx;
        bouncer.y += bouncer.vy;

        // --- LÓGICA DE LÍMITES AJUSTADA ---
        let marginX = 0;
        let marginY = 0;

        if (COLS >= 64) marginX = 4;
        if (ROWS >= 64) marginY = 4;

        // Aplicar rebote con los márgenes calculados
        // Límite Izquierdo
        if (bouncer.x <= marginX) {
            bouncer.x = marginX; 
            bouncer.vx = Math.abs(bouncer.vx); 
        }
        // Límite Derecho
        else if (bouncer.x >= (COLS - 1 - marginX)) {
            bouncer.x = (COLS - 1 - marginX);
            bouncer.vx = -Math.abs(bouncer.vx); 
        }

        // Límite Superior
        if (bouncer.y <= marginY) {
            bouncer.y = marginY;
            bouncer.vy = Math.abs(bouncer.vy); 
        }
        // Límite Inferior
        else if (bouncer.y >= (ROWS - 1 - marginY)) {
            bouncer.y = (ROWS - 1 - marginY);
            bouncer.vy = -Math.abs(bouncer.vy); 
        }

        sourceX = bouncer.x;
        sourceY = bouncer.y;
        useSource = true;

        // Respiración (MÁS LENTA)
        const breathSpeed = 0.02; // <--- VELOCIDAD DE RESPIRACIÓN REDUCIDA (Antes 0.05)
        const breath = (Math.sin(frameCount * breathSpeed) + 1) / 2; 
        currentBrightness = 0.4 + (breath * 0.6); 
    }

    // 3. INYECTAR ENERGÍA
    if (useSource) {
        const drawRadius = BRUSH_RADIUS; 
        const iSourceX = Math.floor(sourceX);
        const iSourceY = Math.floor(sourceY);

        for (let r = -drawRadius; r <= drawRadius; r++) {
            for (let c = -drawRadius; c <= drawRadius; c++) {
                const targetR = iSourceY + r;
                const targetC = iSourceX + c;

                if (targetR >= 0 && targetR < ROWS && targetC >= 0 && targetC < COLS) {
                    const dist = Math.sqrt(r*r + c*c);
                    if (dist <= drawRadius + 0.5) {
                        const intensity = currentBrightness * (1 - (dist / (drawRadius + 2)));
                        decayMatrix[targetR][targetC] = Math.max(decayMatrix[targetR][targetC], intensity);
                    }
                }
            }
        }
    }

    // 4. ONDAS DE CLICK
    clickWaves.forEach(wave => {
        if (!wave.active) return;
        
        wave.radius += 2.5; 
        const currentRadius = wave.radius;
        const waveThickness = 1.5;

        const minR = Math.max(0, Math.floor(wave.y - currentRadius - waveThickness));
        const maxR = Math.min(ROWS - 1, Math.ceil(wave.y + currentRadius + waveThickness));
        const minC = Math.max(0, Math.floor(wave.x - currentRadius - waveThickness));
        const maxC = Math.min(COLS - 1, Math.ceil(wave.x + currentRadius + waveThickness));

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                const dist = Math.sqrt((r - wave.y)**2 + (c - wave.x)**2);
                const diff = Math.abs(dist - currentRadius);
                
                if (diff < waveThickness) {
                    decayMatrix[r][c] = Math.max(decayMatrix[r][c], 1.0 - (diff / waveThickness));
                }
            }
        }

        if (wave.radius > Math.max(COLS, ROWS) * 1.5) {
            wave.active = false;
        }
    });
    clickWaves = clickWaves.filter(w => w.active);

    // 5. RENDERIZADO
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let val = decayMatrix[r][c];
            
            if (val > 0) {
                val -= DECAY_RATE;
                if (val < 0) val = 0;
                decayMatrix[r][c] = val;
            }

            if (val > 0.6) {
                matrix[r][c] = ON_COLOR_CLASS;
            } else if (val > 0.2) {
                matrix[r][c] = 'system';
            } else {
                matrix[r][c] = NOISE_CLASS;
            }
        }
    }

    return matrix;
}

registerEffect('led_tracker', led_tracker);