import { registerEffect, Config, MouseInput } from '../core.js';

// --- ESTADO PERSISTENTE ---
let decayMatrix = []; 
let particles = []; // Almacena las partículas de las explosiones

// Variables para el modo "Screensaver" (Rebote)
let idleFrames = 0;
const IDLE_THRESHOLD = 120; 
let lastMouseC = -1;
let lastMouseR = -1;

// Objeto que rebota (Bouncer)
let bouncer = {
    x: 16, y: 16,
    vx: 0.2, vy: 0.15, // Velocidad baja
    color: 'on'
};

// Configuración
const DECAY_RATE = 0.02; // Decaimiento lento solicitado
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

// Listener de Clic Derecho (Explosión Manual)
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (localMouse.c >= 0 && localMouse.r >= 0) {
        // Generar explosión pequeña en el cursor (Blanco y System)
        spawnExplosion(localMouse.c, localMouse.r, ['on', 'system'], 8);
    }
});

// Función para crear partículas
function spawnExplosion(x, y, colors, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.4 + 0.1; // Velocidad suave
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1.0,
            decay: 0.03 + Math.random() * 0.03
        });
    }
}

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
    } else {
        idleFrames++;
    }

    let sourceX = -1;
    let sourceY = -1;
    let useSource = false;
    let currentBrightness = INITIAL_BRIGHTNESS;

    // 3. LÓGICA DE MOVIMIENTO
    // Si hay actividad reciente Y el mouse está en una posición válida
    if (idleFrames < IDLE_THRESHOLD && mouseC >= 0 && mouseR >= 0) {
        // MODO INTERACTIVO (Rastro del Mouse ACTIVO)
        sourceX = mouseC;
        sourceY = mouseR;
        useSource = true;
        currentBrightness = 1.5; 
        
        // ** CAMBIO CLAVE **: Sincronizar el bouncer con el mouse mientras se mueve
        // Así, cuando se suelte, continuará desde esta posición exacta.
        bouncer.x = mouseC;
        bouncer.y = mouseR;

    } else {
        // MODO REBOTE (SCREENSAVER)
        // La bola continúa desde donde se quedó (o desde el mouse si acabamos de soltarlo)
        bouncer.x += bouncer.vx;
        bouncer.y += bouncer.vy;

        // Márgenes para modos anchos/altos
        let marginX = 0;
        let marginY = 0;
        if (COLS >= 64) marginX = 4;
        if (ROWS >= 64) marginY = 4;

        let collided = false;

        // Rebotes con detección de colisión
        if (bouncer.x <= marginX) { 
            bouncer.x = marginX; 
            bouncer.vx = Math.abs(bouncer.vx); 
            collided = true; 
        } else if (bouncer.x >= (COLS - 1 - marginX)) { 
            bouncer.x = (COLS - 1 - marginX); 
            bouncer.vx = -Math.abs(bouncer.vx); 
            collided = true; 
        }

        if (bouncer.y <= marginY) { 
            bouncer.y = marginY; 
            bouncer.vy = Math.abs(bouncer.vy); 
            collided = true; 
        } else if (bouncer.y >= (ROWS - 1 - marginY)) { 
            bouncer.y = (ROWS - 1 - marginY); 
            bouncer.vy = -Math.abs(bouncer.vy); 
            collided = true; 
        }

        // Generar explosión al chocar (Rojo y System)
        if (collided) {
            spawnExplosion(bouncer.x, bouncer.y, ['red', 'system'], 10);
        }

        sourceX = bouncer.x;
        sourceY = bouncer.y;
        useSource = true;

        // Efecto de respiración para el brillo del bouncer
        const breathSpeed = 0.02;
        const breath = (Math.sin(frameCount * breathSpeed) + 1) / 2; 
        currentBrightness = 0.7 + (breath * 0.6); 
    }

    // 4. INYECTAR ENERGÍA (DIBUJAR EL RASTRO)
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

    // 5. ACTUALIZAR Y DIBUJAR PARTÍCULAS
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            const px = Math.floor(p.x);
            const py = Math.floor(p.y);
            // Dibujar partícula directamente en la matriz si está visible
            if (px >= 0 && px < COLS && py >= 0 && py < ROWS) {
                // Parpadeo final para partículas a punto de morir
                if (p.life > 0.2 || Math.random() > 0.5) {
                    matrix[py][px] = p.color;
                }
            }
        }
    }

    // 6. RENDERIZADO DE ESTELAS (DECAY MATRIX)
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let val = decayMatrix[r][c];
            
            if (val > 0) {
                val -= DECAY_RATE;
                if (val < 0) val = 0;
                decayMatrix[r][c] = val;
            }

            // Solo dibujamos si NO hay una partícula ya dibujada (priorizamos partículas)
            // Verificamos si la celda es NOISE (fondo) o si fue pintada por una partícula
            const currentColor = matrix[r][c];
            const isParticle = currentColor !== NOISE_CLASS;

            // Si no hay partícula, dibujamos el rastro
            if (!isParticle) {
                if (val > 0.6) {
                    matrix[r][c] = ON_COLOR_CLASS;
                } else if (val > 0.2) {
                    matrix[r][c] = 'system';
                } else {
                    matrix[r][c] = NOISE_CLASS;
                }
            }
        }
    }

    return matrix;
}

registerEffect('led_tracker', led_tracker);