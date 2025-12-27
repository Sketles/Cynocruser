// ╔════════════════════════════════════════════════════════════════╗
// ║  WORLD SIMULATOR: Proveedor de Contexto del Mundo              ║
// ║                                                                ║
// ║  Recopila y estructura datos objetivos del entorno:            ║
// ║  - Ubicación física (YAML)                                     ║
// ║  - Clima actual (Open-Meteo API)                               ║
// ║  - Momento temporal (hora, fecha, estación)                    ║
// ║  - Rutina del día (según horario)                              ║
// ║  - Eventos Zeitgeist (festividades, etc)                       ║
// ║                                                                ║
// ║  Output: Datos estructurados para <world_context> del prompt   ║
// ╚════════════════════════════════════════════════════════════════╝

const { Zeitgeist } = require('./zeitgeist');
const { WeatherService, loadUmweltConfig } = require('../../services/weatherService');
const { UmweltNarrator } = require('./umweltNarrator');

class WorldSimulator {
    constructor() {
        const config = loadUmweltConfig();

        // Guardar config completa para el PromptBuilder
        this.fullConfig = config;

        this.location = config.location || {};
        this.apartment = config.apartment || {};
        this.neighborhood = config.neighborhood || {};
        this.daily_routine = config.daily_routine || {};

        this.zeitgeist = new Zeitgeist();
        this.weatherService = new WeatherService();
        this.narrator = new UmweltNarrator();
    }

    // ════════════════════════════════════════════════════════════════
    // API PRINCIPAL: Generar contexto del mundo
    // ════════════════════════════════════════════════════════════════

    /**
     * Genera contexto completo del mundo para el prompt
     */
    async getWorldContext() {
        const now = new Date();

        // Datos temporales
        const temporal = this._getTemporalContext(now);

        // Clima actual
        let weather = null;
        try {
            weather = await this.weatherService.getCurrentWeather();
        } catch (e) {
            console.warn('[WorldSimulator] Weather API error:', e.message);
        }

        // Zeitgeist (eventos especiales)
        const zeitState = this.zeitgeist.getAmbientState();

        // Rutina actual según la hora
        const currentRoutine = this._getCurrentRoutine(now);

        // Calcular impacto fisiológico
        const physiologicalImpact = this._calculatePhysiologicalImpact({
            temporal,
            weather,
            currentRoutine,
            zeitState
        });

        // Construir prompt context en TEXTO PLANO
        const promptContext = this._buildPromptContextText({
            temporal,
            weather,
            zeitState,
            currentRoutine,
            physiologicalImpact
        });

        // Generar narrativa fenomenológica (mini-IA)
        const narrative = await this.narrator.generateNarrative({
            location: this._getLocationData(),
            temporal,
            weather: weather ? this._formatWeatherData(weather) : null,
            routine: currentRoutine,
            zeitgeist: zeitState,
            physiologicalImpact,
            apartment: this.apartment,
            neighborhood: this._getNeighborhoodContext(temporal)
        }, this.fullConfig);  // ← Pasar config completa al PromptBuilder

        return {
            location: this._getLocationData(),
            temporal,
            weather: weather ? this._formatWeatherData(weather) : null,
            routine: currentRoutine,
            zeitgeist: zeitState,
            neighborhood: this._getNeighborhoodContext(temporal),
            apartment: this._getApartmentContext(),
            physiologicalImpact,
            narrative, // ← Relato fenomenológico generado
            promptContext
        };
    }

    // ════════════════════════════════════════════════════════════════
    // DATOS DE UBICACIÓN
    // ════════════════════════════════════════════════════════════════

    _getLocationData() {
        const addr = this.location.address || {};
        return {
            address: `${addr.street || ''} N°${addr.number || ''}, ${addr.comuna || ''}, ${addr.city || 'Santiago'}`,
            coordinates: { lat: this.location.lat, lon: this.location.lon },
            setting: this.location.context?.type || 'Departamento',
            floor: this.location.context?.floor || 2
        };
    }

    _getApartmentContext() {
        return {
            type: this.apartment.type || 'Departamento poblacional',
            size: this.apartment.size_total || '~40-50 m²',
            residents: this.apartment.residents || ['Pelao', 'Abuela'],
            style: this.apartment.style?.vibe || 'Departamento de abuela chilena'
        };
    }

