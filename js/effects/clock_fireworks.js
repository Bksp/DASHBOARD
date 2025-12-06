import { registerEffect, Config } from '../core.js';
import { PIXEL_FONT } from '../font.js';

// ==========================================
// CONFIGURACIÓN Y UTILIDADES DEL RELOJ
// ==========================================
const SPRITE_WIDTH = 5;
const SPRITE_HEIGHT = 7;
const SPACE_WIDTH = 2;
const LETTER_SPACING = 1;
const LINE_SPACING = 3;
const DAYS = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];

function calculateTextWidth(text) {
    let width = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text[i].toUpperCase();
        if (char === ' ') {
            width += SPACE_WIDTH;
        } else if (PIXEL_FONT[char]) {
            width += SPRITE_WIDTH;
        }
        if (i < text.length - 1) width += LETTER_SPACING;
    }
    return width;
}

function drawText(matrix, text, startX, startY, colorClass, showColon = true) {
    let currentX = startX;
    for (let i = 0; i < text.length; i++) {
        const char = text[i].toUpperCase();
        if (char === ' ') {
            currentX += SPACE_WIDTH + LETTER_SPACING;
            continue;
        }
        if (char === ':' && !showColon) {
            currentX += SPRITE_WIDTH + LETTER_SPACING;
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

// ==========================================
// CONFIGURACIÓN Y CLASES DE FUEGOS ARTIFICIALES
// ==========================================
const FW_COLORS = ['red', 'system'];
const NUM_PARTICLES = 10;
const ASCENT_SPEED = 0.2;
const EXPLOSION_FACTOR = 4;
const MAX_HEIGHT_FACTOR = 0.5;
const IGNITION_RATE = 30;

// Configuración de estado encapsulado
let state = {
    activeFireworks: [],
    ignitionTimer: 0
};

class Particle {
    constructor(startX, startY, color, velocity) {
        this.x = startX;
        this.y = startY;
        this.color = color;
        this.vx = velocity.vx;
        this.vy = velocity.vy;
        this.lifetime = 1.0;
        this.decay = 0.01;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime -= this.decay;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    isFinished() { return this.lifetime <= 0; }
}

class Firework {
    constructor(COLS, ROWS) {
        this.x = Math.random() * COLS;
        this.y = ROWS;
        this.color = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)];
        this.targetY = Math.random() * (ROWS * MAX_HEIGHT_FACTOR) + (ROWS * 0.1);
        this.exploded = false;
        this.particles = [];
    }
    updateAscent() {
        if (this.y > this.targetY) {
            this.y -= ASCENT_SPEED;
            return true;
        }
        return false;
    }
    explode() {
        this.exploded = true;
        for (let i = 0; i < NUM_PARTICLES; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const speed = ASCENT_SPEED * EXPLOSION_FACTOR * (0.8 + Math.random() * 0.4);
            const velocity = {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed
            };
            this.particles.push(new Particle(this.x, this.y, this.color, velocity));
        }
    }
    update() {
        if (!this.exploded) {
            if (!this.updateAscent()) this.explode();
        }
        if (this.exploded) {
            this.particles = this.particles.filter(p => !p.isFinished());
            this.particles.forEach(p => p.update());
        }
        return !this.exploded || this.particles.length > 0;
    }
    draw(matrix) {
        if (!this.exploded) {
            const r = Math.floor(this.y);
            const c = Math.floor(this.x);
            if (r >= 0 && r < Config.ROWS && c >= 0 && c < Config.COLS) {
                matrix[r][c] = this.color;
            }
        } else {
            this.particles.forEach(p => {
                const r = Math.floor(p.y);
                const c = Math.floor(p.x);
                if (r >= 0 && r < Config.ROWS && c >= 0 && c < Config.COLS) {
                    matrix[r][c] = p.color;
                }
            });
        }
    }
}

// ==========================================
// EFECTO (LIFECYCLE)
// ==========================================

const ClockFireworksEffect = {
    mount: (Shared) => {
        state = {
            activeFireworks: [],
            ignitionTimer: 0
        };
    },

    unmount: (Shared) => {
        state.activeFireworks = [];
        state.ignitionTimer = 0;
    },

    update: (matrix, globalFrameCount, Shared) => {
        const { COLS, ROWS, ON_COLOR_CLASS } = Config;

        // --- 1. CAPA DE FONDO: FUEGOS ARTIFICIALES ---
        state.ignitionTimer++;
        if (state.ignitionTimer >= IGNITION_RATE) {
            state.activeFireworks.push(new Firework(COLS, ROWS));
            state.ignitionTimer = 0;
        }

        // Actualizar y dibujar fuegos artificiales
        state.activeFireworks = state.activeFireworks.filter(f => f.update());
        state.activeFireworks.forEach(f => f.draw(matrix));


        // --- 2. CAPA SUPERIOR: RELOJ DIGITAL ---
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const dayName = DAYS[now.getDay()];
        const dayNum = String(now.getDate()).padStart(2, '0');
        const showColon = now.getMilliseconds() < 500;

        // Lógica Vertical
        if (ROWS > COLS) {
            const lines = [hours, minutes, dayName, dayNum];
            const colors = [ON_COLOR_CLASS, ON_COLOR_CLASS, 'system', 'system'];
            const totalContentHeight = (lines.length * SPRITE_HEIGHT) + ((lines.length - 0) * LINE_SPACING);
            let currentY = Math.floor((ROWS - totalContentHeight) / 2) + 1;
            const offsetX = 1;

            lines.forEach((lineText, index) => {
                const lineWidth = calculateTextWidth(lineText);
                const startX = Math.floor((COLS - lineWidth) / 2) + offsetX;
                const shouldShowColon = index === 0 || index === 1 ? showColon : true;
                drawText(matrix, lineText, startX, currentY, colors[index], shouldShowColon);
                currentY += SPRITE_HEIGHT + LINE_SPACING;
            });

        } else {
            // Lógica Horizontal
            const timeStr = `${hours}:${minutes}`;
            const timeWidth = calculateTextWidth(timeStr);
            const dayNameWidth = calculateTextWidth(dayName);
            const totalContentHeight = SPRITE_HEIGHT + LINE_SPACING + SPRITE_HEIGHT;
            const base_startY = Math.floor((ROWS - totalContentHeight) / 2);

            const startY_Time = base_startY + 1;
            const startY_Date = startY_Time + SPRITE_HEIGHT + LINE_SPACING;

            const centerDateBlockX = Math.floor(COLS / 2);
            const startX_Time = Math.floor((COLS - timeWidth) / 2);
            const startX_DayName = centerDateBlockX - dayNameWidth - 4;
            const startX_Dot = startX_DayName + dayNameWidth + LETTER_SPACING;
            const startX_DayNum = centerDateBlockX + 3;

            // Dibujamos el texto sobre los fuegos artificiales
            drawText(matrix, timeStr, startX_Time, startY_Time, ON_COLOR_CLASS, showColon);
            drawText(matrix, dayName, startX_DayName, startY_Date, 'system');
            drawText(matrix, '.', startX_Dot, startY_Date, 'system', true);
            drawText(matrix, dayNum, startX_DayNum, startY_Date, 'system');
        }

        return matrix;
    }
};

registerEffect('clock_fireworks', ClockFireworksEffect);