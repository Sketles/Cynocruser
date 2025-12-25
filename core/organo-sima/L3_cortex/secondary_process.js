// ╔════════════════════════════════════════════════════════════════╗
// ║  L3: CORTEX - SECONDARY PROCESS (Proceso Secundario)           ║
// ║                                                                ║
// ║  Según el libro de Dietrich (p.31, 44-45):                     ║
// ║  - Contiene 9 funciones psíquicas                              ║
// ║  - Información PRECONSCIENTE y CONSCIENTE                      ║
// ║  - Asigna "word representatives" a las cosas                   ║
// ║  - Prueba de CAUSALIDAD y REALIDAD                             ║
// ║  - Puede ejecutar 2-3 TRIAL ACTIONS en paralelo                ║
// ║  - Opera bajo el Principio de Realidad                         ║
// ║                                                                ║
// ║  Contiene: Desire Selection Track + Action Decision Track      ║
// ╚════════════════════════════════════════════════════════════════╝

/**
 * WordRepresentative: Representante de palabra
 * 
 * Según el libro (p.31): "word representatives are assigned to all thing 
 * representatives. The assignment of word representatives is a fundamental 
 * property and a necessity for objects or states to become conscious."
 */
class WordRepresentative {
    constructor(thingRepId, word, feeling = 0) {
        this.thingRepId = thingRepId;  // Referencia al thing representative original
        this.word = word;               // La palabra asignada
        this.feeling = feeling;         // Evaluación de feeling (escalar)
        this.isConscious = false;       // Se vuelve consciente bajo ciertas condiciones
        this.selfReference = false;     // ¿Está conectado al Self?
        this.timestamp = Date.now();
    }

    /**
     * Activa la consciencia para este representante
     * Según el libro: requiere feeling + Self
     */
    makeConscious(feeling, selfActivated) {
        this.feeling = feeling;
        this.selfReference = selfActivated;
        this.isConscious = feeling !== 0 && selfActivated;
        return this;
    }
}

/**
 * TrialAction: Simulación de acción antes de ejecutar
 * 
 * Según el libro (p.45): "the psyche performs trial actions... According to 
 * Solms, two or three simulation experiments can run in parallel"
 */
class TrialAction {
    constructor(proposal, id) {
        this.id = id;
        this.proposal = proposal;
        this.expectedOutcome = null;
        this.causalityCheck = null;
        this.realityCheck = null;
        this.pleasureScore = 0;
        this.unpleasureScore = 0;
        this.netScore = 0;
    }

    /**
     * Simula el resultado de esta acción
     * @param {Object} context - Contexto actual
     * @param {Object} memories - Memorias disponibles
     */
    simulate(context, memories = {}) {
        const { proposal } = this;

        // ─────────────────────────────────────────
        // 1. Prueba de Causalidad
        // ─────────────────────────────────────────
        // ¿La acción puede lógicamente llevar al resultado?
        this.causalityCheck = this._checkCausality(proposal, context);

        // ─────────────────────────────────────────
        // 2. Prueba de Realidad
        // ─────────────────────────────────────────
        // ¿Es posible en el mundo externo?
        this.realityCheck = this._checkReality(proposal, context);

        // ─────────────────────────────────────────
        // 3. Estimar placer/displacer
        // ─────────────────────────────────────────
        if (this.causalityCheck.passes && this.realityCheck.passes) {
            this.pleasureScore = proposal.quotaOfAffect * 0.8;
            this.unpleasureScore = proposal.guilt || 0;
        } else {
            this.pleasureScore = 0;
            this.unpleasureScore = 0.3; // Frustración por no poder ejecutar
        }

        this.netScore = this.pleasureScore - this.unpleasureScore;

        this.expectedOutcome = {
            action: proposal.aim,
            probability: this.realityCheck.passes ? 0.7 : 0.2,
            pleasure: this.pleasureScore,
            unpleasure: this.unpleasureScore,
            net: this.netScore
        };

        return this;
    }

    _checkCausality(proposal, context) {
        // Verificar si la acción tiene sentido causal
        // Por ahora, simplificado
        const passes = proposal.aim && proposal.object;
        return {
            passes,
            reason: passes ? 'causal_chain_valid' : 'no_clear_path'
        };
    }

    _checkReality(proposal, context) {
        // Verificar si es posible en el mundo real
        // Por ahora, la mayoría de acciones conversacionales son posibles
        const isConversational = ['connect', 'respond', 'humor', 'wit', 'demonstrate_ability']
            .includes(proposal.aim);

        return {
            passes: isConversational || proposal.type === 'superego_proactive',
            reason: isConversational ? 'conversational_context' : 'requires_external_action'
        };
    }
}

