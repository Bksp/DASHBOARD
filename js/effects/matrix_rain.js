javascript
// js/effects/matrix_rain.js
import { registerEffect, Config } from '../core.js';

// Estado encapsulado en el módulo (pero gestionado por lifecycle)
let drops = [];

const MatrixRain = {
    mount: (Shared) => {
        const { COLS, ROWS } = Config;
        // Inicializar gotas
        drops = new Array(COLS).fill(0).map(() => Math.random() * ROWS * -1);
    },

    unmount: (Shared) => {
        // Limpiar memoria explícitamente
        drops = [];
    },

    update: (matrix, frameCount, Shared) => {
        const { COLS, ROWS } = Config;

        // Re-inicializar si cambia el tamaño dinámicamente
        if (drops.length !== COLS) {
            drops = new Array(COLS).fill(0).map(() => Math.random() * ROWS * -1);
        }

        const COLOR_HEAD = Shared?.Colors?.ON || 'on';
        const COLOR_TRAIL = Shared?.Colors?.SYSTEM || 'system';

        for (let i = 0; i < COLS; i++) {
            const headRow = Math.floor(drops[i]);
            const trailLength = 8;

            for (let k = 0; k < trailLength; k++) {
                const trailRow = headRow - k;

                if (trailRow >= 0 && trailRow < ROWS) {
                    if (k === 0) {
                        matrix[trailRow][i] = COLOR_HEAD;
                    } else if (Math.random() > 0.1) {
                        matrix[trailRow][i] = COLOR_TRAIL;
                    }
                }
            }

            drops[i] += 0.3 + Math.random() * 0.2;

            if (drops[i] - trailLength > ROWS) {
                drops[i] = Math.random() * -20;
            }
        }

        return matrix;
    }
};

registerEffect('matrix_rain', MatrixRain); a