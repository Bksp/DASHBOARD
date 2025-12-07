// js/core.js - Motor Central Optimizado (v9.1 - Pong Ready)

// --- CONFIGURACIÓN DE RENDIMIENTO ---
const TARGET_FPS = 30;
const IDLE_FPS = 1;
const IDLE_TIMEOUT = 5000;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const IDLE_FRAME_INTERVAL = 1000 / IDLE_FPS;

let lastTime = 0;
let isIdle = false;
let lastInputTime = Date.now();

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
let pixelDOMCache = [];
let logicalGridBuffer = [];
let cachedGridRect = null;
let animationFrameCount = 0;

// --- GESTIÓN DE EFECTOS ---
export const EFFECTS = {};
const EFFECTS_LIST = [];
let currentEffectName = null;

// --- RECURSOS COMPARTIDOS (SHARED) ---
export const Shared = {
    random: Math.random,
    noise: (x, y) => Math.random(),
    time: 0,
    tempBuffer: [],
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
const KEYS_PRESSED = new Set(); // Estado continuo
const MAX_KEY_HISTORY = 40;
let mousePosition = { c: -1, r: -1 };

// --- CONFIGURACIÓN DE INTERACCIÓN ---
const LONG_PRESS_DURATION = 800;
let isLongPress = false;
let pressTimer = null;


// ==========================================
// 1. SISTEMA DE REGISTRO Y CARGA DE EFECTOS
// ==========================================

export function registerEffect(name, effectModule) {
    if (!EFFECTS[name]) {
        EFFECTS[name] = effectModule;
        EFFECTS_LIST.push(name);
        console.log(`✅ Efecto registrado: ${name}`);

        if (!currentEffectName) {
            switchEffect(name);
        }
    }
}

export async function loadEffect(path) {
    try {
        await import(path);
    } catch (err) {
        console.error(`❌ Error cargando efecto ${path}:`, err);
    }
}

export function switchEffect(effectName) {
    if (!EFFECTS[effectName]) {
        console.warn(`⚠️ Efecto ${effectName} no encontrado.`);
        return;
    }

    // 1. LIMPIEZA DEL EFECTO ANTERIOR (Lifecycle: Unmount)
    if (currentEffectName && EFFECTS[currentEffectName]) {
        const oldEffect = EFFECTS[currentEffectName];
        if (typeof oldEffect === 'object' && oldEffect.unmount) {
            try {
                oldEffect.unmount(Shared);
                console.log(`🧹 Limpiado: ${currentEffectName}`);
            } catch (e) {
                console.error(`Error limpiando ${currentEffectName}:`, e);
            }
        }
    }

    currentEffectName = effectName;
    animationFrameCount = 0;

    // 2. INICIALIZACIÓN DEL NUEVO EFECTO (Lifecycle: Mount)
    const newEffect = EFFECTS[effectName];
    if (typeof newEffect === 'object' && newEffect.mount) {
        try {
            newEffect.mount(Shared);
            console.log(`🚀 Montado: ${effectName}`);
        } catch (e) {
            console.error(`Error montando ${effectName}:`, e);
        }
    }

    console.log(`🔀 Cambio a: ${effectName}`);
    resetIdleTimer();
}

export function cycleEffect() {
    if (EFFECTS_LIST.length === 0) return;
    const currentIndex = EFFECTS_LIST.indexOf(currentEffectName);
    const nextIndex = (currentIndex + 1) % EFFECTS_LIST.length;
    switchEffect(EFFECTS_LIST[nextIndex]);
}


// ==========================================
// 2. GESTIÓN DE DIMENSIONES Y MEMORIA
// ==========================================

function initLogicalBuffer() {
    logicalGridBuffer = new Array(LOGICAL_ROWS);
    Shared.tempBuffer = new Array(LOGICAL_ROWS);

    for (let r = 0; r < LOGICAL_ROWS; r++) {
        logicalGridBuffer[r] = new Array(LOGICAL_COLS).fill(NOISE_CLASS);
        Shared.tempBuffer[r] = new Array(LOGICAL_COLS).fill(NOISE_CLASS);
    }
}

export function detectAndSetDimensions(visualCols, visualRows) {
    if (visualCols % 2 !== 0) visualCols -= 1;

    COLS = visualCols;
    ROWS = visualRows;

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

    if (grid && (grid.children.length !== (COLS * ROWS) || pixelDOMCache.length === 0)) {
        initializeDisplay();
    }
}


// ==========================================
// 3. EVENTOS Y CONTROL DE INACTIVIDAD
// ==========================================

function resetIdleTimer() {
    lastInputTime = Date.now();
    if (isIdle) {
        isIdle = false;
        console.log("⚡ Despertando (Active Mode)");
    }
}

function updateGridRect() {
    const grid = document.getElementById('pixel-grid');
    if (grid) cachedGridRect = grid.getBoundingClientRect();
}

function handleMouseMove(e) {
    resetIdleTimer();
    if (!cachedGridRect) updateGridRect();
    if (!cachedGridRect) return;

    const pixelSizeX = cachedGridRect.width / LOGICAL_COLS;
    const pixelSizeY = cachedGridRect.height / LOGICAL_ROWS;

    const rawC = (e.clientX - cachedGridRect.left) / pixelSizeX;
    const rawR = (e.clientY - cachedGridRect.top) / pixelSizeY;

    mousePosition.c = Math.min(LOGICAL_COLS - 1, Math.max(0, Math.floor(rawC)));
    mousePosition.r = Math.min(LOGICAL_ROWS - 1, Math.max(0, Math.floor(rawR)));
}

function handleKeyDown(e) {
    resetIdleTimer();
    if (e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

    const key = e.key.toUpperCase();
    KEY_QUEUE.push({ key: key, timestamp: Date.now() });
    if (KEY_QUEUE.length > MAX_KEY_HISTORY) KEY_QUEUE.shift();

    KEYS_PRESSED.add(key);
}

function handleKeyUp(e) {
    const key = e.key.toUpperCase();
    KEYS_PRESSED.delete(key);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
    setTimeout(updateGridRect, 500);
}

function startPress(e) {
    resetIdleTimer();
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
    resetIdleTimer();
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

    for (let i = 0; i < COLS * ROWS; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        pixel.id = `p-${i}`;
        gridContainer.appendChild(pixel);

        pixelDOMCache[i] = { el: pixel, currentClass: null };
    }

    updateGridRect();

    const add = (el, ev, fn, opts) => el.addEventListener(ev, fn, opts);

    wrapper.onmousedown = startPress;
    wrapper.onmouseup = cancelPress;
    wrapper.onmouseleave = cancelPress;
    wrapper.ontouchstart = (e) => startPress(e);
    wrapper.ontouchend = cancelPress;
    wrapper.onclick = handleClick;

    add(wrapper, 'mousemove', handleMouseMove);
    add(wrapper, 'touchmove', (e) => {
        if (e.touches[0]) handleMouseMove(e.touches[0]); cancelPress();
    }, { passive: true });

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    window.onresize = updateGridRect;
    window.onscroll = updateGridRect;

    if (!window.animationFrameId) {
        window.animationFrameId = requestAnimationFrame(mainLoop);
    }
}

function mainLoop(currentTime) {
    window.animationFrameId = requestAnimationFrame(mainLoop);

    // --- GESTIÓN DE INACTIVIDAD (IDLE MODE) ---
    if (!isIdle && (currentTime - lastInputTime > IDLE_TIMEOUT)) {
        isIdle = true;
        console.log("💤 Entrando en modo inactivo (Ahorro de energía)");
    }

    // --- CONTROL DE FPS DINÁMICO ---
    const currentInterval = isIdle ? IDLE_FRAME_INTERVAL : FRAME_INTERVAL;
    const deltaTime = currentTime - lastTime;

    if (deltaTime < currentInterval) return;
    lastTime = currentTime - (deltaTime % currentInterval);

    Shared.time = currentTime;

    if (EFFECTS_LIST.length === 0 || !currentEffectName) return;

    // 1. Limpieza de Buffer
    for (let r = 0; r < LOGICAL_ROWS; r++) {
        for (let c = 0; c < LOGICAL_COLS; c++) {
            logicalGridBuffer[r][c] = NOISE_CLASS;
        }
    }

    // 2. Ejecución del Efecto
    let dataToRender = logicalGridBuffer;
    const effectModule = EFFECTS[currentEffectName];

    if (effectModule) {
        try {
            Config.COLS = LOGICAL_COLS;
            Config.ROWS = LOGICAL_ROWS;

            let result;
            if (typeof effectModule === 'function') {
                result = effectModule(logicalGridBuffer, animationFrameCount, Shared);
            } else if (typeof effectModule === 'object' && effectModule.update) {
                result = effectModule.update(logicalGridBuffer, animationFrameCount, Shared);
            }

            if (result) dataToRender = result;
        } catch (err) {
            console.error(`Error crítico en efecto ${currentEffectName}:`, err);
        }
    }

    // 3. Renderizado al DOM
    applyVisualMapping(dataToRender);
    animationFrameCount++;
}

// ==========================================
// 5. RENDERIZADO
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

            if (isRowValid && logicalC >= 0 && logicalC < LOGICAL_COLS) {
                const val = logicalData[logicalR][logicalC];
                if (val && val !== 0) targetClass = val;
            }

            if (pixelObj.currentClass !== targetClass) {
                pixelObj.el.className = targetClass ? `pixel ${targetClass}` : 'pixel';
                pixelObj.currentClass = targetClass;
            }
        }
    }
}

export const Config = { COLS: LOGICAL_COLS, ROWS: LOGICAL_ROWS, NOISE_CLASS, ON_COLOR_CLASS };
export const KeyInput = { KEY_QUEUE, KEYS_PRESSED };
export const MouseInput = { position: mousePosition };