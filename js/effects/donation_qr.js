import { registerEffect, Config } from '../core.js';
import { PIXEL_FONT } from '../font.js';

// --- CONFIGURACIÓN ---
const PAYPAL_LINK = "https://paypal.me/AlessyDevoid"; 
const QR_COLOR = Config.ON_COLOR_CLASS; 
const QR_BG = 'bg-noise'; 

let qrMatrix = null;
let qrSize = 0;

// Almacenamos la posición del último frame dibujado para comprobar clics
let lastQrBounds = { x: 0, y: 0, w: 0, h: 0 };

function generateQR() {
    try {
        const qr = qrcode(0, 'L'); 
        qr.addData(PAYPAL_LINK);
        qr.make();
        qrSize = qr.getModuleCount();
        
        qrMatrix = [];
        for (let r = 0; r < qrSize; r++) {
            const row = [];
            for (let c = 0; c < qrSize; c++) {
                row.push(qr.isDark(r, c));
            }
            qrMatrix.push(row);
        }
        console.log(`QR Generado. Tamaño: ${qrSize}x${qrSize}`);
    } catch (e) {
        console.error("Error generando QR", e);
    }
}

function drawText(matrix, text, startX, startY, colorClass) {
    const SPRITE_WIDTH = 5; 
    const SPRITE_HEIGHT = 7; 
    const SPACE_WIDTH = 2; 
    const LETTER_SPACING = 1;
    let currentX = startX;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i].toUpperCase();
        if (char === ' ') {
            currentX += SPACE_WIDTH + LETTER_SPACING;
            continue;
        }
        const sprite = PIXEL_FONT[char];
        if (!sprite) continue; 

        for (let r = 0; r < SPRITE_HEIGHT; r++) {
            for (let c = 0; c < SPRITE_WIDTH; c++) {
                if (sprite[r][c] === 1) { 
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

function donation_qr(matrix, frameCount) {
    if (!qrMatrix) generateQR();
    if (!qrMatrix) return matrix; 

    const { COLS, ROWS } = Config;

    // Calculamos posición
    const startX = Math.floor((COLS - qrSize) / 2);
    const verticalBias = ROWS > 40 ? -4 : 0; 
    const startY = Math.floor((ROWS - qrSize) / 2) + verticalBias;

    // ACTUALIZAMOS LOS LÍMITES PARA LA DETECCIÓN DE CLIC
    lastQrBounds = { 
        x: startX, 
        y: startY, 
        w: qrSize, 
        h: qrSize 
    };

    // 1. Dibujar QR
    for (let r = 0; r < qrSize; r++) {
        for (let c = 0; c < qrSize; c++) {
            const cell = qrMatrix[r][c];
            const drawR = startY + r;
            const drawC = startX + c;

            if (drawR >= 0 && drawR < ROWS && drawC >= 0 && drawC < COLS) {
                if (cell) {
                    matrix[drawR][drawC] = QR_COLOR;
                }
            }
        }
    }

    // 2. Decoración y Texto
    const pulse = Math.floor(frameCount / 30) % 2 === 0;
    
    if (ROWS >= 40) { 
        const text = " ";
        const textWidth = (text.length * 5) + (text.length * 1); 
        const textX = Math.floor((COLS - textWidth) / 2);
        const textY = startY + qrSize + 4; 
        
        drawText(matrix, text, textX, textY, pulse ? 'on' : 'system');
    } 
    else if (COLS >= 60) { 
        drawText(matrix, "<", startX - 8, startY + 10, pulse ? 'red' : 'system');
        drawText(matrix, ">", startX + qrSize + 4, startY + 10, pulse ? 'red' : 'system');
    }

    return matrix;
}

// --- REGISTRO CON LÓGICA DE CLIC INTELIGENTE ---
registerEffect('donation_qr', donation_qr, {
    onClick: (e, clickC, clickR) => {
        // clickC y clickR son las coordenadas (Columna, Fila) donde se hizo clic en el grid lógico.
        
        // Verificamos si el clic está DENTRO del cuadrado del QR
        if (clickC >= lastQrBounds.x && clickC < lastQrBounds.x + lastQrBounds.w &&
            clickR >= lastQrBounds.y && clickR < lastQrBounds.y + lastQrBounds.h) {
            
            // ¡Clic DENTRO del QR! -> Abrir enlace
            if (confirm("¿Quieres abrir el enlace de donación?")) {
                window.open(PAYPAL_LINK, '_blank');
            }
            return true; // "Consumimos" el evento (no cambia pantalla)
        }
        
        // ¡Clic FUERA del QR! -> Retornamos false
        // Esto le dice al Core: "Yo no usé este clic, haz lo que hagas por defecto" (que es cambiar pantalla)
        return false; 
    }
});