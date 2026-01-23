import { registerEffect, Config, MouseInput } from '../core.js';
import { PIXEL_FONT } from '../font.js';
import { Firework } from './fireworks.js';

// --- CONFIGURACIÓN ---
const LINK_URL = "https://bkspxx.itch.io/bksp-pixel-font"; // URL placeholder
const TEXT_LINE_1 = "BUY";
const TEXT_LINE_2 = "FONT";
const IGNITION_RATE = 30;

// --- ESTADO ---
let state = {
    activeFireworks: [],
    ignitionTimer: 0,
    textBounds: [], // Array de {x, y, w, h}

    // Wave Effect State
    waveCenterC: 0,
    waveCenterR: 0,
    lastWaveStartFrame: 0
};

// --- UTILS ---
function generateNewCenter(COLS, ROWS) {
    state.waveCenterC = Math.floor(Math.random() * COLS);
    state.waveCenterR = Math.floor(Math.random() * ROWS);

    return Math.max(
        Math.sqrt(state.waveCenterC ** 2 + state.waveCenterR ** 2),
        Math.sqrt((COLS - state.waveCenterC) ** 2 + state.waveCenterR ** 2),
        Math.sqrt(state.waveCenterC ** 2 + (ROWS - state.waveCenterR) ** 2),
        Math.sqrt((COLS - state.waveCenterC) ** 2 + (ROWS - state.waveCenterR) ** 2)
    );
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
            currentX += SPACE_WIDTH;
            continue;
        }

        const sprite = PIXEL_FONT[char];
        if (sprite) {
            for (let r = 0; r < SPRITE_HEIGHT; r++) {
                for (let c = 0; c < SPRITE_WIDTH; c++) {
                    if (sprite[r][c] === 1) {
                        const targetY = startY + r;
                        const targetX = currentX + c;
                        if (targetY >= 0 && targetY < Config.ROWS && targetX >= 0 && targetX < Config.COLS) {
                            matrix[targetY][targetX] = colorClass;
                        }
                    }
                }
            }
        }
        currentX += SPRITE_WIDTH + LETTER_SPACING;
    }

    return { x: startX, y: startY, w: currentX - startX, h: SPRITE_HEIGHT };
}

