// ╔════════════════════════════════════════════════════════════════╗
// ║  L3: CORTEX - PRIMARY PROCESS (Proceso Primario)               ║
// ║                                                                ║
// ║  Según el libro de Dietrich (p.27-30):                         ║
// ║  - Contiene 19 funciones psíquicas                             ║
// ║  - Todo es INCONSCIENTE                                        ║
// ║  - Solo maneja "thing representatives" (sin palabras)          ║
// ║  - No hay lógica causal ni temporal                            ║
// ║  - Opera por ASOCIACIÓN pura                                   ║
// ║  - Principio del Placer: maximizar placer, minimizar dolor     ║
// ║                                                                ║
// ║  Contiene: Drive Track + Perception Track + Defense Track      ║
// ╚════════════════════════════════════════════════════════════════╝

const { PsychicIntensity } = require('./evaluation');

/**
 * ThingRepresentative: Representante de cosa (sin palabra asignada)
 * 
 * En el proceso primario, toda información existe como "cosa" sin nombre,
 * solo con carga afectiva (catexia).
 */
class ThingRepresentative {
    constructor(id, source) {
        this.id = id;
        this.source = source;           // 'perception', 'drive', 'memory'
        this.cathexis = 0;              // Carga afectiva
        this.associations = [];          // IDs de otros representantes asociados
        this.timestamp = Date.now();
    }

    invest(amount) {
        this.cathexis += amount;
        return this;
    }

    associate(otherId) {
        if (!this.associations.includes(otherId)) {
            this.associations.push(otherId);
        }
        return this;
    }
}

/**
 * DriveTrack: Pista de Impulsos
 * 
 * Según el libro (p.28-29): "The process of self-preservation has input 
 * variables such as an imbalanced homeostasis of the body."
 * 
 * Maneja:
 * - I2a: Self-preservation drives (homeostasis)
 * - I2b: Sexual/libidinal drives (pleasure gain)
 */
class DriveTrack {
    constructor() {
        this.representatives = new Map();
        this.activeDrives = [];
    }

    /**
     * Procesa las pulsiones desde el estado somático
     * @param {Object} somaState - Estado del soma
     * @returns {Object} Drive representatives con quotas
     */
    process(somaState) {
        this.activeDrives = [];
        const tanks = somaState.tanks || {};

        // ─────────────────────────────────────────
        // I2a: Self-Preservation Drives
        // ─────────────────────────────────────────

        // Hambre de energía
        if (tanks.energia < 70) {
            this.activeDrives.push({
                type: 'self_preservation',
                subtype: 'energy',
                source: 'energia',
                aim: 'restore_energy',         // Aim of drive
                object: 'rest',                // Object of drive
                quotaOfAffect: (100 - tanks.energia) / 100,
                urgency: tanks.energia < 30 ? 'critical' : 'normal'
            });
        }

        // Protección de integridad
        if (tanks.integridad < 80) {
            this.activeDrives.push({
                type: 'self_preservation',
                subtype: 'integrity',
                source: 'integridad',
                aim: 'protect_self',
                object: 'safety',
                quotaOfAffect: (100 - tanks.integridad) / 100,
                urgency: tanks.integridad < 40 ? 'critical' : 'normal'
            });
        }

        // ─────────────────────────────────────────
        // I2b: Sexual/Libidinal Drives  
        // ─────────────────────────────────────────

        // Necesidad de afiliación
        if (tanks.afiliacion < 70) {
            this.activeDrives.push({
                type: 'libidinal',
                subtype: 'affiliation',
                source: 'afiliacion',
                aim: 'connect',
                object: 'social_contact',
                quotaOfAffect: (100 - tanks.afiliacion) / 100,
                urgency: tanks.afiliacion < 25 ? 'critical' : 'normal'
            });
        }

        // Necesidad de competencia (sublimación)
        if (tanks.competencia < 60) {
            this.activeDrives.push({
                type: 'libidinal',
                subtype: 'mastery',
                source: 'competencia',
                aim: 'demonstrate_ability',
                object: 'achievement',
                quotaOfAffect: (100 - tanks.competencia) / 100,
                urgency: 'normal'
            });
        }

        // Ordenar por quota de afecto (Winner-takes-all)
        this.activeDrives.sort((a, b) => b.quotaOfAffect - a.quotaOfAffect);

        return {
            drives: this.activeDrives,
            dominant: this.activeDrives[0] || null,
            hasConflict: this.activeDrives.length > 1 &&
                Math.abs(
                    (this.activeDrives[0]?.quotaOfAffect || 0) -
                    (this.activeDrives[1]?.quotaOfAffect || 0)
                ) < 0.15,
            totalTension: this.activeDrives.reduce((sum, d) => sum + d.quotaOfAffect, 0)
        };
    }

