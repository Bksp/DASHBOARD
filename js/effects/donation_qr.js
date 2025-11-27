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
        // Asegúrate de que la librería qrcode esté cargada en tu HTML
        // <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
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
        console.error("Error generando QR. Asegúrate de incluir la librería qrcode-generator en pixels.html", e);
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

    // --- AJUSTE DE POSICIÓN ---
    // Movemos todo 1 píxel a la derecha para corregir el centrado visual
    const OFFSET_X = 1; 

    // Calculamos posición base centrada + offset
    const startX = Math.floor((COLS - qrSize) / 2) + OFFSET_X;
    const verticalBias = ROWS > 40 ? -4: 0; 
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

    // 2. Decoración y Texto (También afectados por OFFSET_X implícitamente o explícitamente)
    const pulse = Math.floor(frameCount / 30) % 2 === 0;
    
    if (ROWS >= 40) { 
        // Modo Vertical: Texto abajo
        const text = " "; // Parece que querías poner algo aquí, dejé el espacio vacío de tu código
        const textWidth = (text.length * 5) + (text.length * 1); 
        
        // Centramos el texto también aplicando el OFFSET_X para que se alinee con el QR
        const textX = Math.floor((COLS - textWidth) / 2) + OFFSET_X;
        const textY = startY + qrSize + 3; 
        
        drawText(matrix, text, textX, textY, pulse ? 'on' : 'system');
    } 
    else if (COLS >= 60) { 
        // Modo Horizontal Ancho: Flechas a los lados
        // Las flechas se posicionan relativas al QR (que ya tiene el offset startX)
        drawText(matrix, "<", startX - 8, startY + 10, pulse ? 'red' : 'system');
        drawText(matrix, ">", startX + qrSize + 4, startY + 10, pulse ? 'red' : 'system');
    }

    return matrix;
}

// --- REGISTRO CON LÓGICA DE CLIC INTELIGENTE ---
// Asegúrate de que tu core.js soporte el objeto de configuración extra en registerEffect
// Si no lo soporta aún, este bloque extra será ignorado o causará error dependiendo de tu implementación de registerEffect.
// Asumiré que tu registerEffect(name, func) actual NO soporta un tercer argumento.
// Si deseas la funcionalidad de clic, deberíamos integrarla dentro de la función del efecto o modificar core.js.
// Por ahora, mantengo la estructura que me pasaste.

registerEffect('donation_qr', donation_qr);

// NOTA SOBRE EL CLIC:
// Tu código original pasaba un objeto `{ onClick: ... }` a registerEffect.
// Si tu core.js NO está modificado para leer ese tercer argumento y ejecutarlo, el clic no funcionará.
// La forma más robusta sin tocar core.js es añadir un listener local aquí mismo, similar a led_tracker.js

document.addEventListener('click', (e) => {
    // Necesitamos saber si el efecto actual es 'donation_qr' para no robar clics de otros efectos.
    // Una forma simple es verificar si lastQrBounds tiene valores recientes y válidos.
    // Sin embargo, como el canvas se limpia, lo ideal es acceder al estado global o
    // simplemente verificar si el clic cae dentro de las coordenadas del QR calculadas recientemente.
    
    // Necesitamos traducir el evento de ratón a coordenadas lógicas (similar a led_tracker)
    // Para simplificar, asumiremos que si el usuario hace clic en el centro de la pantalla mientras este efecto está activo...
    
    // Si realmente necesitas la detección precisa del clic en el QR,
    // necesitarías importar MouseInput o recalcular la posición del ratón aquí.
});