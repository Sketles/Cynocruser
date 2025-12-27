// ╔════════════════════════════════════════════════════════════════╗
// ║                      TTS SERVICE                               ║
// ║              Text-to-Speech (Hume AI / ElevenLabs)             ║
// ╚════════════════════════════════════════════════════════════════╝

const ttsSettings = require('../config/tts-settings');

const HUME_API_URL = 'https://api.hume.ai/v0/tts/file';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

/**
 * Convierte texto a audio usando el proveedor configurado
 * @param {string} text - Texto a convertir
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Buffer>} Buffer del audio MP3
 */
async function textToSpeech(text, options = {}) {
    const provider = ttsSettings.provider || 'hume';

    if (provider === 'none') {
        throw new Error('TTS desactivado en configuración');
    }

    if (provider === 'hume') {
        return humeTextToSpeech(text, options);
    }

    if (provider === 'elevenlabs') {
        return elevenLabsTextToSpeech(text, options);
    }

    throw new Error(`Proveedor TTS no soportado: ${provider}`);
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

    console.log(`🗣️ [Hume TTS] "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    // Octave 2 NO soporta 'description', usar version 1 si necesitas emoción
    const useOctave1 = options.emotion || config.emotion;

    const body = {
        utterances: [{
            text: text,
            voice: { id: voiceId }
        }],
        format: { type: 'mp3' },
        version: useOctave1 ? '1' : '2'  // Octave 1 para emotion, Octave 2 sin
    };

    // Solo agregar description en Octave 1
    if (useOctave1) {
        body.utterances[0].description = options.emotion || config.emotion;
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
