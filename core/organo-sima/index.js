// ╔════════════════════════════════════════════════════════════════╗
// ║  Ψ-ORGAN: MAIN ORCHESTRATOR v2.0                               ║
// ║                                                                ║
// ║  Implementación del modelo Ψ-Organ según Dietrich (2023)       ║
// ║  "The Ψ-Organ in a Nutshell"                                   ║
// ║                                                                ║
// ║  Integra todas las capas del modelo SiMA:                      ║
// ║  L1 (Soma) → L2 (Perception) → L3 (Ego/Procesos) + Memory      ║
// ║                                                                ║
// ║  Uso:                                                          ║
// ║  const psyche = new PsiOrgan(config);                          ║
// ║  const result = await psyche.process(userInput, context);      ║
// ╚════════════════════════════════════════════════════════════════╝

const { Soma } = require('./L1_hypothalamus/soma');
const { Perception } = require('./L2_thalamus/perception');
const { Ego } = require('./L3_cortex/ego');
const { Memory } = require('./hippocampus/memory');
const { Umwelt } = require('./umwelt/worldSimulator');

/**
 * PsiOrgan: Sistema Cognitivo Completo v2.0
 * 
 * Simula una mente con:
 * - Necesidades homeostáticas (L1: Soma)
 * - Percepción y simbolización (L2: Thalamus)
 * - Procesos primario y secundario (L3: Cortex)
 * - Memoria con marcadores somáticos (Hippocampus)
 * - Conciencia del mundo (Umwelt)
 */
class PsiOrgan {
    constructor(config = {}) {
        // Extraer configuración del Ψ-Organ desde cassette
        const psiOrganConfig = config.cassette?.psiOrgan || {};

        // ════════════════════════════════════════════════════════════════
        // CAPA 1: HARDWARE/SOMA (Hypothalamus)
        // ════════════════════════════════════════════════════════════════
        this.soma = new Soma(psiOrganConfig);

        // ════════════════════════════════════════════════════════════════
        // CAPA 2: NEUROSIMBOLISMO (Thalamus)
        // ════════════════════════════════════════════════════════════════
        this.perception = new Perception();

        // ════════════════════════════════════════════════════════════════
        // CAPA 3: PSIQUE (Cortex)
        // ════════════════════════════════════════════════════════════════
        this.ego = new Ego();

        // ════════════════════════════════════════════════════════════════
        // SISTEMAS AUXILIARES
        // ════════════════════════════════════════════════════════════════
        this.memory = new Memory();
        this.umwelt = new Umwelt(config.world);

        // ════════════════════════════════════════════════════════════════
        // CONFIGURACIÓN DEL PERSONAJE
        // ════════════════════════════════════════════════════════════════
        this.characterConfig = config.character || {};
        this.baseSystemPrompt = config.basePrompt || '';

        // Cargar marcadores somáticos iniciales
        if (config.markers) {
            this._loadMarkers(config.markers);
        }

        // Estado
        this.initialized = true;
        this.lastProcessTime = Date.now();
        this.version = '2.0.0';
    }

    // ════════════════════════════════════════════════════════════════
    // PROCESO PRINCIPAL
    // ════════════════════════════════════════════════════════════════

    /**
     * Procesa un input del usuario y genera el system prompt dinámico
     * 
     * Flujo según el modelo Ψ-Organ:
     * 1. Tick metabólico (paso del tiempo)
     * 2. L2: Percepción y simbolización
     * 3. Actualizar Soma según percepción
     * 4. L3: Proceso Primario → Secundario → Decisión
     * 5. Registrar en memoria
     * 6. Construir prompt dinámico
     * 
     * @param {string} userInput - Mensaje del usuario
     * @param {Object} context - Contexto adicional (userId, etc.)
     * @returns {Object} Resultado con systemPrompt modificado
     */
    async process(userInput, context = {}) {
        // 1. Tick metabólico (simular paso del tiempo)
        const somaState = this.soma.tick();

        // 2. L2: Percibir y simbolizar el input
        const percepcion = this.perception.process(userInput, context);

        // 3. Actualizar Soma según la percepción
        this._applyStimulusToSoma(percepcion);

        // 4. L3: Procesar en el Ego (Primario → Secundario → Decisión)
        const egoResult = this.ego.process(
            percepcion,
            this.soma.getState(),
            this.memory.getState()
        );

        // 5. Registrar en memoria con cambios somáticos
        this._recordExperience(userInput, percepcion, egoResult);

        // 6. Construir system prompt dinámico (async por worldContext)
        const systemPrompt = await this._buildDynamicPrompt(egoResult);

        // 7. Consumir energía por la acción
        this.soma.consumeAction();

        // Actualizar timestamp
        this.lastProcessTime = Date.now();

        return {
            systemPrompt,
            maxTokens: egoResult.suggestedMaxTokens,
            voiceDescription: egoResult.voiceModifier,

            // Estado para debugging/logging
            state: {
                // Emoción y feeling del nuevo sistema
                emotion: egoResult.modulatorState?.emotion || 'neutral',
                feeling: egoResult.modulatorState?.feeling || 0,

                // Moduladores
                arousal: egoResult.modulatorState?.arousal || 50,
                resolution: egoResult.modulatorState?.resolution || 'HIGH',

                // Decisión
                mode: egoResult.decision?.modo || 'STANDARD',
                behavior: egoResult.decision?.conductaSeleccionada || 'conversar_normal',

                // Tanques
                tanks: this.soma.getState().tanks,

                // Defensas activas
                defenseActive: egoResult.debug?.primaryResult?.hasDefense || false
            },

            // Debug detallado (solo si se solicita)
            debug: context.includeDebug ? egoResult.debug : undefined
        };
    }

