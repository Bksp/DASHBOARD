// js/effects/color_plasma.js
import { registerEffect, Config } from '../core.js';

function color_plasma(matrix, frameCount) {
    const { COLS, ROWS } = Config;

    const scale = 0.1; // Controla qué tan "grande" es el zoom de la onda
    const speed = 0.05; // Controla la velocidad de la animación
    
    // Lista de colores que deben coincidir con tus clases CSS
    const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    const color_count = COLORS.length;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            // Fórmula matemática para crear ondas complejas que se mueven
            // Combina la posición (r, c) con el tiempo (frameCount)
            const value = Math.sin(r * scale + frameCount * speed) +
                          Math.sin(c * scale + frameCount * speed * 0.8) +
                          Math.sin((r + c) * scale * 0.5 + frameCount * speed * 1.5);
            
            // 'value' oscila aproximadamente entre -3 y 3.
            // Lo normalizamos para obtener un índice válido del array COLORS (0 a 5)
            
            // 1. (value / 3) convierte el rango a -1...1 aprox
            // 2. + 1 lo convierte a 0...2
            // 3. Multiplicamos para estirar al tamaño del array
            const mappedIndex = Math.floor(((value / 3) + 1) * (color_count));
            
            // Aseguramos que el índice esté dentro de los límites y sea cíclico
            // (usamos Math.abs para evitar negativos raros y % para ciclar)
            const colorId = Math.abs(mappedIndex % color_count);
            
            // Asignar la clase de color correspondiente
            matrix[r][c] = COLORS[colorId];
        }
    }
    return matrix;
}

registerEffect('color_plasma', color_plasma);