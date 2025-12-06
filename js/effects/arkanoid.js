import { registerEffect, Config, KeyInput } from '../core.js';

// --- CONFIGURACIÓN DEL JUEGO ---
const PADDLE_WIDTH_BASE = 5;
const PADDLE_COLOR = 'system'; // Blanco
const BALL_COLOR = 'red'; // Blanco
const BG_COLOR = Config.NOISE_CLASS;

// Velocidades (Ajustadas para ser más lentas)
const PADDLE_SPEED = 1.0;
const BALL_SPEED_BASE = 0.15;
const POWERUP_SPEED = 0.1;

// Colores de los ladrillos por fila
const BRICK_COLORS = ['on'];

// --- ESTADO DEL JUEGO (Encapsulado) ---
let state = {
    paddle: { x: 0, width: PADDLE_WIDTH_BASE },
    balls: [],
    bricks: [],
    powerups: [],
    particles: [],
    gameStarted: false,
    score: 0,
    lives: 3,
    powerupState: {
        widePaddle: false,
        laser: false,
        timer: 0
    }
};

// --- INICIALIZACIÓN ---
function initGame(COLS, ROWS) {
    state.paddle.x = Math.floor(COLS / 2) - Math.floor(PADDLE_WIDTH_BASE / 2);
    state.paddle.width = PADDLE_WIDTH_BASE;

    // Reiniciar pelotas (empieza con una pegada a la pala)
    state.balls = [{
        x: state.paddle.x + Math.floor(state.paddle.width / 2),
        y: ROWS - 2,
        vx: 0,
        vy: 0,
        active: true,
        stuck: true // Pegada a la pala al inicio
    }];

    // Crear ladrillos
    state.bricks = [];
    const rowsOfBricks = Math.floor(ROWS / 4); // Ocupar 1/4 superior
    const colsOfBricks = COLS;

    // Dejar un margen superior de 2 filas
    for (let r = 2; r < 2 + rowsOfBricks; r++) {
        for (let c = 1; c < colsOfBricks - 1; c += 2) { // Ladrillos de 1px ancho, separados por 1px
            if (Math.random() > 0.1) { // 90% de probabilidad de ladrillo
                state.bricks.push({
                    r: r,
                    c: c,
                    color: BRICK_COLORS[(r - 2) % BRICK_COLORS.length],
                    active: true
                });
            }
        }
    }

    state.powerups = [];
    state.particles = [];
    state.gameStarted = true;
}

// --- FÍSICA Y LÓGICA ---
function updateGame(COLS, ROWS) {
    // 1. MOVER PALA (Control con Flechas)
    // Consumimos eventos recientes para mover
    const recentKeys = KeyInput.KEY_QUEUE.splice(0, KeyInput.KEY_QUEUE.length);

    recentKeys.forEach(k => {
        if (k.key === 'ARROWLEFT') state.paddle.x -= PADDLE_SPEED;
        if (k.key === 'ARROWRIGHT') state.paddle.x += PADDLE_SPEED;
        if (k.key === ' ' || k.key === 'ARROWUP') {
            // Lanzar pelota si está pegada
            state.balls.forEach(b => {
                if (b.stuck) {
                    b.stuck = false;
                    // Ángulo aleatorio hacia arriba
                    b.vx = (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED_BASE;
                    b.vy = -BALL_SPEED_BASE;
                }
            });
        }
    });

    // Límites de la pala
    if (state.paddle.x < 0) state.paddle.x = 0;
    if (state.paddle.x > COLS - state.paddle.width) state.paddle.x = COLS - state.paddle.width;

    // 2. ACTUALIZAR PELOTAS
    state.balls.forEach(b => {
        if (!b.active) return;

        if (b.stuck) {
            // Si está pegada, sigue a la pala
            b.x = state.paddle.x + Math.floor(state.paddle.width / 2);
            b.y = ROWS - 2;
        } else {
            // Movimiento
            let nextX = b.x + b.vx;
            let nextY = b.y + b.vy;

            // Rebote Paredes
            if (nextX <= 0 || nextX >= COLS - 1) {
                b.vx *= -1;
                nextX = b.x + b.vx;
            }
            if (nextY <= 0) {
                b.vy *= -1;
                nextY = b.y + b.vy;
            }

            // Rebote Pala
            if (nextY >= ROWS - 1 &&
                nextX >= state.paddle.x && nextX <= state.paddle.x + state.paddle.width) {

                b.vy *= -1;
                // Efecto de ángulo según dónde golpeó
                const hitPoint = nextX - (state.paddle.x + state.paddle.width / 2);
                b.vx = hitPoint * (BALL_SPEED_BASE * 0.8); // Ajuste suave de ángulo

                // Asegurar que suba y no se quede atascada horizontalmente
                b.y = ROWS - 2;
                if (Math.abs(b.vy) < BALL_SPEED_BASE * 0.5) b.vy = -BALL_SPEED_BASE;
            }

            // Muerte (cae al vacío)
            if (nextY >= ROWS) {
                b.active = false;
            }

            // Colisión Ladrillos
            let hit = false;
            for (let i = 0; i < state.bricks.length; i++) {
                let brick = state.bricks[i];
                if (!brick.active) continue;

                // Colisión simple punto vs punto
                if (Math.round(nextX) === brick.c && Math.round(nextY) === brick.r) {
                    brick.active = false;
                    b.vy *= -1;
                    hit = true;

                    // Generar Partículas
                    spawnExplosion(brick.c, brick.r, [brick.color]);

                    // Generar Powerup (15% prob)
                    if (Math.random() < 0.15) spawnPowerup(brick.c, brick.r);

                    break;
                }
            }

            if (!hit) {
                b.x = nextX;
                b.y = nextY;
            }
        }
    });

    // Limpiar pelotas muertas
    state.balls = state.balls.filter(b => b.active);

    // Si no quedan pelotas, perder vida
    if (state.balls.length === 0) {
        state.lives--;
        if (state.lives > 0) {
            // Respawn
            state.paddle.width = PADDLE_WIDTH_BASE; // Resetear ancho
            state.balls.push({
                x: state.paddle.x + Math.floor(state.paddle.width / 2),
                y: ROWS - 2,
                vx: 0,
                vy: 0,
                active: true,
                stuck: true
            });
        } else {
            // Game Over
            initGame(COLS, ROWS);
            state.lives = 3;
        }
    }

    // 3. ACTUALIZAR POWERUPS
    state.powerups.forEach(p => {
        if (!p.active) return;
        p.y += POWERUP_SPEED;

        if (p.y >= ROWS - 1 && p.x >= state.paddle.x && p.x <= state.paddle.x + state.paddle.width) {
            activatePowerup(p.type);
            p.active = false;
        }

        if (p.y > ROWS) p.active = false;
    });
    state.powerups = state.powerups.filter(p => p.active);

    // 4. ACTUALIZAR PARTÍCULAS
    state.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05; // Decaimiento más lento
    });
    state.particles = state.particles.filter(p => p.life > 0);
}

