import { registerEffect, Config } from '../core.js';

// --- ESTADO PERSISTENTE ---
// Almacena las coordenadas del centro de la onda actual
let center_c_rand = 0; 
let center_r_rand = 0;
// Almacena el frame count en el que se generó la última onda.
let last_wave_start_frame = 0;

// --- FUNCIÓN DE GENERACIÓN DE NUEVO CENTRO ---
function generateNewCenter(COLS, ROWS) {
    // Genera coordenadas aleatorias dentro de la cuadrícula lógica (0 a COLS/ROWS - 1)
    center_c_rand = Math.floor(Math.random() * COLS);
    center_r_rand = Math.floor(Math.random() * ROWS);
    
    // Calcula la distancia máxima desde este nuevo centro a la esquina más lejana
    // Esto asegura que la onda cubra TODA la pantalla antes de resetearse.
    const max_dist_to_corner = Math.max(
        Math.sqrt(center_c_rand**2 + center_r_rand**2),         // Distancia a (0, 0)
        Math.sqrt((COLS - center_c_rand)**2 + center_r_rand**2), // Distancia a (COLS, 0)
        Math.sqrt(center_c_rand**2 + (ROWS - center_r_rand)**2), // Distancia a (0, ROWS)
        Math.sqrt((COLS - center_c_rand)**2 + (ROWS - center_r_rand)**2) // Distancia a (COLS, ROWS)
    );
    return max_dist_to_corner;
}


// --- FUNCIÓN DEL EFECTO: CÍRCULO EXPANSIVO ---
function expanding_circle(matrix, frameCount) {
    const { COLS, ROWS, ON_COLOR_CLASS } = Config; 
    
    const wave_speed = 0.2; // Velocidad de expansión
    const wave_thickness = 2.5; // Grosor del anillo
    
    let max_radius;

    // Inicializar el centro en el primer frame o si se redimensiona
    if (center_c_rand === 0 && center_r_rand === 0) {
        max_radius = generateNewCenter(COLS, ROWS);
    } else {
        // Reutilizar el centro, pero recalcular el max_radius por si se cambió la dimensión
        max_radius = Math.max(
            Math.sqrt(center_c_rand**2 + center_r_rand**2),
            Math.sqrt((COLS - center_c_rand)**2 + center_r_rand**2),
            Math.sqrt(center_c_rand**2 + (ROWS - center_r_rand)**2),
            Math.sqrt((COLS - center_c_rand)**2 + (ROWS - center_r_rand)**2)
        );
    }
    
    // La posición de la onda es el tiempo transcurrido desde el inicio de esta onda
    const elapsed_frames = frameCount - last_wave_start_frame;
    const current_wave_pos = elapsed_frames * wave_speed;

    // 1. Detección y generación de nueva onda (si la onda actual ha pasado el borde más lejano)
    if (current_wave_pos > max_radius + wave_thickness * 2) {
        last_wave_start_frame = frameCount; // Reiniciar el contador de tiempo
        max_radius = generateNewCenter(COLS, ROWS); // Generar nuevas coordenadas
        
        // Recalcular la posición de la onda para el primer frame de la nueva onda
        const new_elapsed_frames = frameCount - last_wave_start_frame;
        const new_current_wave_pos = new_elapsed_frames * wave_speed;
        
        // Usar la nueva posición
        const center_c = center_c_rand;
        const center_r = center_r_rand;
        
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const r_dist = r - center_r;
                const c_dist = c - center_c;
                const distance = Math.sqrt(r_dist * r_dist + c_dist * c_dist);

                const diff = Math.abs(distance - new_current_wave_pos);
                
                // Dibujar el anillo principal
                if (diff < wave_thickness) {
                    matrix[r][c] = ON_COLOR_CLASS; 
                }
            }
        }
    } else {
        // La onda aún está activa, usa las posiciones actuales
        const center_c = center_c_rand;
        const center_r = center_r_rand;
        
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const r_dist = r - center_r;
                const c_dist = c - center_c;
                const distance = Math.sqrt(r_dist * r_dist + c_dist * c_dist);

                const diff = Math.abs(distance - current_wave_pos);
                
                // Dibujar el anillo principal
                if (diff < wave_thickness) {
                    matrix[r][c] = ON_COLOR_CLASS; 
                }
            }
        }
    }

    return matrix;
}

// --- REGISTRO DEL EFECTO ---
registerEffect('expanding_circle', expanding_circle);