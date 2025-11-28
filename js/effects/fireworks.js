import { registerEffect, Config } from '../core.js';

// --- CONFIGURACIÓN DE PARTÍCULAS ---
const COLORS = ['on', 'system', 'red']; // Se completará con Shared.Colors
const NUM_PARTICLES = 10;
const ASCENT_SPEED = 0.2;
const EXPLOSION_FACTOR = 4;
const MAX_HEIGHT_FACTOR = 0.5;
const IGNITION_RATE = 40;

// --- ESTADO PERSISTENTE (Pools) ---
let activeFireworks = [];
let ignitionTimer = 0;

// --- CLASE PARTICLE (Partículas de la explosión) ---
class Particle {
    constructor(startX, startY, color, velocity) {
        this.init(startX, startY, color, velocity);
    }

    init(startX, startY, color, velocity) {
        this.x = startX;
        this.y = startY;
        this.color = color;
        this.vx = velocity.vx;
        this.vy = velocity.vy;
        this.lifetime = 1.0;
        this.decay = 0.01;
        this.active = true;
    }

    update() {
        if (!this.active) return;
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime -= this.decay;
        this.vx *= 0.98;
        this.vy *= 0.98;
        if (this.lifetime <= 0) this.active = false;
    }
}

// --- CLASE FIREWORK (Cohete de lanzamiento) ---
class Firework {
    constructor() {
        this.active = false;
        this.particles = [];
    }

    spawn(COLS, ROWS, colorPalette) {
        this.x = Math.random() * COLS;
        this.y = ROWS;
        this.color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        this.targetY = Math.random() * (ROWS * MAX_HEIGHT_FACTOR) + (ROWS * 0.1);
        this.exploded = false;
        this.active = true;
        this.particles = []; // Limpiar partículas previas
    }

    update() {
        if (!this.active) return false;

        if (!this.exploded) {
            if (this.y > this.targetY) {
                this.y -= ASCENT_SPEED;
            } else {
                this.explode();
            }
        } else {
            // Actualizar partículas
            let activeParticles = 0;
            for (const p of this.particles) {
                p.update();
                if (p.active) activeParticles++;
            }
            if (activeParticles === 0) this.active = false;
        }
        return this.active;
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

    draw(matrix) {
        if (!this.active) return;

        if (!this.exploded) {
            const r = Math.floor(this.y);
            const c = Math.floor(this.x);
            if (r >= 0 && r < Config.ROWS && c >= 0 && c < Config.COLS) {
                matrix[r][c] = this.color;
            }
        } else {
            for (const p of this.particles) {
                if (!p.active) continue;
                const r = Math.floor(p.y);
                const c = Math.floor(p.x);
                if (r >= 0 && r < Config.ROWS && c >= 0 && c < Config.COLS) {
                    matrix[r][c] = p.color;
                }
            }
        }
    }
}

const FireworksEffect = {
    mount: (Shared) => {
        activeFireworks = [];
        ignitionTimer = 0;
        // Pre-calentar pool si fuera necesario, por ahora dinámico
    },

    unmount: (Shared) => {
        activeFireworks = []; // Liberar memoria inmediatamente
    },

    update: (matrix, frameCount, Shared) => {
        const { COLS, ROWS } = Config;
        const palette = [Shared.Colors.ON, Shared.Colors.SYSTEM, Shared.Colors.RED, Shared.Colors.YELLOW];

        // 1. GESTIONAR EL INICIO DE NUEVOS FUEGOS ARTIFICIALES
        ignitionTimer++;
        if (ignitionTimer >= IGNITION_RATE) {
            const fw = new Firework(); // Podríamos usar pool aquí también
            fw.spawn(COLS, ROWS, palette);
            activeFireworks.push(fw);
            ignitionTimer = 0;
        }

        // 2. ACTUALIZAR Y DIBUJAR
        // Filtrar inactivos para mantener el array pequeño
        activeFireworks = activeFireworks.filter(f => f.update());
        activeFireworks.forEach(f => f.draw(matrix));

        return matrix;
    }
};

registerEffect('fireworks', FireworksEffect);