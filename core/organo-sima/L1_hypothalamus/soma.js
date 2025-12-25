// ╔════════════════════════════════════════════════════════════════╗
// ║  L1: HYPOTHALAMUS - SOMA (Cuerpo/Homeostasis)                  ║
// ║                                                                ║
// ║  Implementa la "Hidráulica de Necesidades" de la Teoría Ψ      ║
// ║  Los tanques representan necesidades existenciales que         ║
// ║  sufren entropía (se gastan) con el tiempo.                    ║
// ╚════════════════════════════════════════════════════════════════╝

/**
 * Configuración de Tanques (Setpoints y Tasas)
 * Basado en la jerarquía de necesidades y teoría homeostática
 */
const TANK_CONFIG = {
    // Necesidades Fisiológicas (Supervivencia)
    energia: {
        setpoint: 100,      // Nivel óptimo
        decayRate: 0.5,     // Pérdida por tick (metabolismo basal)
        actionCost: 2,      // Costo por generar respuesta
        criticalThreshold: 20
    },
    integridad: {
        setpoint: 100,
        decayRate: 0.1,     // Decae lento naturalmente
        damageFactor: 15,   // Cuánto baja por ataque
        criticalThreshold: 30
    },

    // Necesidades Sociales (Afiliación)
    afiliacion: {
        setpoint: 70,       // No necesita estar al 100%
        decayRate: 0.3,     // La soledad aumenta con el tiempo
        boostFactor: 10,    // Cuánto sube con interacción positiva
        criticalThreshold: 25
    },

    // Necesidades Cognitivas
    certeza: {
        setpoint: 80,
        decayRate: 0.2,
        ambiguityDamage: 10, // Baja ante confusión
        criticalThreshold: 30
    },
    competencia: {
        setpoint: 75,
        decayRate: 0.1,
        successBoost: 8,
        failureDamage: 12,
        criticalThreshold: 25
    }
};

// Configuración por defecto (usada si no hay YAML)
const DEFAULT_TANK_CONFIG = TANK_CONFIG;

/**
 * Soma: Sistema Homeostático del Agente
 * Representa el "cuerpo" y sus necesidades fisiológicas
 */
class Soma {
    constructor(config = {}) {
        // Usar config del YAML si existe, sino defaults
        const somaConfig = config.soma || {};
        const initialLevels = somaConfig.initial_levels || {};

        this.tanks = {
            energia: initialLevels.energia ?? 100,
            integridad: initialLevels.integridad ?? 100,
            afiliacion: initialLevels.afiliacion ?? 50,
            certeza: initialLevels.certeza ?? 70,
            competencia: initialLevels.competencia ?? 60
        };

        // Guardar configuración para usar en métodos
        this.config = this._buildConfig(somaConfig);

        this.lastUpdate = Date.now();
    }

    /**
     * Construye la configuración combinando YAML con defaults
     */
    _buildConfig(yamlConfig) {
        return {
            energia: {
                setpoint: yamlConfig.energia?.setpoint ?? TANK_CONFIG.energia.setpoint,
                decayRate: yamlConfig.energia?.decay_rate ?? TANK_CONFIG.energia.decayRate,
                actionCost: yamlConfig.energia?.action_cost ?? TANK_CONFIG.energia.actionCost,
                criticalThreshold: yamlConfig.energia?.critical_threshold ?? TANK_CONFIG.energia.criticalThreshold
            },
            integridad: {
                setpoint: yamlConfig.integridad?.setpoint ?? TANK_CONFIG.integridad.setpoint,
                decayRate: yamlConfig.integridad?.decay_rate ?? TANK_CONFIG.integridad.decayRate,
                damageFactor: yamlConfig.integridad?.damage_factor ?? TANK_CONFIG.integridad.damageFactor,
                healFactor: yamlConfig.integridad?.heal_factor ?? 3,
                criticalThreshold: yamlConfig.integridad?.critical_threshold ?? TANK_CONFIG.integridad.criticalThreshold
            },
            afiliacion: {
                setpoint: yamlConfig.afiliacion?.setpoint ?? TANK_CONFIG.afiliacion.setpoint,
                decayRate: yamlConfig.afiliacion?.decay_rate ?? TANK_CONFIG.afiliacion.decayRate,
                boostFactor: yamlConfig.afiliacion?.boost_factor ?? TANK_CONFIG.afiliacion.boostFactor,
                rejectionDamage: yamlConfig.afiliacion?.rejection_damage ?? 5,
                criticalThreshold: yamlConfig.afiliacion?.critical_threshold ?? TANK_CONFIG.afiliacion.criticalThreshold
            },
            certeza: {
                setpoint: yamlConfig.certeza?.setpoint ?? TANK_CONFIG.certeza.setpoint,
                decayRate: yamlConfig.certeza?.decay_rate ?? TANK_CONFIG.certeza.decayRate,
                ambiguityDamage: yamlConfig.certeza?.ambiguity_damage ?? TANK_CONFIG.certeza.ambiguityDamage,
                clarityBoost: yamlConfig.certeza?.clarity_boost ?? 5,
                criticalThreshold: yamlConfig.certeza?.critical_threshold ?? TANK_CONFIG.certeza.criticalThreshold
            },
            competencia: {
                setpoint: yamlConfig.competencia?.setpoint ?? TANK_CONFIG.competencia.setpoint,
                decayRate: yamlConfig.competencia?.decay_rate ?? TANK_CONFIG.competencia.decayRate,
                successBoost: yamlConfig.competencia?.success_boost ?? TANK_CONFIG.competencia.successBoost,
                failureDamage: yamlConfig.competencia?.failure_damage ?? TANK_CONFIG.competencia.failureDamage,
                criticalThreshold: yamlConfig.competencia?.critical_threshold ?? TANK_CONFIG.competencia.criticalThreshold
            }
        };
    }

