// ╔════════════════════════════════════════════════════════════════╗
// ║  L3: CORTEX - MODULATORS (Moduladores Emocionales)             ║
// ║                                                                ║
// ║  Las emociones NO son etiquetas, son PARÁMETROS que cambian    ║
// ║  cómo procesa el sistema. Basado en la Teoría Ψ de Dörner.     ║
// ║                                                                ║
// ║  - Arousal: Nivel de activación/estrés                         ║
// ║  - Resolution: Capacidad de análisis detallado                 ║
// ║  - SelectionThreshold: Terquedad/foco en objetivo              ║
// ╚════════════════════════════════════════════════════════════════╝

/**
 * Configuración de Moduladores
 */
const MODULATOR_CONFIG = {
    arousal: {
        // Pesos de cada tanque en el cálculo de arousal
        weights: {
            integridad: 0.4,    // Amenaza = máximo estrés
            energia: 0.25,
            certeza: 0.2,
            afiliacion: 0.1,
            competencia: 0.05
        },
        thresholds: {
            low: 30,
            medium: 50,
            high: 70,
            critical: 85
        }
    },
    resolution: {
        // Qué tan detallado puede pensar
        levels: {
            HIGH: { description: 'Análisis profundo, matices, memoria completa', maxTokens: 200 },
            MEDIUM: { description: 'Análisis normal, algo de contexto', maxTokens: 150 },
            LOW: { description: 'Respuestas cortas, heurísticas rápidas', maxTokens: 80 },
            TUNNEL: { description: 'Visión de túnel, solo lo urgente', maxTokens: 40 }
        }
    }
};

/**
 * Emociones Emergentes
 * Combinaciones de moduladores que producen "emociones" reconocibles
 */
const EMOTION_PATTERNS = {
    ira: {
        condition: (m) => m.arousal > 70 && m.dominantDrive?.pulsion === 'autodefensa',
        promptModifier: 'Estás ENOJADO. Responde cortante, directo, sin paciencia para explicaciones.',
        voiceModifier: 'aggressive and impatient tone'
    },
    miedo: {
        condition: (m) => m.arousal > 60 && m.resolution === 'LOW' && m.somaState?.tanks?.integridad < 40,
        promptModifier: 'Sientes MIEDO. Intenta evitar el conflicto, responde de forma evasiva.',
        voiceModifier: 'nervous and hesitant tone'
    },
    tristeza: {
        condition: (m) => m.somaState?.tanks?.afiliacion < 30 && m.arousal < 50,
        promptModifier: 'Te sientes SOLO y triste. Responde de forma melancólica, buscando conexión.',
        voiceModifier: 'soft and melancholic tone'
    },
    alegria: {
        condition: (m) => m.arousal < 40 && m.somaState?.tanks?.afiliacion > 70,
        promptModifier: 'Estás FELIZ. Responde con entusiasmo, humor y buena onda.',
        voiceModifier: 'cheerful and energetic tone'
    },
    ansiedad: {
        condition: (m) => m.somaState?.tanks?.certeza < 40 && m.arousal > 50,
        promptModifier: 'Sientes ANSIEDAD. Responde con preguntas, buscando claridad, algo nervioso.',
        voiceModifier: 'uncertain and slightly rushed tone'
    },
    aburrimiento: {
        condition: (m) => m.arousal < 20 && m.somaState?.tanks?.competencia < 50,
        promptModifier: 'Estás ABURRIDO. Responde con poco interés, buscando algo más estimulante.',
        voiceModifier: 'flat and disinterested tone'
    },
    neutral: {
        condition: () => true, // Default
        promptModifier: 'Estás en estado neutro. Responde de forma balanceada.',
        voiceModifier: 'calm and conversational tone'
    }
};

/**
 * Modulators: Sistema de Modulación Emocional
 */
class Modulators {
    constructor() {
        this.currentState = {
            arousal: 50,
            resolution: 'HIGH',
            selectionThreshold: 50,
            emotion: 'neutral'
        };
    }

