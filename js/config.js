// Configuración de la aplicación para Render
window.appConfig = {
    // Determinar entorno
    isProduction: window.location.hostname.includes('onrender.com'),
    
    // URLs base - usar siempre el origen actual
    get baseUrl() {
        return window.location.origin;
    },
    
    // Configuración de Socket.io
    socketConfig: {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
    },
    
    // Obtener la URL del socket
    get socketUrl() {
        return this.baseUrl;
    }
};