// js/effects/digital_clock.js
import { registerEffect, Config } from '../core.js';

// --- CONSTANTES DEL SPRITE (Fuente Pixelada 5x3) ---
const SPRITE_WIDTH = 3; 
const SPRITE_HEIGHT = 5; 

// Sprites completos para los dígitos 0-9 y el separador ':'
const SPRITES = {
    '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
    '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
    '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
    '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
    '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
    '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
    '7': [[1,1,1],[0,0,1],[0,1,0],[1,0,0],[1,0,0]],
    '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
    '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
    ':': [[0,0,0],[0,1,0],[0,0,0],[0,1,0],[0,0,0]] 
};

// --- FUNCIÓN DEL EFECTO: RELOJ DIGITAL HH:MM ---
function digital_clock(matrix) {
    const now = new Date();
    // Obtiene HH:MM y se asegura de que tenga dos dígitos (ej. 09:05)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`; 
    
    // El ancho total necesario para 'HH:MM' en 5x3 con 1px de espacio:
    // (4 dígitos * 3 ancho) + (1 separador * 3 ancho) + (3 espacios * 1 ancho) = 12 + 3 + 3 = 18 columnas
    const clockDisplayWidth = (SPRITE_WIDTH * 5) + (1 * 3); // 5 caracteres (incl. :) y 4 espacios entre ellos (18px)
    
    // Cálculo del Offset para centrar el reloj en la matriz de 32x32
    const offsetX = Math.floor((Config.COLS - clockDisplayWidth) / 2); // 32 - 18 = 14 / 2 = 7
    const offsetY = Math.floor((Config.ROWS - SPRITE_HEIGHT) / 2); // 32 - 5 = 27 / 2 = 13
    
    let currentX = offsetX;
    
    for (let i = 0; i < timeStr.length; i++) {
        const char = timeStr[i];
        const sprite = SPRITES[char];

        if (!sprite) continue; // Si falta un sprite, salta

        for (let r = 0; r < SPRITE_HEIGHT; r++) {
            for (let c = 0; c < SPRITE_WIDTH; c++) {
                if (sprite[r] && sprite[r][c] === 1) { // Si el píxel del sprite está encendido
                    // Comprobar límites y pintar con el color principal
                    if (offsetY + r < Config.ROWS && currentX + c < Config.COLS) {
                        matrix[offsetY + r][currentX + c] = Config.ON_COLOR_CLASS; 
                    }
                }
            }
        }
        currentX += SPRITE_WIDTH + 1; // Mover al siguiente carácter + 1 píxel de espacio
    }
    return matrix;
}

// --- REGISTRO DEL EFECTO ---
registerEffect('digital_clock', digital_clock);