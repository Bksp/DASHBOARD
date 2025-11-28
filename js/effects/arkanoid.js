import { registerEffect, Config, KeyInput } from '../core.js';

// --- CONFIGURACIÓN DEL JUEGO ---
const PADDLE_WIDTH_BASE = 5;
const PADDLE_COLOR = 'system'; // Blanco
const BALL_COLOR = 'red'; // Blanco
const BG_COLOR = Config.NOISE_CLASS;

// Velocidades (Ajustadas para ser más lentas)
const PADDLE_SPEED = 1.0; 
// *** CAMBIO: Velocidad de la pelota reducida ***
const BALL_SPEED_BASE = 0.15; // Antes 0.25
const POWERUP_SPEED = 0.1;

// Colores de los ladrillos por fila
const BRICK_COLORS = ['on'];

// --- ESTADO DEL JUEGO ---
let paddle = { x: 0, width: PADDLE_WIDTH_BASE };
let balls = []; // Array de objetos pelota {x, y, vx, vy, active}
let bricks = []; // Array de ladrillos {r, c, color, active}
let powerups = []; // Items que caen {x, y, type, active}
let particles = []; // Partículas de explosión

let gameStarted = false;
let score = 0;
let lives = 3;

// Estado de Power-ups
let powerupState = {
    widePaddle: false,
    laser: false,
    timer: 0
};

// --- INICIALIZACIÓN ---
function initGame(COLS, ROWS) {
    paddle.x = Math.floor(COLS / 2) - Math.floor(PADDLE_WIDTH_BASE / 2);
    paddle.width = PADDLE_WIDTH_BASE;
    
    // Reiniciar pelotas (empieza con una pegada a la pala)
    balls = [{
        x: paddle.x + Math.floor(paddle.width / 2),
        y: ROWS - 2,
        vx: 0,
        vy: 0,
        active: true,
        stuck: true // Pegada a la pala al inicio
    }];

    // Crear ladrillos
    bricks = [];
    const rowsOfBricks = Math.floor(ROWS / 4); // Ocupar 1/4 superior
    const colsOfBricks = COLS; 
    
    // Dejar un margen superior de 2 filas
    for (let r = 2; r < 2 + rowsOfBricks; r++) {
        for (let c = 1; c < colsOfBricks - 1; c += 2) { // Ladrillos de 1px ancho, separados por 1px
             if (Math.random() > 0.1) { // 90% de probabilidad de ladrillo
                 bricks.push({
                     r: r,
                     c: c,
                     color: BRICK_COLORS[(r - 2) % BRICK_COLORS.length],
                     active: true
                 });
             }
        }
    }
    
    powerups = [];
    particles = [];
    gameStarted = true;
}