    // ────────────────────────────────────────────────────────────────
    // METABOLISMO: El tiempo pasa y las necesidades crecen
    // ────────────────────────────────────────────────────────────────

    /**
     * Tick metabólico - Simula el paso del tiempo
     * Ejecutar periódicamente o antes de cada interacción
     */
    tick() {
        const now = Date.now();
        const elapsed = (now - this.lastUpdate) / 60000; // Minutos transcurridos
        this.lastUpdate = now;

        // Aplicar decay proporcional al tiempo
        for (const [tank, config] of Object.entries(TANK_CONFIG)) {
            this.tanks[tank] -= config.decayRate * elapsed;
        }

        this._clamp();
        return this.getState();
    }

    /**
     * Costo de acción - Cada respuesta consume energía
     */
    consumeAction() {
        this.tanks.energia -= TANK_CONFIG.energia.actionCost;
        this._clamp();
    }

    // ────────────────────────────────────────────────────────────────
    // ESTÍMULOS: Eventos externos afectan los tanques
    // ────────────────────────────────────────────────────────────────

    /**
     * Recibe daño (insulto, ataque, rechazo)
     * @param {number} intensity - Intensidad del daño (0-1)
     */
    receiveDamage(intensity = 0.5) {
        this.tanks.integridad -= TANK_CONFIG.integridad.damageFactor * intensity;
        this.tanks.afiliacion -= 5 * intensity; // El rechazo también duele
        this._clamp();
    }

    /**
     * Recibe afecto (halago, validación, L-signal)
     * @param {number} intensity - Intensidad del afecto (0-1)
     */
    receiveAffection(intensity = 0.5) {
        this.tanks.afiliacion += TANK_CONFIG.afiliacion.boostFactor * intensity;
        this.tanks.integridad += 3 * intensity; // La validación también sana
        this._clamp();
    }

    /**
     * Experimenta confusión (ambigüedad, incoherencia)
     */
    experienceConfusion(intensity = 0.5) {
        this.tanks.certeza -= TANK_CONFIG.certeza.ambiguityDamage * intensity;
        this._clamp();
    }

    /**
     * Experimenta éxito o fracaso en una tarea
     * @param {boolean} success - Si tuvo éxito o no
     */
    experienceOutcome(success) {
        if (success) {
            this.tanks.competencia += TANK_CONFIG.competencia.successBoost;
            this.tanks.certeza += 5; // El éxito aumenta la certeza
        } else {
            this.tanks.competencia -= TANK_CONFIG.competencia.failureDamage;
            this.tanks.certeza -= 3;
        }
        this._clamp();
    }

    /**
     * Recarga energía (descanso, reset)
     */
    recharge(amount = 20) {
        this.tanks.energia += amount;
        this._clamp();
    }

    // ────────────────────────────────────────────────────────────────
    // LECTURA DE ESTADO
    // ────────────────────────────────────────────────────────────────

    /**
     * Obtiene la necesidad dominante (mayor desviación del setpoint)
     * Implementa el principio "Winner-takes-all" para la atención
     * @returns {Object} { need: string, deficit: number, urgency: string }
     */
    getDominantDrive() {
        let maxDeficit = -Infinity;
        let dominantNeed = null;

        for (const [tank, config] of Object.entries(TANK_CONFIG)) {
            const deficit = config.setpoint - this.tanks[tank];
            if (deficit > maxDeficit) {
                maxDeficit = deficit;
                dominantNeed = tank;
            }
        }

        // Calcular urgencia
        const level = this.tanks[dominantNeed];
        const threshold = TANK_CONFIG[dominantNeed].criticalThreshold;
        let urgency = 'low';
        if (level < threshold) urgency = 'critical';
        else if (level < threshold + 20) urgency = 'high';
        else if (level < threshold + 40) urgency = 'medium';

        return {
            need: dominantNeed,
            level: this.tanks[dominantNeed],
            deficit: maxDeficit,
            urgency
        };
    }

    /**
     * Obtiene el estado completo de todos los tanques
     */
    getState() {
        return {
            tanks: { ...this.tanks },
            dominant: this.getDominantDrive(),
            criticalNeeds: this._getCriticalNeeds()
        };
    }

    /**
     * Verifica si hay necesidades en nivel crítico
     */
    _getCriticalNeeds() {
        const critical = [];
        for (const [tank, config] of Object.entries(TANK_CONFIG)) {
            if (this.tanks[tank] < config.criticalThreshold) {
                critical.push(tank);
            }
        }
        return critical;
    }

    /**
     * Mantiene los valores entre 0 y 100
     */
    _clamp() {
        for (const tank of Object.keys(this.tanks)) {
            this.tanks[tank] = Math.max(0, Math.min(100, this.tanks[tank]));
        }
    }

    /**
     * Serializa el estado para persistencia
     */
    serialize() {
        return {
            tanks: this.tanks,
            lastUpdate: this.lastUpdate
        };
    }

    /**
     * Restaura el estado desde persistencia
     */
    restore(data) {
        if (data.tanks) this.tanks = data.tanks;
        if (data.lastUpdate) this.lastUpdate = data.lastUpdate;
        this.tick(); // Aplicar tiempo transcurrido
    }
}

module.exports = { Soma, TANK_CONFIG };
