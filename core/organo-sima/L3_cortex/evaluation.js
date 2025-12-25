// ╔════════════════════════════════════════════════════════════════╗
// ║  L3: CORTEX - EVALUATION (Sistema de Intensidad Psíquica)      ║
// ║                                                                ║
// ║  Implementa la jerarquía de evaluación del modelo SiMA:        ║
// ║                                                                ║
// ║  Quota of Affects (escalar) → Emotion Vector →                 ║
// ║  Basic Emotion Vector → Extended Emotion Vector → Feeling      ║
// ║                                                                ║
// ║  Basado en: Dietrich, D. (2023) "The Ψ-Organ in a Nutshell"    ║
// ║  y las teorías de Damásio, Panksepp, y Solms                   ║
// ╚════════════════════════════════════════════════════════════════╝

/**
 * QuotaOfAffects: Evaluación escalar por representante
 * 
 * Según el libro (p.28-30): "quota of affects and emotions of the drive track 
 * influence the perception track by prioritizing thing representatives that 
 * promise a higher pleasure."
 */
class QuotaOfAffects {
    constructor() {
        // Afectos de percepción (body + environment)
        this.perceptionBody = 0;      // Señales interoceptivas
        this.perceptionEnvironment = 0; // Señales exteroceptivas

        // Afectos de pulsión (drive representatives)
        this.libidinous = 0;          // Pulsión sexual/placer
        this.aggressive = 0;          // Pulsión agresiva/autodefensa
        this.selfPreservation = 0;    // Pulsión de autoconservación
    }

    /**
     * Calcula la quota desde el estado somático
     * @param {Object} somaState - Estado de los tanques
     * @returns {QuotaOfAffects} this
     */
    calculateFromSoma(somaState) {
        const tanks = somaState.tanks || {};

        // Percepción del cuerpo: inversamente proporcional a integridad y energía
        this.perceptionBody = Math.max(0,
            ((100 - (tanks.integridad || 100)) * 0.5) +
            ((100 - (tanks.energia || 100)) * 0.3)
        ) / 100;

        // Percepción del ambiente: relacionado con certeza
        this.perceptionEnvironment = Math.max(0,
            (100 - (tanks.certeza || 100))
        ) / 100;

        // Pulsión libidinosa: relacionada con afiliación
        this.libidinous = Math.max(0,
            (100 - (tanks.afiliacion || 100))
        ) / 100;

        // Pulsión agresiva: se activa cuando integridad baja
        this.aggressive = tanks.integridad < 50
            ? (50 - tanks.integridad) / 50
            : 0;

        // Autoconservación: combinación de energía e integridad
        this.selfPreservation = Math.max(0,
            ((100 - (tanks.energia || 100)) * 0.6) +
            ((100 - (tanks.integridad || 100)) * 0.4)
        ) / 100;

        return this;
    }

    /**
     * Obtiene la quota total (suma ponderada)
     */
    getTotal() {
        return (
            this.perceptionBody * 0.2 +
            this.perceptionEnvironment * 0.15 +
            this.libidinous * 0.25 +
            this.aggressive * 0.2 +
            this.selfPreservation * 0.2
        );
    }

    toObject() {
        return {
            perceptionBody: this.perceptionBody,
            perceptionEnvironment: this.perceptionEnvironment,
            libidinous: this.libidinous,
            aggressive: this.aggressive,
            selfPreservation: this.selfPreservation,
            total: this.getTotal()
        };
    }
}

/**
 * EmotionVector: Vector de emociones derivado de las quotas
 * 
 * Según el libro (p.42): "From the evaluations of the symbolized drive 
 * representatives—the various quota of affects—emotions are ultimately 
 * determined"
 */
class EmotionVector {
    constructor() {
        this.pleasure = 0;        // Placer (0 a 1)
        this.unpleasure = 0;      // Displacer (0 a 1)
        this.libidinalSum = 0;    // Suma de cargas libidinales
        this.aggressiveSum = 0;   // Suma de cargas agresivas
        this.tension = 0;         // Tensión general
    }