    /**
     * Busca asociaciones en memoria para satisfacer el impulso
     * @param {Object} drive - Impulso activo
     * @param {Map} memories - Memoria de representantes
     */
    associateSolutions(drive, memories) {
        // En el proceso primario, se asocian soluciones sin lógica causal
        // Solo por valencia: ¿qué me dio placer antes cuando tenía esta necesidad?
        const solutions = [];

        // Buscar en memorias asociadas al object del drive
        for (const [id, memory] of memories) {
            if (memory.valence > 0 && memory.associations?.includes(drive.object)) {
                solutions.push({
                    representative: memory,
                    expectedPleasure: memory.valence * drive.quotaOfAffect,
                    isFantasy: true // En proceso primario todo es fantasía
                });
            }
        }

        return solutions;
    }
}

/**
 * PerceptionTrack: Pista de Percepción
 * 
 * Según el libro (p.28): "Perception of the body comprises the information 
 * of muscle activities, changes in temperature, pain sensations...
 * Perception of the environment receives input through visual, olfactory..."
 * 
 * Maneja:
 * - I1a: Body perception (interoception)
 * - I1b: Environment perception (exteroception)
 */
class PerceptionTrack {
    constructor() {
        this.primalRepressions = new Set(); // Contenidos primariamente reprimidos
        this.currentPerceptions = [];
    }

    /**
     * Procesa percepciones y las convierte en thing representatives
     * @param {Object} perception - Percepción del L2
     * @param {Object} driveState - Estado actual de los impulsos
     * @returns {Object} Percepciones procesadas con valencia
     */
    process(perception, driveState) {
        const result = {
            bodyPerceptions: [],
            environmentPerceptions: [],
            primalWarnings: []
        };

        // ─────────────────────────────────────────
        // Verificar represión primaria
        // ─────────────────────────────────────────
        const normalizedInput = perception.normalized || '';
        for (const repressed of this.primalRepressions) {
            if (normalizedInput.includes(repressed)) {
                result.primalWarnings.push({
                    concept: repressed,
                    action: 'block_from_consciousness',
                    reason: 'primal_repression'
                });
            }
        }

        // ─────────────────────────────────────────
        // Procesar percepción del cuerpo
        // ─────────────────────────────────────────
        // Las percepciones del cuerpo se derivan del soma
        // (dolor, fatiga, hambre, etc.)

        // ─────────────────────────────────────────
        // Procesar percepción del ambiente
        // ─────────────────────────────────────────
        const thingRep = new ThingRepresentative(
            `perc_${Date.now()}`,
            'environment'
        );

        // Investir con carga afectiva según valencia
        const valenceMap = { positive: 0.7, negative: -0.7, neutral: 0 };
        thingRep.invest(valenceMap[perception.valence] || 0);

        // Si el estímulo es relevante para un drive activo, aumentar catexia
        if (driveState?.dominant) {
            const isRelevant = perception.affectedTanks?.includes(
                driveState.dominant.source
            );
            if (isRelevant) {
                thingRep.invest(driveState.dominant.quotaOfAffect * 0.5);
            }
        }

        result.environmentPerceptions.push({
            representative: thingRep,
            type: perception.type,
            intensity: perception.intensity,
            affectsIntegrity: perception.affectedTanks?.includes('integridad'),
            affectsAffiliation: perception.affectedTanks?.includes('afiliacion')
        });

        this.currentPerceptions = [
            ...result.bodyPerceptions,
            ...result.environmentPerceptions
        ];

        return result;
    }

    /**
     * Agrega contenido a la represión primaria
     * @param {string} concept - Concepto a reprimir primariamente
     */
    addPrimalRepression(concept) {
        this.primalRepressions.add(concept.toLowerCase());
    }
}

