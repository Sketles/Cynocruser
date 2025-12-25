// ╔════════════════════════════════════════════════════════════════╗
// ║  L2: THALAMUS - PERCEPTION (Percepción/Simbolización)          ║
// ║                                                                ║
// ║  Resuelve el "Binding Problem": traduce datos crudos (texto)   ║
// ║  en neurosímbolos valorados (significado para el cuerpo).      ║
// ║                                                                ║
// ║  Input: Texto del usuario                                      ║
// ║  Output: Símbolo + Valencia + Señales de afectación            ║
// ╚════════════════════════════════════════════════════════════════╝

/**
 * Taxonomía de Estímulos
 * Categorías que afectan diferentes tanques
 */
const STIMULUS_TAXONOMY = {
    // Amenazas a la Integridad
    ATTACK: {
        affectedTanks: ['integridad', 'afiliacion'],
        valence: 'negative',
        keywords: ['tonto', 'imbécil', 'estúpido', 'weon', 'idiota', 'inútil', 'basura', 'mierda', 'cállate', 'muere']
    },

    // Señales de Afiliación Positiva (L-Signals)
    AFFECTION: {
        affectedTanks: ['afiliacion', 'integridad'],
        valence: 'positive',
        keywords: ['gracias', 'genial', 'crack', 'capo', 'te quiero', 'eres el mejor', 'bacán', 'la raja', 'wena']
    },

    // Rechazo/Abandono
    REJECTION: {
        affectedTanks: ['afiliacion', 'competencia'],
        valence: 'negative',
        keywords: ['chao', 'no me interesa', 'aburrido', 'fome', 'penca', 'no sirves', 'me voy']
    },

    // Confusión/Ambigüedad
    AMBIGUITY: {
        affectedTanks: ['certeza'],
        valence: 'negative',
        keywords: ['qué?', 'no entiendo', 'confuso', 'random', '???', 'wat', 'eh']
    },

    // Desafío/Reto
    CHALLENGE: {
        affectedTanks: ['competencia', 'certeza'],
        valence: 'neutral',
        keywords: ['a ver', 'prueba', 'demuestra', 'no puedes', 'apuesto']
    },

    // Interacción Neutral/Social
    NEUTRAL: {
        affectedTanks: ['afiliacion'],
        valence: 'neutral',
        keywords: ['hola', 'qué onda', 'cómo estás', 'oye', 'wena']
    },

    // Curiosidad/Pregunta
    INQUIRY: {
        affectedTanks: ['competencia'],
        valence: 'neutral',
        keywords: ['por qué', 'cómo', 'qué es', 'explica', 'cuéntame']
    }
};

/**
 * Perception: Sistema de Simbolización de Estímulos
 * Traduce input textual en representaciones valoradas
 */
class Perception {
    constructor() {
        this.sensitivityThreshold = 0.3; // Umbral mínimo para detectar
    }

    /**
     * Procesa un input y lo convierte en símbolo valorado
     * @param {string} input - Texto del usuario
     * @param {Object} context - Contexto adicional (usuario, historial)
     * @returns {Object} Símbolo procesado
     */
    process(input, context = {}) {
        const normalizedInput = this._normalize(input);

        // Detectar tipo de estímulo
        const stimulusType = this._classifyStimulus(normalizedInput);

        // Calcular intensidad emocional
        const intensity = this._calculateIntensity(normalizedInput, stimulusType);

        // Extraer features adicionales
        const features = this._extractFeatures(normalizedInput, context);

        return {
            // Representación Cosa (Thing Presentation)
            raw: input,
            normalized: normalizedInput,

            // Clasificación
            type: stimulusType.type,
            taxonomy: STIMULUS_TAXONOMY[stimulusType.type],

            // Valencia Emocional
            valence: stimulusType.valence,
            intensity: intensity,

            // Señales para el Soma
            affectedTanks: stimulusType.affectedTanks,

            // Features adicionales
            features: features,

            // Metadatos
            timestamp: Date.now(),
            userId: context.userId || 'unknown'
        };
    }

    /**
     * Normaliza el input para procesamiento
     */
    _normalize(input) {
        return input
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .trim();
    }

    /**
     * Clasifica el estímulo según la taxonomía
     */
    _classifyStimulus(input) {
        let bestMatch = { type: 'NEUTRAL', score: 0, valence: 'neutral', affectedTanks: ['afiliacion'] };

        for (const [type, config] of Object.entries(STIMULUS_TAXONOMY)) {
            let score = 0;

            for (const keyword of config.keywords) {
                if (input.includes(keyword.toLowerCase())) {
                    score += 1;
                }
            }

            if (score > bestMatch.score) {
                bestMatch = {
                    type,
                    score,
                    valence: config.valence,
                    affectedTanks: config.affectedTanks
                };
            }
        }

        return bestMatch;
    }

    /**
     * Calcula la intensidad emocional del estímulo
     * @returns {number} 0-1
     */
    _calculateIntensity(input, stimulus) {
        let intensity = 0.5; // Base

        // Más keywords = más intenso
        intensity += stimulus.score * 0.15;

        // Mayúsculas = más intenso (GRITAR)
        const upperRatio = (input.match(/[A-Z]/g) || []).length / input.length;
        intensity += upperRatio * 0.3;

        // Signos de exclamación
        const exclamations = (input.match(/!/g) || []).length;
        intensity += exclamations * 0.1;

        // Repetición de letras (nooooo, siiiiii)
        if (/(.)\1{2,}/.test(input)) {
            intensity += 0.15;
        }

        return Math.min(1, Math.max(0, intensity));
    }

    /**
     * Extrae features adicionales del input
     */
    _extractFeatures(input, context) {
        return {
            // Longitud del mensaje
            length: input.length,
            isShort: input.length < 10,
            isLong: input.length > 100,

            // Tipo de mensaje
            isQuestion: /\?/.test(input),
            isCommand: /^(haz|dime|explica|cuenta)/i.test(input),
            isGreeting: /(hola|wena|que onda|ola)/i.test(input),
            isFarewell: /(chao|adios|bye|nos vemos)/i.test(input),

            // Emojis
            hasEmoji: /[\u{1F600}-\u{1F64F}]/u.test(input),

            // Contexto social
            mentionsBot: /(pelao|bot|robot)/i.test(input),
            isReply: context.isReply || false
        };
    }

    /**
     * Procesa múltiples inputs en batch
     */
    processBatch(inputs, context = {}) {
        return inputs.map(input => this.process(input, context));
    }
}

module.exports = { Perception, STIMULUS_TAXONOMY };
