// js/core.js - Motor Central Optimizado (DOM Cache + Memory Buffer)

// --- DIMENSIONES VISUALES Y LÓGICAS ---
export let COLS = 32;       
export let ROWS = 32;       

let LOGICAL_COLS = 32;
let LOGICAL_ROWS = 32;
let OFFSET_X = 0; 
let OFFSET_Y = 0;

const NOISE_CLASS = 'bg-noise'; 
const ON_COLOR_CLASS = 'on';
const BASE_PIXEL_SIZE = 16; 
let animationFrameCount = 0; 

// --- VARIABLES DE OPTIMIZACIÓN (NUEVO) ---
let pixelDOMCache = [];     // Cache de referencias directas a los DIVs
let logicalGridBuffer = []; // Buffer de memoria reutilizable para la lógica
let cachedGridRect = null;  // Cache para posición del grid (Mouse performance)

// --- CONFIGURACIÓN DE INTERACCIÓN ---
const LONG_PRESS_DURATION = 800; 
let isLongPress = false;
let pressTimer = null;

// --- GESTIÓN DE ENTRADA DE TECLADO ---
const KEY_QUEUE = [];
const MAX_KEY_HISTORY = 300; 

// --- GESTIÓN DE ENTRADA DE RATÓN ---
let mousePosition = { c: -1, r: -1 }; 

// Función optimizada para mouse: Usa valores cacheados
function handleMouseMove(e) {
    // Si no hay caché del rectángulo (o cambio el tamaño), salimos o recalculamos
    if (!cachedGridRect) updateGridRect();

    // Usamos las dimensiones cacheadas en lugar de llamar al DOM cada vez
    const pixelSizeX = cachedGridRect.width / LOGICAL_COLS;
    const pixelSizeY = cachedGridRect.height / LOGICAL_ROWS;

    // Calcular posición relativa al cached rect
    const rawC = (e.clientX - cachedGridRect.left) / pixelSizeX;
    const rawR = (e.clientY - cachedGridRect.top) / pixelSizeY;
    
    mousePosition.c = Math.min(LOGICAL_COLS - 1, Math.max(0, Math.floor(rawC)));
    mousePosition.r = Math.min(LOGICAL_ROWS - 1, Math.max(0, Math.floor(rawR)));
}

// Recalcular posición del grid solo en resize/scroll
function updateGridRect() {
    const grid = document.getElementById('pixel-grid');
    if (grid) {
        cachedGridRect = grid.getBoundingClientRect();
    }
}

// --- CAMBIO DE EFECTO ---
export function switchEffect(effectName) {
    if (EFFECTS_NAME_LIST_MASTER.includes(effectName)) {
        currentEffectName = effectName;
        animationFrameCount = 0;
        console.log(`Efecto cambiado forzosamente a: ${effectName}`);
    }
}

// --- LISTA MAESTRA DE EFECTOS ---
const EFFECTS_NAME_LIST_MASTER = [
    'digital_clock',
    'tetris_clock',
    'clock_fireworks',   
    // 'donation_qr',
    'color_plasma', 
    'expanding_circle', 
    'fireworks',
    'key_tester', 
    'led_tracker',
    // 'matrix_rain',
    // 'scrolling_marquee',
    // 'spectrum_analyzer',
    'arkanoid',
    'space_invaders',
];

let currentEffectName = EFFECTS_NAME_LIST_MASTER[0]; 
const EFFECTS_LIST = []; 
export const EFFECTS = {}; 

export function registerEffect(name, func) {
    if (EFFECTS_NAME_LIST_MASTER.includes(name) && !EFFECTS[name]) {
        EFFECTS[name] = func;
        EFFECTS_LIST.push(name);
        console.log(`Efecto registrado: ${name}`);
    }
}

// --- INICIALIZACIÓN DE BUFFER LÓGICO ---
function initLogicalBuffer() {
    // Creamos la matriz una sola vez para evitar Garbage Collection constante
    logicalGridBuffer = new Array(LOGICAL_ROWS);
    for(let r=0; r < LOGICAL_ROWS; r++) {
        logicalGridBuffer[r] = new Array(LOGICAL_COLS).fill(NOISE_CLASS);
    }
}

