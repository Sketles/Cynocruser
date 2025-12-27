// ╔════════════════════════════════════════════════════════════════╗
// ║  ZEITGEIST: Percepción Ambiental Pasiva                        ║
// ║                                                                ║
// ║  Detecta eventos especiales y genera atmósfera emocional       ║
// ║  Configuración en: cassettes/{cassette}/core-umwelt.yaml       ║
// ╚════════════════════════════════════════════════════════════════╝

const { loadUmweltConfig } = require('../../services/weatherService');

/**
 * Clase Zeitgeist - Detecta contexto temporal/cultural
 */
class Zeitgeist {
    constructor() {
        const config = loadUmweltConfig();
        this.events = config.zeitgeist?.events || {};
        this.timezone = config.location?.timezone || 'America/Santiago';
    }

    /**
     * Obtiene el estado ambiental actual
     */
    getAmbientState() {
        const now = new Date();
        const activeEvent = this._detectActiveEvent(now);

        if (!activeEvent) {
            return {
                active: false,
                eventId: null,
                eventName: null,
                symbols: [],
                atmosphere: null,
                tankModifiers: {},
                promptContext: null
            };
        }

        return {
            active: true,
            eventId: activeEvent.id,
            eventName: activeEvent.id,
            symbols: activeEvent.config.symbols || [],
            atmosphere: activeEvent.config.atmosphere || null,
            tankModifiers: activeEvent.config.tank_modifiers || {},
            promptContext: this._buildAtmosphericPrompt(activeEvent.config.atmosphere)
        };
    }

    /**
     * Detecta si hay un evento activo
     */
    _detectActiveEvent(now) {
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();

        for (const [eventId, eventConfig] of Object.entries(this.events)) {
            // Verificar fechas específicas
            if (eventConfig.dates) {
                const dateMatch = eventConfig.dates.some(d =>
                    d.month === month && d.day === day
                );
                if (!dateMatch) continue;
            }

            // Verificar día de la semana
            if (eventConfig.dayOfWeek !== undefined) {
                if (eventConfig.dayOfWeek !== dayOfWeek) continue;
            }

            // Verificar horas
            if (eventConfig.hours) {
                const { start, end } = eventConfig.hours;
                if (hour < start || hour > end) continue;
            }

            // ¡Evento activo!
            return { id: eventId, config: eventConfig };
        }

        return null;
    }

    /**
     * Construye prompt atmosférico
     */
    _buildAtmosphericPrompt(atmosphere) {
        if (!atmosphere) return null;

        const lines = ['[PERCEPCIÓN AMBIENTAL]'];

        if (atmosphere.feeling) {
            lines.push(`Tu percepción está teñida por ${atmosphere.feeling}.`);
        }
        if (atmosphere.urge) {
            lines.push(`Sientes una urgencia latente hacia: ${atmosphere.urge}.`);
        }
        if (atmosphere.context) {
            lines.push(`El ambiente sugiere: ${atmosphere.context}.`);
        }
        if (atmosphere.vulnerability) {
            lines.push(`Nota: ${atmosphere.vulnerability}.`);
        }

        return lines.join('\n');
    }
}

module.exports = { Zeitgeist };
