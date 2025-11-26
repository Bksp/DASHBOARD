import { registerEffect, Config, KeyInput } from '../core.js';
import { PIXEL_FONT } from '../font.js';

// --- CONSTANTES DE JUEGO ---
const BLOCK_SIZE = 2; // Cada bloque de tetris son 2x2 píxeles reales
const TICK_RATE_AI = 8; // Velocidad relajada
const TICK_RATE_USER = 5; 

// --- CONSTANTES VISUALES DEL RELOJ ---
const SPRITE_WIDTH = 5; 
const SPRITE_HEIGHT = 7; 
const SPACE_WIDTH = 2; 
const LETTER_SPACING = 1;
const LINE_SPACING = 3; 
const DAYS = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];

// Definición de Piezas (Tetrominos)
const SHAPES = {
    I: { color: 'blue',   blocks: [[1,1,1,1]] },
    J: { color: 'blue',   blocks: [[1,0,0],[1,1,1]] },
    L: { color: 'orange', blocks: [[0,0,1],[1,1,1]] },
    O: { color: 'yellow', blocks: [[1,1],[1,1]] },
    S: { color: 'green',  blocks: [[0,1,1],[1,1,0]] },
    T: { color: 'purple', blocks: [[0,1,0],[1,1,1]] },
    Z: { color: 'red',    blocks: [[1,1,0],[0,1,1]] }
};

const SHAPE_KEYS = Object.keys(SHAPES);

// --- ESTADO DEL JUEGO ---
let grid = []; 
let bag = [];  
let currentPiece = null;
let score = 0;
let gameOver = false;
let frameCounter = 0;

// Variables de IA y Control
let isUserControlling = false;
let aiPath = []; 
let aiMoveIndex = 0;
let lastUserActionTime = 0;

// --- UTILIDADES DE TEXTO ---
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

// --- UTILIDADES DEL RELOJ ---
function drawClock(matrix) {
    const { COLS, ROWS, ON_COLOR_CLASS } = Config;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dayName = DAYS[now.getDay()];
    const dayNum = String(now.getDate());
    const showColon = now.getMilliseconds() < 500;

    // Dibujamos DIRECTAMENTE con drawText, sin outlines ni cajas de fondo.
    // Esto mezcla las letras con el contenido de atrás.

    if (ROWS > COLS) {
        // --- MODO VERTICAL ---
        const lines = [hours, minutes, dayName, dayNum];
        const colors = [ON_COLOR_CLASS, ON_COLOR_CLASS, 'system', 'system'];
        
        const totalContentHeight = (lines.length * SPRITE_HEIGHT) + ((lines.length - 1) * LINE_SPACING);
        let currentY = Math.floor((ROWS - totalContentHeight) / 2) + 1;
        
        lines.forEach((lineText, index) => {
            const lineWidth = calculateTextWidth(lineText);
            const startX = Math.floor((COLS - lineWidth) / 2) + 1;
            const shouldShowColon = index === 0 || index === 1 ? showColon : true;
            
            drawText(matrix, lineText, startX, currentY, colors[index], shouldShowColon);
            currentY += SPRITE_HEIGHT + LINE_SPACING;
        });

    } else {
        // --- MODO HORIZONTAL ---
        const timeStr = `${hours}:${minutes}`; 
        const totalContentHeight = SPRITE_HEIGHT + LINE_SPACING + SPRITE_HEIGHT;
        const base_startY = Math.floor((ROWS - totalContentHeight) / 2);
        
        const startY_Time = base_startY + 1;
        const startY_Date = startY_Time + SPRITE_HEIGHT + LINE_SPACING;

        const timeWidth = calculateTextWidth(timeStr);
        
        const centerDateBlockX = Math.floor(COLS / 2);
        const startX_Time = Math.floor((COLS - timeWidth) / 2);
        const dayNameWidth = calculateTextWidth(dayName);
        const startX_DayName = centerDateBlockX - dayNameWidth - 4; 
        const startX_Dot = startX_DayName + dayNameWidth + LETTER_SPACING;
        const startX_DayNum = centerDateBlockX + 3; 

        drawText(matrix, timeStr, startX_Time, startY_Time, ON_COLOR_CLASS, showColon);
        drawText(matrix, dayName, startX_DayName, startY_Date, 'system'); 
        drawText(matrix, '.', startX_Dot, startY_Date, 'system', true); 
        drawText(matrix, dayNum, startX_DayNum, startY_Date, 'system'); 
    }
}

// --- LÓGICA DE TETRIS ---

