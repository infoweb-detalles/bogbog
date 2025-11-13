// Función para manejar acciones de Telegram
function handleTelegramAction(action, messageId) {
    console.log('🔄 Procesando acción de Telegram:', action);
    
    if (window.commonUtils) {
        window.commonUtils.showLoading('Procesando solicitud...');
    }

    // El redireccionamiento lo maneja Socket.io en common.js
    // No necesitamos hacer nada más aquí
}

// Inicialización simplificada
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Eventos de Telegram inicializados - Usando Socket.io');
    
    // Verificar si hay una acción pendiente
    const currentAction = sessionStorage.getItem('currentAction');
    const currentMessageId = sessionStorage.getItem('currentMessageId');
    
    if (currentAction) {
        console.log('Acción pendiente encontrada:', currentAction);
        handleTelegramAction(currentAction, currentMessageId);
        sessionStorage.removeItem('currentAction');
        sessionStorage.removeItem('currentMessageId');
    }
});

// Manejar mensajes de Socket.io para acciones de Telegram
if (window.socket) {
    window.socket.on('telegram_action', (data) => {
        console.log('📨 Acción recibida via Socket.io:', data);
        
        if (data.redirect) {
            console.log('📍 Redirigiendo a:', data.redirect);
            if (data.message) {
                sessionStorage.setItem('actionMessage', data.message);
            }
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 500);
        }
    });
}

// Exportar funciones
window.telegramEvents = {
    handleAction: handleTelegramAction
};