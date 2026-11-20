// ╔════════════════════════════════════════════════════════════════╗
// ║                      TTS SERVICE                               ║
// ║          Text-to-Speech (Noiz AI / ElevenLabs / Hume)          ║
// ╚════════════════════════════════════════════════════════════════╝

const ttsSettings = require('../config/tts-settings');

const NOIZ_API_URL = 'https://noiz.ai/v1/text-to-speech';
const HUME_API_URL = 'https://api.hume.ai/v0/tts/file';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

/**
 * Convierte texto a audio usando el proveedor configurado
 * @param {string} text - Texto a convertir
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Buffer>} Buffer del audio MP3
 */
async function textToSpeech(text, options = {}) {
    const provider = ttsSettings.provider || 'noiz';

    if (provider === 'none') {
        throw new Error('TTS desactivado en configuración');
    }

    if (provider === 'noiz') {
        return noizTextToSpeech(text, options);
    }

    if (provider === 'elevenlabs') {
        return elevenLabsTextToSpeech(text, options);
    }

    if (provider === 'hume') {
        return humeTextToSpeech(text, options);
    }

    throw new Error(`Proveedor TTS no soportado: ${provider}`);
}

/**
 * Noiz AI Text-to-Speech
 */
async function noizTextToSpeech(text, options = {}) {
    const apiKey = process.env.NOIZ_API_KEY;
    const config = ttsSettings.noiz || {};
    const voiceId = options.voiceId || config.voiceId || process.env.NOIZ_VOICE_ID || process.env.VOICE_ID_PELAO;

    if (!apiKey || !voiceId) {
        throw new Error('NOIZ_API_KEY o NOIZ_VOICE_ID (o VOICE_ID_PELAO) no configurados');
    }

    console.log(`🗣️ [Noiz AI TTS] "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" (Voice: ${voiceId})`);

    const formData = new FormData();
    formData.append('text', text);
    formData.append('voice_id', voiceId);
    formData.append('output_format', config.outputFormat || 'mp3');

    const response = await fetch(NOIZ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': apiKey.trim()
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Noiz AI API: ${response.status} - ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Hume AI Text-to-Speech
 */
async function humeTextToSpeech(text, options = {}) {
    const apiKey = process.env.HUME_API_KEY;
    const config = ttsSettings.hume || {};
    const voiceId = options.voiceId || config.voices?.[config.activeVoice] || process.env.HUME_VOICE_ID;

    if (!apiKey || !voiceId) {
        throw new Error('HUME_API_KEY o HUME_VOICE_ID no configurados');
    }

    const version = config.version || '2';  // Default Octave 2
    console.log(`🗣️ [Hume TTS Octave ${version}] "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    // Limpiar texto: eliminar saltos de línea que cortan el audio
    const cleanText = text
        .replace(/\n+/g, ', ')  // Reemplazar saltos de línea con comas
        .replace(/\s+/g, ' ')   // Normalizar espacios
        .trim();

    // Construir payload según versión
    const body = {
        utterances: [{
            text: cleanText,
            voice: { id: voiceId }
        }],
        format: { type: 'mp3' },
        version: version
    };

    // Octave 1 soporta description emocional, Octave 2 no
    if (version === '1' && options.emotion) {
        body.utterances[0].description = options.emotion;
    }

    const response = await fetch(HUME_API_URL, {
        method: 'POST',
        headers: {
            'X-Hume-Api-Key': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Hume API: ${response.status} - ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * ElevenLabs Text-to-Speech
 */
async function elevenLabsTextToSpeech(text, options = {}) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const config = ttsSettings.elevenlabs || {};
    const voiceId = options.voiceId || config.voiceId;

    if (!apiKey || !voiceId) {
        throw new Error('ELEVENLABS_API_KEY o voiceId no configurados');
    }

    console.log(`🗣️ [ElevenLabs TTS] "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: text,
            model_id: config.model || 'eleven_multilingual_v2',
            voice_settings: {
                stability: config.stability || 0.5,
                similarity_boost: config.similarityBoost || 0.75
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API: ${response.status} - ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Convierte texto a audio con estilo emocional específico
 * @param {string} text - Texto a convertir
 * @param {string} emotion - Descripción del tono/emoción
 * @returns {Promise<Buffer>} Buffer del audio MP3
 */
async function textToSpeechWithStyle(text, emotion) {
    return textToSpeech(text, { emotion });
}

module.exports = {
    textToSpeech,
    textToSpeechWithStyle
};
