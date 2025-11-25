import { registerEffect, Config } from '../core.js';

// --- CONFIGURACIÓN DE PARTÍCULAS ---
const COLORS = ['on','system', Config.ON_COLOR_CLASS];
const NUM_PARTICLES = 50; 
const GRAVITY = 0.00; // REDUCIDO A CERO (la gravedad no existe para las partículas de fuego artificial)
const ASCENT_SPEED = 0.2; // Velocidad de subida del cohete
const EXPLOSION_FACTOR = 4; // <--- AJUSTADO A 4 PARA UNA EXPLOSIÓN MÁS LENTA
const MAX_HEIGHT_FACTOR = 0.5; // Altura máxima de la explosión (50% superior)

// --- ESTADO PERSISTENTE ---
let activeFireworks = []; // Almacena todas las explosiones activas
let ignitionTimer = 0;    
const IGNITION_RATE = 40; // Una nueva ignición cada 40 frames (~0.66s)

// --- CLASE PARTICLE (Partículas de la explosión) ---
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
        // La gravedad se mantiene en cero
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime -= this.decay;
        this.vx *= 0.98; // Fricción (desaceleración)
        this.vy *= 0.98;
    }

    isFinished() {
        return this.lifetime <= 0;
    }
}

// --- CLASE FIREWORK (Cohete de lanzamiento) ---
class Firework {
    constructor(COLS, ROWS) {
        // Cohete inicia en la parte inferior y tiene una altura objetivo
        this.x = Math.random() * COLS;
        this.y = ROWS; // Inicia fuera de la parte inferior de la pantalla
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.targetY = Math.random() * (ROWS * MAX_HEIGHT_FACTOR) + (ROWS * 0.1); // Altura máxima entre 10% y 60%
        
        this.exploded = false;
        this.particles = [];
    }

    // El cohete asciende lentamente
    updateAscent() {
        if (this.y > this.targetY) {
            this.y -= ASCENT_SPEED;
            return true; // Sigue subiendo
        }
        return false; // Ha llegado al objetivo
    }
    
    // Genera la explosión
    explode() {
        this.exploded = true;
        
        // Crea las partículas con vectores aleatorios
        for (let i = 0; i < NUM_PARTICLES; i++) {
            const angle = Math.random() * 2 * Math.PI;
            
            // Velocidad de explosión ahora es más lenta gracias a EXPLOSION_FACTOR = 4
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
            if (!this.updateAscent()) {
                this.explode();
            }
        }
        
        // Si ha explotado, actualiza las partículas
        if (this.exploded) {
            this.particles = this.particles.filter(p => !p.isFinished());
            this.particles.forEach(p => p.update());
        }
        
        // El Firework está activo si está subiendo O si tiene partículas
        return !this.exploded || this.particles.length > 0;
    }

    draw(matrix) {
        if (!this.exploded) {
            // Dibuja el rastro del cohete ascendente (un solo píxel)
            const r = Math.floor(this.y);
            const c = Math.floor(this.x);
            if (r >= 0 && r < Config.ROWS && c >= 0 && c < Config.COLS) {
                matrix[r][c] = this.color; 
            }
        } else {
            // Dibuja la explosión de partículas
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

// --- FUNCIÓN PRINCIPAL DEL EFECTO ---
function fireworks(matrix, frameCount) {
    const { COLS, ROWS } = Config;

    // 1. GESTIONAR EL INICIO DE NUEVOS FUEGOS ARTIFICIALES
    ignitionTimer++;
    if (ignitionTimer >= IGNITION_RATE) {
        activeFireworks.push(new Firework(COLS, ROWS));
        ignitionTimer = 0;
    }

    // 2. ACTUALIZAR Y DIBUJAR
    // Filtrar los fuegos artificiales que ya terminaron
    activeFireworks = activeFireworks.filter(f => f.update());

    // Dibujar los fuegos artificiales activos
    activeFireworks.forEach(f => f.draw(matrix));

    return matrix;
}

// --- REGISTRO DEL EFECTO ---
registerEffect('fireworks', fireworks);