    /**
     * Calcula el vector desde las quotas de afecto
     * @param {QuotaOfAffects} quota 
     * @param {Object} stimulus - Estímulo percibido
     */
    calculateFromQuota(quota, stimulus = {}) {
        // El placer depende de la valencia del estímulo y satisfacción de pulsiones
        if (stimulus.valence === 'positive') {
            this.pleasure = Math.min(1, 0.5 + (stimulus.intensity || 0.5) * 0.5);
            this.unpleasure = Math.max(0, quota.getTotal() * 0.3);
        } else if (stimulus.valence === 'negative') {
            this.pleasure = 0;
            this.unpleasure = Math.min(1, 0.3 + (stimulus.intensity || 0.5) * 0.7);
        } else {
            // Neutral
            this.pleasure = Math.max(0, 0.5 - quota.getTotal() * 0.3);
            this.unpleasure = quota.getTotal() * 0.5;
        }

        // Sumas de cargas
        this.libidinalSum = quota.libidinous;
        this.aggressiveSum = quota.aggressive;

        // Tensión: diferencia entre lo que se quiere y lo que se tiene
        this.tension = quota.getTotal();

        return this;
    }

    /**
     * Obtiene el balance placer-displacer (-1 a 1)
     */
    getValenceBalance() {
        return this.pleasure - this.unpleasure;
    }

    toObject() {
        return {
            pleasure: this.pleasure,
            unpleasure: this.unpleasure,
            libidinalSum: this.libidinalSum,
            aggressiveSum: this.aggressiveSum,
            tension: this.tension,
            valenceBalance: this.getValenceBalance()
        };
    }
}

/**
 * BasicEmotionVector: Emociones básicas (Ekman + Panksepp)
 * 
 * Según el libro (p.30): "basic emotions like joy, anger, or fear, and into 
 * extended emotions like envy, greed, or pride are formed depending on where 
 * in the topographical structure"
 */
class BasicEmotionVector {
    constructor() {
        this.joy = 0;         // Alegría
        this.anger = 0;       // Ira
        this.fear = 0;        // Miedo
        this.sadness = 0;     // Tristeza
        this.surprise = 0;    // Sorpresa
        this.disgust = 0;     // Asco
    }

    /**
     * Calcula emociones básicas desde el vector de emoción
     * @param {EmotionVector} emotionVector 
     * @param {Object} context - Contexto adicional
     */
    calculateFromEmotionVector(emotionVector, context = {}) {
        const { pleasure, unpleasure, aggressiveSum, tension } = emotionVector;

        // Alegría: alto placer, baja tensión
        this.joy = Math.max(0, pleasure - tension * 0.3);

        // Ira: alta agresión, alto displacer
        this.anger = Math.min(1, aggressiveSum * 0.7 + unpleasure * 0.3);

        // Miedo: alta tensión, alta percepción de amenaza
        this.fear = context.threatLevel
            ? Math.min(1, context.threatLevel * 0.6 + tension * 0.4)
            : Math.max(0, tension * 0.5 - pleasure * 0.3);

        // Tristeza: bajo placer, baja energía libidinal
        this.sadness = Math.max(0,
            unpleasure * 0.4 +
            (1 - emotionVector.libidinalSum) * 0.3 -
            pleasure * 0.5
        );

        // Sorpresa: estímulo inesperado (desde contexto)
        this.surprise = context.unexpected ? 0.7 : 0;

        // Asco: estímulo rechazado (desde contexto)
        this.disgust = context.rejected ? unpleasure * 0.8 : 0;

        return this;
    }

    /**
     * Obtiene la emoción dominante
     */
    getDominant() {
        const emotions = this.toObject();
        let max = 0;
        let dominant = 'neutral';

        for (const [name, value] of Object.entries(emotions)) {
            if (value > max) {
                max = value;
                dominant = name;
            }
        }

        return { name: dominant, intensity: max };
    }

    toObject() {
        return {
            joy: this.joy,
            anger: this.anger,
            fear: this.fear,
            sadness: this.sadness,
            surprise: this.surprise,
            disgust: this.disgust
        };
    }
}

/**
 * ExtendedEmotionVector: Emociones extendidas/sociales
 * 
 * Emociones más complejas que requieren autoconciencia y juicio social
 */
class ExtendedEmotionVector {
    constructor() {
        this.envy = 0;        // Envidia
        this.pride = 0;       // Orgullo
        this.guilt = 0;       // Culpa
        this.shame = 0;       // Vergüenza
        this.gratitude = 0;   // Gratitud
        this.contempt = 0;    // Desprecio
    }