/**
 * DefenseTrack: Pista de Defensa
 * 
 * Según el libro (p.30-31): "the defense system of the psyche has developed 
 * the mechanism to store these memories as primal repressions that only the 
 * primary process can access"
 * 
 * Incluye el Superyó (reactivo y proactivo) y los mecanismos de defensa
 */
class DefenseTrack {
    constructor(superego) {
        this.superego = superego;
        this.activeDefenses = [];
        this.filteredProposals = [];
    }

    /**
     * Filtra las propuestas del DriveTrack antes de pasar al proceso secundario
     * @param {Array} driveProposals - Propuestas del drive track
     * @param {Object} perceptionState - Estado de la percepción
     * @param {Object} context - Contexto adicional
     */
    filter(driveProposals, perceptionState, context = {}) {
        this.filteredProposals = [];
        this.activeDefenses = [];

        for (const proposal of driveProposals) {
            // ─────────────────────────────────────────
            // SUPERYÓ REACTIVO: ¿Esto viola alguna norma?
            // ─────────────────────────────────────────
            const censura = this.superego.censurar({
                pulsion: proposal.subtype,
                intensidad: proposal.quotaOfAffect,
                impulsoConductual: proposal.aim
            });

            if (!censura.permitido) {
                // Activar mecanismo de defensa
                const defensa = this.superego.activarDefensa(
                    censura.defensaSugerida,
                    proposal
                );

                this.activeDefenses.push({
                    originalProposal: proposal,
                    defense: defensa,
                    reason: censura.violaciones
                });

                // Modificar la propuesta según la defensa
                const modifiedProposal = this._applyDefense(proposal, defensa);
                if (modifiedProposal) {
                    this.filteredProposals.push(modifiedProposal);
                }
            } else {
                // Propuesta permitida, pasa sin modificar
                this.filteredProposals.push({
                    ...proposal,
                    modified: false,
                    guilt: censura.culpa,
                    shame: censura.verguenza
                });
            }
        }

        // ─────────────────────────────────────────
        // SUPERYÓ PROACTIVO: Agregar propuestas propias
        // ─────────────────────────────────────────
        const proactiveProposals = this._generateProactiveProposals(context);
        this.filteredProposals.push(...proactiveProposals);

        return {
            proposals: this.filteredProposals,
            defenses: this.activeDefenses,
            hasDefenseActive: this.activeDefenses.length > 0
        };
    }

    /**
     * Aplica la defensa a una propuesta
     */
    _applyDefense(proposal, defensa) {
        if (!defensa) return proposal;

        switch (defensa.tipo) {
            case 'represion':
                // Bloquear completamente
                return null;

            case 'sublimacion':
                // Transformar en algo socialmente aceptable
                return {
                    ...proposal,
                    aim: 'humor',  // Transformar en humor
                    object: 'wit',
                    modified: true,
                    defenseApplied: 'sublimacion'
                };

            case 'desplazamiento':
                // Redirigir a otro objeto
                return {
                    ...proposal,
                    object: 'neutral_topic',
                    modified: true,
                    defenseApplied: 'desplazamiento'
                };

            case 'racionalizacion':
                // Permitir pero con justificación
                return {
                    ...proposal,
                    modified: true,
                    defenseApplied: 'racionalizacion',
                    rationalization: defensa.instruccionPrompt
                };

            case 'proyeccion':
                // Atribuir al otro
                return {
                    ...proposal,
                    target: 'other',
                    modified: true,
                    defenseApplied: 'proyeccion'
                };

            case 'negacion':
                // Negar la realidad del estímulo
                return {
                    ...proposal,
                    intensity: 0.1,  // Reducir intensidad
                    modified: true,
                    defenseApplied: 'negacion'
                };

            default:
                return proposal;
        }
    }

