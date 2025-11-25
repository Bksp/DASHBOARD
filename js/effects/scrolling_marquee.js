// js/effects/scrolling_marquee.js
import { registerEffect, Config } from '../core.js';
import { PIXEL_FONT } from '../font.js';

const MESSAGE = "COMPLETOS";
const SPRITE_WIDTH = 5; 
const SPRITE_HEIGHT = 7;
const LETTER_SPACING = 1;
const SCROLL_SPEED = 2; // Píxeles por frame (dividir el frameCount)

function scrolling_marquee(matrix, frameCount) {
    const { COLS, ROWS, ON_COLOR_CLASS } = Config;

    // Calcular el desplazamiento basado en el tiempo
    // Usamos frameCount / 2 para que no vaya demasiado rápido (60fps es muy veloz)
    const shift = Math.floor(frameCount / 3); 
    
    // Ancho total del mensaje en píxeles
    // (Aprox 6px por letra)
    const totalMessageWidth = MESSAGE.length * (SPRITE_WIDTH + LETTER_SPACING);
    
    // Posición X inicial (se mueve hacia la izquierda y se repite)
    // El modulo (%) hace que se repita en ciclo
    let startX = COLS - (shift % (totalMessageWidth + COLS));

    // Centrado vertical
    const startY = Math.floor((ROWS - SPRITE_HEIGHT) / 2);

    let currentX = startX;

    for (let i = 0; i < MESSAGE.length; i++) {
        const char = MESSAGE[i];
        const sprite = PIXEL_FONT[char] || PIXEL_FONT[' ']; // Fallback a espacio

        // Solo dibujar si la letra está visible en pantalla (Optimización)
        if (currentX + SPRITE_WIDTH >= 0 && currentX < COLS) {
            
            if (sprite) {
                for (let r = 0; r < SPRITE_HEIGHT; r++) {
                    for (let c = 0; c < SPRITE_WIDTH; c++) {
                        if (sprite[r][c] === 1) {
                            const targetX = currentX + c;
                            const targetY = startY + r;

                            if (targetX >= 0 && targetX < COLS && targetY >= 0 && targetY < ROWS) {
                                // Puedes cambiar 'blue' por 'on' o cualquier color
                                matrix[targetY][targetX] = 'system'; 
                            }
                        }
                    }
                }
            }
        }
        
        currentX += SPRITE_WIDTH + LETTER_SPACING;
    }

    return matrix;
}

registerEffect('scrolling_marquee', scrolling_marquee);