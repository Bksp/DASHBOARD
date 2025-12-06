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

    // --- CONFIGURACIÓN DE DESPLAZAMIENTOS SOLICITADOS ---
    // 1. Título "KEYS" -> 1 px a la derecha
    const OFFSET_X_TITLE = 1;
    // 2. Teclas pulsadas -> 2 px a la derecha
    const OFFSET_X_KEYS = 2;

    // Ajuste Vertical (Solo en modo vertical baja 4px)
    const OFFSET_Y = isVertical ? 4 : 0;

    // 1. Limpiar teclas caducadas
    while (KeyInput.KEY_QUEUE.length > 0 &&
        now - KeyInput.KEY_QUEUE[0].timestamp > KEY_DISPLAY_DURATION) {
        KeyInput.KEY_QUEUE.shift();
    }

    const queue = KeyInput.KEY_QUEUE;

    // --- CÁLCULO DE DIMENSIONES ---
    // Espacio disponible restando el desplazamiento de las teclas
    const AVAILABLE_COLS = COLS - OFFSET_X_KEYS;

    // Recalcular cuántos caben
    const MAX_CHARS_PER_ROW = Math.floor(AVAILABLE_COLS / CHAR_SPACING);

    // Ajuste de filas para modo vertical
    let MAX_ROWS = Math.floor(ROWS / LINE_HEIGHT_TOTAL);
    if (isVertical) {
        // Reducimos filas para compensar el desplazamiento vertical
        MAX_ROWS -= 1;
    }

    const MAX_DISPLAYABLE_CHARS = MAX_CHARS_PER_ROW * MAX_ROWS;

    // 2. ESTADO INACTIVO (Mostrar Título)
    if (queue.length === 0 || MAX_CHARS_PER_ROW <= 0 || MAX_ROWS <= 0) {
        const message = 'KEYS';
        const messageWidth = message.length * CHAR_SPACING - LETTER_SPACING;

        // Centrado base + Desplazamiento solicitado (+1)
        const startX = Math.floor((COLS - messageWidth) / 2) + OFFSET_X_TITLE;
        const startY = Math.floor((ROWS - SPRITE_HEIGHT) / 2);

        let currentX = startX;
        for (let i = 0; i < message.length; i++) {
            drawChar(matrix, message[i], currentX, startY, 'system');
            currentX += CHAR_SPACING;
        }
        return matrix;
    }

    // 3. RENDERIZADO DE TECLAS
    const sliceLength = Math.min(queue.length, MAX_DISPLAYABLE_CHARS);
    const displayQueue = queue.slice(-sliceLength);

    displayQueue.forEach((item, i) => {
        const r_index = Math.floor(i / MAX_CHARS_PER_ROW);
        const c_index = i % MAX_CHARS_PER_ROW;

        // Posición Y con el offset vertical si corresponde
        const startY = OFFSET_Y + r_index * LINE_HEIGHT_TOTAL;

        // Posición X con el offset de teclas solicitado (+2)
        const startX = OFFSET_X_KEYS + c_index * CHAR_SPACING;

        // Restricción de seguridad
        if (startX + SPRITE_WIDTH > COLS) {
            return;
        }

        // Colores con atenuación
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