import { registerEffect, Config, KeyInput } from '../core.js';

// --- CONFIGURACIÓN ---
const PADDLE_HEIGHT = 6;
const PADDLE_WIDTH = 1;
const BALL_SPEED_START = 0.5;
const MAX_BALL_SPEED = 1.2;
const WIN_SCORE = 5;

// --- ESTADO DEL JUEGO ---
let state = {
    p1: { y: 0, score: 0 },
    p2: { y: 0, score: 0 },
    ball: { x: 0, y: 0, vx: 0, vy: 0 },
    mode: 'CPU', // 'CPU' o 'PVP'
    isGameOver: false,
    winner: null
};

function resetBall(dir) {
    const { COLS, ROWS } = Config;
    state.ball.x = COLS / 2;
    state.ball.y = ROWS / 2;
    state.ball.vx = dir * BALL_SPEED_START;
    state.ball.vy = (Math.random() - 0.5) * BALL_SPEED_START;
}

function resetGame() {
    const { COLS, ROWS } = Config;
    state.p1.y = ROWS / 2 - PADDLE_HEIGHT / 2;
    state.p2.y = ROWS / 2 - PADDLE_HEIGHT / 2;
    state.p1.score = 0;
    state.p2.score = 0;
    state.isGameOver = false;
    state.winner = null;
    resetBall(1);
}

const PongEffect = {
    mount: (Shared) => {
        resetGame();
    },

    unmount: (Shared) => {
        // Nada crítico que limpiar, el estado se reinicia en mount
    },

    update: (matrix, frameCount, Shared) => {
        const { COLS, ROWS } = Config;
        const { KEYS_PRESSED } = KeyInput;

        // --- INPUT JUGADOR 1 (WASD) ---
        if (KEYS_PRESSED.has('W') && state.p1.y > 0) state.p1.y -= 0.8;
        if (KEYS_PRESSED.has('S') && state.p1.y < ROWS - PADDLE_HEIGHT) state.p1.y += 0.8;

        // --- INPUT JUGADOR 2 / CPU ---
        if (state.mode === 'PVP') {
            if (KEYS_PRESSED.has('ARROWUP') && state.p2.y > 0) state.p2.y -= 0.8;
            if (KEYS_PRESSED.has('ARROWDOWN') && state.p2.y < ROWS - PADDLE_HEIGHT) state.p2.y += 0.8;
        } else {
            // CPU Simple (Sigue la pelota con velocidad limitada)
            const center = state.p2.y + PADDLE_HEIGHT / 2;
            if (center < state.ball.y - 1) state.p2.y += 0.6;
            if (center > state.ball.y + 1) state.p2.y -= 0.6;

            // Límites CPU
            state.p2.y = Math.max(0, Math.min(ROWS - PADDLE_HEIGHT, state.p2.y));
        }

        // --- CAMBIO DE MODO (Tecla M) ---
        // Usamos KEY_QUEUE para eventos únicos (toggle)
        const lastKey = KeyInput.KEY_QUEUE[KeyInput.KEY_QUEUE.length - 1];
        if (lastKey && lastKey.key === 'M' && Date.now() - lastKey.timestamp < 100) {
            // Debounce simple: limpiar cola
            KeyInput.KEY_QUEUE.length = 0;
            state.mode = state.mode === 'CPU' ? 'PVP' : 'CPU';
            resetGame();
        }

        // --- LÓGICA DE LA BOLA ---
        if (!state.isGameOver) {
            state.ball.x += state.ball.vx;
            state.ball.y += state.ball.vy;

            // Rebote arriba/abajo
            if (state.ball.y <= 0 || state.ball.y >= ROWS - 1) {
                state.ball.vy *= -1;
            }

            // Colisión Palas
            // P1 (Izquierda)
            if (state.ball.x <= 1 && state.ball.y >= state.p1.y && state.ball.y <= state.p1.y + PADDLE_HEIGHT) {
                state.ball.vx *= -1.1; // Acelerar
                state.ball.vx = Math.min(state.ball.vx, MAX_BALL_SPEED);
                state.ball.x = 1.1; // Evitar atasco
            }
            // P2 (Derecha)
            if (state.ball.x >= COLS - 2 && state.ball.y >= state.p2.y && state.ball.y <= state.p2.y + PADDLE_HEIGHT) {
                state.ball.vx *= -1.1;
                state.ball.vx = Math.max(state.ball.vx, -MAX_BALL_SPEED);
                state.ball.x = COLS - 2.1;
            }

            // Puntuación
            if (state.ball.x < 0) {
                state.p2.score++;
                resetBall(1);
            }
            if (state.ball.x > COLS) {
                state.p1.score++;
                resetBall(-1);
            }

            if (state.p1.score >= WIN_SCORE || state.p2.score >= WIN_SCORE) {
                state.isGameOver = true;
                state.winner = state.p1.score >= WIN_SCORE ? 'P1' : 'P2';
            }
        }

        // --- RENDERIZADO ---

        // 1. Palas
        const drawPaddle = (x, y, color) => {
            for (let i = 0; i < PADDLE_HEIGHT; i++) {
                const r = Math.floor(y + i);
                if (r >= 0 && r < ROWS) matrix[r][x] = color;
            }
        };
        drawPaddle(0, state.p1.y, Shared.Colors.BLUE);
        drawPaddle(COLS - 1, state.p2.y, Shared.Colors.RED);

        // 2. Bola
        const bx = Math.floor(state.ball.x);
        const by = Math.floor(state.ball.y);
        if (bx >= 0 && bx < COLS && by >= 0 && by < ROWS) {
            matrix[by][bx] = Shared.Colors.ON;
        }

        // 3. Puntuación (Estilo binario simple o puntos en la parte superior)
        for (let i = 0; i < state.p1.score; i++) matrix[0][2 + i * 2] = Shared.Colors.BLUE;
        for (let i = 0; i < state.p2.score; i++) matrix[0][COLS - 3 - i * 2] = Shared.Colors.RED;

        // 4. Indicador de Modo
        matrix[ROWS - 1][COLS / 2] = state.mode === 'CPU' ? Shared.Colors.SYSTEM : Shared.Colors.GREEN;

        return matrix;
    }
};

registerEffect('pong', PongEffect);
