/**
 * ARCHIVO: js/app.js
 * LÓGICA PRINCIPAL DEL DASHBOARD
 * Define los componentes de Alpine.js: mainDashboard, timeComponent, weatherComponent.
 */

// ------------------------------------
// 1. COMPONENTE PRINCIPAL (PERSISTENCIA Y CONFIGURACIÓN)
// ------------------------------------
function mainDashboard() {
    return {
        // Estado inicial de la configuración del usuario
        mainConfig: {
            city: 'Santiago',
            units: 'C'
        },
        nextUpdate: 'Cargando...',

        // Carga la configuración desde localStorage (PERSISTENCIA)
        loadSettings() {
            const savedSettings = localStorage.getItem('dashboard_settings');
            if (savedSettings) {
                this.mainConfig = JSON.parse(savedSettings);
                console.log("Configuración cargada desde localStorage:", this.mainConfig);
            }
        },

        // Guarda la configuración en localStorage
        saveSettings() {
            localStorage.setItem('dashboard_settings', JSON.stringify(this.mainConfig));
            console.log("Configuración guardada.");
        }
    }
}

// ------------------------------------
// 2. COMPONENTE DE HORA Y FECHA (El Reloj)
// ------------------------------------
function timeComponent() {
    return {
        time: '--:--',
        date: 'Cargando fecha...',
        
        // Inicializa el reloj
        initTime() {
            this.updateTime();
            // Llama a la función de actualización cada 1000ms (1 segundo)
            setInterval(() => this.updateTime(), 1000);
        },

        // Lógica para obtener y formatear la hora/fecha
        updateTime() {
            const now = new Date();
            
            // Hora (usando el locale chileno 'es-CL')
            this.time = now.toLocaleTimeString('es-CL', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            // Fecha
            this.date = now.toLocaleDateString('es-CL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
        }
    }
}

// ------------------------------------
// 3. COMPONENTE DE CLIMA (Placeholder para futuro)
// ------------------------------------
function weatherComponent() {
    return {
        city: 'N/A',
        temp: '--',
        description: 'Esperando datos de API...',
        
        fetchWeather() {
            // Aquí irá la función 'fetch'
            console.log("Clima listo para fetch.");
        }
    }
}