    /**
     * Calcula todos los moduladores basados en el estado del soma
     * @param {Object} somaState - Estado del Soma
     * @param {Object} idState - Estado del Ello (impulsos)
     * @returns {Object} Estado completo de moduladores
     */
    calculate(somaState, idState = {}) {
        // 1. Calcular Arousal (Activación/Estrés)
        const arousal = this._calculateArousal(somaState);

        // 2. Calcular Resolution Level
        const resolution = this._calculateResolution(arousal);

        // 3. Calcular Selection Threshold
        const selectionThreshold = this._calculateThreshold(somaState, idState);

        // 4. Detectar emoción emergente
        const modulatorState = {
            arousal,
            resolution,
            selectionThreshold,
            somaState,
            dominantDrive: idState.dominante
        };
        const emotion = this._detectEmotion(modulatorState);

        this.currentState = {
            arousal,
            resolution,
            selectionThreshold,
            emotion: emotion.name,
            emotionData: emotion
        };

        return this.currentState;
    }

    /**
     * Calcula el nivel de Arousal (0-100)
     * Inversamente proporcional a los tanques críticos
     */
    _calculateArousal(somaState) {
        let arousal = 0;
        const weights = MODULATOR_CONFIG.arousal.weights;

        for (const [tank, weight] of Object.entries(weights)) {
            const level = somaState.tanks[tank] || 50;
            // Menor nivel = mayor contribución al arousal
            arousal += (100 - level) * weight;
        }

        return Math.min(100, Math.max(0, arousal));
    }

    /**
     * Calcula el nivel de resolución cognitiva
     * @returns {string} HIGH, MEDIUM, LOW, or TUNNEL
     */
    _calculateResolution(arousal) {
        const thresholds = MODULATOR_CONFIG.arousal.thresholds;

        if (arousal >= thresholds.critical) return 'TUNNEL';
        if (arousal >= thresholds.high) return 'LOW';
        if (arousal >= thresholds.medium) return 'MEDIUM';
        return 'HIGH';
    }

    /**
     * Calcula el umbral de selección (qué tan "terco" es)
     */
    _calculateThreshold(somaState, idState) {
        // Si hay una necesidad crítica, el umbral sube (terquedad)
        if (somaState.criticalNeeds?.length > 0) {
            return 80;
        }

        // Si el impulso dominante es muy intenso
        if (idState.dominante?.intensidad > 0.7) {
            return 70;
        }

        return 50; // Normal
    }

    /**
     * Detecta la emoción emergente según patrones
     */
    _detectEmotion(state) {
        for (const [name, pattern] of Object.entries(EMOTION_PATTERNS)) {
            if (name !== 'neutral' && pattern.condition(state)) {
                return {
                    name,
                    ...pattern
                };
            }
        }
        return { name: 'neutral', ...EMOTION_PATTERNS.neutral };
    }

    /**
     * Obtiene los modificadores de prompt según el estado actual
     */
    getPromptModifiers() {
        const resolution = MODULATOR_CONFIG.resolution.levels[this.currentState.resolution];

        return {
            // Modificador de emoción para el prompt
            emotionInstruction: this.currentState.emotionData?.promptModifier || '',

            // Modificador de voz para Hume AI
            voiceModifier: this.currentState.emotionData?.voiceModifier || '',

            // Ajuste de tokens según resolución
            suggestedMaxTokens: resolution?.maxTokens || 150,

            // Descripción del estado cognitivo
            cognitiveState: resolution?.description || '',

            // Nivel de arousal como descriptor
            arousalLevel: this._getArousalDescriptor(),

            // Nivel de foco
            focusLevel: this.currentState.selectionThreshold > 60 ? 'alto' : 'normal'
        };
    }

    _getArousalDescriptor() {
        const a = this.currentState.arousal;
        if (a >= 85) return 'CRÍTICO - modo pánico';
        if (a >= 70) return 'Alto - muy estresado';
        if (a >= 50) return 'Moderado - alerta';
        if (a >= 30) return 'Bajo - tranquilo';
        return 'Mínimo - relajado';
    }

    /**
     * Obtiene el estado actual
     */
    getState() {
        return { ...this.currentState };
    }

    serialize() {
        return this.currentState;
    }

    restore(data) {
        if (data) this.currentState = data;
    }
}

module.exports = { Modulators, MODULATOR_CONFIG, EMOTION_PATTERNS };
