// ╔════════════════════════════════════════════════════════════════╗
// ║  WEATHER SERVICE: Servicio de Clima Real                       ║
// ║                                                                ║
// ║  Obtiene clima real via Open-Meteo (GRATIS)                    ║
// ║  Configuración en: cassettes/{cassette}/umwelt.yaml            ║
// ╚════════════════════════════════════════════════════════════════╝

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Cache del config de umwelt
let _umweltConfig = null;

/**
 * Carga configuración de Umwelt desde YAML
 */
function loadUmweltConfig() {
    if (_umweltConfig) return _umweltConfig;

    const possiblePaths = [
        path.join(__dirname, '../cassettes/pelaosniper/umwelt.yaml'),
        path.join(__dirname, '../../cassettes/pelaosniper/umwelt.yaml')
    ];

    for (const configPath of possiblePaths) {
        if (fs.existsSync(configPath)) {
            try {
                const content = fs.readFileSync(configPath, 'utf8');
                _umweltConfig = yaml.parse(content);
                return _umweltConfig;
            } catch (e) {
                console.warn(`[WeatherService] Error loading ${configPath}:`, e.message);
            }
        }
    }

    console.warn('[WeatherService] No umwelt.yaml found, using defaults');
    _umweltConfig = getDefaultConfig();
    return _umweltConfig;
}

/**
 * Config por defecto si no hay YAML
 */
function getDefaultConfig() {
    return {
        location: { lat: -33.4489, lon: -70.6693, timezone: 'America/Santiago' },
        weather: {
            api: {
                baseUrl: 'https://api.open-meteo.com/v1/forecast',
                current: 'temperature_2m,relative_humidity_2m,weather_code,is_day'
            },
            cache: { maxAgeMs: 1800000 },
            wmo_codes: { 0: 'despejado', 3: 'nublado' },
            climate_effects: {
                hot: { threshold: 28, description: 'calor' },
                warm: { threshold: 22, description: 'templado' },
                cool: { threshold: 15, description: 'fresco' },
                cold: { threshold: 10, description: 'frío' },
                freezing: { threshold: 5, description: 'muy frío' }
            }
        }
    };
}

/**
 * Clase WeatherService - Usa Open-Meteo API (gratis)
 */
class WeatherService {
    constructor() {
        const config = loadUmweltConfig();
        this.location = config.location || {};
        this.weather = config.weather || {};
        this.cache = { data: null, timestamp: 0 };
    }

    async getCurrentWeather() {
        const cacheMaxAge = this.weather.cache?.maxAgeMs || 1800000;

        if (this.cache.data && (Date.now() - this.cache.timestamp) < cacheMaxAge) {
            return this.cache.data;
        }

        try {
            const url = this._buildApiUrl();
            const response = await fetch(url);

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            const processed = this._processWeatherData(data);

            this.cache = { data: processed, timestamp: Date.now() };
            return processed;

        } catch (error) {
            console.error('[WeatherService] Error:', error.message);
            return this._getFallbackWeather();
        }
    }

    _processWeatherData(data) {
        const current = data.current || {};
        const temp = current.temperature_2m || 20;
        const humidity = current.relative_humidity_2m || 50;
        const weatherCode = current.weather_code || 0;
        const isDay = current.is_day === 1;

        const effect = this._getClimateEffect(temp);
        const conditionLocal = this._getLocalCondition(weatherCode, isDay);

        return {
            temperature: Math.round(temp),
            humidity,
            weatherCode,
            condition: conditionLocal,
            conditionLocal,
            isDay,
            effect,
            promptDescription: `Afuera hace ${Math.round(temp)}°C (${conditionLocal}). ${effect?.description || ''}`
        };
    }

    _getLocalCondition(weatherCode, isDay) {
        let condition = this.weather.wmo_codes?.[weatherCode] || 'normal';

        // Adaptar descripciones según día/noche
        if (!isDay) {
            // Si menciona sol o despejado, usar descripción nocturna
            if (condition.includes('sol') || condition.includes('despejado')) {
                return 'cielo nocturno despejado';
            }
            // Otras condiciones se mantienen igual (lluvia, nublado, etc.)
        }

        return condition;
    }

    _getClimateEffect(temp) {
        const effects = this.weather.climate_effects || {};

        for (const level of ['hot', 'warm', 'cool', 'cold', 'freezing']) {
            if (effects[level] && temp >= effects[level].threshold) {
                return { ...effects[level], level };
            }
        }
        return effects.freezing || { level: 'freezing', description: 'frío' };
    }

    _buildApiUrl() {
        const api = this.weather.api || {};
        return `${api.baseUrl}?latitude=${this.location.lat}&longitude=${this.location.lon}&current=${api.current}&timezone=${this.location.timezone || 'America/Santiago'}`;
    }

    _getFallbackWeather() {
        const hour = new Date().getHours();
        const month = new Date().getMonth() + 1;
        let temp = (month >= 11 || month <= 2) ? (hour >= 12 ? 28 : 22) : (hour >= 12 ? 18 : 12);

        return {
            temperature: temp,
            humidity: 50,
            weatherCode: 0,
            condition: 'estimado',
            conditionLocal: 'estimado',
            isDay: hour >= 6 && hour <= 20,
            effect: this._getClimateEffect(temp),
            isFallback: true
        };
    }
}

module.exports = { WeatherService, loadUmweltConfig };
