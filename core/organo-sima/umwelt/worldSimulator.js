// ╔════════════════════════════════════════════════════════════════╗
// ║  WORLD SIMULATOR: Sistema Principal del Umwelt                 ║
// ║                                                                ║
// ║  Unifica TODO el contexto del mundo:                           ║
// ║  - Fecha, hora, ubicación                                      ║
// ║  - Clima real (Open-Meteo)                                     ║
// ║  - Eventos especiales (Zeitgeist)                              ║
// ║  - Percepciones sensoriales (templates)                        ║
// ║                                                                ║  
// ║  Config: cassettes/{cassette}/umwelt.yaml                      ║
// ╚════════════════════════════════════════════════════════════════╝

const { Zeitgeist } = require('./zeitgeist');
const { WeatherService, loadUmweltConfig } = require('./weatherService');

/**
 * WorldSimulator - Sistema unificado del Umwelt
 */
class WorldSimulator {
    constructor() {
        const config = loadUmweltConfig();

        this.location = config.location || {};
        this.perceptions = config.perceptions || {};
        this.zeitgeist = new Zeitgeist();
        this.weatherService = new WeatherService();
    }

    // ════════════════════════════════════════════════════════════════
    // CONTEXTO DEL MUNDO (reemplaza a Umwelt/world.js)
    // ════════════════════════════════════════════════════════════════

    /**
     * Obtiene el contexto completo del mundo (para prompt-builder)
     */
    getWorldContext() {
        const now = new Date();
        const time = this._getCurrentTime(now);
        const date = this._getCurrentDate(now);
        const timeOfDay = this._getTimeOfDay(now);

        return {
            time,
            date,
            timeOfDay,
            location: {
                city: this.location.address?.city || this.location.city || 'Santiago',
                country: this.location.address?.country || this.location.country || 'Chile',
                comuna: this.location.address?.comuna || '',
                description: this._formatLocationDescription()
            },
            promptContext: this._buildWorldPrompt(time, date, timeOfDay)
        };
    }

    _getCurrentTime(now) {
        const options = { timeZone: this.location.timezone || 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false };
        const formatted = now.toLocaleTimeString('es-CL', options);
        const [hour, minute] = formatted.split(':').map(Number);
        return { hour, minute, formatted };
    }