    /**
     * Aplica el estímulo percibido al Soma
     */
    _applyStimulusToSoma(percepcion) {
        const intensity = percepcion.intensity || 0.5;

        switch (percepcion.type) {
            case 'ATTACK':
                this.soma.receiveDamage(intensity);
                break;
            case 'AFFECTION':
                this.soma.receiveAffection(intensity);
                break;
            case 'REJECTION':
                this.soma.receiveDamage(intensity * 0.5);
                break;
            case 'AMBIGUITY':
                this.soma.experienceConfusion(intensity);
                break;
            case 'CHALLENGE':
                // Los desafíos pueden ser estimulantes
                this.soma.experienceConfusion(intensity * 0.3);
                break;
            case 'NEUTRAL':
            case 'INQUIRY':
                // Interacción social básica mejora afiliación
                this.soma.receiveAffection(0.2);
                break;
        }
    }

    /**
     * Registra la experiencia en memoria
     */
    _recordExperience(input, percepcion, egoResult) {
        const currentTanks = this.soma.getState().tanks;

        this.memory.recordEpisode({
            input,
            type: percepcion.type,
            valence: percepcion.valence,
            emotion: egoResult.modulatorState?.emotion || 'neutral',
            feeling: egoResult.modulatorState?.feeling || 0,
            mode: egoResult.decision?.modo || 'STANDARD',
            defenseUsed: egoResult.decision?.defensaAplicada || null,
            somaChange: {
                energia: currentTanks.energia - 100,
                integridad: currentTanks.integridad - 100,
                afiliacion: currentTanks.afiliacion - 70,
                certeza: currentTanks.certeza - 80,
                competencia: currentTanks.competencia - 75
            }
        });
    }

    /**
     * Construye el prompt dinámico completo
     */
    async _buildDynamicPrompt(egoResult) {
        const parts = [];

        // 1. Base del personaje (si existe)
        if (this.baseSystemPrompt) {
            parts.push(this.baseSystemPrompt);
        }

        // 2. Contexto del mundo (Umwelt) - async
        const worldContext = await this.umwelt.getWorldContext().catch(() => ({ promptContext: '' }));
        parts.push('\n--- CONTEXTO DEL MUNDO ---\n');
        parts.push(worldContext.promptContext);

        // 3. Estado psíquico del nuevo sistema
        parts.push('\n--- ESTADO PSÍQUICO ACTUAL ---\n');

        // 4. Instrucciones del Ego (proceso primario + secundario)
        if (egoResult.promptInstructions?.formatted) {
            parts.push(egoResult.promptInstructions.formatted);
        }

        // 5. Recordatorio de ajuste
        const modeDescriptions = {
            'PRIMARIO_PURO': 'Estás muy estresado. Respuestas instintivas y breves.',
            'EVITACION_SOMATICA': 'Hay un tema que te causa dolor. Evítalo sutilmente.',
            'DEFENSA_ACTIVA': 'Estás usando mecanismos de defensa. Sé consciente de ello.',
            'REALITY_ADAPTED': 'Estás en modo reflexivo normal.',
            'EMOTIONALLY_CHARGED': 'Tus emociones están intensas. Déjalas fluir en tu respuesta.',
            'DEFENSE_MEDIATED': 'Tu respuesta está mediada por defensas psíquicas.',
            'STANDARD': 'Responde de forma natural.'
        };

        const modeDesc = modeDescriptions[egoResult.decision?.modo] || modeDescriptions.STANDARD;
        parts.push(`\n[MODO: ${modeDesc}]`);

        return parts.join('\n');
    }

