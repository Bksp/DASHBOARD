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

// --- GESTIÓN DE ENTRADA DE TECLADO ---
const KEY_QUEUE = [];
// *** CAMBIO CLAVE: Aumentado el límite para llenar la pantalla ***
const MAX_KEY_HISTORY = 300; 

// --- GESTIÓN DE ENTRADA DE RATÓN ---
// Añadir estado para rastrear la posición del ratón
let mousePosition = { c: -1, r: -1 }; 

function handleMouseMove(e) {
    const rect = document.getElementById('pixel-grid').getBoundingClientRect();
    // Usamos LOGICAL_COLS/ROWS para mapear al área de animación central
    const pixelSizeX = rect.width / LOGICAL_COLS;
    const pixelSizeY = rect.height / LOGICAL_ROWS;

    // Calcular la posición lógica (0 a LOGICAL_COLS/ROWS)
    const rawC = (e.clientX - rect.left) / pixelSizeX;
    const rawR = (e.clientY - rect.top) / pixelSizeY;
    
    // Almacenar la posición entera dentro de los límites lógicos
    mousePosition.c = Math.min(LOGICAL_COLS - 1, Math.max(0, Math.floor(rawC)));
    mousePosition.r = Math.min(LOGICAL_ROWS - 1, Math.max(0, Math.floor(rawR)));
}

// --- NUEVA FUNCIÓN PARA CAMBIAR EFECTO (USADA POR expanding_circle) ---
export function switchEffect(effectName) {
    if (EFFECTS_NAME_LIST_MASTER.includes(effectName)) {
        currentEffectName = effectName;
        animationFrameCount = 0;
        console.log(`Efecto cambiado forzosamente a: ${effectName}`);
    }
}

// --- LISTA MAESTRA DE EFECTOS ---
// Orden solicitado por el usuario
const EFFECTS_NAME_LIST_MASTER = [
    //'clock_fireworks',   
    'digital_clock',
    'color_plasma', 
    'expanding_circle', 
    'fireworks',
    // 'key_tester', 
    // 'led_tracker',
    // 'matrix_rain',
    // 'scrolling_marquee',
    // 'spectrum_analyzer',
    'tetris_clock',

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

// --- MANEJADORES DE EVENTOS DE MOUSE/TOUCH ---
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

// --- MANEJADOR DE EVENTOS DE TECLADO ---
function handleKeyDown(e) {
    if (e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return; 
    
    const key = e.key.toUpperCase();

    KEY_QUEUE.push({
        key: key,
        timestamp: Date.now()
    });

    if (KEY_QUEUE.length > MAX_KEY_HISTORY) {
        KEY_QUEUE.shift();
    }
}

// --- FUNCIÓN DE INICIALIZACIÓN ---
export function initializeDisplay() {
    const gridContainer = document.getElementById('pixel-grid');
    const wrapper = document.querySelector('.display-wrapper'); 
    
    if (!gridContainer || !wrapper) return;
    
    gridContainer.innerHTML = ''; 

    for (let i = 0; i < COLS * ROWS; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        pixel.id = `p-${i}`; 
        gridContainer.appendChild(pixel);
    }
    
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

    // AÑADIDO: Eventos de movimiento de ratón/tacto
    addEvent(wrapper, 'mousemove', handleMouseMove);
    addEvent(wrapper, 'touchmove', (e) => { 
        // Usamos el primer toque para simular el movimiento del ratón
        if (e.touches.length > 0) handleMouseMove(e.touches[0]); 
    }, {passive: true});

    if (!window.animationFrameId) {
        mainLoop();
    }
}

// --- CAMBIO DE EFECTO ---
function cycleEffect() {
    if (EFFECTS_LIST.length === 0) return;
    
    const currentIndex = EFFECTS_LIST.indexOf(currentEffectName);
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

// --- EXPORTAR ENTRADA DE RATÓN (NUEVO) ---
export const MouseInput = {
    position: mousePosition
};