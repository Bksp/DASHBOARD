# DASHBOARD - Pixel Display
![](./img/mockup.png)

https://bksp.github.io/DASHBOARD/pixels.html

[🇺🇸 English Documentation below](#-dashboard---pixel-display-english)

Un sistema de visualización de píxeles interactivo y optimizado, diseñado para ser ligero y estéticamente agradable. Incluye varios efectos visuales y minijuegos totalmente funcionales.

## 🚀 Cómo Usar
Simplemente abre el archivo `pixels.html` en tu navegador web favorito. No requiere instalación ni servidor.

## 📱 Catálogo de Aplicaciones

### ✅ Habilitadas (Activas en rotación)
Estas aplicaciones están activas por defecto en `js/main.js`:

1.  **Digital Clock (`digital_clock.js`)**
    *   **Qué hace:** Muestra la hora (HH:MM), día de la semana y fecha.
    *   **Funcionamiento:** Se adapta inteligentemente a la orientación de la pantalla (Vertical/Horizontal). Incluye parpadeo de dos puntos.

2.  **Expanding Circle (`expanding_circle.js`)**
    *   **Qué hace:** Genera ondas circulares hipnóticas que nacen en puntos aleatorios y se expanden hasta cubrir la pantalla.
    *   **Funcionamiento:** Usa matemáticas para calcular la distancia desde el centro de la onda.

3.  **Key Tester (`key_tester.js`)**
    *   **Qué hace:** Herramienta de diagnóstico para teclado.
    *   **Funcionamiento:** Muestra "KEYS" cuando está inactivo. Al pulsar teclas, estas aparecen en pantalla y se desvanecen suavemente con el tiempo.

4.  **LED Tracker (`led_tracker.js`)**
    *   **Qué hace:** Sistema de partículas interactivo y salvapantallas.
    *   **Funcionamiento:**
        *   **Interactivo:** El mouse/dedo deja una estela de luz brillante que se disipa. Clic derecho crea explosiones.
        *   **Salvapantallas:** Tras inactividad, una bola de luz rebota por la pantalla (estilo DVD) generando estelas y explosiones al chocar.

5.  **Clock Fireworks (`clock_fireworks.js`)**
    *   **Qué hace:** Combina la utilidad del reloj con la estética de los fuegos artificiales.
    *   **Funcionamiento:** Muestra la hora en primer plano mientras se generan explosiones de colores aleatorios en el fondo.

6.  **Tetris Clock (`tetris_clock.js`)**
    *   **Qué hace:** Un reloj superpuesto a una partida de Tetris automática.
    *   **Funcionamiento:** Una IA juega Tetris infinitamente en el fondo.
        *   **Modo Jugable:** Si presionas las flechas, tomas el control de la partida (Izquierda/Derecha/Arriba-Rotar/Abajo-Caer). El control vuelve a la IA tras 2 segundos de inactividad.

7.  **Color Plasma (`color_plasma.js`)**
    *   **Qué hace:** Genera un patrón de ondas de colores suaves y psicodélicos.
    *   **Funcionamiento:** Utiliza una tabla de senos pre-calculada (LUT) para un rendimiento extremo y bajo consumo de CPU.

### ❌ Deshabilitadas (Disponibles en código)
Estas aplicaciones están presentes en la carpeta `js/effects/` pero comentadas en `js/main.js`. Pueden activarse descomentando una línea.

1.  **Pong (`pong.js`)**
    *   **Qué hace:** Clásico juego de tenis de mesa.
    *   **Funcionamiento:** Soporta modo CPU (Auto) y PvP (2 Jugadores). Controles: W/S (P1) y Flechas (P2).

2.  **Arkanoid (`arkanoid.js`)**
    *   **Qué hace:** Juego de romper ladrillos.
    *   **Funcionamiento:** Controla la pala con flechas. Incluye físicas de rebote, sistema de vidas, puntuación y Power-ups (Multibola, Pala Ancha).

3.  **Matrix Rain (`matrix_rain.js`)**
    *   **Qué hace:** Simulación de la lluvia de código digital de Matrix.
    *   **Funcionamiento:** Estelas verdes con caracteres que caen a diferentes velocidades.

4.  **Space Invaders (`space_invaders.js`)**
    *   **Qué hace:** Juego de disparos arcade.
    *   **Funcionamiento:** Nave controlable que dispara a hordas de alienígenas que descienden.

5.  **Fireworks (`fireworks.js`)**
    *   **Qué hace:** Efecto puro de fuegos artificiales (sin reloj).
    *   **Funcionamiento:** Cohetes que ascienden y explotan en partículas con gravedad y desvanecimiento.

6.  **Scrolling Marquee (`scrolling_marquee.js`)**
    *   **Qué hace:** Muestra un mensaje de texto desplazándose horizontalmente.
    *   **Funcionamiento:** Texto "COMPLETOS" (configurable) moviéndose en bucle.

7.  **Spectrum Analyzer (`spectrum_analyzer.js`)**
    *   **Qué hace:** Simulación visual de un ecualizador de música.
    *   **Funcionamiento:** Barras verticales que suben y bajan aleatoriamente simulando frecuencias de audio.

8.  **Donation QR (`donation_qr.js`)**
    *   **Qué hace:** Muestra un código QR escaneable.
    *   **Funcionamiento:** Genera un QR en tiempo real que apunta a un enlace de PayPal.

## 🎮 Controles Generales
- **Cambiar Efecto**: Haz clic en cualquier lugar (o toca) para rotar al siguiente efecto habilitado.
- **Modo Inactivo**: Tras 5 segundos sin actividad, el sistema reduce los FPS a 1 para ahorrar energía.

## ⚡ Optimizaciones Técnicas
- **Core v9.1**: Motor gráfico optimizado para bajo consumo.
- **Shared Resources**: Gestión eficiente de memoria.
- **Effect Lifecycle**: Carga y descarga dinámica de recursos.
- **Dynamic FPS**: Ahorro de batería inteligente.

## 📝 Roadmap
### Minijuegos
- Mejorar Arkanoid
- Mejorar Pong
- Mejorar Space Invaders
---
### Funcionalidades
- Transformar en una API
- Crear Sintetizador de sonido
- Crear Visor de Datos de PC
- Crear Visor y Editor de Imágenes
- Añadir a Sonic

---

# 🇺🇸 DASHBOARD - Pixel Display (English)

An interactive and optimized pixel display system, designed to be lightweight and aesthetically pleasing. It includes various visual effects and fully functional minigames.

## 🚀 How to Use
Simply open the `pixels.html` file in your favorite web browser. No installation or server required.

## 📱 App Catalog

### ✅ Enabled (Active in rotation)
These applications are active by default in `js/main.js`:

1.  **Digital Clock (`digital_clock.js`)**
    *   **What it does:** Displays time (HH:MM), day of the week, and date.
    *   **How it works:** Smartly adapts to screen orientation (Vertical/Horizontal). Includes blinking colon.

2.  **Expanding Circle (`expanding_circle.js`)**
    *   **What it does:** Generates hypnotic circular waves that spawn at random points and expand to cover the screen.
    *   **How it works:** Uses math to calculate distance from the wave center.

3.  **Key Tester (`key_tester.js`)**
    *   **What it does:** Keyboard diagnostic tool.
    *   **How it works:** Displays "KEYS" when idle. When keys are pressed, they appear on screen and fade out smoothly over time.

4.  **LED Tracker (`led_tracker.js`)**
    *   **What it does:** Interactive particle system and screensaver.
    *   **How it works:**
        *   **Interactive:** Mouse/finger leaves a glowing light trail that dissipates. Right-click creates explosions.
        *   **Screensaver:** After inactivity, a light ball bounces around the screen (DVD style) generating trails and explosions on impact.

5.  **Clock Fireworks (`clock_fireworks.js`)**
    *   **What it does:** Combines the utility of a clock with the aesthetics of fireworks.
    *   **How it works:** Displays time in the foreground while generating random colored explosions in the background.

6.  **Tetris Clock (`tetris_clock.js`)**
    *   **What it does:** A clock overlaid on an automatic Tetris game.
    *   **How it works:** An AI plays Tetris infinitely in the background.
        *   **Playable Mode:** If you press arrow keys, you take control of the game (Left/Right/Up-Rotate/Down-Drop). Control returns to AI after 2 seconds of inactivity.

7.  **Color Plasma (`color_plasma.js`)**
    *   **What it does:** Generates a pattern of smooth, psychedelic color waves.
    *   **How it works:** Uses a pre-calculated sine table (LUT) for extreme performance and low CPU usage.

### ❌ Disabled (Available in code)
These applications are present in the `js/effects/` folder but commented out in `js/main.js`. They can be activated by uncommenting a line.

1.  **Pong (`pong.js`)**
    *   **What it does:** Classic table tennis game.
    *   **How it works:** Supports CPU mode (Auto) and PvP (2 Players). Controls: W/S (P1) and Arrows (P2).

2.  **Arkanoid (`arkanoid.js`)**
    *   **What it does:** Brick breaking game.
    *   **How it works:** Control the paddle with arrows. Includes bounce physics, life system, scoring, and Power-ups (Multiball, Wide Paddle).

3.  **Matrix Rain (`matrix_rain.js`)**
    *   **What it does:** Simulation of the Matrix digital code rain.
    *   **How it works:** Green trails with characters falling at different speeds.

4.  **Space Invaders (`space_invaders.js`)**
    *   **What it does:** Arcade shooter game.
    *   **How it works:** Controllable ship shooting at descending hordes of aliens.

5.  **Fireworks (`fireworks.js`)**
    *   **What it does:** Pure fireworks effect (without clock).
    *   **How it works:** Rockets that ascend and explode into particles with gravity and fading.

6.  **Scrolling Marquee (`scrolling_marquee.js`)**
    *   **What it does:** Shows a text message scrolling horizontally.
    *   **How it works:** Text "COMPLETOS" (configurable) moving in a loop.

7.  **Spectrum Analyzer (`spectrum_analyzer.js`)**
    *   **What it does:** Visual simulation of a music equalizer.
    *   **How it works:** Vertical bars that rise and fall randomly simulating audio frequencies.

8.  **Donation QR (`donation_qr.js`)**
    *   **What it does:** Displays a scannable QR code.
    *   **How it works:** Generates a real-time QR pointing to a PayPal link.

## 🎮 General Controls
- **Change Effect**: Click anywhere (or touch) to rotate to the next enabled effect.
- **Idle Mode**: After 5 seconds of inactivity, the system reduces FPS to 1 to save energy.

## ⚡ Technical Optimizations
- **Core v9.1**: Graphics engine optimized for low consumption.
- **Shared Resources**: Efficient memory management.
- **Effect Lifecycle**: Dynamic resource loading and unloading.
- **Dynamic FPS**: Smart battery saving.

## 📝 Roadmap
### Minigames
- Improve Arkanoid
- Improve Pong
- Improve Space Invaders
---
### Features
- Transform into an API
- Create Sound Synthesizer
- Create PC Data Viewer
- Create Image Viewer and Editor
- Add to Sonic
---
_Design by Bksp_