/**
 * DesireAndNeedSelectionTrack: Pista de Selección de Deseos y Necesidades
 * 
 * Recibe propuestas del proceso primario y las evalúa con criterios
 * del proceso secundario (causalidad, realidad)
 */
class DesireAndNeedSelectionTrack {
    constructor() {
        this.selectedDesires = [];
        this.trialActions = [];
    }

    /**
     * Procesa las propuestas del proceso primario
     * @param {Array} proposals - Propuestas del primary process
     * @param {Object} feeling - Estado de feeling actual
     * @param {Object} context - Contexto del mundo
     */
    process(proposals, feeling, context = {}) {
        this.selectedDesires = [];
        this.trialActions = [];

        // ─────────────────────────────────────────
        // 1. Asignar Word Representatives
        // ─────────────────────────────────────────
        const wordReps = proposals.map(p => this._assignWord(p, feeling));

        // ─────────────────────────────────────────
        // 2. Filtrar por realidad externa
        // ─────────────────────────────────────────
        const viableDesires = wordReps.filter(wr => {
            // Solo pasan los que tienen sentido en el contexto actual
            return wr.feeling.intensity > 0.1 || wr.proposal.urgency === 'critical';
        });

        // ─────────────────────────────────────────
        // 3. Crear Trial Actions (máx 3)
        // ─────────────────────────────────────────
        const topDesires = viableDesires
            .sort((a, b) => (b.proposal.quotaOfAffect || 0) - (a.proposal.quotaOfAffect || 0))
            .slice(0, 3);

        for (let i = 0; i < topDesires.length; i++) {
            const trial = new TrialAction(topDesires[i].proposal, `trial_${i}`);
            trial.simulate(context);
            this.trialActions.push(trial);
        }

        this.selectedDesires = viableDesires;

        return {
            desires: this.selectedDesires,
            trialActions: this.trialActions
        };
    }

    /**
     * Asigna una palabra a una propuesta (thing → word representative)
     */
    _assignWord(proposal, feeling) {
        // Mapeo de aims a palabras
        const wordMap = {
            'restore_energy': 'descansar',
            'protect_self': 'defenderse',
            'connect': 'conectar',
            'demonstrate_ability': 'demostrar',
            'humor': 'bromear',
            'wit': 'ingenio',
            'neutral_topic': 'hablar',
            'ideal_satisfaction': 'ser_mejor'
        };

        const word = wordMap[proposal.aim] || proposal.aim;

        return {
            wordRep: new WordRepresentative(
                proposal.id || `prop_${Date.now()}`,
                word,
                feeling.value || 0
            ),
            proposal,
            feeling: feeling
        };
    }
}

/**
 * ActionDecisionTrack: Pista de Decisión de Acción
 * 
 * Según el libro (p.45): "The action decision track then ultimately decides 
 * which action will be performed not only mentally but also physiologically"
 */
class ActionDecisionTrack {
    constructor() {
        this.lastDecision = null;
        this.decisionHistory = [];
    }

    /**
     * Decide la mejor acción basándose en las trial actions
     * @param {Array} trialActions - Acciones simuladas
     * @param {Object} feeling - Estado de feeling
     * @param {Object} context - Contexto adicional
     */
    decide(trialActions, feeling, context = {}) {
        if (!trialActions || trialActions.length === 0) {
            this.lastDecision = this._getDefaultDecision();
            return this.lastDecision;
        }

        // ─────────────────────────────────────────
        // 1. Ordenar por net score (placer - displacer)
        // ─────────────────────────────────────────
        const sortedTrials = [...trialActions].sort((a, b) => b.netScore - a.netScore);

        // ─────────────────────────────────────────
        // 2. Verificar que pase causalidad y realidad
        // ─────────────────────────────────────────
        const viable = sortedTrials.filter(t =>
            t.causalityCheck?.passes && t.realityCheck?.passes
        );

        // ─────────────────────────────────────────
        // 3. Seleccionar la mejor opción
        // ─────────────────────────────────────────
        const winner = viable[0] || sortedTrials[0];

        this.lastDecision = {
            action: winner.proposal.aim,
            object: winner.proposal.object,
            mode: this._determineMode(winner, feeling),

            // Información para el prompt
            promptBehavior: this._mapToPromptBehavior(winner.proposal),

            // Scores
            expectedPleasure: winner.pleasureScore,
            expectedUnpleasure: winner.unpleasureScore,
            confidence: winner.netScore,

            // Defensas aplicadas
            defenseApplied: winner.proposal.defenseApplied || null,

            // Metadata
            trialCount: trialActions.length,
            timestamp: Date.now()
        };

        // Guardar en historial
        this.decisionHistory.push({
            decision: this.lastDecision.action,
            mode: this.lastDecision.mode,
            timestamp: Date.now()
        });

        // Limitar historial
        if (this.decisionHistory.length > 50) {
            this.decisionHistory.shift();
        }

        return this.lastDecision;
    }

