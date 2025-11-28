// js/core.js - Motor Central Optimizado (v8.0)

// --- CONFIGURACIÓN DE RENDIMIENTO ---
const TARGET_FPS = 30; // Limitamos a 30 FPS para ahorrar recursos
const FRAME_INTERVAL = 1000 / TARGET_FPS;
let lastTime = 0;

// --- DIMENSIONES VISUALES Y LÓGICAS ---
export let COLS = 32;
export let ROWS = 32;

let LOGICAL_COLS = 32;
let LOGICAL_ROWS = 32;
let OFFSET_X = 0;
let OFFSET_Y = 0;

const NOISE_CLASS = 'bg-noise';
const ON_COLOR_CLASS = 'on';

// --- VARIABLES DE OPTIMIZACIÓN (CACHE) ---
let pixelDOMCache = [];     // Referencias directas a los DIVs
let logicalGridBuffer = []; // Matriz reutilizable en memoria
let cachedGridRect = null;  // Posición del grid para el mouse
let animationFrameCount = 0;

// --- GESTIÓN DE EFECTOS (DESACOPLADO) ---
export const EFFECTS = {};
const EFFECTS_LIST = [];
let currentEffectName = null;

// --- RECURSOS COMPARTIDOS (SHARED) ---
// Para evitar duplicación de lógica y memoria en los efectos
export const Shared = {
    // Generador de números aleatorios (placeholder por si queremos algo determinista luego)
    random: Math.random,
    // Utilidad para ruido
    noise: (x, y) => Math.random(),
    // Referencia al tiempo global
    time: 0,
    // Buffer auxiliar para efectos que necesiten doble buffer
    tempBuffer: [],
    // Paleta de colores común
    Colors: {
        OFF: NOISE_CLASS,
        ON: ON_COLOR_CLASS,
        RED: 'red',
        ORANGE: 'orange',
        YELLOW: 'yellow',
        GREEN: 'green',
        BLUE: 'blue',
        PURPLE: 'purple',
        SYSTEM: 'system'
    }
};

// --- INPUTS ---
const KEY_QUEUE = [];
const MAX_KEY_HISTORY = 300;
let mousePosition = { c: -1, r: -1 };

// --- CONFIGURACIÓN DE INTERACCIÓN ---
const LONG_PRESS_DURATION = 800;
let isLongPress = false;
let pressTimer = null;


// ==========================================
// 1. SISTEMA DE REGISTRO Y CARGA DE EFECTOS
// ==========================================

export function registerEffect(name, func) {
    if (!EFFECTS[name]) {
        EFFECTS[name] = func;
        EFFECTS_LIST.push(name);
        console.log(`✅ Efecto registrado: ${name}`);

        // Si es el primer efecto registrado, lo activamos automáticamente
        if (!currentEffectName) {
            currentEffectName = name;
        }
    }
}

// Carga dinámica de efectos (Lazy Loading)
export async function loadEffect(path) {
    try {
        await import(path);
        // El efecto se registrará a sí mismo llamando a registerEffect
    } catch (err) {
        console.error(`❌ Error cargando efecto ${path}:`, err);
    }
}

export function switchEffect(effectName) {
    if (EFFECTS[effectName]) {
        currentEffectName = effectName;
        animationFrameCount = 0;
        console.log(`🔀 Cambio forzado a: ${effectName}`);
    } else {
        console.warn(`⚠️ Efecto ${effectName} no encontrado.`);
    }
}

export function cycleEffect() {
    if (EFFECTS_LIST.length === 0) return;
    const currentIndex = EFFECTS_LIST.indexOf(currentEffectName);
    const nextIndex = (currentIndex + 1) % EFFECTS_LIST.length;
    currentEffectName = EFFECTS_LIST[nextIndex];
    animationFrameCount = 0;
    console.log(`⏩ Siguiente efecto: ${currentEffectName}`);
}


// ==========================================
// 2. GESTIÓN DE DIMENSIONES Y MEMORIA
// ==========================================