    _getCurrentDate(now) {
        const options = { timeZone: this.location.timezone || 'America/Santiago', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const formatted = now.toLocaleDateString('es-CL', options);
        const dayOfWeek = now.getDay();
        return { formatted, dayOfWeek, isWeekend: dayOfWeek === 0 || dayOfWeek === 6 };
    }

    _getTimeOfDay(now) {
        const hour = now.getHours();
        const periods = [
            { start: 0, end: 6, period: 'madrugada', emoji: '🌙', mood: 'muy cansado' },
            { start: 6, end: 12, period: 'mañana', emoji: '☀️', mood: 'despertando' },
            { start: 12, end: 14, period: 'mediodía', emoji: '🌞', mood: 'activo' },
            { start: 14, end: 18, period: 'tarde', emoji: '🌤️', mood: 'normal' },
            { start: 18, end: 21, period: 'atardecer', emoji: '🌆', mood: 'relajado' },
            { start: 21, end: 24, period: 'noche', emoji: '🌙', mood: 'cansado' }
        ];
        return periods.find(p => hour >= p.start && hour < p.end) || periods[5];
    }

    _formatLocationDescription() {
        const addr = this.location.address || {};
        const parts = [];
        if (addr.comuna) parts.push(addr.comuna);
        if (addr.city && addr.city !== addr.comuna) parts.push(addr.city);
        if (addr.country) parts.push(addr.country);

        let desc = parts.join(', ');
        if (addr.street && addr.number) desc += ` (${addr.street} #${addr.number})`;
        return desc || 'Santiago, Chile';
    }

    _buildWorldPrompt(time, date, timeOfDay) {
        const addr = this.location.address || {};
        const locDesc = this._formatLocationDescription();

        // Contexto extra del barrio (si existe)
        const barrioInfo = this.neighborhood?.safety?.level ? `\n- Barrio: ${this.neighborhood.type || 'Población'}. ${this.neighborhood.safety.level}.` : '';

        return `[MUNDO ACTUAL]
- Ubicación: ${locDesc}
- Fecha: ${date.formatted}
- Hora: ${time.formatted} (${timeOfDay.period} ${timeOfDay.emoji})
- Estado natural: ${timeOfDay.mood}${barrioInfo}${date.isWeekend ? '\n- Es fin de semana' : ''}`;
    }

    // ════════════════════════════════════════════════════════════════
    // PERCEPCIONES SENSORIALES
    // ════════════════════════════════════════════════════════════════

    /**
     * Genera snapshot completo del entorno
     */
    async generateSnapshot() {
        const now = new Date();
        const zeitState = this.zeitgeist.getAmbientState();
        const timeContext = this._getTimeContext(now);

        // Clima real
        let weather = null;
        try {
            weather = await this.weatherService.getCurrentWeather();
        } catch (e) {
            console.warn('[WorldSimulator] Weather error:', e.message);
        }

        const template = this._selectTemplate(zeitState, timeContext);
        const stimuli = this._generateStimuli(template);

        return {
            timestamp: now.toISOString(),
            context: {
                event: zeitState.eventName || 'normal',
                timeOfDay: timeContext.period,
                dayOfWeek: timeContext.dayName
            },
            weather: weather ? {
                temperature: weather.temperature,
                condition: weather.conditionLocal,
                effect: weather.effect
            } : null,
            stimuli,
            atmosphere: zeitState.atmosphere,
            neurosymbols: this._extractNeurosymbols(stimuli, zeitState),
            promptContext: this._buildPerceptionPrompt(stimuli, zeitState, weather)
        };
    }

    _getTimeContext(date) {
        const hour = date.getHours();
        const dayOfWeek = date.getDay();
        const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

        let period = 'noche';
        if (hour < 6) period = 'madrugada';
        else if (hour < 12) period = 'mañana';
        else if (hour < 14) period = 'mediodía';
        else if (hour < 18) period = 'tarde';
        else if (hour < 21) period = 'atardecer';

        return { hour, dayOfWeek, dayName: days[dayOfWeek], period, isWorkday: dayOfWeek >= 1 && dayOfWeek <= 5 };
    }

    _selectTemplate(zeitState, timeContext) {
        const map = { 'navidad': 'navidad_noche', 'año_nuevo': 'navidad_noche', 'viernes_noche': 'viernes_noche', 'madrugada': 'madrugada' };

        if (zeitState.eventId && map[zeitState.eventId]) {
            return this.perceptions[map[zeitState.eventId]] || this.perceptions.default;
        }
        if (timeContext.hour >= 0 && timeContext.hour < 5) return this.perceptions.madrugada || this.perceptions.default;
        if (timeContext.isWorkday && timeContext.hour >= 9 && timeContext.hour < 18) return this.perceptions.dia_laboral || this.perceptions.default;

        return this.perceptions.default || {};
    }

    _generateStimuli(template) {
        const pick = (arr, n = 1) => arr?.length ? [...arr].sort(() => 0.5 - Math.random()).slice(0, n) : [];
        return {
            visual: pick(template.visual, 2),
            auditivo: pick(template.auditivo, 2),
            olfativo: pick(template.olfativo, 1),
            termico: pick(template.termico, 1)
        };
    }

    _extractNeurosymbols(stimuli, zeitState) {
        const symbols = [...(zeitState.symbols || [])];
        const text = [...stimuli.visual, ...stimuli.auditivo, ...stimuli.olfativo, ...stimuli.termico].join(' ').toLowerCase();

        if (text.includes('familia') || text.includes('gente') || text.includes('risas')) symbols.push('social_activity_nearby');
        if (text.includes('silencio') || text.includes('oscuridad')) symbols.push('isolation');
        if (text.includes('calor') || text.includes('sofocante')) symbols.push('physical_discomfort');

        return [...new Set(symbols)];
    }

    _buildPerceptionPrompt(stimuli, zeitState, weather) {
        const lines = ['[PERCEPCIÓN SENSORIAL DEL ENTORNO]'];

        if (weather) lines.push(`🌡️ Clima actual: ${weather.temperature}°C, ${weather.conditionLocal}. ${weather.effect?.description || ''}`);
        if (stimuli.visual?.length) lines.push(`🪟 Por la ventana ves: ${stimuli.visual.join('. ')}.`);
        if (stimuli.auditivo?.length) lines.push(`👂 Escuchas: ${stimuli.auditivo.join('. ')}.`);
        if (stimuli.olfativo?.length && stimuli.olfativo[0] !== 'Neutral') lines.push(`👃 Percibes: ${stimuli.olfativo.join('. ')}.`);

        if (zeitState.atmosphere) {
            lines.push('', '[CÓMO TE AFECTA]');
            lines.push(`Tu percepción está teñida por ${zeitState.atmosphere.feeling}.`);
            if (zeitState.atmosphere.vulnerability) lines.push(`Nota: ${zeitState.atmosphere.vulnerability}.`);
        }

        return lines.join('\n');
    }

    // Compatibilidad con código antiguo
    serialize() { return this.location; }
    restore(data) { if (data) this.location = data; }
}

// Alias para compatibilidad
const Umwelt = WorldSimulator;

module.exports = { WorldSimulator, Umwelt };
