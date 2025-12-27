// ╔════════════════════════════════════════════════════════════════╗
// ║  UMWELT PROMPT BUILDER                                         ║
// ║                                                                ║
// ║  Construye el prompt estructurado para la mini-IA de Umwelt    ║
// ║  con TODOS los datos del YAML + datos dinámicos                ║
// ╚════════════════════════════════════════════════════════════════╝

const yaml = require('yaml');

class UmweltPromptBuilder {
    /**
     * Construye el prompt completo para la mini-IA
     * @param {Object} staticConfig - Configuración del umwelt.yaml
     * @param {Object} dynamicData - Datos dinámicos (clima, hora, etc)
     * @returns {string} - Prompt estructurado en YAML
     */
    buildPrompt(staticConfig, dynamicData) {
        const sections = [];

        // ═══════════════════════════════════════════════════════════════
        // CONTEXTO TEMPORAL
        // ═══════════════════════════════════════════════════════════════
        sections.push(this._buildTemporalSection(dynamicData.temporal));

        // ═══════════════════════════════════════════════════════════════
        // UBICACIÓN
        // ═══════════════════════════════════════════════════════════════
        sections.push(this._buildLocationSection(staticConfig.location, staticConfig.apartment));

        // ═══════════════════════════════════════════════════════════════
        // CLIMA ACTUAL
        // ═══════════════════════════════════════════════════════════════
        if (dynamicData.weather) {
            sections.push(this._buildWeatherSection(dynamicData.weather, staticConfig.weather));
        }

        // ═══════════════════════════════════════════════════════════════
        // RUTINA ACTUAL
        // ═══════════════════════════════════════════════════════════════
        if (dynamicData.routine) {
            sections.push(this._buildRoutineSection(dynamicData.routine, staticConfig.daily_routine));
        }

        // ═══════════════════════════════════════════════════════════════
        // AMBIENTE SENSORIAL (de la pieza)
        // ═══════════════════════════════════════════════════════════════
        sections.push(this._buildSensorySection(staticConfig.apartment, staticConfig.neighborhood, dynamicData));

        // ═══════════════════════════════════════════════════════════════
        // EVENTO ESPECIAL (Zeitgeist)
        // ═══════════════════════════════════════════════════════════════
        if (dynamicData.zeitgeist?.eventName) {
            sections.push(this._buildZeitgeistSection(dynamicData.zeitgeist));
        }

        // ═══════════════════════════════════════════════════════════════
        // ESTADO FISIOLÓGICO
        // ═══════════════════════════════════════════════════════════════
        if (dynamicData.physiologicalImpact) {
            sections.push(this._buildPhysiologicalSection(dynamicData.physiologicalImpact));
        }

        return sections.join('\n\n');
    }

    // ─────────────────────────────────────────────────────────────────
    // SECCIÓN: TEMPORAL
    // ─────────────────────────────────────────────────────────────────
    _buildTemporalSection(temporal) {
        if (!temporal) return '';

        return `CONTEXTO TEMPORAL:
  fecha: ${temporal.formatted || 'N/A'}
  hora: ${temporal.time || 'N/A'}
  periodo: ${temporal.period || 'N/A'}
  estacion: ${temporal.season || 'N/A'}
  fin_de_semana: ${temporal.isWeekend ? 'sí' : 'no'}`;
    }

    // ─────────────────────────────────────────────────────────────────
    // SECCIÓN: UBICACIÓN
    // ─────────────────────────────────────────────────────────────────
    _buildLocationSection(location, apartment) {
        if (!location) return '';

        const addr = location.address || {};
        const direccion = `${addr.street || ''} ${addr.number || ''}, ${addr.comuna || ''}, ${addr.city || ''}`.trim();

        return `UBICACIÓN:
  direccion: ${direccion}
  tipo: ${apartment?.type || 'Departamento'}
  piso: ${location.context?.floor || apartment?.floor || 'N/A'}
  edificio: ${location.context?.building_style || 'N/A'}
  color_edificio: ${location.context?.building_color || 'N/A'}
  zona: ${location.context?.type || 'urbana'}`;
    }