function initLogicalBuffer() {
    // Creamos la matriz UNA SOLA VEZ
    logicalGridBuffer = new Array(LOGICAL_ROWS);
    Shared.tempBuffer = new Array(LOGICAL_ROWS); // Inicializar buffer compartido

    for (let r = 0; r < LOGICAL_ROWS; r++) {
        logicalGridBuffer[r] = new Array(LOGICAL_COLS).fill(NOISE_CLASS);
        Shared.tempBuffer[r] = new Array(LOGICAL_COLS).fill(NOISE_CLASS);
    }
}

export function detectAndSetDimensions(visualCols, visualRows) {
    // Paridad forzada para centrado perfecto
    if (visualCols % 2 !== 0) visualCols -= 1;

    COLS = visualCols;
    ROWS = visualRows;

    // Lógica de "Resolución Virtual"
    const aspectRatio = COLS / ROWS;
    if (aspectRatio > 1.5) {
        LOGICAL_COLS = 64; LOGICAL_ROWS = 32;
    } else if (aspectRatio < 0.66) {
        LOGICAL_COLS = 32; LOGICAL_ROWS = 64;
    } else {
        LOGICAL_COLS = 32; LOGICAL_ROWS = 32;
    }

    OFFSET_X = Math.floor((COLS - LOGICAL_COLS) / 2);
    OFFSET_Y = Math.floor((ROWS - LOGICAL_ROWS) / 2);

    const grid = document.getElementById('pixel-grid');
    if (grid) {
        document.documentElement.style.setProperty('--grid-cols', COLS);
        document.documentElement.style.setProperty('--grid-rows', ROWS);
        setTimeout(updateGridRect, 100);
    }

    initLogicalBuffer();

    // Reconstruir el DOM solo si cambia el número total de píxeles
    if (grid && (grid.children.length !== (COLS * ROWS) || pixelDOMCache.length === 0)) {
        initializeDisplay();
    }
}


// ==========================================
// 3. EVENTOS (MOUSE / TECLADO)
// ==========================================

function updateGridRect() {
    const grid = document.getElementById('pixel-grid');
    if (grid) cachedGridRect = grid.getBoundingClientRect();
}

function handleMouseMove(e) {
    if (!cachedGridRect) updateGridRect();
    if (!cachedGridRect) return;

    const pixelSizeX = cachedGridRect.width / LOGICAL_COLS;
    const pixelSizeY = cachedGridRect.height / LOGICAL_ROWS;

    // Usamos clientX/Y relativo al cachedRect para máxima velocidad
    const rawC = (e.clientX - cachedGridRect.left) / pixelSizeX;
    const rawR = (e.clientY - cachedGridRect.top) / pixelSizeY;

    mousePosition.c = Math.min(LOGICAL_COLS - 1, Math.max(0, Math.floor(rawC)));
    mousePosition.r = Math.min(LOGICAL_ROWS - 1, Math.max(0, Math.floor(rawR)));
}

function handleKeyDown(e) {
    if (e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
    KEY_QUEUE.push({ key: e.key.toUpperCase(), timestamp: Date.now() });
    if (KEY_QUEUE.length > MAX_KEY_HISTORY) KEY_QUEUE.shift();
}

// Fullscreen y Click
function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
    setTimeout(updateGridRect, 500);
}

function startPress(e) {
    if (e.type === 'mousedown' && e.button !== 0) return;
    isLongPress = false;
    pressTimer = setTimeout(() => {
        isLongPress = true;
        toggleFullscreen();
        if (navigator.vibrate) navigator.vibrate(50);
    }, LONG_PRESS_DURATION);
}
function cancelPress() { clearTimeout(pressTimer); }
function handleClick(e) {
    if (isLongPress) {
        e.stopImmediatePropagation();
        e.preventDefault();
        isLongPress = false;
    } else {
        cycleEffect();
    }
}


// ==========================================
// 4. INICIALIZACIÓN Y BUCLE PRINCIPAL
// ==========================================

