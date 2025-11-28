// js/effects/matrix_rain.js
import { registerEffect, Config } from '../core.js';

// Estado persistente de las gotas
let drops = [];

function matrix_rain(matrix, frameCount, Shared) {
    const { COLS, ROWS } = Config;

    // Inicializar gotas si cambia el tamaño o es la primera vez
    if (drops.length !== COLS) {
        drops = new Array(COLS).fill(0).map(() => Math.random() * ROWS * -1);
    }

    // Usamos colores compartidos si están disponibles, o fallbacks
    const COLOR_HEAD = Shared?.Colors?.ON || 'on';
    const COLOR_TRAIL = Shared?.Colors?.SYSTEM || 'system';

    for (let i = 0; i < COLS; i++) {
        // Posición actual de la gota (cabeza)
        const headRow = Math.floor(drops[i]);

        // DIBUJAR LA GOTA Y SU ESTELA
        // Longitud de la estela: 5 a 10 píxeles
        const trailLength = 8;

        for (let k = 0; k < trailLength; k++) {
            const trailRow = headRow - k;

            // Si el píxel está dentro de la pantalla
            if (trailRow >= 0 && trailRow < ROWS) {
                if (k === 0) {
                    // La cabeza es blanca (más brillante)
                    matrix[trailRow][i] = COLOR_HEAD;
                } else if (Math.random() > 0.1) {
                    // La cola es verde (con un poco de parpadeo)
                    matrix[trailRow][i] = COLOR_TRAIL;
                }
            }
        }

        // MOVER LA GOTA
        // Velocidad aleatoria para cada columna
        drops[i] += 0.3 + Math.random() * 0.2;

        // Si la cola de la gota sale de la pantalla, reiniciar arriba
        if (drops[i] - trailLength > ROWS) {
            // Reiniciar en una posición negativa aleatoria para que no caigan todas juntas
            drops[i] = Math.random() * -20;
        }
    }

    return matrix;
}

registerEffect('matrix_rain', matrix_rain); a