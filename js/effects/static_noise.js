// js/effects/expanding_circle.js
import { registerEffect, Config } from '../core.js';

// --- FUNCIÓN DEL EFECTO: CÍRCULO EXPANSIVO ---
function expanding_circle(matrix, frameCount) {
    const center = Config.COLS / 2; // El centro de la cuadrícula (16 para 32x32)
    const wave_speed = 0.2; // Velocidad a la que se expande el círculo
    const wave_thickness = 1.5; // Grosor del anillo
    const max_radius = Math.sqrt(center * center + center * center); // Radio máximo

    for (let r = 0; r < Config.ROWS; r++) {
        for (let c = 0; c < Config.COLS; c++) {
            // 1. Calcular la distancia euclidiana del píxel al centro
            // r_dist^2 + c_dist^2 = distance^2
            const r_dist = r - center;
            const c_dist = c - center;
            const distance = Math.sqrt(r_dist * r_dist + c_dist * c_dist);

            // 2. Calcular la posición de la onda basada en el tiempo
            const current_wave_pos = (frameCount * wave_speed) % max_radius;
            
            // 3. Determinar si el píxel está en el anillo de la onda
            const diff = Math.abs(distance - current_wave_pos);
            
            if (diff < wave_thickness || (max_radius - diff) < wave_thickness) {
                // Si la diferencia es menor al grosor de la onda, o si estamos cerca
                // del inicio/fin del ciclo (para la transición), encender.
                matrix[r][c] = Config.ON_COLOR_CLASS; 
            }
        }
    }
    return matrix;
}

// --- REGISTRO DEL EFECTO ---
registerEffect('expanding_circle', expanding_circle);