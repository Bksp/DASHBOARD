// js/core.js - Motor Central (FULL SCREEN & EFECTOS)

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

// --- CONFIGURACIÓN DE INTERACCIÓN ---
const LONG_PRESS_DURATION = 800; // ms para activar fullscreen
let isLongPress = false;
let pressTimer = null;

// --- LISTA MAESTRA DE EFECTOS ---
const EFFECTS_NAME_LIST_MASTER = [
    'digital_clock',      
    'static_noise', 
    'matrix_rain', 
    'oscillating_line',
    'color_plasma', 
    'expanding_circle', 
    'pixel_rain',
    'spectrum_analyzer',
    'scrolling_marquee'
];

let currentEffectName = EFFECTS_NAME_LIST_MASTER[0]; 
const EFFECTS_LIST = []; 
export const EFFECTS = {}; 

// --- FUNCIÓN DE REGISTRO ---
export function registerEffect(name, func) {
    if (EFFECTS_NAME_LIST_MASTER.includes(name) && !EFFECTS[name]) {
        EFFECTS[name] = func;
        EFFECTS_LIST.push(name);
        console.log(`Efecto registrado: ${name}`);
    }
}

// --- FUNCIÓN PRINCIPAL: DETECTAR Y ASIGNAR DIMENSIONES ---
export function detectAndSetDimensions(visualCols, visualRows) {
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
    if (grid && grid.children.length !== (COLS * ROWS)) {
        initializeDisplay();
    }
}

// --- FUNCIÓN DE PANTALLA COMPLETA ---
function toggleFullscreen() {
    const element = document.documentElement;
    
    if (!document.fullscreenElement && 
        !document.mozFullScreenElement && 
        !document.webkitFullscreenElement && 
        !document.msFullscreenElement) 
    {
        if (element.requestFullscreen) element.requestFullscreen();
        else if (element.mozRequestFullScreen) element.mozRequestFullScreen();
        else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        else if (element.msRequestFullscreen) element.msRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
}

// --- MANEJADORES DE EVENTOS ---
function startPress(e) {
    // Solo botón izquierdo o toque
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
        // Si fue long press, detenemos la propagación para no cambiar efecto
        e.stopImmediatePropagation();
        e.preventDefault();
        isLongPress = false;
    } else {
        // Si fue click corto, cambiamos efecto
        cycleEffect();
    }
}

// --- FUNCIÓN DE INICIALIZACIÓN: CREAR DIVS E INTERACCIÓN ---
export function initializeDisplay() {
    const gridContainer = document.getElementById('pixel-grid');
    const wrapper = document.querySelector('.display-wrapper'); // Usamos el wrapper para eventos
    
    if (!gridContainer || !wrapper) return;
    
    gridContainer.innerHTML = ''; 

    // Crear Píxeles
    for (let i = 0; i < COLS * ROWS; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        pixel.id = `p-${i}`; 
        gridContainer.appendChild(pixel);
    }
    
    // --- GESTIÓN DE EVENTOS (Limpiar anteriores y añadir nuevos) ---
    // Usamos una función auxiliar para remover y añadir limpiamente
    const addEvent = (el, type, handler, options) => {
        el.removeEventListener(type, handler, options);
        el.addEventListener(type, handler, options);
    };

    // Mouse
    addEvent(wrapper, 'mousedown', startPress);
    addEvent(wrapper, 'mouseup', cancelPress);
    addEvent(wrapper, 'mouseleave', cancelPress);

    // Touch
    addEvent(wrapper, 'touchstart', startPress, {passive: true});
    addEvent(wrapper, 'touchend', cancelPress);
    addEvent(wrapper, 'touchmove', cancelPress);

    // Click (Fase de captura para interceptar)
    addEvent(wrapper, 'click', handleClick, true);

    // Iniciar bucle
    if (!window.animationFrameId) {
        mainLoop();
    }
}

// --- CAMBIO DE EFECTO ---
function cycleEffect() {
    if (EFFECTS_LIST.length === 0) return;
    
    const currentIndex = EFFECTS_LIST.indexOf(currentEffectName);
    // Si falla la búsqueda, volver al principio
    const baseIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (baseIndex + 1) % EFFECTS_LIST.length;
    
    currentEffectName = EFFECTS_LIST[nextIndex];
    animationFrameCount = 0; 
    console.log(`Cambiado a: ${currentEffectName}`);
}

// --- BUCLE PRINCIPAL ---
function mainLoop() {
    if (EFFECTS_LIST.length === 0) {
        window.animationFrameId = requestAnimationFrame(mainLoop);
        return; 
    }
    
    let logicalData = new Array(LOGICAL_ROWS).fill(0).map(() => new Array(LOGICAL_COLS).fill(NOISE_CLASS));

    if (EFFECTS[currentEffectName]) {
        Config.COLS = LOGICAL_COLS;
        Config.ROWS = LOGICAL_ROWS;
        logicalData = EFFECTS[currentEffectName](logicalData, animationFrameCount); 
    }

    applyVisualMapping(logicalData);
    
    animationFrameCount++;
    window.animationFrameId = requestAnimationFrame(mainLoop); 
}

// --- RENDERIZADO ---
function applyVisualMapping(logicalData) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const visualIndex = r * COLS + c;
            const pixelElement = document.getElementById(`p-${visualIndex}`);
            
            if (!pixelElement) continue;

            const logicalR = r - OFFSET_Y;
            const logicalC = c - OFFSET_X;
            let colorClass = 0; 

            if (logicalR >= 0 && logicalR < LOGICAL_ROWS && 
                logicalC >= 0 && logicalC < LOGICAL_COLS) {
                colorClass = logicalData[logicalR][logicalC];
            } else {
                 colorClass = 0;
            }

            pixelElement.className = 'pixel'; 
            if (colorClass !== 0) { 
                pixelElement.classList.add(colorClass); 
            }
        }
    }
}

// --- EXPORTAR CONFIG ---
export const Config = { 
    COLS: LOGICAL_COLS, 
    ROWS: LOGICAL_ROWS, 
    NOISE_CLASS, 
    ON_COLOR_CLASS 
};