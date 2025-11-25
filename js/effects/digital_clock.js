import { registerEffect, Config } from '../core.js';
import { PIXEL_FONT } from '../font.js'; 

const SPRITE_WIDTH = 5; 
const SPRITE_HEIGHT = 7; 
const SPACE_WIDTH = 2; // Ancho reducido para el espacio (para que quepa bien)
const LETTER_SPACING = 1;
const LINE_SPACING = 3; // Espacio vertical entre líneas

// Nombres de días en español (Abreviados para que quepan mejor)
const DAYS = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];

// Función auxiliar para calcular el ancho de un texto en píxeles
function calculateTextWidth(text) {
    let width = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text[i].toUpperCase(); 
        
        if (char === ' ') {
            width += SPACE_WIDTH;
        } else if (PIXEL_FONT[char]) {
            width += SPRITE_WIDTH;
        }
        
        // Añadir espaciado entre caracteres (salvo al final)
        if (i < text.length - 1) width += LETTER_SPACING;
    }
    return width;
}

// Función auxiliar para dibujar texto en la matriz
// showColon: controla si se dibujan los dos puntos (para el parpadeo)
function drawText(matrix, text, startX, startY, colorClass, showColon = true) {
    let currentX = startX;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i].toUpperCase();

        // 1. Manejo de espacios
        if (char === ' ') {
            currentX += SPACE_WIDTH + LETTER_SPACING;
            continue;
        }

        // 2. Lógica de parpadeo de dos puntos
        if (char === ':' && !showColon) {
            currentX += SPRITE_WIDTH + LETTER_SPACING;
            continue;
        }

        // 3. Dibujo de Caracter
        const sprite = PIXEL_FONT[char];
        if (!sprite) continue; 

        for (let r = 0; r < SPRITE_HEIGHT; r++) {
            for (let c = 0; c < SPRITE_WIDTH; c++) {
                if (sprite[r][c] === 1) { 
                    // Verificación de límites
                    if (startY + r >= 0 && startY + r < Config.ROWS && 
                        currentX + c >= 0 && currentX + c < Config.COLS) {
                        matrix[startY + r][currentX + c] = colorClass; 
                    }
                }
            }
        }
        currentX += SPRITE_WIDTH + LETTER_SPACING;
    }
}


function digital_clock(matrix) {
    const { COLS, ROWS, ON_COLOR_CLASS } = Config; 
    
    // 1. OBTENER DATOS DE FECHA Y HORA
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dayName = DAYS[now.getDay()];
    const dayNum = String(now.getDate());

    // Parpadeo: 500ms encendido / 500ms apagado
    const showColon = now.getMilliseconds() < 500;

    // --- MODO VERTICAL (Pantalla Alta, ej: 32x64) ---
    if (ROWS > COLS) {
        // Orden vertical: Hora, Minutos, Día, Número
        const lines = [hours, minutes, dayName, dayNum];
        // Colores: Hora/Min en blanco (principal), Día/Num en 'system' (secundario)
        const colors = [ON_COLOR_CLASS, ON_COLOR_CLASS, 'system', 'system'];

        // Calcular altura total del bloque para centrarlo verticalmente
        const totalContentHeight = (lines.length * SPRITE_HEIGHT) + ((lines.length - 1) * LINE_SPACING);
        let currentY = Math.floor((ROWS - totalContentHeight) / 2);

        // Dibujar cada línea centrada horizontalmente
        lines.forEach((lineText, index) => {
            const lineWidth = calculateTextWidth(lineText);
            const startX = Math.floor((COLS - lineWidth) / 2);
            
            // Pasamos showColon solo si estamos en la primera o segunda línea (Horas o Minutos)
            const shouldShowColon = index === 0 || index === 1 ? showColon : true;
            
            drawText(matrix, lineText, startX, currentY, colors[index], shouldShowColon);
            
            // Avanzar Y para la siguiente línea
            currentY += SPRITE_HEIGHT + LINE_SPACING;
        });

    } else {
        // MODO HORIZONTAL / CUADRADO (Standard 32x32, 64x32)
        const timeStr = `${hours}:${minutes}`; 
        const dateStr = `${dayName} ${dayNum}`; 

        // 2. CALCULAR DIMENSIONES DE CONTENIDO
        const timeWidth = calculateTextWidth(timeStr);
        const dateWidth = calculateTextWidth(dateStr);
        
        // Altura total del bloque de contenido (Hora + Espacio + Fecha)
        const totalContentHeight = SPRITE_HEIGHT + LINE_SPACING + SPRITE_HEIGHT;

        // 3. CALCULAR POSICIONES (CENTRADO)
        const startY_Time = Math.floor((ROWS - totalContentHeight) / 2);
        const startY_Date = startY_Time + SPRITE_HEIGHT + LINE_SPACING;

        const startX_Time = Math.floor((COLS - timeWidth) / 2);
        const startX_Date = Math.floor((COLS - dateWidth) / 2);

        // 4. DIBUJAR
        // Pasamos showColon para que los ':' parpadeen en la hora
        drawText(matrix, timeStr, startX_Time, startY_Time, ON_COLOR_CLASS, showColon);
        
        // La fecha siempre se muestra fija
        drawText(matrix, dateStr, startX_Date, startY_Date, 'system'); 
    }

    return matrix;
}

registerEffect('digital_clock', digital_clock);