    _getNeighborhoodContext(temporal) {
        const hour = temporal.hour;
        const isNight = hour >= 22 || hour < 6;

        return {
            type: this.neighborhood.type || 'Población urbana',
            safety: this.neighborhood.safety?.level || 'Zona popular',
            activity: this._getNeighborhoodActivity(hour, isNight)
        };
    }

    _getNeighborhoodActivity(hour, isNight) {
        if (hour >= 2 && hour < 6) return 'silencio profundo, casi nadie en la calle';
        if (hour >= 6 && hour < 9) return 'gente yendo al trabajo, tráfico aumentando';
        if (hour >= 9 && hour < 18) return 'actividad normal del día';
        if (hour >= 18 && hour < 22) return 'gente regresando, más movimiento';
        if (isNight) return 'actividad nocturna, algunos autos, perros ladrando';
        return 'actividad normal';
    }

    // ════════════════════════════════════════════════════════════════
    // PHYSIOLOGICAL IMPACT - Traducción a sensaciones corporales
    // ════════════════════════════════════════════════════════════════

    _calculatePhysiologicalImpact({ temporal, weather, currentRoutine, zeitState }) {
        const hour = temporal.hour;
        const impact = {
            circadian_pressure: this._getCircadianPressure(hour),
            thermal_comfort: this._getThermalComfort(weather),
            energy_drain: this._getEnergyDrain(hour, currentRoutine),
            social_affordances: this._getSocialAffordances(hour, zeitState),
            arousal_modulation: this._getArousalLevel(hour, weather)
        };

        return impact;
    }

    _getCircadianPressure(hour) {
        if (hour >= 1 && hour < 6) return { level: 'very_high', description: 'Cuerpo exige sueño, melatonina alta' };
        if (hour >= 6 && hour < 9) return { level: 'medium', description: 'Despertar gradual, cortisol subiendo' };
        if (hour >= 22 || hour === 0) return { level: 'high', description: 'Presión de sueño aumentando' };
        return { level: 'low', description: 'Estado de alerta normal' };
    }

    _getThermalComfort(weather) {
        if (!weather) return { comfort: 'neutral', description: 'Sin datos' };

        const temp = weather.temperature;
        if (temp < 10) return { comfort: 'cold', description: 'Frío percibido, necesidad de abrigo', affordance: 'Quedarse adentro' };
        if (temp < 15) return { comfort: 'cool', description: 'Fresco, ligeramente incómodo', affordance: 'Ropa abrigada' };
        if (temp > 28) return { comfort: 'hot', description: 'Calor, sudor, incomodidad', affordance: 'Buscar sombra/agua' };
        return { comfort: 'pleasant', description: 'Temperatura agradable', affordance: 'No restringe acciones' };
    }

    _getEnergyDrain(hour, routine) {
        // Trabajo drena energía
        if (routine && routine.id === 'work') {
            return { level: 'high', description: 'Jornada laboral agotadora (11 horas)', impact: 'Respuestas cortas, menos paciencia' };
        }

        // Madrugada drena por falta de sueño
        if (hour >= 1 && hour < 6) {
            return { level: 'critical', description: 'Privación de sueño, cognición reducida', impact: 'Irritable, monosilábico' };
        }

        // Post-trabajo
        if (hour >= 18 && hour < 22) {
            return { level: 'medium', description: 'Cansancio acumulado del día', impact: 'Busca descanso/placer' };
        }

        return { level: 'low', description: 'Energía normal', impact: 'Ninguno' };
    }

    _getSocialAffordances(hour, zeitState) {
        const affordances = [];

        // Discord disponible de noche
        if (hour >= 22 || hour < 6) {
            affordances.push({ action: 'Discord', availability: 'high', reason: 'Amigos nocturnos/internacionales online' });
        }

        // Familia disponible en día
        if (hour >= 8 && hour < 22) {
            affordances.push({ action: 'Familia', availability: 'medium', reason: 'Abuela despierta, posible interacción' });
        }

        // Silencio obligatorio de noche
        if ((hour >= 23 || hour < 7) && zeitState.eventName !== 'fin_de_semana') {
            affordances.push({ constraint: 'Silencio', reason: 'Abuela durmiendo, evitar ruido' });
        }

        return affordances;
    }