function initGame() {
    const cols = Math.floor(Config.COLS / BLOCK_SIZE);
    const rows = Math.floor(Config.ROWS / BLOCK_SIZE);
    
    grid = Array(rows).fill().map(() => Array(cols).fill(null));
    bag = [];
    spawnPiece();
    gameOver = false;
}

function getPiece() {
    if (bag.length === 0) {
        bag = [...SHAPE_KEYS, ...SHAPE_KEYS]; 
        bag.sort(() => Math.random() - 0.5);
    }
    const type = bag.pop();
    return {
        type: type,
        matrix: SHAPES[type].blocks,
        color: SHAPES[type].color,
        x: 0,
        y: 0
    };
}

function rotate(matrix) {
    const N = matrix.length;
    const M = matrix[0].length;
    const result = Array(M).fill().map(() => Array(N).fill(0));
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < M; j++) {
            result[j][N - 1 - i] = matrix[i][j];
        }
    }
    return result;
}

function collide(arena, player) {
    const m = player.matrix;
    const o = {x: player.x, y: player.y};
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] && arena[y + o.y][x + o.x]) !== null) {
                return true;
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                if (arena[y + player.y] && arena[y + player.y][x + player.x] !== undefined) {
                     arena[y + player.y][x + player.x] = player.color;
                }
            }
        });
    });
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = grid.length -1; y > 0; --y) {
        for (let x = 0; x < grid[y].length; ++x) {
            if (grid[y][x] === null) {
                continue outer;
            }
        }
        const row = grid.splice(y, 1)[0].fill(null);
        grid.unshift(row);
        ++y;
        score += rowCount * 10;
        rowCount *= 2;
    }
}

// --- INTELIGENCIA ARTIFICIAL (IA) ---
function calculateBestMove() {
    const moves = [];
    const boardWidth = grid[0].length;
    
    let testPiece = JSON.parse(JSON.stringify(currentPiece));
    
    for (let r = 0; r < 4; r++) {
        for (let x = -2; x < boardWidth; x++) {
            testPiece.x = x;
            testPiece.y = 0;
            
            if (!collide(grid, testPiece)) {
                while (!collide(grid, testPiece)) {
                    testPiece.y++;
                }
                testPiece.y--; 
                
                const score = evaluateBoardState(grid, testPiece);
                moves.push({
                    x: x,
                    rotation: r,
                    score: score
                });
            }
        }
        testPiece.matrix = rotate(testPiece.matrix);
    }
    
    moves.sort((a, b) => b.score - a.score);
    return moves.length > 0 ? moves[0] : null;
}

function evaluateBoardState(arena, piece) {
    const tempGrid = arena.map(row => [...row]);
    
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                if (tempGrid[y + piece.y] && tempGrid[y + piece.y][x + piece.x] !== undefined) {
                    tempGrid[y + piece.y][x + piece.x] = 1; 
                }
            }
        });
    });

    let aggregateHeight = 0;
    let completeLines = 0;
    let holes = 0;
    let bumpiness = 0;
    
    const rows = tempGrid.length;
    const cols = tempGrid[0].length;
    const columnHeights = new Array(cols).fill(0);

    for (let x = 0; x < cols; x++) {
        let colHeight = 0;
        for (let y = 0; y < rows; y++) {
            if (tempGrid[y][x] !== null) {
                colHeight = rows - y;
                for (let k = y + 1; k < rows; k++) {
                    if (tempGrid[k][x] === null) holes++;
                }
                break;
            }
        }
        columnHeights[x] = colHeight;
        aggregateHeight += colHeight;
    }

    for (let y = 0; y < rows; y++) {
        if (tempGrid[y].every(cell => cell !== null)) completeLines++;
    }

    for (let x = 0; x < cols - 1; x++) {
        bumpiness += Math.abs(columnHeights[x] - columnHeights[x+1]);
    }

    return (0.76 * completeLines) - (0.51 * aggregateHeight) - (0.36 * holes) - (0.18 * bumpiness);
}

function generateAIPath(bestMove) {
    const path = [];
    if (!bestMove) return path;

    for (let i = 0; i < bestMove.rotation; i++) {
        path.push('ROTATE');
    }
    
    const currentX = Math.floor((grid[0].length / 2)) - Math.floor(currentPiece.matrix[0].length / 2);
    let deltaX = bestMove.x - currentPiece.x; 

    if (deltaX > 0) {
        for (let i = 0; i < deltaX; i++) path.push('RIGHT');
    } else {
        for (let i = 0; i < Math.abs(deltaX); i++) path.push('LEFT');
    }
    return path;
}