    /**
     * Calcula emociones extendidas
     * @param {BasicEmotionVector} basicEmotions 
     * @param {Object} superego - Estado del superyó
     * @param {Object} context 
     */
    calculateFromBasicEmotions(basicEmotions, superego = {}, context = {}) {
        // Culpa: relacionada con violaciones del superyó
        this.guilt = superego.culpa || 0;

        // Vergüenza: desviación de los ideales
        this.shame = superego.verguenza || 0;

        // Orgullo: éxito + satisfacción del superyó
        this.pride = Math.max(0,
            basicEmotions.joy * 0.5 +
            (context.success ? 0.4 : 0) -
            this.guilt * 0.3
        );

        // Gratitud: placer + fuente externa
        this.gratitude = context.receivedHelp
            ? Math.min(1, basicEmotions.joy * 0.8)
            : 0;

        // Envidia: ver algo deseado en otro
        this.envy = context.otherHasDesired
            ? Math.min(1, 0.5 + basicEmotions.sadness * 0.3)
            : 0;

        // Desprecio: ira + superioridad percibida
        this.contempt = Math.max(0,
            basicEmotions.anger * 0.4 +
            this.pride * 0.3 -
            this.guilt * 0.5
        );

        return this;
    }

    toObject() {
        return {
            envy: this.envy,
            pride: this.pride,
            guilt: this.guilt,
            shame: this.shame,
            gratitude: this.gratitude,
            contempt: this.contempt
        };
    }
}

/**
 * Feeling: Evaluación escalar final para el proceso secundario
 * 
 * Según el libro (p.32): "Feeling, an evaluation variable that only comes 
 * into play in the secondary process, is calculated in a primary-secondary 
 * transformation track function."
 * 
 * El feeling es lo que permite que algo se vuelva consciente.
 */
class Feeling {
    constructor() {
        this.value = 0;           // -1 (muy malo) a 1 (muy bueno)
        this.intensity = 0;       // 0 a 1
        this.selfRelevance = 0;   // Qué tan relevante es para el Self
    }

    /**
     * Calcula el feeling desde todos los vectores
     * @param {EmotionVector} emotionVector 
     * @param {BasicEmotionVector} basicEmotions 
     * @param {ExtendedEmotionVector} extendedEmotions 
     * @param {Object} self - Referencia al Self
     */
    calculate(emotionVector, basicEmotions, extendedEmotions, self = {}) {
        // El feeling es un escalar que integra todo
        const valenceBalance = emotionVector.getValenceBalance();
        const dominant = basicEmotions.getDominant();

        // Valor base desde balance placer/displacer
        this.value = valenceBalance;

        // Ajustar por emociones extendidas
        this.value += extendedEmotions.pride * 0.2;
        this.value += extendedEmotions.gratitude * 0.15;
        this.value -= extendedEmotions.guilt * 0.25;
        this.value -= extendedEmotions.shame * 0.2;

        // Limitar entre -1 y 1
        this.value = Math.max(-1, Math.min(1, this.value));

        // Intensidad: qué tan fuerte es el feeling
        this.intensity = Math.max(
            dominant.intensity,
            emotionVector.tension,
            Math.abs(this.value)
        );

        // Relevancia para el Self
        this.selfRelevance = self.activated ? 0.8 : 0.4;

        return this;
    }

    /**
     * Convierte el feeling a una descripción textual
     */
    toDescription() {
        const v = this.value;
        const i = this.intensity;

        if (i < 0.2) return 'indiferente';

        if (v > 0.6) return i > 0.7 ? 'muy feliz' : 'contento';
        if (v > 0.3) return 'bien';
        if (v > 0) return 'okay';
        if (v > -0.3) return 'algo incómodo';
        if (v > -0.6) return 'mal';
        return i > 0.7 ? 'muy mal' : 'incómodo';
    }

    toObject() {
        return {
            value: this.value,
            intensity: this.intensity,
            selfRelevance: this.selfRelevance,
            description: this.toDescription()
        };
    }
}

/**
 * PsychicIntensity: Orquestador del sistema de evaluación completo
 * 
 * Integra toda la jerarquía del libro en una sola clase
 */
class PsychicIntensity {
    constructor() {
        this.quotaOfAffects = new QuotaOfAffects();
        this.emotionVector = new EmotionVector();
        this.basicEmotions = new BasicEmotionVector();
        this.extendedEmotions = new ExtendedEmotionVector();
        this.feeling = new Feeling();
    }