    // ─────────────────────────────────────────────────────────────────
    // SECCIÓN: CLIMA
    // ─────────────────────────────────────────────────────────────────
    _buildWeatherSection(weather, weatherConfig) {
        let climateEffect = '';

        // Buscar efecto del clima según temperatura
        if (weatherConfig?.climate_effects && weather.temp) {
            const temp = parseInt(weather.temp);
            if (temp >= 28) climateEffect = weatherConfig.climate_effects.hot?.pelao_reaction || '';
            else if (temp >= 22) climateEffect = weatherConfig.climate_effects.warm?.pelao_reaction || '';
            else if (temp >= 15) climateEffect = weatherConfig.climate_effects.cool?.pelao_reaction || '';
            else if (temp >= 10) climateEffect = weatherConfig.climate_effects.cold?.pelao_reaction || '';
            else climateEffect = weatherConfig.climate_effects.freezing?.pelao_reaction || '';
        }

        return `CLIMA ACTUAL:
  temperatura: ${weather.temperature || weather.temp || 'N/A'}
  condicion: ${weather.condition || 'N/A'}
  sensacion: ${weather.feel || 'N/A'}
  humedad: ${weather.humidity || 'N/A'}
  efecto_en_pelao: ${climateEffect || 'normal'}`;
    }

    // ─────────────────────────────────────────────────────────────────
    // SECCIÓN: RUTINA
    // ─────────────────────────────────────────────────────────────────
    _buildRoutineSection(routine, routineConfig) {
        // Encontrar el evento de rutina actual basado en la hora
        let sensoryDetails = '';

        if (routineConfig?.workday && routine.activity) {
            // Buscar detalles sensoriales del evento actual
            const currentEvent = routineConfig.workday.find(e =>
                routine.activity.toLowerCase().includes(e.event?.toLowerCase() || '')
            );
            if (currentEvent?.sensory) {
                sensoryDetails = Object.entries(currentEvent.sensory)
                    .map(([k, v]) => `    ${k}: ${v}`)
                    .join('\n');
            }
        }

        return `RUTINA ACTUAL:
  actividad: ${routine.activity || 'N/A'}
  contexto: ${routine.context || 'N/A'}
  estado_energia: ${routine.energyDrain || 'normal'}${sensoryDetails ? '\n  sensorial:\n' + sensoryDetails : ''}`;
    }

    // ─────────────────────────────────────────────────────────────────
    // SECCIÓN: AMBIENTE SENSORIAL
    // ─────────────────────────────────────────────────────────────────
    _buildSensorySection(apartment, neighborhood, dynamicData) {
        const room = apartment?.pelao_room || {};
        const hood = neighborhood || {};

        // Sonidos según hora del día
        const isNight = dynamicData.temporal?.period === 'noche' || dynamicData.temporal?.period === 'madrugada';
        const sounds = isNight ?
            (hood.sounds?.night || []).slice(0, 3) :
            (hood.sounds?.constant || []).slice(0, 3);

        // Olores
        const smells = [
            ...(room.ambient?.smells || []).slice(0, 2),
            ...(hood.smells?.common || []).slice(0, 1)
        ];

        // Visual
        const visual = isNight ?
            (room.ambient?.lighting?.night || 'Luz del monitor') :
            (room.ambient?.lighting?.day || 'Luz natural');

        return `AMBIENTE SENSORIAL:
  pieza:
    tamaño: ${room.size || 'pequeña'}
    vibe: ${(room.vibe || '').split('\n')[0] || 'Personal'}
  sonidos: [${sounds.join(', ')}]
  olores: [${smells.join(', ')}]
  iluminacion: ${visual}
  temperatura_pieza: ${room.ambient?.temperature?.[dynamicData.temporal?.season] || 'normal'}`;
    }

    // ─────────────────────────────────────────────────────────────────
    // SECCIÓN: ZEITGEIST (Evento Especial)
    // ─────────────────────────────────────────────────────────────────
    _buildZeitgeistSection(zeitgeist) {
        return `EVENTO ESPECIAL:
  nombre: ${zeitgeist.eventName || 'N/A'}
  simbolos: ${(zeitgeist.symbols || []).join(', ')}
  atmosfera: ${zeitgeist.atmosphere?.feeling || 'N/A'}
  urgencia: ${zeitgeist.atmosphere?.urge || 'N/A'}
  contexto: ${zeitgeist.atmosphere?.context || 'N/A'}`;
    }

    // ─────────────────────────────────────────────────────────────────
    // SECCIÓN: ESTADO FISIOLÓGICO
    // ─────────────────────────────────────────────────────────────────
    _buildPhysiologicalSection(physio) {
        return `ESTADO FISIOLOGICO:
  arousal: ${physio.arousal_modulation || 50}/100
  circadiano: ${physio.circadian_pressure?.description || 'normal'}
  energia: ${physio.energy_drain?.level || 'normal'} - ${physio.energy_drain?.impact || ''}
  confort_termico: ${physio.thermal_comfort?.comfort || 'normal'}`;
    }
}

module.exports = { UmweltPromptBuilder };