export function initializeDisplay() {
    const gridContainer = document.getElementById('pixel-grid');
    const wrapper = document.querySelector('.display-wrapper');

    if (!gridContainer || !wrapper) return;

    gridContainer.innerHTML = '';
    pixelDOMCache = [];

    // Generación del DOM + Caché
    for (let i = 0; i < COLS * ROWS; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        // id opcional, mantenemos por si acaso
        pixel.id = `p-${i}`;
        gridContainer.appendChild(pixel);

        pixelDOMCache[i] = { el: pixel, currentClass: null };
    }

    updateGridRect();

    // Event Listeners
    const add = (el, ev, fn, opts) => el.addEventListener(ev, fn, opts);

    // Mouse/Touch
    wrapper.onmousedown = startPress;
    wrapper.onmouseup = cancelPress;
    wrapper.onmouseleave = cancelPress;
    wrapper.ontouchstart = (e) => startPress(e);
    wrapper.ontouchend = cancelPress;
    wrapper.onclick = handleClick;

    // Movimiento eficiente
    add(wrapper, 'mousemove', handleMouseMove);
    add(wrapper, 'touchmove', (e) => {
        if (e.touches[0]) handleMouseMove(e.touches[0]); cancelPress();
    }, { passive: true });

    document.onkeydown = handleKeyDown;
    window.onresize = updateGridRect;
    window.onscroll = updateGridRect;

    if (!window.animationFrameId) {
        window.animationFrameId = requestAnimationFrame(mainLoop);
    }
}

function mainLoop(currentTime) {
    window.animationFrameId = requestAnimationFrame(mainLoop);

    // --- CONTROL DE FPS ---
    const deltaTime = currentTime - lastTime;
    if (deltaTime < FRAME_INTERVAL) return; // Saltamos este frame si vamos muy rápido
    lastTime = currentTime - (deltaTime % FRAME_INTERVAL);

    Shared.time = currentTime; // Actualizar tiempo compartido

    if (EFFECTS_LIST.length === 0 || !currentEffectName) return;

    // 1. Limpieza de Buffer (Sin borrar memoria)
    for (let r = 0; r < LOGICAL_ROWS; r++) {
        for (let c = 0; c < LOGICAL_COLS; c++) {
            logicalGridBuffer[r][c] = NOISE_CLASS;
        }
    }

    // 2. Ejecución Segura del Efecto
    let dataToRender = logicalGridBuffer;
    if (EFFECTS[currentEffectName]) {
        try {
            Config.COLS = LOGICAL_COLS;
            Config.ROWS = LOGICAL_ROWS;

            // Pasamos Shared como tercer argumento
            const result = EFFECTS[currentEffectName](logicalGridBuffer, animationFrameCount, Shared);
            if (result) dataToRender = result;
        } catch (err) {
            console.error(`Error crítico en efecto ${currentEffectName}:`, err);
            // Opcional: Desactivar efecto fallido
        }
    }

    // 3. Renderizado al DOM
    applyVisualMapping(dataToRender);
    animationFrameCount++;
}


// ==========================================
// 5. RENDERIZADO (CACHE + DIRTY CHECKING)
// ==========================================

function applyVisualMapping(logicalData) {
    for (let r = 0; r < ROWS; r++) {
        const logicalR = r - OFFSET_Y;
        const isRowValid = (logicalR >= 0 && logicalR < LOGICAL_ROWS);

        for (let c = 0; c < COLS; c++) {
            const visualIndex = r * COLS + c;
            const pixelObj = pixelDOMCache[visualIndex];

            if (!pixelObj) continue;

            let targetClass = '';
            const logicalC = c - OFFSET_X;

            // Mapeo
            if (isRowValid && logicalC >= 0 && logicalC < LOGICAL_COLS) {
                const val = logicalData[logicalR][logicalC];
                if (val && val !== 0) targetClass = val;
            }

            // Dirty Checking: Solo tocamos el DOM si cambia
            if (pixelObj.currentClass !== targetClass) {
                pixelObj.el.className = targetClass ? `pixel ${targetClass}` : 'pixel';
                pixelObj.currentClass = targetClass;
            }
        }
    }
}

// --- EXPORTS ---
export const Config = { COLS: LOGICAL_COLS, ROWS: LOGICAL_ROWS, NOISE_CLASS, ON_COLOR_CLASS };
export const KeyInput = { KEY_QUEUE };
export const MouseInput = { position: mousePosition };