    /**
     * Determina el modo de operación
     */
    _determineMode(trial, feeling) {
        // Si hubo defensa, el modo cambia
        if (trial.proposal.defenseApplied) {
            return 'DEFENSE_MEDIATED';
        }

        // Si el feeling es muy intenso
        if (Math.abs(feeling.value) > 0.7) {
            return 'EMOTIONALLY_CHARGED';
        }

        // Si pasó todas las pruebas
        if (trial.causalityCheck?.passes && trial.realityCheck?.passes) {
            return 'REALITY_ADAPTED';
        }

        return 'STANDARD';
    }

    /**
     * Mapea la propuesta a un comportamiento para el prompt
     */
    _mapToPromptBehavior(proposal) {
        const behaviorMap = {
            'connect': 'responder_sociable',
            'protect_self': 'responder_defensivo',
            'restore_energy': 'responder_breve',
            'demonstrate_ability': 'responder_informativo',
            'humor': 'responder_con_humor',
            'wit': 'responder_ingenioso',
            'neutral_topic': 'cambiar_tema',
            'ideal_satisfaction': 'ser_util'
        };

        return behaviorMap[proposal.aim] || 'conversar_normal';
    }

    _getDefaultDecision() {
        return {
            action: 'respond',
            object: 'conversation',
            mode: 'STANDARD',
            promptBehavior: 'conversar_normal',
            expectedPleasure: 0.3,
            expectedUnpleasure: 0,
            confidence: 0.5,
            defenseApplied: null,
            trialCount: 0,
            timestamp: Date.now()
        };
    }

    getHistory(limit = 10) {
        return this.decisionHistory.slice(-limit);
    }
}

/**
 * PrimarySecondaryTransformationTrack: Track de Transformación
 * 
 * Según el libro (p.43-44): "this track is the function in which the feeling 
 * is determined from the quota of affects and the various emotions"
 * 
 * También maneja el feedback del secundario al primario
 */
class PrimarySecondaryTransformationTrack {
    constructor() {
        this.feedbackQueue = [];
    }

    /**
     * Transforma propuestas del primario para el secundario
     * @param {Object} primaryResult - Resultado del proceso primario
     * @param {Object} feeling - Feeling calculado
     */
    transform(primaryResult, feeling) {
        // Las propuestas se enriquecen con feeling
        const enrichedProposals = primaryResult.proposals.map(p => ({
            ...p,
            feeling: feeling.value,
            feelingIntensity: feeling.intensity,
            readyForConsciousness: Math.abs(feeling.value) > 0.2
        }));

        return {
            proposals: enrichedProposals,
            evaluation: primaryResult.evaluation,
            defenses: primaryResult.defenses,
            feeling
        };
    }

    /**
     * Recibe feedback del proceso secundario
     * Según el libro: "the representative parts of the secondary process come 
     * back directly into the primary process"
     */
    receiveFeedback(decision) {
        // Convertir la decisión (con palabras) de vuelta a thing representative
        const thingRep = {
            source: 'secondary_feedback',
            action: decision.action,
            mode: decision.mode,
            cathexis: decision.expectedPleasure - decision.expectedUnpleasure,
            timestamp: Date.now()
        };

        this.feedbackQueue.push(thingRep);

        // Limitar cola
        if (this.feedbackQueue.length > 20) {
            this.feedbackQueue.shift();
        }

        return thingRep;
    }

    /**
     * Obtiene feedback para reinjectar al proceso primario
     * Esto permite fantasías inconscientes
     */
    getFeedbackForPrimary() {
        return this.feedbackQueue;
    }
}

/**
 * SecondaryProcess: Orquestador del Proceso Secundario Completo
 * 
 * Coordina los tracks y produce la decisión final
 */
class SecondaryProcess {
    constructor() {
        this.transformationTrack = new PrimarySecondaryTransformationTrack();
        this.desireSelectionTrack = new DesireAndNeedSelectionTrack();
        this.actionDecisionTrack = new ActionDecisionTrack();

        this.lastResult = null;
    }

