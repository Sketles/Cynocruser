// ╔════════════════════════════════════════════════════════════════╗
// ║  HOMEOSTATIC MIDDLEWARE                                        ║
// ║                                                                ║
// ║  Mapea Símbolos Perceptivos → Tanques de Necesidades           ║
// ║  Basado en teoría SiMA + Damasio (Marcadores Somáticos)        ║
// ║                                                                ║
// ║  Implementa:                                                   ║
// ║  - Ruta Rápida (keywords explícitos)                           ║
// ║  - Evaluación de Accesibilidad (frustración vs satisfacción)   ║
// ╚════════════════════════════════════════════════════════════════╝

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

/**
 * Carga la configuración de mappings desde YAML
 */
function loadTankMappings(cassettePath) {
    const mappingsPath = path.join(cassettePath, 'tank-mappings.yaml');

    if (!fs.existsSync(mappingsPath)) {
        console.warn('[HomeostaticMiddleware] tank-mappings.yaml not found, using defaults');
        return getDefaultMappings();
    }

    const content = fs.readFileSync(mappingsPath, 'utf8');
    return yaml.parse(content);
}

/**
 * Mappings por defecto si no existe el archivo
 */
function getDefaultMappings() {
    return {
        tanks: {
            afiliacion: {
                keywords: ['familia', 'amigo', 'fiesta', 'discord', 'gente', 'vecino']
            },
            energia: {
                keywords: ['comida', 'dormir', 'cansado', 'calor', 'hambre']
            },
            integridad: {
                keywords: ['peligro', 'insulto', 'pelea', 'ruido fuerte']
            },
            certeza: {
                keywords: ['confuso', 'raro', 'noticia', 'cambio']
            },
            competencia: {
                keywords: ['ganar', 'perder', 'logro', 'fail']
            }
        }
    };
}

/**
 * Clase HomeostaticMiddleware
 * Conecta percepciones con el sistema de tanques
 */
class HomeostaticMiddleware {
    constructor(cassettePath) {
        this.mappings = loadTankMappings(cassettePath);
        this.tanks = this.mappings.tanks || {};
    }

    /**
     * Procesa una snapshot del WorldSimulator
     * Retorna señales homeostáticas para modificar tanques
     * 
     * @param {Object} snapshot - Snapshot del WorldSimulator
     * @param {Object} currentTankLevels - Niveles actuales de los tanques
     * @returns {Object} Señales de modificación de tanques
     */
    processSnapshot(snapshot, currentTankLevels = {}) {
        const signals = {
            tankModifiers: {},
            emotionalSignals: [],
            promptInjection: null
        };

        if (!snapshot || !snapshot.stimuli) {
            return signals;
        }

        // Concatenar todos los estímulos en un string para búsqueda
        const allStimuli = this._flattenStimuli(snapshot.stimuli);
        const stimuliText = allStimuli.join(' ').toLowerCase();

        // Procesar cada tanque
        for (const [tankId, tankConfig] of Object.entries(this.tanks)) {
            const result = this._evaluateTankImpact(
                tankId,
                tankConfig,
                stimuliText,
                snapshot.neurosymbols || [],
                currentTankLevels[tankId] || 50
            );

            if (result.impact !== 0) {
                signals.tankModifiers[tankId] = result;
            }

            if (result.emotionalSignal) {
                signals.emotionalSignals.push(result.emotionalSignal);
            }
        }

        // Generar inyección de prompt si hay señales emocionales
        if (signals.emotionalSignals.length > 0) {
            signals.promptInjection = this._buildPromptInjection(signals.emotionalSignals);
        }

        return signals;
    }

