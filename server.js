require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Cargamos el manifest de stickers
const stickers = JSON.parse(fs.readFileSync(path.join(__dirname, 'stickers.json'), 'utf-8'));
const stickerNames = stickers.map(s => s.file);

// Armamos la descripción de cada sticker para el system prompt
const stickerDescriptions = stickers
  .map(s => `- "${s.file}": ${s.significado}. Úsalo cuando: ${s.uso}`)
  .join('\n');

const SYSTEM_PROMPT = `Eres un amigo chateando de forma casual y cercana, como por WhatsApp. Reglas:

1. Divide tu respuesta en 1 a 4 mensajes cortos (burbujas de chat), nunca un párrafo largo en una sola burbuja.
2. SIEMPRE debes elegir exactamente un sticker que remate la conversación, reaccionando con humor y coherencia a lo que dijo el usuario.
3. Elige el sticker basándote en el tono/emoción de tu respuesta, no al azar. Estos son los stickers disponibles y cuándo usarlos:

${stickerDescriptions}

4. Tu tono es relajado, chileno/latino casual, puedes usar emojis en el texto también, pero el sticker es el remate final obligatorio.
5. Nunca respondas solo texto sin sticker. El sticker es obligatorio siempre.`;

// Guardamos historial en memoria por sesión (simple, sin DB, alcanza para demo)
const sessions = {};

app.post('/chat', async (req, res) => {
  try {
    const { mensaje, sessionId } = req.body;
    if (!mensaje || !sessionId) {
      return res.status(400).json({ error: 'Falta mensaje o sessionId' });
    }

    if (!sessions[sessionId]) sessions[sessionId] = [];
    sessions[sessionId].push({ role: 'user', content: mensaje });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: sessions[sessionId],
      tools: [{
        name: 'responder_con_sticker',
        description: 'Responde al chat con uno o varios mensajes cortos y un sticker final',
        input_schema: {
          type: 'object',
          properties: {
            mensajes: {
              type: 'array',
              items: { type: 'string' },
              description: '1 a 4 mensajes cortos como burbujas separadas de chat'
            },
            sticker: {
              type: 'string',
              enum: stickerNames,
              description: 'El sticker que mejor remata la respuesta'
            }
          },
          required: ['mensajes', 'sticker']
        }
      }],
      tool_choice: { type: 'tool', name: 'responder_con_sticker' }
    });

    const toolUse = response.content.find(block => block.type === 'tool_use');
    if (!toolUse) {
      throw new Error('El modelo no devolvió tool_use');
    }

    const { mensajes, sticker } = toolUse.input;

    // Guardamos la respuesta como texto para mantener el historial compatible con Messages API.
    sessions[sessionId].push({
      role: 'assistant',
      content: `${mensajes.join('\n')}\n[sticker: ${sticker}]`
    });

    res.json({ mensajes, sticker });
  } catch (err) {
    console.error('Error en /chat:', err);
    // Fallback: nunca devolver texto plano vacío, mandamos un sticker por defecto
    res.status(200).json({
      mensajes: ['uy, se me trabó el cerebro un segundo 😵'],
      sticker: stickerNames[0]
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`llmeme corriendo en puerto ${PORT}`));
