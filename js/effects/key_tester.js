import { registerEffect, Config, KeyInput } from '../core.js'; 
import { PIXEL_FONT } from '../font.js';

// --- CONFIGURACIÓN VISUAL ---
const SPRITE_WIDTH = 5; 
const SPRITE_HEIGHT = 7; 
// Espacio de 1 píxel entre letras
const LETTER_SPACING = 1; 
const CHAR_SPACING = SPRITE_WIDTH + LETTER_SPACING; // 6 píxeles (5+1)

// Espacio vertical (+1 píxel de separación entre filas)
const LINE_HEIGHT_TOTAL = SPRITE_HEIGHT + 1; 

// Duración de la pulsación en la cola (6 segundos)
const KEY_DISPLAY_DURATION = 6000; 

// --- FUNCIÓN AUXILIAR: drawChar ---
function drawChar(matrix, char, startX, startY, colorClass) {
    const sprite = PIXEL_FONT[char.toUpperCase()];
    if (!sprite) return; 
    
    for (let r = 0; r < 7; r++) { 
        for (let c = 0; c < 5; c++) { 
            if (sprite[r] && sprite[r][c] === 1) { 
                const targetR = startY + r;
                const targetC = startX + c;
                
                if (targetR >= 0 && targetR < Config.ROWS && 
                    targetC >= 0 && targetC < Config.COLS) {
                    matrix[targetR][targetC] = colorClass; 
                }
            }
        }
    }
}

function key_tester(matrix) {
    const { COLS, ROWS, ON_COLOR_CLASS, NOISE_CLASS } = Config; 
    const now = Date.now();
    
    // DETECCIÓN DE MODO VERTICAL
    const isVertical = ROWS > COLS;

    // --- CONFIGURACIONES DE MODO ---
    let offsetX = 0; // Desplazamiento horizontal inicial (desde el borde izquierdo)
    let offsetY = 0; // Desplazamiento vertical inicial (desde el borde superior)
    let availableCols = COLS;
    let availableRows = ROWS;
    
    if (isVertical) { // MODO 32x64
        // Dejar 1 píxel de margen izquierdo y desplazar 4px hacia abajo.
        offsetX = 1; 
        offsetY = 4;
        
        // El área disponible se reduce por los offsets
        availableCols = COLS - offsetX;
        availableRows = ROWS - offsetY;
        
    } else { // MODO 32x32 y 64x32
        // Dejar 1 píxel de margen izquierdo
        offsetX = 1; 
        offsetY = 0; 
        
        availableCols = COLS - offsetX;
        availableRows = ROWS - offsetY;
    }

    // 1. Limpiar teclas caducadas
    while (KeyInput.KEY_QUEUE.length > 0 && 
           now - KeyInput.KEY_QUEUE[0].timestamp > KEY_DISPLAY_DURATION) {
        KeyInput.KEY_QUEUE.shift();
    }
    
    const queue = KeyInput.KEY_QUEUE;
    
    // --- CÁLCULO DE CAPACIDAD REAL ---
    // Usamos el área disponible después de los offsets
    const MAX_CHARS_PER_ROW = Math.floor(availableCols / CHAR_SPACING);
    const MAX_ROWS = Math.floor(availableRows / LINE_HEIGHT_TOTAL);
    const MAX_DISPLAYABLE_CHARS = MAX_CHARS_PER_ROW * MAX_ROWS;
    
    // 2. Estado inactivo
    if (queue.length === 0 || MAX_CHARS_PER_ROW <= 0 || MAX_ROWS <= 0) {
        const message = 'KEYS';
        const messageWidth = message.length * CHAR_SPACING - LETTER_SPACING; 
        
        // Centrado: se centra en el área total, no en el área disponible
        const startX = Math.floor((COLS - messageWidth) / 2);
        const startY = Math.floor((ROWS - SPRITE_HEIGHT) / 2);

        let currentX = startX;
        for (let i = 0; i < message.length; i++) {
            drawChar(matrix, message[i], currentX, startY, 'system');
            currentX += CHAR_SPACING;
        }
        return matrix;
    }

    // 3. Renderizado (Relleno de Títulos)
    const sliceLength = Math.min(queue.length, MAX_DISPLAYABLE_CHARS);
    const displayQueue = queue.slice(-sliceLength).reverse();
    
    displayQueue.forEach((item, i) => {
        const r_index = Math.floor(i / MAX_CHARS_PER_ROW);
        const c_index = i % MAX_CHARS_PER_ROW;

        // Posiciones de inicio basadas en el índice, más el offset de modo
        const startY = offsetY + r_index * LINE_HEIGHT_TOTAL;
        const startX = offsetX + c_index * CHAR_SPACING; 

        // Restricción horizontal de seguridad (ya cubierta por MAX_CHARS_PER_ROW, pero mejor dejar)
        if (startX + SPRITE_WIDTH > COLS) {
             return; 
        }
        
        // Colores
        const age = now - item.timestamp;
        const decayFactor = 1 - (age / KEY_DISPLAY_DURATION); 

        let colorClass = ON_COLOR_CLASS; 

        if (decayFactor < 0.3) {
             colorClass = NOISE_CLASS; 
        } else if (decayFactor < 0.6) {
             colorClass = 'system'; 
        } 

        drawChar(matrix, item.key, startX, startY, colorClass);
    });

    return matrix;
}

registerEffect('key_tester', key_tester);