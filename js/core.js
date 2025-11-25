// js/core.js - Motor Central (CICLO AUTOMÁTICO)

// --- CONSTANTES GLOBALES ---
const COLS = 32; 
const ROWS = 32; 
const NOISE_CLASS = 'bg-noise'; 
const ON_COLOR_CLASS = 'on';

// Define cada cuánto tiempo (en milisegundos) debe cambiar el efecto
const EFFECT_CYCLE_INTERVAL_MS = 5000; // 5 segundos

let animationFrameCount = 0; 
let currentEffectName = 'static_noise'; // Efecto inicial

// Lista de efectos disponibles y objeto de funciones de efectos
const EFFECTS_LIST = []; 
export const EFFECTS = {}; 

// --- FUNCIÓN DE INICIALIZACIÓN: CREAR DIVS Y TEMPORIZADOR ---
export function initializeDisplay() {
    const gridContainer = document.getElementById('pixel-grid');
    gridContainer.innerHTML = ''; 

    // 1. Crear Píxeles
    for (let i = 0; i < COLS * ROWS; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        pixel.id = `p-${i}`; 
        gridContainer.appendChild(pixel);
    }

    // 2. INICIAR EL CICLO AUTOMÁTICO (Cada 5 segundos)
    setInterval(cycleEffect, EFFECT_CYCLE_INTERVAL_MS);

    // 3. Iniciar bucle de renderizado
    mainLoop(); 
}

// --- Lógica de Cambio de Efecto Automático ---
function cycleEffect() {
    if (EFFECTS_LIST.length === 0) return;
    
    // Calcula el índice del siguiente efecto en el ciclo
    const currentIndex = EFFECTS_LIST.indexOf(currentEffectName);
    const nextIndex = (currentIndex + 1) % EFFECTS_LIST.length;
    
    currentEffectName = EFFECTS_LIST[nextIndex];
    animationFrameCount = 0; // Reiniciar animación para el nuevo efecto
}


// --- FUNCIÓN DE RENDERIZADO FINAL: PINTAR LOS DIVS (LEDS) ---
export function applyPixelDataToDOM(data) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const index = r * COLS + c;
            const pixelElement = document.getElementById(`p-${index}`);
            const colorClass = data[r][c];

            pixelElement.className = 'pixel';
            
            if (colorClass !== 0) { 
                pixelElement.classList.add(colorClass); 
            }
        }
    }
}

// --- BUCLE PRINCIPAL DE RENDERIZADO ---
function mainLoop() {
    let pixelData = new Array(ROWS).fill(0).map(() => new Array(COLS).fill(NOISE_CLASS));

    // Ejecutar el efecto actual
    if (EFFECTS[currentEffectName]) {
        pixelData = EFFECTS[currentEffectName](pixelData, animationFrameCount);
    }

    applyPixelDataToDOM(pixelData);
    animationFrameCount++;
    requestAnimationFrame(mainLoop); 
}

// Exportar constantes para que los efectos las usen
export const Config = { COLS, ROWS, NOISE_CLASS, ON_COLOR_CLASS };

// FUNCIÓN DE REGISTRO
export function registerEffect(name, func) {
    EFFECTS[name] = func;
    EFFECTS_LIST.push(name);
}