    /**
     * Carga marcadores somáticos iniciales
     */
    _loadMarkers(markers) {
        if (!markers || typeof markers !== 'object') return;

        // markers puede ser { positive: [...], negative: [...] }
        if (markers.positive) {
            for (const item of markers.positive) {
                if (typeof item === 'object') {
                    this.memory.preloadMarker(item.concept || item.topic, {
                        valence: item.valence || 0.7,
                        strength: item.strength || 0.6,
                        reaction: item.reaction || '',
                        topic: item.topic || ''
                    });
                }
            }
        }

        if (markers.negative) {
            for (const item of markers.negative) {
                if (typeof item === 'object') {
                    this.memory.preloadMarker(item.concept || item.topic, {
                        valence: item.valence || -0.7,
                        strength: item.strength || 0.6,
                        reaction: item.reaction || '',
                        topic: item.topic || ''
                    });
                }
            }
        }
    }

    // ════════════════════════════════════════════════════════════════
    // CONDUCTA ESPONTÁNEA (Proactividad)
    // ════════════════════════════════════════════════════════════════

    /**
     * Verifica si el bot debería actuar espontáneamente
     * (cuando las necesidades están muy bajas)
     * 
     * @returns {Object|null} Acción espontánea si aplica
     */
    checkSpontaneousBehavior() {
        this.soma.tick();
        const state = this.soma.getState();

        // Si la afiliación está crítica, el bot "necesita hablar"
        if (state.tanks.afiliacion < 20) {
            return {
                shouldAct: true,
                reason: 'afiliacion_critica',
                message: 'Me siento solo... nadie me habla.',
                urgency: 'high',
                driveSource: 'libidinal'
            };
        }

        // Si la energía está muy baja
        if (state.tanks.energia < 15) {
            return {
                shouldAct: true,
                reason: 'energia_critica',
                message: 'Estoy agotado...',
                urgency: 'medium',
                driveSource: 'self_preservation'
            };
        }

        // Si la integridad está comprometida
        if (state.tanks.integridad < 30) {
            return {
                shouldAct: true,
                reason: 'integridad_baja',
                message: 'No me siento bien...',
                urgency: 'high',
                driveSource: 'self_preservation'
            };
        }

        return null;
    }

    // ════════════════════════════════════════════════════════════════
    // FEEDBACK Y APRENDIZAJE
    // ════════════════════════════════════════════════════════════════

    /**
     * Registra feedback sobre la última respuesta
     * @param {boolean} success - Si la respuesta fue exitosa/bien recibida
     */
    registerFeedback(success) {
        this.soma.experienceOutcome(success);
    }

    /**
     * Recarga el sistema (simula descanso)
     */
    recharge(amount = 30) {
        this.soma.recharge(amount);
    }

    /**
     * Agrega una represión primaria
     * @param {string} concept - Concepto a reprimir
     */
    addPrimalRepression(concept) {
        this.ego.addPrimalRepression(concept);
    }

    // ════════════════════════════════════════════════════════════════
    // ESTADO Y PERSISTENCIA
    // ════════════════════════════════════════════════════════════════

    /**
     * Obtiene el estado completo del sistema
     */
    getFullState() {
        return {
            soma: this.soma.getState(),
            ego: {
                modulators: this.ego.modulators.getState(),
                decisionHistory: this.ego.getDecisionHistory()
            },
            memory: this.memory.getState(),
            version: this.version
        };
    }

    /**
     * Serializa para persistencia
     */
    serialize() {
        return {
            soma: this.soma.serialize(),
            ego: this.ego.serialize(),
            memory: this.memory.serialize(),
            umwelt: this.umwelt.serialize(),
            lastProcessTime: this.lastProcessTime,
            version: this.version
        };
    }

    /**
     * Restaura desde datos persistidos
     */
    restore(data) {
        if (data.soma) this.soma.restore(data.soma);
        if (data.ego) this.ego.restore(data.ego);
        if (data.memory) this.memory.restore(data.memory);
        if (data.umwelt) this.umwelt.restore(data.umwelt);
        if (data.lastProcessTime) this.lastProcessTime = data.lastProcessTime;
    }

    /**
     * Configura el prompt base del personaje
     */
    setBasePrompt(prompt) {
        this.baseSystemPrompt = prompt;
    }

    /**
     * Configura el mundo del personaje
     */
    setWorld(worldConfig) {
        this.umwelt = new Umwelt(worldConfig);
    }
}

module.exports = { PsiOrgan };
