// js/effects/spectrum_analyzer.js
import { registerEffect, Config } from '../core.js';

// Estado para la altura actual de las barras
let barHeights = [];

function spectrum_analyzer(matrix) {
    const { COLS, ROWS } = Config;

    // Inicializar
    if (barHeights.length !== COLS) {
        barHeights = new Array(COLS).fill(0);
    }

    for (let c = 0; c < COLS; c++) {
        // 1. Simular movimiento: Mover hacia un objetivo aleatorio
        // A veces sube rápido, siempre baja lento (gravedad)
        
        let targetHeight = Math.random() * ROWS;
        
        // Suavizado: movemos la altura actual hacia el objetivo lentamente
        if (targetHeight > barHeights[c]) {
             // Subir (con un salto a veces para simular "golpe")
             barHeights[c] += (targetHeight - barHeights[c]) * 0.2;
        } else {
             // Bajar (caída lenta)
             barHeights[c] -= 2;
        }
        
        // Limites
        if (barHeights[c] < 0) barHeights[c] = 0;
        if (barHeights[c] > ROWS) barHeights[c] = ROWS;

        // 2. Dibujar la barra
        const h = Math.floor(barHeights[c]);
        
        for (let r = 0; r < h; r++) {
            // Coordenada Y (invertida, porque 0 es arriba)
            const posY = ROWS - 1 - r;
            
            if (posY >= 0 && posY < ROWS) {
                let color = 'system';
                
                // Cambiar color según la altura (Ecualizador clásico)
                // 30% superior = rojo, medio = amarillo, abajo = verde
                const percentage = r / ROWS;
                
                if (percentage > 0.75) color = 'purple';
                else if (percentage > 0.4) color = 'on';
                else color = 'system';
                
                // Dejar un hueco entre barras si la resolución lo permite (opcional)
                // if (c % 2 === 0) 
                matrix[posY][c] = color;
            }
        }
        
        // 3. Dibujar un "pico" flotante (un pixel que cae más lento)
        // (Simplificado para este ejemplo: solo la barra sólida)
    }

    return matrix;
}

registerEffect('spectrum_analyzer', spectrum_analyzer);