function spawnPiece() {
    currentPiece = getPiece();
    const cols = grid[0].length;
    currentPiece.x = Math.floor(cols / 2) - Math.floor(currentPiece.matrix[0].length / 2);
    currentPiece.y = 0;

    isUserControlling = false;
    
    const bestMove = calculateBestMove();
    aiPath = generateAIPath(bestMove);
    aiMoveIndex = 0;

    if (collide(grid, currentPiece)) {
        grid.forEach(row => row.fill(null));
        score = 0;
    }
}

function playerMove(dir) {
    currentPiece.x += dir;
    if (collide(grid, currentPiece)) {
        currentPiece.x -= dir;
    }
}

function playerRotate() {
    const pos = currentPiece.x;
    let offset = 1;
    const matrix = rotate(currentPiece.matrix);
    const originalMatrix = currentPiece.matrix;
    currentPiece.matrix = matrix;
    
    while (collide(grid, currentPiece)) {
        currentPiece.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > currentPiece.matrix[0].length) {
            rotate(originalMatrix); 
            currentPiece.matrix = originalMatrix;
            currentPiece.x = pos;
            return;
        }
    }
}

function playerDrop() {
    currentPiece.y++;
    if (collide(grid, currentPiece)) {
        currentPiece.y--;
        merge(grid, currentPiece);
        spawnPiece();
        arenaSweep();
    }
}


// --- LOOP PRINCIPAL ---

function tetris_clock(matrix, frameCount) {
    // 1. Inicialización Lazy
    const logicCols = Math.floor(Config.COLS / BLOCK_SIZE);
    const logicRows = Math.floor(Config.ROWS / BLOCK_SIZE);
    
    if (!grid || grid.length !== logicRows || grid[0].length !== logicCols) {
        initGame();
    }

    // 2. Procesar Input de Usuario
    const inputs = KeyInput.KEY_QUEUE.splice(0, KeyInput.KEY_QUEUE.length); 
    
    if (inputs.length > 0) {
        isUserControlling = true; 
        lastUserActionTime = Date.now();
        
        inputs.forEach(input => {
            if (input.key === 'ARROWLEFT') playerMove(-1);
            if (input.key === 'ARROWRIGHT') playerMove(1);
            if (input.key === 'ARROWUP') playerRotate();
            if (input.key === 'ARROWDOWN') playerDrop();
        });
    }

    if (Date.now() - lastUserActionTime > 2000) {
        isUserControlling = false;
    }

    // 3. Lógica de Juego
    frameCounter++;
    const speed = isUserControlling ? TICK_RATE_USER : TICK_RATE_AI;

    if (frameCounter % speed === 0) {
        if (!isUserControlling) {
            if (aiMoveIndex < aiPath.length) {
                const move = aiPath[aiMoveIndex];
                if (move === 'ROTATE') playerRotate();
                if (move === 'LEFT') playerMove(-1);
                if (move === 'RIGHT') playerMove(1);
                aiMoveIndex++;
            } else {
                playerDrop();
            }
        } else {
            if (frameCounter % (speed * 4) === 0) {
                 playerDrop();
            }
        }
    }

    // 4. Renderizado
    
    // A) Dibujar Tablero
    grid.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const px = x * BLOCK_SIZE;
                const py = y * BLOCK_SIZE;
                
                if (py < Config.ROWS && px < Config.COLS) matrix[py][px] = value;
                if (py < Config.ROWS && px+1 < Config.COLS) matrix[py][px+1] = value;
                if (py+1 < Config.ROWS && px < Config.COLS) matrix[py+1][px] = value;
                if (py+1 < Config.ROWS && px+1 < Config.COLS) matrix[py+1][px+1] = value;
            }
        });
    });

    // B) Dibujar Pieza Activa
    if (currentPiece) {
        currentPiece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const px = (currentPiece.x + x) * BLOCK_SIZE;
                    const py = (currentPiece.y + y) * BLOCK_SIZE;
                    
                    if (py >= 0 && py < Config.ROWS && px >= 0 && px < Config.COLS) {
                        if (py < Config.ROWS && px < Config.COLS) matrix[py][px] = currentPiece.color;
                        if (py < Config.ROWS && px+1 < Config.COLS) matrix[py][px+1] = currentPiece.color;
                        if (py+1 < Config.ROWS && px < Config.COLS) matrix[py+1][px] = currentPiece.color;
                        if (py+1 < Config.ROWS && px+1 < Config.COLS) matrix[py+1][px+1] = currentPiece.color;
                    }
                }
            });
        });
    }

    // C) Dibujar Reloj (Sin caja, con outline)
    drawClock(matrix);

    return matrix;
}

registerEffect('tetris_clock', tetris_clock);