    /**
     * Evalúa el impacto de los estímulos en un tanque específico
     */
    _evaluateTankImpact(tankId, tankConfig, stimuliText, neurosymbols, currentLevel) {
        const result = {
            impact: 0,
            decayModifier: 1.0,
            reason: null,
            emotionalSignal: null
        };

        const keywords = tankConfig.keywords || [];
        const frustrationKeywords = tankConfig.frustration_keywords || [];
        const drainKeywords = tankConfig.drain_keywords || [];

        // RUTA RÁPIDA: Buscar keywords directos
        let matchedKeywords = [];
        for (const keyword of keywords) {
            if (stimuliText.includes(keyword.toLowerCase())) {
                matchedKeywords.push(keyword);
            }
        }

        if (matchedKeywords.length === 0) {
            return result; // No hay impacto
        }

        // Evaluar ACCESIBILIDAD (¿el estímulo satisface o frustra?)
        let isAccessible = true;
        for (const fKey of frustrationKeywords) {
            if (stimuliText.includes(fKey.toLowerCase())) {
                isAccessible = false;
                break;
            }
        }

        // Calcular impacto según Damasio:
        // - Si es accesible: El estímulo puede satisfacer la necesidad
        // - Si es inaccesible: Ver lo que no puedes tener AUMENTA la necesidad (Displacer)

        if (isAccessible) {
            // Estímulo positivo/accesible
            result.impact = 5 * matchedKeywords.length; // Sube el tanque
            result.reason = `Estímulos accesibles: ${matchedKeywords.join(', ')}`;
        } else {
            // Estímulo inaccesible = FRUSTRACIÓN
            // Ver a otros felices cuando estás solo = más dolor

            // La frustración es más intensa si el tanque ya está bajo
            const frustrationIntensity = currentLevel < 40 ? 2.0 : 1.0;

            result.impact = -3 * matchedKeywords.length * frustrationIntensity;
            result.decayModifier = 1.3; // Decay más rápido
            result.reason = `Frustración: ves ${matchedKeywords.join(', ')} pero está fuera de tu alcance`;

            // Generar señal emocional
            result.emotionalSignal = {
                tank: tankId,
                type: 'frustration',
                intensity: Math.abs(result.impact),
                description: this._getEmotionalDescription(tankId, 'frustration', matchedKeywords)
            };
        }

        // Evaluar estímulos que drenan (ej: calor drena energía)
        for (const dKey of drainKeywords) {
            if (stimuliText.includes(dKey.toLowerCase())) {
                result.decayModifier *= 1.2;
                result.reason = (result.reason || '') + `. ${dKey} te afecta`;
            }
        }

        return result;
    }

    /**
     * Genera descripción emocional para el prompt
     */
    _getEmotionalDescription(tankId, type, keywords) {
        const descriptions = {
            afiliacion: {
                frustration: `Ves ${keywords.join('/')} cerca pero no estás incluido. La soledad pesa más.`
            },
            energia: {
                frustration: `Percibes ${keywords.join('/')} pero no lo tienes. Tu cuerpo lo resiente.`
            },
            competencia: {
                frustration: `Otros están logrando cosas mientras tú no. Te sientes estancado.`
            },
            default: {
                frustration: `Hay ${keywords.join('/')} cerca pero fuera de tu alcance.`
            }
        };

        return descriptions[tankId]?.[type] || descriptions.default[type];
    }

    /**
     * Construye inyección de prompt para señales emocionales
     */
    _buildPromptInjection(emotionalSignals) {
        if (emotionalSignals.length === 0) return null;

        const lines = ['[SEÑALES HOMEOSTÁTICAS]'];

        for (const signal of emotionalSignals) {
            if (signal.type === 'frustration') {
                lines.push(`⚠️ ${signal.description}`);
            }
        }

        lines.push('');
        lines.push('Estas sensaciones colorean tu estado de ánimo actual.');

        return lines.join('\n');
    }

    /**
     * Aplana estímulos en un array único
     */
    _flattenStimuli(stimuli) {
        const flat = [];
        for (const category of Object.values(stimuli)) {
            if (Array.isArray(category)) {
                flat.push(...category);
            }
        }
        return flat;
    }
}

module.exports = { HomeostaticMiddleware, loadTankMappings };