    _getArousalLevel(hour, weather) {
        let arousal = 50; // Base

        // Hora afecta arousal
        if (hour >= 1 && hour < 6) arousal -= 30; // Muy bajo en madrugada
        if (hour >= 10 && hour < 14) arousal += 20; // Pico diurno

        // Clima afecta
        if (weather && weather.conditionLocal.includes('lluvia')) arousal -= 10; // Lluvia baja arousal
        if (weather && weather.temperature > 28) arousal += 15; // Calor aumenta irritabilidad

        return Math.max(0, Math.min(100, arousal));
    }

    // ════════════════════════════════════════════════════════════════
    // DATOS TEMPORALES
    // ════════════════════════════════════════════════════════════════

    _getTemporalContext(date) {
        const hour = date.getHours();
        const dayOfWeek = date.getDay();

        const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

        return {
            datetime: date.toISOString(),
            formatted: `${days[dayOfWeek]} ${date.getDate()} de ${months[date.getMonth()]} ${date.getFullYear()}`,
            time: `${String(hour).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
            hour,
            dayOfWeek: days[dayOfWeek],
            isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
            period: this._getPeriodOfDay(hour),
            season: this._getSeason(date.getMonth() + 1)
        };
    }

    _getPeriodOfDay(hour) {
        if (hour >= 0 && hour < 6) return 'madrugada';
        if (hour >= 6 && hour < 12) return 'mañana';
        if (hour >= 12 && hour < 14) return 'mediodía';
        if (hour >= 14 && hour < 18) return 'tarde';
        if (hour >= 18 && hour < 21) return 'atardecer';
        return 'noche';
    }

    _getSeason(month) {
        if (month >= 12 || month <= 2) return 'verano';
        if (month >= 3 && month <= 5) return 'otoño';
        if (month >= 6 && month <= 8) return 'invierno';
        return 'primavera';
    }

    // ════════════════════════════════════════════════════════════════
    // RUTINA DEL DÍA
    // ════════════════════════════════════════════════════════════════

    _getCurrentRoutine(date) {
        const hour = date.getHours();
        const dayOfWeek = date.getDay();
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

        // Rutina de semana
        if (isWeekday) {
            if (hour >= 5 && hour < 6) return this._formatRoutine('prepare', 'Preparándose para el trabajo', 'Alarma sonó a las 5:30, preparándose');
            if (hour >= 6 && hour < 7) return this._formatRoutine('commute', 'Van de la empresa lo busca', 'Viajando al aeropuerto');
            if (hour >= 7 && hour < 18) return this._formatRoutine('work', 'Trabajando en el aeropuerto', 'Jornada laboral de 11 horas');
            if (hour >= 18 && hour < 19) return this._formatRoutine('commute_back', 'Regresando a casa', 'Van lo deja en casa');
            if (hour >= 19 && hour < 22) return this._formatRoutine('relax', 'Tiempo libre en casa', 'Viendo series, Discord, comiendo');
            if (hour >= 22 || hour < 1) return this._formatRoutine('night_discord', 'Activo en Discord', 'Jugando o chateando con amigos');
            if (hour >= 1 && hour < 5) return this._formatRoutine('sleep', 'Durmiendo', 'Debería estar durmiendo');
        }

        // Fin de semana
        if (hour >= 1 && hour < 10) return this._formatRoutine('sleep_weekend', 'Durmiendo (sin alarma)', 'Fin de semana, duerme hasta tarde');
        if (hour >= 10 && hour < 22) return this._formatRoutine('weekend', 'Día libre', 'Puede estar con Chinita, jugando, o saliendo');
        return this._formatRoutine('night_weekend', 'Noche de fin de semana', 'Más flexible, probablemente despierto');
    }

    _formatRoutine(id, activity, context) {
        return { id, activity, context };
    }

    // ════════════════════════════════════════════════════════════════
    // FORMATO DE DATOS
    // ════════════════════════════════════════════════════════════════

    _formatWeatherData(weather) {
        return {
            temperature: `${weather.temperature}°C`,
            condition: weather.conditionLocal,
            feel: weather.effect?.description || '',
            isDay: weather.isDay
        };
    }

    // ════════════════════════════════════════════════════════════════
    // CONSTRUCCIÓN DEL PROMPT CONTEXT (TEXTO PLANO)
    // ════════════════════════════════════════════════════════════════

    _buildPromptContextText({ temporal, weather, zeitState, currentRoutine, physiologicalImpact }) {
        const lines = [];

        // === CONTEXTO TEMPORAL ===
        lines.push('CONTEXTO TEMPORAL:');
        lines.push(`- Fecha: ${temporal.formatted}, ${temporal.time}`);
        lines.push(`- Período: ${temporal.period}`);
        lines.push(`- Estación: ${temporal.season}`);
        if (temporal.isWeekend) lines.push('- Nota: Fin de semana');
        const circ = physiologicalImpact.circadian_pressure;
        lines.push(`- Estado circadiano: ${circ.description}`);
        lines.push('');

        // === UBICACIÓN ===
        const loc = this._getLocationData();
        lines.push('UBICACIÓN:');
        lines.push(`- Dirección: ${loc.address}`);
        lines.push(`- Setting: ${loc.setting}`);
        lines.push('');

        // === CLIMA ===
        if (weather) {
            const therm = physiologicalImpact.thermal_comfort;
            lines.push('CLIMA:');
            lines.push(`- Temperatura: ${weather.temperature}°C`);
            lines.push(`- Condición: ${weather.conditionLocal}`);
            lines.push(`- Sensación: ${weather.effect?.description || 'Normal'}`);
            lines.push(`- Impacto corporal: ${therm.description}`);
            if (therm.affordance) lines.push(`- Affordance: ${therm.affordance}`);
            lines.push('');
        }

        // === ESTADO ACTUAL ===
        if (currentRoutine) {
            const energyDrain = physiologicalImpact.energy_drain;
            lines.push('ESTADO ACTUAL:');
            lines.push(`- Actividad: ${currentRoutine.activity}`);
            lines.push(`- Contexto: ${currentRoutine.context}`);
            lines.push(`- Nivel energía: ${energyDrain.level}`);
            lines.push(`- Impacto: ${energyDrain.impact}`);
            lines.push('');
        }

        // === AFFORDANCES SOCIALES ===
        const socialAff = physiologicalImpact.social_affordances;
        if (socialAff.length > 0) {
            lines.push('AFFORDANCES SOCIALES:');
            socialAff.forEach(aff => {
                if (aff.action) {
                    lines.push(`- ${aff.action}: ${aff.availability} (${aff.reason})`);
                } else if (aff.constraint) {
                    lines.push(`- Restricción: ${aff.constraint} (${aff.reason})`);
                }
            });
            lines.push('');
        }

        // === ZEITGEIST ===
        if (zeitState.eventName) {
            lines.push('ZEITGEIST:');
            lines.push(`- Evento: ${zeitState.eventName}`);
            if (zeitState.symbols?.length) {
                lines.push(`- Símbolos: ${zeitState.symbols.join(', ')}`);
            }
            if (zeitState.atmosphere) {
                lines.push(`- Atmósfera: ${zeitState.atmosphere.feeling}`);
            }
            lines.push('');
        }

        // === TONO FISIOLÓGICO ===
        lines.push('TONO FISIOLÓGICO:');
        lines.push(`- Arousal: ${physiologicalImpact.arousal_modulation}/100`);
        lines.push(`- Interpretación: ${this._interpretArousal(physiologicalImpact.arousal_modulation)}`);

        return lines.join('\n');
    }

    _interpretArousal(arousal) {
        if (arousal < 30) return 'Muy bajo - letargo, respuestas lentas';
        if (arousal < 50) return 'Bajo-medio - relajado, poco reactivo';
        if (arousal < 70) return 'Medio-alto - alerta, responsivo';
        return 'Muy alto - tenso, irritable, hiperactivo';
    }

    // ════════════════════════════════════════════════════════════════
    // COMPATIBILIDAD CON CÓDIGO ANTIGUO
    // ════════════════════════════════════════════════════════════════

    serialize() { return this.location; }
    restore(data) { if (data) this.location = data; }
}

// Alias para compatibilidad
const Umwelt = WorldSimulator;

module.exports = { WorldSimulator, Umwelt };
