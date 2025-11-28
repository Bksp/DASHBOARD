import { initializeDisplay, detectAndSetDimensions, loadEffect } from './core.js';

function calculateVisualDimensions() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;

    // --- LÓGICA DE ESCALADO ADAPTATIVO ---
    let targetCols = 36;
    let targetRows = 36;

    if (aspectRatio < 0.65) {
        targetRows = 70;
        targetCols = 36;
    }
    else if (aspectRatio > 1.6) {
        targetCols = 70;
        targetRows = 36;
    }

    const sizeFromWidth = Math.floor(width / targetCols);
    const sizeFromHeight = Math.floor(height / targetRows);

    let finalPixelSize = Math.min(sizeFromWidth, sizeFromHeight);

    const MAX_PIXEL_SIZE = 24;
    const MIN_PIXEL_SIZE = 8;

    if (finalPixelSize > MAX_PIXEL_SIZE) finalPixelSize = MAX_PIXEL_SIZE;
    if (finalPixelSize < MIN_PIXEL_SIZE) finalPixelSize = MIN_PIXEL_SIZE;

    const visualCols = Math.floor(width / finalPixelSize);
    const visualRows = Math.floor(height / finalPixelSize);

    document.documentElement.style.setProperty('--grid-cols', visualCols);
    document.documentElement.style.setProperty('--grid-rows', visualRows);

    detectAndSetDimensions(visualCols, visualRows);
}

async function initApp() {
    calculateVisualDimensions();
    initializeDisplay();

    window.addEventListener('resize', () => {
        calculateVisualDimensions();
    });

    // Cargar efectos dinámicamente
    const effects = [
        './effects/digital_clock.js',
        './effects/expanding_circle.js',
        './effects/key_tester.js',
        './effects/led_tracker.js',
        './effects/scrolling_marquee.js',
        './effects/spectrum_analyzer.js',
        './effects/fireworks.js',
        './effects/clock_fireworks.js',
        './effects/tetris_clock.js',
        './effects/donation_qr.js',
        './effects/arkanoid.js',
        './effects/space_invaders.js',
        './effects/matrix_rain.js',
        './effects/pong.js',
        './effects/color_plasma.js'
    ];

    for (const effect of effects) {
        await loadEffect(effect);
    }
}

document.addEventListener('DOMContentLoaded', initApp);
