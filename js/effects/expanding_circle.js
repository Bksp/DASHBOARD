// js/effects/expanding_circle.js
import { registerEffect, Config } from '../core.js';

// --- FUNCIÓN DEL EFECTO: CÍRCULO EXPANSIVO ---
function expanding_circle(matrix, frameCount) {
    // Usamos las dimensiones dinámicas
    const { COLS, ROWS, ON_COLOR_CLASS } = Config; 
    
    const center_c = COLS / 2;
    const center_r = ROWS / 2;
    const wave_speed = 0.5; // Velocidad de expansión
    const wave_thickness = 2.5; // Grosor del anillo
    
    // Calculamos el radio máximo para que la onda se reinicie correctamente
    // Usamos la distancia a la esquina más lejana para cubrir toda la pantalla
    const max_radius = Math.sqrt(center_c * center_c + center_r * center_r); 

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            // 1. Calcular la distancia euclidiana del píxel al centro (Teorema de Pitágoras)
            const r_dist = r - center_r;
            const c_dist = c - center_c;
            const distance = Math.sqrt(r_dist * r_dist + c_dist * c_dist);

            // 2. Calcular la posición de la onda basada en el tiempo
            // Usamos módulo para que se repita cíclicamente
            // (max_radius + wave_thickness * 2) asegura que la onda salga completamente antes de reiniciar
            const current_wave_pos = (frameCount * wave_speed) % (max_radius + wave_thickness * 2);
            
            // 3. Determinar si el píxel está en el anillo
            const diff = Math.abs(distance - current_wave_pos);
            
            // Dibujar el anillo principal
            if (diff < wave_thickness) {
                matrix[r][c] = ON_COLOR_CLASS; 
            }
        }
    }
    return matrix;
}

// --- REGISTRO DEL EFECTO ---
// Asegúrate de que 'expanding_circle' esté en la lista maestra en core.js
registerEffect('expanding_circle', expanding_circle);