// --- FÍSICA Y LÓGICA ---
function updateGame(COLS, ROWS) {
    // 1. MOVER PALA (Control con Flechas)
    // Consumimos eventos recientes para mover
    const recentKeys = KeyInput.KEY_QUEUE.splice(0, KeyInput.KEY_QUEUE.length);
    
    recentKeys.forEach(k => {
        if (k.key === 'ARROWLEFT') paddle.x -= PADDLE_SPEED;
        if (k.key === 'ARROWRIGHT') paddle.x += PADDLE_SPEED;
        if (k.key === ' ' || k.key === 'ARROWUP') {
            // Lanzar pelota si está pegada
            balls.forEach(b => {
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
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x > COLS - paddle.width) paddle.x = COLS - paddle.width;

    // 2. ACTUALIZAR PELOTAS
    balls.forEach(b => {
        if (!b.active) return;

        if (b.stuck) {
            // Si está pegada, sigue a la pala
            b.x = paddle.x + Math.floor(paddle.width / 2);
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
                nextX >= paddle.x && nextX <= paddle.x + paddle.width) {
                
                b.vy *= -1;
                // Efecto de ángulo según dónde golpeó
                const hitPoint = nextX - (paddle.x + paddle.width / 2);
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
            for (let i = 0; i < bricks.length; i++) {
                let brick = bricks[i];
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
    balls = balls.filter(b => b.active);
    
    // Si no quedan pelotas, perder vida
    if (balls.length === 0) {
        lives--;
        if (lives > 0) {
            // Respawn
            paddle.width = PADDLE_WIDTH_BASE; // Resetear ancho
            balls.push({
                x: paddle.x + Math.floor(paddle.width / 2),
                y: ROWS - 2,
                vx: 0,
                vy: 0,
                active: true,
                stuck: true
            });
        } else {
            // Game Over
            initGame(COLS, ROWS);
            lives = 3;
        }
    }

    // 3. ACTUALIZAR POWERUPS
    powerups.forEach(p => {
        if (!p.active) return;
        p.y += POWERUP_SPEED; 

        if (p.y >= ROWS - 1 && p.x >= paddle.x && p.x <= paddle.x + paddle.width) {
            activatePowerup(p.type);
            p.active = false;
        }
        
        if (p.y > ROWS) p.active = false;
    });
    powerups = powerups.filter(p => p.active);

    // 4. ACTUALIZAR PARTÍCULAS
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05; // Decaimiento más lento
    });
    particles = particles.filter(p => p.life > 0);
}

// --- FUNCIONES AUXILIARES ---
function spawnExplosion(x, y, colors) {
    for (let i = 0; i < 6; i++) {
        particles.push({
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
    powerups.push({
        x: x, y: y,
        type: types[Math.floor(Math.random() * types.length)],
        active: true
    });
}

function activatePowerup(type) {
    if (type === 'multiball') {
        const currentBalls = [...balls];
        currentBalls.forEach(b => {
            // Triplicar pelota
            balls.push({ ...b, vx: b.vx - 0.1, stuck: false });
            balls.push({ ...b, vx: b.vx + 0.1, stuck: false });
        });
    } else if (type === 'wide') {
        paddle.width = Math.min(Config.COLS - 2, paddle.width + 4);
    }
}

// --- FUNCIÓN PRINCIPAL DE RENDERIZADO ---
function arkanoid(matrix, frameCount) {
    const { COLS, ROWS, ON_COLOR_CLASS } = Config;

    // Inicializar si es necesario
    if (!gameStarted || (balls.length === 0 && lives > 0)) {
        initGame(COLS, ROWS);
    }

    updateGame(COLS, ROWS);

    // 1. DIBUJAR PALA
    // Verificamos si alguna pelota está pegada para mostrar las vidas
    const isBallStuck = balls.some(b => b.stuck);

    for (let i = 0; i < paddle.width; i++) {
        const px = Math.floor(paddle.x + i);
        if (px >= 0 && px < COLS) {
            let color = PADDLE_COLOR;
            
            // Lógica de visualización de vidas en la barra
            // Si la pelota está cargada, los primeros N píxeles de la barra son verdes
            if (isBallStuck && i < lives) {
                color = 'on';
            }
            
            matrix[ROWS - 1][px] = color;
        }
    }

    // 2. DIBUJAR LADRILLOS
    bricks.forEach(b => {
        if (b.active) {
            matrix[b.r][b.c] = b.color;
        }
    });

    // 3. DIBUJAR PELOTAS
    balls.forEach(b => {
        const bx = Math.floor(b.x);
        const by = Math.floor(b.y);
        if (bx >= 0 && bx < COLS && by >= 0 && by < ROWS) {
            matrix[by][bx] = BALL_COLOR;
        }
    });

    // 4. DIBUJAR POWERUPS
    powerups.forEach(p => {
        const px = Math.floor(p.x);
        const py = Math.floor(p.y);
        if (px >= 0 && px < COLS && py >= 0 && py < ROWS) {
            matrix[py][px] = (frameCount % 8 < 4) ? 'system' : 'on'; // Parpadeo lento
        }
    });

    // 5. DIBUJAR PARTÍCULAS
    particles.forEach(p => {
        const px = Math.floor(p.x);
        const py = Math.floor(p.y);
        if (px >= 0 && px < COLS && py >= 0 && py < ROWS) {
            matrix[py][px] = p.color; 
        }
    });

    return matrix;
}

registerEffect('arkanoid', arkanoid);