// --- FUNCIONES AUXILIARES ---
function spawnExplosion(x, y, colors) {
    for (let i = 0; i < 6; i++) {
        state.particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            color: colors[0],
            life: 1.0
        });
    }
}

function spawnPowerup(x, y) {
    const types = ['multiball', 'wide'];
    state.powerups.push({
        x: x, y: y,
        type: types[Math.floor(Math.random() * types.length)],
        active: true
    });
}

function activatePowerup(type) {
    if (type === 'multiball') {
        const currentBalls = [...state.balls];
        currentBalls.forEach(b => {
            // Triplicar pelota
            state.balls.push({ ...b, vx: b.vx - 0.1, stuck: false });
            state.balls.push({ ...b, vx: b.vx + 0.1, stuck: false });
        });
    } else if (type === 'wide') {
        state.paddle.width = Math.min(Config.COLS - 2, state.paddle.width + 4);
    }
}

// --- EFECTO (LIFECYCLE) ---

const ArkanoidEffect = {
    mount: (Shared) => {
        state = {
            paddle: { x: 0, width: PADDLE_WIDTH_BASE },
            balls: [],
            bricks: [],
            powerups: [],
            particles: [],
            gameStarted: false,
            score: 0,
            lives: 3,
            powerupState: {
                widePaddle: false,
                laser: false,
                timer: 0
            }
        };
        // Inicializar se hará en el primer update si es 'lazy' o aquí.
        // Lo dejamos lazy en update o forzado aquí, pero gameStarted=false forzará initGame en update.
    },

    unmount: (Shared) => {
        // Limpieza agresiva
        state.balls = [];
        state.bricks = [];
        state.particles = [];
        state.powerups = [];
    },

    update: (matrix, frameCount, Shared) => {
        const { COLS, ROWS } = Config;

        // Inicializar si es necesario
        if (!state.gameStarted || (state.balls.length === 0 && state.lives > 0)) {
            initGame(COLS, ROWS);
        }

        updateGame(COLS, ROWS);

        // 1. DIBUJAR PALA
        const isBallStuck = state.balls.some(b => b.stuck);

        for (let i = 0; i < state.paddle.width; i++) {
            const px = Math.floor(state.paddle.x + i);
            if (px >= 0 && px < COLS) {
                let color = PADDLE_COLOR;
                if (isBallStuck && i < state.lives) {
                    color = 'on';
                }
                matrix[ROWS - 1][px] = color;
            }
        }

        // 2. DIBUJAR LADRILLOS
        state.bricks.forEach(b => {
            if (b.active) {
                matrix[b.r][b.c] = b.color;
            }
        });

        // 3. DIBUJAR PELOTAS
        state.balls.forEach(b => {
            const bx = Math.floor(b.x);
            const by = Math.floor(b.y);
            if (bx >= 0 && bx < COLS && by >= 0 && by < ROWS) {
                matrix[by][bx] = BALL_COLOR;
            }
        });

        // 4. DIBUJAR POWERUPS
        state.powerups.forEach(p => {
            const px = Math.floor(p.x);
            const py = Math.floor(p.y);
            if (px >= 0 && px < COLS && py >= 0 && py < ROWS) {
                matrix[py][px] = (frameCount % 8 < 4) ? 'system' : 'on'; // Parpadeo lento
            }
        });

        // 5. DIBUJAR PARTÍCULAS
        state.particles.forEach(p => {
            const px = Math.floor(p.x);
            const py = Math.floor(p.y);
            if (px >= 0 && px < COLS && py >= 0 && py < ROWS) {
                matrix[py][px] = p.color;
            }
        });

        return matrix;
    }
};

registerEffect('arkanoid', ArkanoidEffect);