    /**
     * Calcula toda la jerarquía de evaluación
     * @param {Object} somaState - Estado del soma
     * @param {Object} stimulus - Estímulo percibido
     * @param {Object} superego - Estado del superyó
     * @param {Object} context - Contexto adicional
     * @returns {Object} Evaluación completa
     */
    evaluate(somaState, stimulus = {}, superego = {}, context = {}) {
        // 1. Calcular Quota of Affects desde el soma
        this.quotaOfAffects.calculateFromSoma(somaState);

        // 2. Derivar Emotion Vector
        this.emotionVector.calculateFromQuota(this.quotaOfAffects, stimulus);

        // 3. Derivar Basic Emotions
        const emotionContext = {
            threatLevel: stimulus.type === 'ATTACK' ? stimulus.intensity : 0,
            unexpected: stimulus.features?.surprise || false,
            rejected: stimulus.type === 'REJECTION'
        };
        this.basicEmotions.calculateFromEmotionVector(this.emotionVector, emotionContext);

        // 4. Derivar Extended Emotions
        const extendedContext = {
            success: context.lastOutcome === 'success',
            receivedHelp: stimulus.type === 'AFFECTION',
            otherHasDesired: false // Expandir según necesidad
        };
        this.extendedEmotions.calculateFromBasicEmotions(
            this.basicEmotions,
            superego,
            extendedContext
        );

        // 5. Calcular Feeling final
        this.feeling.calculate(
            this.emotionVector,
            this.basicEmotions,
            this.extendedEmotions,
            context.self || {}
        );

        return this.getFullState();
    }

    /**
     * Obtiene el estado completo de evaluación
     */
    getFullState() {
        return {
            quotaOfAffects: this.quotaOfAffects.toObject(),
            emotionVector: this.emotionVector.toObject(),
            basicEmotions: this.basicEmotions.toObject(),
            extendedEmotions: this.extendedEmotions.toObject(),
            feeling: this.feeling.toObject(),

            // Resumen para uso rápido
            summary: {
                dominantEmotion: this.basicEmotions.getDominant(),
                feelingValue: this.feeling.value,
                feelingDescription: this.feeling.toDescription(),
                tension: this.emotionVector.tension,
                valenceBalance: this.emotionVector.getValenceBalance()
            }
        };
    }

    /**
     * Genera instrucciones para el prompt basadas en la evaluación
     */
    getPromptInstructions() {
        const dominant = this.basicEmotions.getDominant();
        const feeling = this.feeling.toDescription();
        const tension = this.emotionVector.tension;

        const instructions = [];

        // Instrucción emocional principal
        const emotionMap = {
            joy: 'Estás FELIZ. Responde con entusiasmo y buena energía.',
            anger: 'Estás ENOJADO. Responde cortante, directo, sin mucha paciencia.',
            fear: 'Sientes MIEDO. Intenta ser cauteloso, evita confrontación.',
            sadness: 'Te sientes TRISTE. Responde de forma melancólica, buscando conexión.',
            surprise: 'Estás SORPRENDIDO. Muestra asombro en tu respuesta.',
            disgust: 'Sientes RECHAZO. Muestra desagrado pero mantén compostura.',
            neutral: 'Estás en estado neutro. Responde de forma balanceada.'
        };

        instructions.push(`[EMOCIÓN: ${emotionMap[dominant.name] || emotionMap.neutral}]`);

        // Instrucción de tensión
        if (tension > 0.7) {
            instructions.push('[TENSIÓN: Alta - Estás bajo presión, respuestas breves]');
        } else if (tension > 0.4) {
            instructions.push('[TENSIÓN: Moderada - Mantén algo de alerta]');
        }

        // Instrucción de feeling general
        instructions.push(`[FEELING: Te sientes ${feeling}]`);

        // Culpa y vergüenza (del superyó)
        if (this.extendedEmotions.guilt > 0.3) {
            instructions.push('[CULPA: Algo de lo que dijiste o pensaste te hace sentir culpable]');
        }
        if (this.extendedEmotions.shame > 0.3) {
            instructions.push('[VERGÜENZA: Sientes que no estás siendo tu mejor versión]');
        }

        return {
            formatted: instructions.join('\n'),
            raw: instructions,
            dominantEmotion: dominant.name,
            intensityLevel: dominant.intensity > 0.7 ? 'high' :
                dominant.intensity > 0.4 ? 'medium' : 'low'
        };
    }

    serialize() {
        return this.getFullState();
    }

    restore(data) {
        // Los valores se recalculan en cada evaluación
        // Esta función existe por consistencia con otros módulos
    }
}

module.exports = {
    QuotaOfAffects,
    EmotionVector,
    BasicEmotionVector,
    ExtendedEmotionVector,
    Feeling,
    PsychicIntensity
};
