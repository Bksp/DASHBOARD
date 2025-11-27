import { registerEffect, Config, KeyInput, MouseInput } from '../core.js';

// --- CONFIGURACIÓN ---
const PLAYER_COLOR = 'on';
const BULLET_COLOR = 'on';
const ENEMY_COLOR_1 = 'red';
const ENEMY_COLOR_2 = 'purple';

const PLAYER_SPEED = 1.0;
const BULLET_SPEED = 0.5;
const ENEMY_SPEED_X = 0.05; // Velocidad lateral de los enemigos
const ENEMY_DROP_SPEED = 1.0; // Cuánto bajan al tocar borde

// --- ESTADO DEL JUEGO ---
let playerX = 0;
let bullets = []; // {x, y, active}
let enemies = []; // {x, y, type, active}
let enemyDirection = 1; // 1: Derecha, -1: Izquierda
let gameStarted = false;
let score = 0;
let lives = 3;
let lastFireTime = 0;

// Partículas de explosión (reutilizamos lógica simple)
let particles = []; 

function initGame(COLS, ROWS) {
    playerX = Math.floor(COLS / 2);
    bullets = [];
    enemies = [];
    particles = [];
    enemyDirection = 1;
    
    // Crear formación de enemigos
    // Dejar márgenes y no llenar todo
    const rows = 3; 
    const cols = Math.floor(COLS / 2); // Un enemigo cada 2 pixeles aprox
    const startY = 2;
    const startX = 2;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (c % 2 === 0) { // Espaciar enemigos
                enemies.push({
                    x: startX + c,
                    y: startY + r * 2, // Espaciar filas
                    type: r % 2 === 0 ? 1 : 2, // Alternar tipos para color
                    active: true
                });
            }
        }
    }
    gameStarted = true;
}

function spawnExplosion(x, y, color) {
    for (let i = 0; i < 4; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            color: color,
            life: 1.0
        });
    }
}

function updateGame(COLS, ROWS) {
    const now = Date.now();

    // 1. MOVER JUGADOR
    // Mouse (Prioridad)
    if (MouseInput && MouseInput.position && MouseInput.position.c >= 0) {
        playerX = MouseInput.position.c;
    } 
    // Teclado
    else {
        const keys = KeyInput.KEY_QUEUE.splice(0, KeyInput.KEY_QUEUE.length);
        keys.forEach(k => {
            if (k.key === 'ARROWLEFT') playerX -= 1;
            if (k.key === 'ARROWRIGHT') playerX += 1;
            if (k.key === ' ' || k.key === 'ARROWUP') {
                // Disparar (con cooldown simple)
                if (now - lastFireTime > 300) {
                    bullets.push({ x: Math.floor(playerX), y: ROWS - 2, active: true });
                    lastFireTime = now;
                }
            }
        });
    }
    
    // Disparo automático con click derecho (si se desea) o mantener espacio
    // Para simplificar en este entorno, el disparo es manual con espacio/arriba

    // Límites Jugador
    if (playerX < 0) playerX = 0;
    if (playerX >= COLS) playerX = COLS - 1;

    // 2. ACTUALIZAR BALAS
    bullets.forEach(b => {
        b.y -= BULLET_SPEED;
        if (b.y < 0) b.active = false;
    });

    // 3. ACTUALIZAR ENEMIGOS
    let touchEdge = false;
    let lowestEnemyY = 0;

    enemies.forEach(e => {
        if (!e.active) return;
        
        // Mover lateral
        e.x += ENEMY_SPEED_X * enemyDirection;
        
        // Detectar bordes
        if (e.x <= 0 || e.x >= COLS - 1) {
            touchEdge = true;
        }
        
        if (e.y > lowestEnemyY) lowestEnemyY = e.y;
    });

    // Bajar enemigos si tocan borde
    if (touchEdge) {
        enemyDirection *= -1;
        enemies.forEach(e => {
            if (e.active) e.y += ENEMY_DROP_SPEED;
        });
    }

    // 4. COLISIONES (Bala vs Enemigo)
    bullets.forEach(b => {
        if (!b.active) return;
        
        for (let e of enemies) {
            if (!e.active) continue;
            
            // Colisión simple (distancia < 1)
            if (Math.abs(b.x - e.x) < 1 && Math.abs(b.y - e.y) < 1) {
                e.active = false;
                b.active = false;
                spawnExplosion(e.x, e.y, e.type === 1 ? ENEMY_COLOR_1 : ENEMY_COLOR_2);
                break; 
            }
        }
    });
    
    // Limpiar inactivos
    bullets = bullets.filter(b => b.active);
    
    // 5. GAME OVER / WIN
    // Si los enemigos llegan abajo
    if (lowestEnemyY >= ROWS - 1) {
        // Reiniciar
        initGame(COLS, ROWS);
    }
    // Si no quedan enemigos
    if (!enemies.some(e => e.active)) {
        initGame(COLS, ROWS); // Nivel infinito (reinicia)
    }

    // 6. ACTUALIZAR PARTÍCULAS
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.1;
    });
    particles = particles.filter(p => p.life > 0);
}

function space_invaders(matrix, frameCount) {
    const { COLS, ROWS } = Config;

    if (!gameStarted) {
        initGame(COLS, ROWS);
    }

    updateGame(COLS, ROWS);

    // DIBUJAR JUGADOR
    const px = Math.floor(playerX);
    if (px >= 0 && px < COLS) {
        matrix[ROWS - 1][px] = PLAYER_COLOR;
        // Dibujar un punto arriba para simular la punta de la nave
        if (ROWS - 2 >= 0) matrix[ROWS - 2][px] = PLAYER_COLOR; 
    }

    // DIBUJAR ENEMIGOS
    enemies.forEach(e => {
        if (e.active) {
            const ex = Math.floor(e.x);
            const ey = Math.floor(e.y);
            if (ex >= 0 && ex < COLS && ey >= 0 && ey < ROWS) {
                // Animación simple de "alas" usando frameCount
                const open = Math.floor(frameCount / 20) % 2 === 0;
                matrix[ey][ex] = e.type === 1 ? ENEMY_COLOR_1 : ENEMY_COLOR_2;
                
                // Dibujar alas si hay espacio (opcional para 32x32)
                // if (open && ex-1 >=0) matrix[ey][ex-1] = e.type === 1 ? ENEMY_COLOR_1 : ENEMY_COLOR_2;
                // if (open && ex+1 < COLS) matrix[ey][ex+1] = e.type === 1 ? ENEMY_COLOR_1 : ENEMY_COLOR_2;
            }
        }
    });

    // DIBUJAR BALAS
    bullets.forEach(b => {
        const bx = Math.floor(b.x);
        const by = Math.floor(b.y);
        if (bx >= 0 && bx < COLS && by >= 0 && by < ROWS) {
            matrix[by][bx] = BULLET_COLOR;
        }
    });

    // DIBUJAR PARTÍCULAS
    particles.forEach(p => {
        const px = Math.floor(p.x);
        const py = Math.floor(p.y);
        if (px >= 0 && px < COLS && py >= 0 && py < ROWS) {
            matrix[py][px] = p.color;
        }
    });

    return matrix;
}

registerEffect('space_invaders', space_invaders);