    /**
     * Procesa el output del proceso primario
     * @param {Object} primaryResult - Resultado del primary process
     * @param {Object} context - Contexto adicional
     */
    process(primaryResult, context = {}) {
        const feeling = primaryResult.evaluation?.feeling || { value: 0, intensity: 0 };

        // ═══════════════════════════════════════════════════════════════
        // FASE 1: Transformación (Primario → Secundario)
        // ═══════════════════════════════════════════════════════════════
        const transformed = this.transformationTrack.transform(primaryResult, feeling);

        // ═══════════════════════════════════════════════════════════════
        // FASE 2: Selección de Deseos + Trial Actions
        // ═══════════════════════════════════════════════════════════════
        const selection = this.desireSelectionTrack.process(
            transformed.proposals,
            feeling,
            context
        );

        // ═══════════════════════════════════════════════════════════════
        // FASE 3: Decisión de Acción
        // ═══════════════════════════════════════════════════════════════
        const decision = this.actionDecisionTrack.decide(
            selection.trialActions,
            feeling,
            context
        );

        // ═══════════════════════════════════════════════════════════════
        // FASE 4: Feedback al Proceso Primario
        // ═══════════════════════════════════════════════════════════════
        this.transformationTrack.receiveFeedback(decision);

        // ═══════════════════════════════════════════════════════════════
        // OUTPUT
        // ═══════════════════════════════════════════════════════════════
        this.lastResult = {
            decision,
            selection,
            feeling,
            evaluation: transformed.evaluation,
            defenses: transformed.defenses,

            // Para el prompt
            promptInstructions: this._buildPromptInstructions(decision, feeling, transformed),

            // Metadata
            isConscious: true,
            timestamp: Date.now()
        };

        return this.lastResult;
    }

    /**
     * Construye las instrucciones finales para el prompt
     */
    _buildPromptInstructions(decision, feeling, transformed) {
        const instructions = [];

        // 1. Estado emocional (desde evaluation)
        if (transformed.evaluation?.summary) {
            const dom = transformed.evaluation.summary.dominantEmotion;
            instructions.push(`[EMOCIÓN DOMINANTE: ${dom.name} (intensidad: ${(dom.intensity * 100).toFixed(0)}%)]`);
        }

        // 2. Feeling
        instructions.push(`[FEELING: ${feeling.description || 'neutral'} (${(feeling.value * 100).toFixed(0)}%)]`);

        // 3. Modo de decisión
        instructions.push(`[MODO: ${decision.mode}]`);

        // 4. Comportamiento seleccionado
        instructions.push(`[CONDUCTA: ${decision.promptBehavior}]`);

        // 5. Defensa activa
        if (decision.defenseApplied) {
            const defenseInstructions = {
                'sublimacion': 'Transforma cualquier frustración en humor inteligente.',
                'desplazamiento': 'Habla de otro tema, evita lo que te incomoda.',
                'racionalizacion': 'Da una explicación lógica para tu estado.',
                'proyeccion': 'Sugiere que el otro es quien tiene el problema.',
                'negacion': 'Actúa como si nada hubiera pasado.'
            };
            instructions.push(`[DEFENSA: ${defenseInstructions[decision.defenseApplied] || decision.defenseApplied}]`);
        }

        // 6. Confianza en la decisión
        if (decision.confidence < 0.3) {
            instructions.push('[NOTA: Tienes poca certeza sobre cómo responder, sé más cauteloso]');
        }

        return {
            formatted: instructions.join('\n'),
            raw: instructions,
            decision,
            feeling
        };
    }

    /**
     * Obtiene el historial de decisiones
     */
    getDecisionHistory(limit = 10) {
        return this.actionDecisionTrack.getHistory(limit);
    }

    serialize() {
        return {
            decisionHistory: this.actionDecisionTrack.decisionHistory,
            feedbackQueue: this.transformationTrack.feedbackQueue
        };
    }

    restore(data) {
        if (data?.decisionHistory) {
            this.actionDecisionTrack.decisionHistory = data.decisionHistory;
        }
        if (data?.feedbackQueue) {
            this.transformationTrack.feedbackQueue = data.feedbackQueue;
        }
    }
}

module.exports = {
    WordRepresentative,
    TrialAction,
    DesireAndNeedSelectionTrack,
    ActionDecisionTrack,
    PrimarySecondaryTransformationTrack,
    SecondaryProcess
};
