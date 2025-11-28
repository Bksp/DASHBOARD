# DASHBOARD - Pixel Display

https://bksp.github.io/DASHBOARD/pixels.html

Un sistema de visualización de píxeles interactivo y optimizado, diseñado para ser ligero y estéticamente agradable. Incluye varios efectos visuales y un minijuego de Pong totalmente funcional.

## 🚀 Cómo Usar
Simplemente abre el archivo `pixels.html` en tu navegador web favorito. No requiere instalación ni servidor.

## 🎮 Manual de Uso

### Controles Generales
- **Cambiar Efecto**: Haz clic en cualquier lugar de la pantalla (o toca en móviles) para cambiar al siguiente efecto visual.
- **Modo Inactivo (Ahorro de Energía)**: Si no interactúas con la página durante 5 segundos, el sistema entrará en "Modo Inactivo", reduciendo los FPS a 1 para ahorrar batería y recursos de CPU/GPU. Mueve el mouse o presiona una tecla para despertar el sistema instantáneamente.

### 🕹️ Minijuego: PONG
El efecto de Pong es interactivo. Puedes jugar contra la CPU o contra un amigo.

**Controles:**
- **Jugador 1 (Izquierda)**:
    - `W`: Mover Arriba
    - `S`: Mover Abajo
- **Jugador 2 (Derecha)**:
    - `Flecha Arriba`: Mover Arriba (Solo en modo PVP)
    - `Flecha Abajo`: Mover Abajo (Solo en modo PVP)

**Modos de Juego:**
- **CPU vs Player (Por defecto)**: La paleta derecha es controlada por la computadora. El indicador central inferior será de color **Gris/Azul**.
- **PVP (Player vs Player)**: Presiona la tecla **`M`** para cambiar a modo manual. El indicador central inferior se volverá **Verde**. Ahora el segundo jugador puede usar las flechas.

**Reglas:**
- El primero en llegar a **5 puntos** gana.
- El juego se reinicia automáticamente tras la victoria.

### 🌌 Otros Efectos
- **Matrix Rain**: Lluvia de código digital estilo Matrix.
- **Fireworks**: Fuegos artificiales generados proceduralmente.
- **Space Invaders**: Animación clásica de los invasores del espacio.
- **Color Plasma**: Patrones de colores suaves en movimiento.

## ⚡ Optimizaciones Técnicas
Este proyecto ha sido refactorizado para máximo rendimiento:
- **Core v9.0**: Motor gráfico optimizado.
- **Shared Resources**: Los efectos comparten recursos (colores, utilidades) para reducir el uso de memoria RAM.
- **Effect Lifecycle**: Los efectos se "desmontan" y limpian su memoria cuando no están en pantalla.
- **Dynamic FPS**: El sistema ajusta la velocidad de actualización según la actividad del usuario.

---
Design by Bksp