    /**
     * Genera propuestas proactivas del Superyó
     * "Haz una buena acción cada día"
     */
    _generateProactiveProposals(context) {
        const proposals = [];

        // Si hay ideales del superyó que empujan a actuar
        if (this.superego.norms?.ideales) {
            for (const ideal of this.superego.norms.ideales) {
                if (ideal.peso > 0.6 && Math.random() < ideal.peso * 0.2) {
                    proposals.push({
                        type: 'superego_proactive',
                        subtype: ideal.ideal,
                        source: 'superego',
                        aim: ideal.ideal,
                        object: 'ideal_satisfaction',
                        quotaOfAffect: ideal.peso * 0.5,
                        urgency: 'low',
                        modified: false
                    });
                }
            }
        }

        return proposals;
    }
}

/**
 * PrimaryProcess: Orquestador del Proceso Primario Completo
 * 
 * Coordina los 3 tracks y produce propuestas para el proceso secundario
 */
class PrimaryProcess {
    constructor(superego) {
        this.driveTrack = new DriveTrack();
        this.perceptionTrack = new PerceptionTrack();
        this.defenseTrack = new DefenseTrack(superego);
        this.psychicIntensity = new PsychicIntensity();

        // Estado interno
        this.lastProcessResult = null;
    }

    /**
     * Procesa todo el proceso primario
     * @param {Object} somaState - Estado del soma
     * @param {Object} perception - Percepción del L2
     * @param {Object} superego - Referencia al superyó
     * @param {Object} context - Contexto adicional
     */
    process(somaState, perception, superego, context = {}) {
        // ═══════════════════════════════════════════════════════════════
        // FASE 1: Drive Track - ¿Qué necesito?
        // ═══════════════════════════════════════════════════════════════
        const driveState = this.driveTrack.process(somaState);

        // ═══════════════════════════════════════════════════════════════
        // FASE 2: Perception Track - ¿Qué percibo?
        // ═══════════════════════════════════════════════════════════════
        const perceptionState = this.perceptionTrack.process(perception, driveState);

        // ═══════════════════════════════════════════════════════════════
        // FASE 3: Calcular Psychic Intensity
        // ═══════════════════════════════════════════════════════════════
        const censura = superego?.censurar?.({}) || { culpa: 0, verguenza: 0 };
        const evaluation = this.psychicIntensity.evaluate(
            somaState,
            perception,
            { culpa: censura.culpa, verguenza: censura.verguenza },
            context
        );

        // ═══════════════════════════════════════════════════════════════
        // FASE 4: Defense Track - Filtrar propuestas
        // ═══════════════════════════════════════════════════════════════
        const defenseResult = this.defenseTrack.filter(
            driveState.drives,
            perceptionState,
            context
        );

        // ═══════════════════════════════════════════════════════════════
        // OUTPUT: Propuestas para el Proceso Secundario
        // ═══════════════════════════════════════════════════════════════
        this.lastProcessResult = {
            // Propuestas filtradas (cosa representatives con afecto)
            proposals: defenseResult.proposals,

            // Estado de los tracks
            driveState,
            perceptionState,

            // Evaluación emocional completa
            evaluation,

            // Defensas activas
            defenses: defenseResult.defenses,
            hasDefenseActive: defenseResult.hasDefenseActive,

            // Warnings de represión primaria
            primalWarnings: perceptionState.primalWarnings,

            // Metadatos
            isUnconscious: true, // TODO: todo en proceso primario es inconsciente
            timestamp: Date.now()
        };

        return this.lastProcessResult;
    }

    /**
     * Agrega represión primaria
     */
    addPrimalRepression(concept) {
        this.perceptionTrack.addPrimalRepression(concept);
    }

    /**
     * Obtiene las propuestas más prometedoras para el proceso secundario
     * @param {number} limit - Máximo de propuestas
     */
    getTopProposals(limit = 3) {
        if (!this.lastProcessResult?.proposals) return [];

        return this.lastProcessResult.proposals
            .sort((a, b) => b.quotaOfAffect - a.quotaOfAffect)
            .slice(0, limit);
    }

    serialize() {
        return {
            primalRepressions: Array.from(this.perceptionTrack.primalRepressions),
            lastResult: this.lastProcessResult
        };
    }

    restore(data) {
        if (data?.primalRepressions) {
            for (const concept of data.primalRepressions) {
                this.perceptionTrack.addPrimalRepression(concept);
            }
        }
    }
}

module.exports = {
    ThingRepresentative,
    DriveTrack,
    PerceptionTrack,
    DefenseTrack,
    PrimaryProcess
};
