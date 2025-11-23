// Definimos la función globalmente
function smartStation() {
    return {
        // Variables de estado
        time: '00:00',
        date: 'INICIANDO...',
        batteryLevel: null,
        loading: true,

        // Función de inicio (se llama desde x-init)
        initApp() {
            console.log('✅ Sistema Smart Station Iniciado');
            this.loading = false;
            
            // Iniciar el reloj inmediatamente
            this.updateClock();
            
            // Actualizar cada segundo
            setInterval(() => {
                this.updateClock();
            }, 1000);

            // Intentar leer batería
            this.getBattery();
        },

        // Lógica del reloj
        updateClock() {
            const now = new Date();
            
            // Hora formato 24hrs
            this.time = now.toLocaleTimeString('es-CL', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });

            // Fecha completa
            this.date = now.toLocaleDateString('es-CL', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long'
            }).toUpperCase(); // Texto en mayúsculas para estilo terminal
        },

        // Lógica de batería
        async getBattery() {
            if (navigator.getBattery) {
                try {
                    const battery = await navigator.getBattery();
                    this.batteryLevel = Math.round(battery.level * 100);
                    
                    // Escuchar cambios en la batería
                    battery.addEventListener('levelchange', () => {
                        this.batteryLevel = Math.round(battery.level * 100);
                    });
                } catch (e) {
                    console.log('⚠️ Batería no accesible');
                }
            }
        }
    }
}