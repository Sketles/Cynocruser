// ╔════════════════════════════════════════════════════════════════╗
// ║  L3: CORTEX - EGO (Yo/Ejecutivo) - VERSIÓN 2.0                 ║
// ║                                                                ║
// ║  Refactorizado según el modelo Ψ-Organ de Dietrich.            ║
// ║  Ahora actúa como ORQUESTADOR de:                              ║
// ║  - Proceso Primario (inconsciente)                             ║
// ║  - Proceso Secundario (preconsciente/consciente)               ║
// ║                                                                ║
// ║  El Ego es el "CEO" que coordina todas las instancias          ║
// ║  psíquicas y genera el prompt final para el LLM.               ║
// ╚════════════════════════════════════════════════════════════════╝

const { Id } = require('./id');
const { Superego } = require('./superego');
const { Modulators } = require('./modulators');
const { PrimaryProcess } = require('./primary_process');
const { SecondaryProcess } = require('./secondary_process');

/**
 * Ego (Yo): Sistema Ejecutivo Central - v2.0
 * 
 * Según el libro de Dietrich, el Ego:
 * - Opera bajo el Principio de Realidad
 * - Coordina entre el proceso primario y secundario
 * - Toma la decisión ejecutiva final
 * - Genera el output para el mundo externo
 */
class Ego {
    constructor() {
        // Instancias psíquicas tradicionales (mantener compatibilidad)
        this.id = new Id();
        this.superego = new Superego();
        this.modulators = new Modulators();

        // Nuevos procesos según el modelo Ψ-Organ
        this.primaryProcess = new PrimaryProcess(this.superego);
        this.secondaryProcess = new SecondaryProcess();

        // Estado
        this.decisionHistory = [];
        this.conflictosRecientes = [];
        this.selfState = { activated: true }; // El Self está siempre activo
    }

    /**
     * Proceso principal de decisión - v2.0
     * 
     * Flujo completo según el modelo Ψ-Organ:
     * 1. Proceso Primario (inconsciente)
     * 2. Proceso Secundario (consciente)
     * 3. Decisión ejecutiva
     * 
     * @param {Object} percepcion - Output del L2 (Perception)
     * @param {Object} somaState - Estado del L1 (Soma)
     * @param {Object} memoriaState - Estado de la memoria (marcadores)
     * @returns {Object} Decisión completa con instrucciones de prompt
     */
    process(percepcion, somaState, memoriaState = {}) {
        // ═══════════════════════════════════════════════════════════════
        // FASE 1: PROCESO PRIMARIO (Inconsciente)
        // ═══════════════════════════════════════════════════════════════
        // El proceso primario es completamente inconsciente.
        // Genera propuestas sin lógica causal, solo por asociación y placer.

        const context = {
            self: this.selfState,
            lastOutcome: this._getLastOutcome(),
            memoriaState
        };

        const primaryResult = this.primaryProcess.process(
            somaState,
            percepcion,
            this.superego,
            context
        );

        // ═══════════════════════════════════════════════════════════════
        // FASE 2: PROCESO SECUNDARIO (Preconsciente/Consciente)
        // ═══════════════════════════════════════════════════════════════
        // El proceso secundario evalúa las propuestas con:
        // - Prueba de causalidad
        // - Prueba de realidad
        // - Trial actions (simulaciones)
        // - Asignación de word representatives

        const secondaryResult = this.secondaryProcess.process(
            primaryResult,
            context
        );

        // ═══════════════════════════════════════════════════════════════
        // FASE 3: CALCULAR MODULADORES (compatibilidad con sistema anterior)
        // ═══════════════════════════════════════════════════════════════
        const drives = this.id.generateDrives(somaState);
        const modulatorState = this.modulators.calculate(somaState, drives);

        // ═══════════════════════════════════════════════════════════════
        // FASE 4: VERIFICAR MARCADORES SOMÁTICOS
        // ═══════════════════════════════════════════════════════════════
        const somaticWarning = this._checkSomaticMarkers(percepcion, memoriaState);

        // ═══════════════════════════════════════════════════════════════
        // FASE 5: CONSTRUIR OUTPUT FINAL
        // ═══════════════════════════════════════════════════════════════
        const decision = this._buildFinalDecision(
            primaryResult,
            secondaryResult,
            modulatorState,
            somaticWarning
        );

        const promptInstructions = this._buildPromptInstructions(
            decision,
            secondaryResult,
            primaryResult,
            modulatorState,
            somaticWarning
        );

        // Guardar en historial
        this.decisionHistory.push({
            timestamp: Date.now(),
            percepcion: percepcion.type,
            decision: decision.modo,
            emotion: secondaryResult.evaluation?.summary?.dominantEmotion?.name || 'neutral',
            feeling: secondaryResult.feeling?.value || 0
        });

        // Limitar historial
        if (this.decisionHistory.length > 100) {
            this.decisionHistory = this.decisionHistory.slice(-100);
        }

        return {
            // Decisión final
            decision,

            // Instrucciones para el prompt
            promptInstructions,

            // Estado de moduladores
            modulatorState: {
                ...modulatorState,
                // Enriquecer con datos del nuevo sistema
                emotion: secondaryResult.evaluation?.summary?.dominantEmotion?.name || modulatorState.emotion,
                feeling: secondaryResult.feeling?.value || 0
            },

            // Sugerencias de configuración
            suggestedMaxTokens: this._calculateMaxTokens(modulatorState, decision),
            voiceModifier: this._getVoiceModifier(secondaryResult),

            // Debug info
            debug: {
                primaryResult: {
                    proposalCount: primaryResult.proposals?.length || 0,
                    hasDefense: primaryResult.hasDefenseActive,
                    tension: primaryResult.evaluation?.summary?.tension || 0
                },
                secondaryResult: {
                    decision: secondaryResult.decision,
                    trialCount: secondaryResult.selection?.trialActions?.length || 0
                },
                somaticWarning
            }
        };
    }

