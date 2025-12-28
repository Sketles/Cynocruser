// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║                                                                             ║
// ║                  C O N F I G U R A C I O N   T T S                          ║
// ║                                                                             ║
// ║        Configuracion de Text-to-Speech (Voz)                                ║
// ║                                                                             ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

module.exports = {

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                      PROVEEDOR TTS ACTIVO                             ║
    // ╠═══════════════════════════════════════════════════════════════════════╣
    // ║                                                                       ║
    // ║   ┌─────────────┬────────────────────────────────────────────────┐    ║
    // ║   │ 'hume'      │ Hume AI - Voz emocional expresiva              │    ║
    // ║   │ 'elevenlabs'│ ElevenLabs - Voces ultra realistas             │    ║
    // ║   │ 'openai'    │ OpenAI TTS - Simple y rapido                   │    ║
    // ║   │ 'none'      │ Desactivar TTS (solo texto)                    │    ║
    // ║   └─────────────┴────────────────────────────────────────────────┘    ║
    // ║                                                                       ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    provider: 'hume',


    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                         HUME AI CONFIG                                ║
    // ╠═══════════════════════════════════════════════════════════════════════╣
    // ║   API Keys en .env: HUME_API_KEY, HUME_SECRET_KEY                     ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    hume: {
        // ┌─────────────────────────────────────────────────────────────────┐
        // │ VERSIÓN DE HUME TTS - Octave 1 vs Octave 2                     │
        // ├─────────────────────────────────────────────────────────────────┤
        // │ '1' = Octave 1 (Original)                                       │
        // │   - Soporta 'description' para estilo emocional                 │
        // │   - Puede sonar más artificial en algunos casos                 │
        // │   - Mejor para control fino de emoción                          │
        // │                                                                 │
        // │ '2' = Octave 2 (Recomendado)                                    │
        // │   - NO soporta 'description', solo voice ID                     │
        // │   - Voz más natural y fluida                                    │
        // │   - Mejor calidad de audio                                      │
        // └─────────────────────────────────────────────────────────────────┘
        version: '1',  // '1' o '2' - Cambiar para probar diferencias

        // ┌─────────────────────────────────────────────────────────────────┐
        // │ VOZ ACTIVA - Cambia el nombre para usar otra voz                │
        // └─────────────────────────────────────────────────────────────────┘
        activeVoice: 'pelao',

        // ┌─────────────────────────────────────────────────────────────────┐
        // │ CATÁLOGO DE VOCES - IDs en .env (VOICE_ID_NOMBRE)               │
        // └─────────────────────────────────────────────────────────────────┘
        voices: {
            pelao: process.env.VOICE_ID_PELAO,
            rorro2: process.env.VOICE_ID_RORRO2,
            // Agrega más aquí y en tu .env
        },

        // emotion: 'casual',   // AHORA ES DINÁMICO desde Ψ-Organ
        speed: 1.1              // Velocidad (0.5 - 2.0)
    },


    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                       ELEVENLABS CONFIG                               ║
    // ╠═══════════════════════════════════════════════════════════════════════╣
    // ║   API Key en .env: ELEVENLABS_API_KEY                                 ║
    // ║                                                                       ║
    // ║   Voces populares:                                                    ║
    // ║   ┌─────────────────────────┬────────────────────────────────────┐    ║
    // ║   │ 'EXAVITQu4vr4xnSDxMaL'  │ Sarah (mujer, natural)             │    ║
    // ║   │ 'TX3LPaxmHKxFdv7VOQHJ'  │ Liam (hombre, narracion)           │    ║
    // ║   │ 'pFZP5JQG7iQjIQuC4Bku'  │ Lily (mujer, britanica)            │    ║
    // ║   │ 'onwK4e9ZLuTAKqWW03F9'  │ Daniel (hombre, serio)             │    ║
    // ║   └─────────────────────────┴────────────────────────────────────┘    ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    elevenlabs: {
        voiceId: 'TX3LPaxmHKxFdv7VOQHJ',
        model: 'eleven_multilingual_v2',
        stability: 0.5,
        similarityBoost: 0.75
    },

};