// --- EFECTO ---
const BuyFontEffect = {
    mount: (Shared) => {
        state.activeFireworks = [];
        state.ignitionTimer = 0;
        state.textBounds = [];
        state.lastWaveStartFrame = 0;
        state.waveCenterC = 0; // Force regen
        state.waveCenterR = 0;
    },

    unmount: (Shared) => {
        state.activeFireworks = [];
        state.textBounds = [];
    },

    onClick: (e) => {
        const { c, r } = MouseInput.position;
        for (const box of state.textBounds) {
            if (c >= box.x && c < box.x + box.w &&
                r >= box.y && r < box.y + box.h) {

                console.log("LINK CLICKED!", LINK_URL);
                window.open(LINK_URL, '_blank');
                return true;
            }
        }
        return false;
    },

    update: (matrix, frameCount, Shared) => {
        const { COLS, ROWS } = Config;

        // ------------------------------------------
        // 1. EXPANDING CIRCLE BACKGROUND (RED)
        // ------------------------------------------
        const wave_speed = 0.2;
        const wave_thickness = 2.5;
        let max_radius;

        // Init wave if needed
        if (state.waveCenterC === 0 && state.waveCenterR === 0) {
            max_radius = generateNewCenter(COLS, ROWS);
        } else {
            // Calculate max_radius based on current center
            max_radius = Math.max(
                Math.sqrt(state.waveCenterC ** 2 + state.waveCenterR ** 2),
                Math.sqrt((COLS - state.waveCenterC) ** 2 + state.waveCenterR ** 2),
                Math.sqrt(state.waveCenterC ** 2 + (ROWS - state.waveCenterR) ** 2),
                Math.sqrt((COLS - state.waveCenterC) ** 2 + (ROWS - state.waveCenterR) ** 2)
            );
        }

        const elapsed_frames = frameCount - state.lastWaveStartFrame;
        const current_wave_pos = elapsed_frames * wave_speed;

        if (current_wave_pos > max_radius + wave_thickness * 2) {
            // Reset wave
            state.lastWaveStartFrame = frameCount;
            max_radius = generateNewCenter(COLS, ROWS);
        }

        // Draw Wave
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const r_dist = r - state.waveCenterR;
                const c_dist = c - state.waveCenterC;
                const distance = Math.sqrt(r_dist * r_dist + c_dist * c_dist);
                const diff = Math.abs(distance - current_wave_pos); // Re-calculated loop logic safely

                if (diff < wave_thickness) {
                    matrix[r][c] = Shared.Colors.RED; // RED WAVE
                }
            }
        }


        // ------------------------------------------
        // 2. FIREWORKS (RED ONLY)
        // ------------------------------------------
        const palette = [Shared.Colors.RED]; // ONLY RED

        state.ignitionTimer++;
        if (state.ignitionTimer >= IGNITION_RATE) {
            const fw = new Firework();
            fw.spawn(COLS, ROWS, palette);
            state.activeFireworks.push(fw);
            state.ignitionTimer = 0;
        }

        state.activeFireworks = state.activeFireworks.filter(f => f.update());
        state.activeFireworks.forEach(f => f.draw(matrix));

        // ------------------------------------------
        // 3. TEXT "BUY FONT" (BLINKING)
        // ------------------------------------------
        state.textBounds = [];

        // Blink logic: Grey -> Red -> Grey
        // 'system' is usually grey/dim cyan, let's use OFF or a specific dimmer color if available.
        // Assuming 'system' is the requested 'grey' equivalent or using Shared.Colors.OFF for off blink?
        // User asked for "parpadeo a gris". 'system' is often used as the "dim" or "grey" color in this system.

        const blinkSpeed = 30; // Frames per blink state
        const isRed = Math.floor(frameCount / blinkSpeed) % 2 === 0;
        const textColor = isRed ? Shared.Colors.ON : Shared.Colors.SYSTEM; // "ON" (usually green/white) vs "SYSTEM" (grey/dim)
        // Wait per user request: "parpadeo a gris" implies it blinks TO grey. 
        // The main color wasn't fully specified, but previous was ON. 
        // Let's alternate between ON (Active) and SYSTEM (Greyish/Dim).

        const SPRITE_HEIGHT = 7;
        const SPRITE_WIDTH = 5;
        const GAP = 1;

        const w1 = TEXT_LINE_1.length * (SPRITE_WIDTH + GAP) - GAP;
        const w2 = TEXT_LINE_2.length * (SPRITE_WIDTH + GAP) - GAP;
        const totalW_SingleLine = w1 + (3 * GAP) + w2;

        if (ROWS >= 40) {
            // MODO VERTICAL
            const TEXT_LINE_3 = "$3";

            const yStart = Math.floor((ROWS - (SPRITE_HEIGHT * 3 + GAP * 2)) / 2);
            const y1 = yStart;
            const y2 = yStart + SPRITE_HEIGHT + GAP;
            const y3 = yStart + (SPRITE_HEIGHT + GAP) * 2;

            const x1 = Math.floor((COLS - (TEXT_LINE_1.length * (SPRITE_WIDTH + GAP) - GAP)) / 2);
            const x2 = Math.floor((COLS - (TEXT_LINE_2.length * (SPRITE_WIDTH + GAP) - GAP)) / 2);
            const x3 = Math.floor((COLS - (TEXT_LINE_3.length * (SPRITE_WIDTH + GAP) - GAP)) / 2);

            state.textBounds.push(drawText(matrix, TEXT_LINE_1, x1, y1, textColor));
            state.textBounds.push(drawText(matrix, TEXT_LINE_2, x2, y2, textColor));
            state.textBounds.push(drawText(matrix, TEXT_LINE_3, x3, y3, textColor));

        } else if (COLS >= totalW_SingleLine + 2) {
            // MODO HORIZONTAL (UNA LÍNEA)
            const finalX = Math.floor((COLS - totalW_SingleLine) / 2);
            const startY = Math.floor((ROWS - SPRITE_HEIGHT) / 2);

            const box = drawText(matrix, TEXT_LINE_1 + " " + TEXT_LINE_2, finalX, startY, textColor);
            state.textBounds.push(box);
        } else {
            // MODO COMPACTO (DOS LÍNEAS)
            const y1 = Math.floor(ROWS / 2) - SPRITE_HEIGHT - 1;
            const y2 = Math.floor(ROWS / 2) + 1;

            const x1 = Math.floor((COLS - w1) / 2);
            const x2 = Math.floor((COLS - w2) / 2);

            const box1 = drawText(matrix, TEXT_LINE_1, x1, y1, textColor);
            const box2 = drawText(matrix, TEXT_LINE_2, x2, y2, textColor);

            state.textBounds.push(box1);
            state.textBounds.push(box2);
        }

        return matrix;
    }
};

registerEffect('buyFont', BuyFontEffect);