    /**
     * Verifica marcadores somáticos (experiencias pasadas dolorosas)
     */
    _checkSomaticMarkers(percepcion, memoriaState) {
        if (!memoriaState?.markers) return null;

        const palabras = percepcion.normalized?.split(' ') || [];

        for (const palabra of palabras) {
            const marker = memoriaState.markers[palabra];
            if (marker && marker.valence < -0.5) {
                return {
                    triggered: true,
                    concept: palabra,
                    valence: marker.valence,
                    warning: 'Este tema me causó dolor antes'
                };
            }
        }

        return null;
    }

    /**
     * Construye la decisión final combinando ambos procesos
     */
    _buildFinalDecision(primaryResult, secondaryResult, modulatorState, somaticWarning) {
        const secDecision = secondaryResult.decision;
        const evaluation = primaryResult.evaluation;

        // Si hay marcador somático muy negativo, override
        if (somaticWarning?.triggered && somaticWarning.valence < -0.7) {
            return {
                modo: 'EVITACION_SOMATICA',
                descripcion: 'Alarma visceral activada por memoria dolorosa',
                instanciaDominante: 'memoria',
                conductaSeleccionada: 'evadir_tema',
                confidence: 0.8
            };
        }

        // Si arousal es crítico, proceso primario domina
        if (modulatorState.arousal >= 85) {
            return {
                modo: 'PRIMARIO_PURO',
                descripcion: 'Estrés máximo, respuesta instintiva',
                instanciaDominante: 'ello',
                conductaSeleccionada: primaryResult.driveState?.dominant?.aim || 'evitar',
                confidence: 0.4
            };
        }

        // Si hay defensa activa
        if (primaryResult.hasDefenseActive) {
            const defensa = primaryResult.defenses[0]?.defense;
            return {
                modo: 'DEFENSA_ACTIVA',
                descripcion: `Usando ${defensa?.nombre || 'defensa'} para manejar impulso`,
                instanciaDominante: 'superego',
                conductaSeleccionada: secDecision.promptBehavior,
                defensaAplicada: secDecision.defenseApplied,
                confidence: secDecision.confidence
            };
        }

        // Proceso secundario normal
        return {
            modo: secDecision.mode,
            descripcion: 'Procesamiento reflexivo normal',
            instanciaDominante: 'yo',
            conductaSeleccionada: secDecision.promptBehavior,
            confidence: secDecision.confidence,
            action: secDecision.action
        };
    }

