// js/core.js - Motor Central (FULL SCREEN ADAPTIVE - CLICK ONLY)

// --- DIMENSIONES VISUALES Y LÓGICAS ---
export let COLS = 32;       
export let ROWS = 32;       

// LOGICAL_COLS/ROWS: Dimensión del efecto (32x32, 64x32, etc.)
let LOGICAL_COLS = 32;
let LOGICAL_ROWS = 32;
let OFFSET_X = 0; // Offset para centrar el efecto
let OFFSET_Y = 0;

const NOISE_CLASS = 'bg-noise'; 
const ON_COLOR_CLASS = 'on';

const BASE_PIXEL_SIZE = 16; 
let animationFrameCount = 0; 

// --- LISTA MAESTRA DE EFECTOS ---
// ACTUALIZADO: Esta lista ahora coincide exactamente con los archivos de tu carpeta 'effects'
const EFFECTS_NAME_LIST_MASTER = [
    'digital_clock',      // El reloj
    'color_plasma',       // El efecto de colores
    'matrix_rain',        // Lluvia tipo Matrix
    'scrolling_marquee',  // Texto que se desplaza
    'spectrum_analyzer',  // Visualizador de audio simulado
    'expanding_circle',      // Ruido estático
];

let currentEffectName = EFFECTS_NAME_LIST_MASTER[0]; // Arranca con static_noise
const EFFECTS_LIST = []; 
export const EFFECTS = {}; 

// --- FUNCIÓN DE REGISTRO ---
export function registerEffect(name, func) {
    // Solo registramos si está en la lista maestra actualizada
    if (EFFECTS_NAME_LIST_MASTER.includes(name) && !EFFECTS[name]) {
        EFFECTS[name] = func;
        EFFECTS_LIST.push(name);
        console.log(`Efecto registrado: ${name}`); 
    } else {
        console.warn(`Intento de registrar efecto desconocido o duplicado: ${name}`);
    }
}

// --- FUNCIÓN PRINCIPAL: DETECTAR Y ASIGNAR DIMENSIONES ---
export function detectAndSetDimensions(visualCols, visualRows) {
    
    // 1. Actualizar Dimensiones VISUALES (Total de celdas en la pantalla)
    COLS = visualCols;
    ROWS = visualRows;
    
    const aspectRatio = COLS / ROWS;
    
    // 2. Determinar las Dimensiones Lógicas FIJAS (El tamaño real del render)
    if (aspectRatio > 1.5) { // Pantalla ancha (Horizontal)
        LOGICAL_COLS = 64;
        LOGICAL_ROWS = 32;
    } else if (aspectRatio < 0.66) { // Pantalla alta (Vertical)
        LOGICAL_COLS = 32;
        LOGICAL_ROWS = 64;
    } else { // Cuadrada o intermedia
        LOGICAL_COLS = 32;
        LOGICAL_ROWS = 32;
    }
    
    // 3. Calcular Offsets para centrar el grid Lógico dentro del Visual
    OFFSET_X = Math.floor((COLS - LOGICAL_COLS) / 2);
    OFFSET_Y = Math.floor((ROWS - LOGICAL_ROWS) / 2);

    // 4. Re-inicializar si las dimensiones VISUALES cambiaron
    const grid = document.getElementById('pixel-grid');
    if (grid && grid.children.length !== (COLS * ROWS)) {
        initializeDisplay();
    }
}


// --- FUNCIÓN DE INICIALIZACIÓN: CREAR DIVS E INTERACCIÓN ---
export function initializeDisplay() {
    const gridContainer = document.getElementById('pixel-grid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = ''; 

    // Crear Píxeles usando las DIMENSIONES VISUALES (COLS * ROWS)
    for (let i = 0; i < COLS * ROWS; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        pixel.id = `p-${i}`; 
        gridContainer.appendChild(pixel);
    }
    
    // AÑADIDO: Event listener para cambiar efecto al hacer click
    gridContainer.removeEventListener('click', cycleEffect); // Prevenir duplicados
    gridContainer.addEventListener('click', cycleEffect);

    // Limpiar temporizador automático si existía
    if (window.effectTimer) {
        clearInterval(window.effectTimer);
        window.effectTimer = null;
    }

    // Iniciar bucle de renderizado
    if (!window.animationFrameId) {
        mainLoop();
    }
}

// --- Lógica de Cambio de Efecto Manual ---
function cycleEffect() {
    // Solo ciclar entre los efectos que se han cargado correctamente
    if (EFFECTS_LIST.length === 0) return;
    
    const currentIndex = EFFECTS_LIST.indexOf(currentEffectName);
    // Si el efecto actual no está en la lista (por algún error), ir al primero
    const baseIndex = currentIndex === -1 ? 0 : currentIndex;
    
    const nextIndex = (baseIndex + 1) % EFFECTS_LIST.length;
    
    currentEffectName = EFFECTS_LIST[nextIndex];
    animationFrameCount = 0; 
    console.log("Cambiando efecto a:", currentEffectName);
}

// --- BUCLE PRINCIPAL DE RENDERIZADO ---
function mainLoop() {
    // Si no hay efectos cargados aún, esperar un frame y reintentar
    if (EFFECTS_LIST.length === 0) {
        window.animationFrameId = requestAnimationFrame(mainLoop);
        return; 
    }
    
    // 1. Crear matriz TEMPORAL para el efecto (Tamaño LÓGICO)
    let logicalData = new Array(LOGICAL_ROWS).fill(0).map(() => new Array(LOGICAL_COLS).fill(NOISE_CLASS));

    // 2. Ejecutar el efecto usando las dimensiones LÓGICAS
    if (EFFECTS[currentEffectName]) {
        // ACTUALIZAR Config con dimensiones LÓGICAS para que los efectos las usen
        Config.COLS = LOGICAL_COLS;
        Config.ROWS = LOGICAL_ROWS;

        logicalData = EFFECTS[currentEffectName](logicalData, animationFrameCount); 
    } 

    // 3. Mapear la matriz LÓGICA al DOM (Tamaño VISUAL)
    applyVisualMapping(logicalData);
    
    animationFrameCount++;
    window.animationFrameId = requestAnimationFrame(mainLoop); 
}

// --- FUNCIÓN DE RENDERIZADO FINAL: Mapear LÓGICA a VISUAL ---
function applyVisualMapping(logicalData) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const visualIndex = r * COLS + c;
            const pixelElement = document.getElementById(`p-${visualIndex}`);
            
            if (!pixelElement) continue;

            // Determinar si estamos DENTRO del área LÓGICA (Offset aplicado)
            const logicalR = r - OFFSET_Y;
            const logicalC = c - OFFSET_X;
            
            let colorClass = 0; 

            if (logicalR >= 0 && logicalR < LOGICAL_ROWS && 
                logicalC >= 0 && logicalC < LOGICAL_COLS) {
                // Usamos el color del efecto
                colorClass = logicalData[logicalR][logicalC];
            } else {
                 // Fuera del área lógica (el borde de la pantalla completa)
                 colorClass = 0;
            }

            pixelElement.className = 'pixel'; 
            if (colorClass !== 0) { 
                pixelElement.classList.add(colorClass); 
            }
        }
    }
}

// --- EXPORTAR CONFIGURACIÓN ---
export const Config = { 
    COLS: LOGICAL_COLS, 
    ROWS: LOGICAL_ROWS, 
    NOISE_CLASS, 
    ON_COLOR_CLASS 
};