// --- DETECTAR Y ASIGNAR DIMENSIONES ---
export function detectAndSetDimensions(visualCols, visualRows) {
    if (visualCols % 2 !== 0) {
        visualCols -= 1;
    }

    COLS = visualCols;
    ROWS = visualRows;
    const aspectRatio = COLS / ROWS;
    
    // Ajuste de lógica interna según aspecto
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
        // Recalculamos el rectángulo del grid para el mouse
        setTimeout(updateGridRect, 100); 
    }

    // Reinicializamos buffer lógico
    initLogicalBuffer();

    // Reinicializamos DOM si cambia la cantidad total de píxeles
    if (grid && (grid.children.length !== (COLS * ROWS) || pixelDOMCache.length === 0)) {
        initializeDisplay();
    }
}

// --- PANTALLA COMPLETA ---
function toggleFullscreen() {
    const element = document.documentElement;
    if (!document.fullscreenElement) {
        if (element.requestFullscreen) element.requestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
    // Actualizar rect del mouse después de cambiar pantalla
    setTimeout(updateGridRect, 500);
}

// --- EVENTOS TOUCH/MOUSE ---
function startPress(e) {
    if (e.type === 'mousedown' && e.button !== 0) return;
    isLongPress = false;
    pressTimer = setTimeout(() => {
        isLongPress = true;
        toggleFullscreen();
        if (navigator.vibrate) navigator.vibrate(50);
    }, LONG_PRESS_DURATION);
}

function cancelPress() {
    clearTimeout(pressTimer);
}

function handleClick(e) {
    if (isLongPress) {
        e.stopImmediatePropagation();
        e.preventDefault();
        isLongPress = false;
    } else {
        cycleEffect();
    }
}

function handleKeyDown(e) {
    if (e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return; 
    const key = e.key.toUpperCase();
    KEY_QUEUE.push({ key: key, timestamp: Date.now() });
    if (KEY_QUEUE.length > MAX_KEY_HISTORY) KEY_QUEUE.shift();
}

// --- INICIALIZACIÓN ---
export function initializeDisplay() {
    const gridContainer = document.getElementById('pixel-grid');
    const wrapper = document.querySelector('.display-wrapper'); 
    
    if (!gridContainer || !wrapper) return;
    
    gridContainer.innerHTML = ''; 
    pixelDOMCache = []; // Limpiar caché

    // Crear píxeles y cachearlos
    for (let i = 0; i < COLS * ROWS; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        // El ID ya no es estrictamente necesario para la lógica, pero útil para depurar
        pixel.id = `p-${i}`; 
        gridContainer.appendChild(pixel);
        
        // --- CACHÉ DEL DOM ---
        // Guardamos referencia directa y su estado actual para "Dirty Checking"
        pixelDOMCache[i] = {
            el: pixel,
            currentClass: null 
        };
    }
    
    updateGridRect(); // Cachear posición inicial

    const addEvent = (el, type, handler, options) => {
        el.removeEventListener(type, handler, options);
        el.addEventListener(type, handler, options);
    };

    addEvent(wrapper, 'mousedown', startPress);
    addEvent(wrapper, 'mouseup', cancelPress);
    addEvent(wrapper, 'mouseleave', cancelPress);
    addEvent(wrapper, 'touchstart', startPress, {passive: true});
    addEvent(wrapper, 'touchend', cancelPress);
    addEvent(wrapper, 'touchmove', cancelPress);
    addEvent(wrapper, 'click', handleClick, true);
    addEvent(document, 'keydown', handleKeyDown);

    // Eventos Mouse Optimizado
    addEvent(wrapper, 'mousemove', handleMouseMove);
    addEvent(wrapper, 'touchmove', (e) => { 
        if (e.touches.length > 0) handleMouseMove(e.touches[0]); 
    }, {passive: true});
    
    // Actualizar caché de posición al redimensionar ventana
    window.addEventListener('resize', updateGridRect);
    window.addEventListener('scroll', updateGridRect);

    if (!window.animationFrameId) {
        mainLoop();
    }
}

function cycleEffect() {
    if (EFFECTS_LIST.length === 0) return;
    const currentIndex = EFFECTS_LIST.indexOf(currentEffectName);
    const nextIndex = (currentIndex + 1) % EFFECTS_LIST.length;
    currentEffectName = EFFECTS_LIST[nextIndex];
    animationFrameCount = 0; 
    console.log(`Cambiado a: ${currentEffectName}`);
}

// --- BUCLE PRINCIPAL (OPTIMIZADO) ---
function mainLoop() {
    if (EFFECTS_LIST.length === 0) {
        window.animationFrameId = requestAnimationFrame(mainLoop);
        return; 
    }
    
    // 1. Limpiar buffer lógico (sin crear nuevos arrays)
    for(let r=0; r < LOGICAL_ROWS; r++) {
        for(let c=0; c < LOGICAL_COLS; c++) {
            logicalGridBuffer[r][c] = NOISE_CLASS; 
        }
    }

    let dataToRender = logicalGridBuffer;

    // 2. Ejecutar efecto
    if (EFFECTS[currentEffectName]) {
        Config.COLS = LOGICAL_COLS;
        Config.ROWS = LOGICAL_ROWS;
        
        // Pasamos el buffer existente. 
        // Si el efecto es antiguo y devuelve un array nuevo, capturamos el retorno.
        // Si el efecto es optimizado y modifica in-place, dataToRender será logicalGridBuffer.
        const result = EFFECTS[currentEffectName](logicalGridBuffer, animationFrameCount);
        if (result) dataToRender = result; 
    }

    // 3. Renderizar (Dirty Checking)
    applyVisualMapping(dataToRender);
    
    animationFrameCount++;
    window.animationFrameId = requestAnimationFrame(mainLoop); 
}

// --- RENDERIZADO (SUPER OPTIMIZADO) ---
function applyVisualMapping(logicalData) {
    // Recorremos el caché linealmente (mucho más rápido que bucles anidados + getElementById)
    // Sin embargo, para mapear coordenadas lógicas necesitamos X, Y.
    
    // Iteración eficiente sobre el grid visual
    for (let r = 0; r < ROWS; r++) {
        // Cálculo previo de fila lógica para evitar hacerlo en cada columna
        const logicalR = r - OFFSET_Y;
        const isRowValid = (logicalR >= 0 && logicalR < LOGICAL_ROWS);

        for (let c = 0; c < COLS; c++) {
            const visualIndex = r * COLS + c;
            
            // Protección contra updates durante resize
            if (!pixelDOMCache[visualIndex]) continue; 

            const pixelObj = pixelDOMCache[visualIndex];
            const logicalC = c - OFFSET_X;
            
            let targetClass = ''; // Clase por defecto (vacía/negra)

            // Mapeo Lógico -> Visual
            if (isRowValid && logicalC >= 0 && logicalC < LOGICAL_COLS) {
                const val = logicalData[logicalR][logicalC];
                // Si val es 0 o null, se queda en blanco, si tiene clase, se asigna
                if (val && val !== 0) targetClass = val;
            }

            // --- DIRTY CHECKING ---
            // Solo tocamos el DOM si la clase deseada es diferente a la actual
            if (pixelObj.currentClass !== targetClass) {
                if (targetClass) {
                    pixelObj.el.className = `pixel ${targetClass}`;
                } else {
                    pixelObj.el.className = 'pixel'; // Reset limpio
                }
                pixelObj.currentClass = targetClass;
            }
        }
    }
}

// --- EXPORTAR ---
export const Config = { 
    COLS: LOGICAL_COLS, 
    ROWS: LOGICAL_ROWS, 
    NOISE_CLASS, 
    ON_COLOR_CLASS 
};

export const KeyInput = {
    KEY_QUEUE: KEY_QUEUE
};

export const MouseInput = {
    position: mousePosition
};