    /**
     * Construye las instrucciones finales para el system prompt
     */
    _buildPromptInstructions(decision, secondaryResult, primaryResult, modulatorState, somaticWarning) {
        const instrucciones = [];

        // 1. Instrucciones del Proceso Secundario (más refinadas)
        if (secondaryResult.promptInstructions?.raw) {
            instrucciones.push(...secondaryResult.promptInstructions.raw);
        }

        // 2. Si hay instrucciones de evaluación del primario, agregar
        const evalInstructions = primaryResult.evaluation?.summary;
        if (evalInstructions && !instrucciones.some(i => i.includes('EMOCIÓN'))) {
            instrucciones.push(`[EMOCIÓN: ${evalInstructions.dominantEmotion?.name || 'neutral'}]`);
        }

        // 3. Arousal como contexto
        if (modulatorState.arousal > 70) {
            instrucciones.push('[AROUSAL: Alto - Respuestas más breves y directas]');
        } else if (modulatorState.arousal < 30) {
            instrucciones.push('[AROUSAL: Bajo - Puedes ser más elaborado]');
        }

        // 4. Alerta somática
        if (somaticWarning?.triggered) {
            instrucciones.push(`[ALERTA SOMÁTICA: ${somaticWarning.warning}. Evitar: "${somaticWarning.concept}"]`);
        }

        // 5. Conducta final
        if (!instrucciones.some(i => i.includes('CONDUCTA'))) {
            instrucciones.push(`[CONDUCTA: ${decision.conductaSeleccionada}]`);
        }

        return {
            formatted: instrucciones.join('\n'),
            raw: instrucciones,
            mode: decision.modo
        };
    }

    /**
     * Calcula tokens máximos según estado
     */
    _calculateMaxTokens(modulatorState, decision) {
        const resolutionMap = {
            'HIGH': 200,
            'MEDIUM': 150,
            'LOW': 80,
            'TUNNEL': 40
        };

        let base = resolutionMap[modulatorState.resolution] || 150;

        // Si hay defensa, respuestas más cortas
        if (decision.defensaAplicada) {
            base = Math.floor(base * 0.7);
        }

        return base;
    }

    /**
     * Obtiene modificador de voz para TTS
     */
    _getVoiceModifier(secondaryResult) {
        const emotion = secondaryResult.evaluation?.summary?.dominantEmotion?.name || 'neutral';

        const voiceMap = {
            'joy': 'cheerful and energetic tone',
            'anger': 'aggressive and impatient tone',
            'fear': 'nervous and hesitant tone',
            'sadness': 'soft and melancholic tone',
            'surprise': 'excited and curious tone',
            'disgust': 'dismissive tone',
            'neutral': 'calm and conversational tone'
        };

        return voiceMap[emotion] || voiceMap.neutral;
    }

    /**
     * Obtiene el último resultado (para contexto)
     */
    _getLastOutcome() {
        if (this.decisionHistory.length === 0) return null;
        const last = this.decisionHistory[this.decisionHistory.length - 1];
        return last.feeling > 0 ? 'positive' : last.feeling < 0 ? 'negative' : 'neutral';
    }

    /**
     * Agrega represión primaria
     */
    addPrimalRepression(concept) {
        this.primaryProcess.addPrimalRepression(concept);
    }

    /**
     * Obtiene el historial de decisiones recientes
     */
    getDecisionHistory(limit = 10) {
        return this.decisionHistory.slice(-limit);
    }

    serialize() {
        return {
            id: this.id.serialize(),
            superego: this.superego.serialize(),
            modulators: this.modulators.serialize(),
            primaryProcess: this.primaryProcess.serialize(),
            secondaryProcess: this.secondaryProcess.serialize(),
            decisionHistory: this.decisionHistory.slice(-50),
            selfState: this.selfState
        };
    }

    restore(data) {
        if (data.id) this.id.restore(data.id);
        if (data.superego) this.superego.restore(data.superego);
        if (data.modulators) this.modulators.restore(data.modulators);
        if (data.primaryProcess) this.primaryProcess.restore(data.primaryProcess);
        if (data.secondaryProcess) this.secondaryProcess.restore(data.secondaryProcess);
        if (data.decisionHistory) this.decisionHistory = data.decisionHistory;
        if (data.selfState) this.selfState = data.selfState;
    }
}

module.exports = { Ego };
