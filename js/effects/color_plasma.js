import { registerEffect, Config } from '../core.js';

// --- CONFIGURACIÓN DE OPTIMIZACIÓN ---
const LUT_SIZE = 512; // Tamaño de la tabla (potencia de 2 para usar máscaras si quisiéramos, aunque % es rápido)
const SINE_LUT = new Float32Array(LUT_SIZE);
const PI2 = Math.PI * 2;

// --- ESTADO DEL EFECTO ---
let isMounted = false;

const PlasmaEffect = {
    mount: (Shared) => {
        if (isMounted) return;

        // 1. Pre-calcular Tabla de Seno (Solo una vez)
        // Mapeamos 0..LUT_SIZE a 0..2PI
        for (let i = 0; i < LUT_SIZE; i++) {
            SINE_LUT[i] = Math.sin((i / LUT_SIZE) * PI2);
        }

        isMounted = true;
    },

    unmount: (Shared) => {
        // No necesitamos borrar la LUT porque es pequeña y estática,
        // pero marcamos como desmontado por si hay lógica futura.
        isMounted = false;
    },

    update: (matrix, frameCount, Shared) => {
        const { COLS, ROWS } = Config;
        const { Colors } = Shared;

        // Paleta optimizada (referencias directas)
        const PALETTE = [Colors.RED, Colors.ORANGE, Colors.YELLOW, Colors.GREEN, Colors.BLUE, Colors.PURPLE];
        const PALETTE_SIZE = PALETTE.length;

        const scale = 0.1;
        const speed = 0.05;

        // Optimizaciones de bucle
        const time = frameCount * speed;
        const time08 = time * 0.8;
        const time15 = time * 1.5;
        const lutFactor = LUT_SIZE / PI2; // Factor para convertir radianes a índice LUT

        // Función helper inline para buscar en LUT
        // (rads % PI2) * lutFactor -> índice
        // Usamos Math.abs para manejar negativos y bitwise OR 0 para floor rápido
        const fastSin = (rads) => {
            let idx = ((rads * lutFactor) | 0) % LUT_SIZE;
            if (idx < 0) idx += LUT_SIZE;
            return SINE_LUT[idx];
        };

        for (let r = 0; r < ROWS; r++) {
            const rScale = r * scale;
            const term1 = fastSin(rScale + time); // Calculado una vez por fila

            for (let c = 0; c < COLS; c++) {
                // Fórmula original:
                // sin(r*scale + t) + sin(c*scale + t*0.8) + sin((r+c)*scale*0.5 + t*1.5)

                const term2 = fastSin(c * scale + time08);
                const term3 = fastSin((r + c) * scale * 0.5 + time15);

                const value = term1 + term2 + term3;

                // Mapeo rápido: value (-3 a 3) -> (0 a PALETTE_SIZE)
                // ((value / 3) + 1) * PALETTE_SIZE
                // Simplificado: (value + 3) * (PALETTE_SIZE / 6) -> (value + 3) * 1 si size es 6

                let colorIdx = ((value + 3) * (PALETTE_SIZE / 6)) | 0;

                // Clamp seguro
                if (colorIdx >= PALETTE_SIZE) colorIdx = PALETTE_SIZE - 1;
                if (colorIdx < 0) colorIdx = 0;

                matrix[r][c] = PALETTE[colorIdx];
            }
        }
        return matrix;
    }
};

registerEffect('color_plasma', PlasmaEffect);