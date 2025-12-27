// ╔════════════════════════════════════════════════════════════════╗
// ║  UMWELT NARRATOR: Generador de Narrativa Fenomenológica        ║
// ║                                                                ║
// ║  Toma datos brutos del Umwelt y genera un relato inmersivo     ║
// ║  usando una mini-IA configurada en umwelt-ai-settings.js       ║
// ╚════════════════════════════════════════════════════════════════╝

const fs = require('fs');
const path = require('path');
const { AIClient } = require('../../services/ai-client');
const aiSettings = require('../../config/ai-settings');
const { UmweltPromptBuilder } = require('../../builders/umweltPromptBuilder');

class UmweltNarrator {
    constructor() {
        this.config = aiSettings.umwelt;
        this.aiClient = this.config.enabled ? new AIClient() : null;
        this.promptBuilder = new UmweltPromptBuilder();

        // Cargar System Prompt desde archivo
        try {
            const promptPath = path.join(__dirname, '../../config/prompts/umwelt-prompt', 'narrator-system.txt');
            this.systemPrompt = fs.readFileSync(promptPath, 'utf8');
        } catch (e) {
            console.warn('⚠️ No se pudo cargar narrator-system.txt, usando default.');
            this.systemPrompt = 'Eres un narrador de contexto ambiental.';
        }
    }

    /**
     * Genera narrativa fenomenológica a partir de datos del Umwelt
     * @param {Object} contextData - Datos dinámicos del worldSimulator
     * @param {Object} staticConfig - Configuración estática del core-umwelt.yaml
     * @returns {Promise<string>} Relato generado o fallback
     */
    async generateNarrative(contextData, staticConfig = null) {
        // Si está deshabilitado, retornar fallback estático
        if (!this.config.enabled || !this.aiClient) {
            return this._generateFallbackNarrative(contextData);
        }

        try {
            // Usar el nuevo PromptBuilder si tenemos config estática
            const prompt = staticConfig
                ? this.promptBuilder.buildPrompt(staticConfig, contextData)
                : this._buildPromptForNarrator(contextData);

            const response = await this._callNarratorAI(prompt);
            return this._cleanResponse(response);
        } catch (error) {
            console.warn('[UmweltNarrator] Error generando narrativa:', error.message);
            return this._generateFallbackNarrative(contextData);
        }
    }

    /**
     * Construye el prompt para la mini-IA narradora
     */
    _buildPromptForNarrator(data) {
        const { location, temporal, weather, routine, zeitgeist, physiologicalImpact, apartment, neighborhood } = data;

        // Construir contexto rico para la IA
        const lines = [];

        // DATOS TEMPORALES
        lines.push(`FECHA Y HORA: ${temporal.formatted}, ${temporal.time}`);
        lines.push(`PERÍODO DEL DÍA: ${temporal.period} (${temporal.season})`);
        if (temporal.isWeekend) lines.push('Es fin de semana');

        // UBICACIÓN
        lines.push(`\nUBICACIÓN: ${location.address}`);
        lines.push(`TIPO DE VIVIENDA: ${apartment.type || 'Departamento'}, ${location.floor}° piso`);
        lines.push(`BARRIO: ${neighborhood.type || 'Población urbana'} - ${neighborhood.safety}`);

        // CLIMA
        if (weather) {
            lines.push(`\nCLIMA: ${weather.temperature}, ${weather.condition}`);
            lines.push(`SENSACIÓN: ${weather.feel}`);
            if (physiologicalImpact?.thermal_comfort?.description) {
                lines.push(`IMPACTO CORPORAL: ${physiologicalImpact.thermal_comfort.description}`);
            }
        }

        // RUTINA ACTUAL
        if (routine) {
            lines.push(`\nACTIVIDAD ACTUAL: ${routine.activity}`);
            lines.push(`CONTEXTO: ${routine.context}`);
        }

        // ESTADO FISIOLÓGICO
        if (physiologicalImpact) {
            lines.push(`\nESTADO CIRCADIANO: ${physiologicalImpact.circadian_pressure.description}`);
            lines.push(`ENERGÍA: ${physiologicalImpact.energy_drain.description}`);
            lines.push(`AROUSAL: ${physiologicalImpact.arousal_modulation}/100 (${this._interpretArousal(physiologicalImpact.arousal_modulation)})`);
        }

        // ZEITGEIST (Eventos especiales)
        if (zeitgeist?.eventName) {
            lines.push(`\nEVENTO ESPECIAL: ${zeitgeist.eventName}`);
            if (zeitgeist.symbols) lines.push(`SÍMBOLOS: ${zeitgeist.symbols.join(', ')}`);
            if (zeitgeist.atmosphere) lines.push(`ATMÓSFERA: ${zeitgeist.atmosphere.feeling}`);
        }

        // AFFORDANCES SOCIALES
        if (physiologicalImpact?.social_affordances?.length > 0) {
            const affordances = physiologicalImpact.social_affordances
                .map(a => a.action ? `${a.action}: ${a.reason}` : `RESTRICCIÓN - ${a.constraint}: ${a.reason}`)
                .join('; ');
            lines.push(`\nCONTEXTO SOCIAL: ${affordances}`);
        }

        // INSTRUCCIÓN FINAL
        lines.push('\n---');
        lines.push('Genera un relato de 1-2 párrafos describiendo cómo se siente estar en este lugar en este momento.');
        lines.push('Incluye detalles sensoriales, contexto cultural chileno, y menciona eventos relevantes.');

        return lines.join('\n');
    }

    /**
     * Llama a la mini-IA con el prompt construido
     */
    async _callNarratorAI(userPrompt) {
        // Resolver API Key específica si está configurada
        const apiKey = this.config.apiKeyEnv ? process.env[this.config.apiKeyEnv] : null;

        const response = await this.aiClient.sendMessage([
            { role: 'system', content: this.systemPrompt }, // ← Propiedad de clase
            { role: 'user', content: userPrompt }
        ], {
            provider: this.config.provider,
            model: this.config.model,
            apiKey: apiKey, // Pasar key específica
            temperature: this.config.temperature,
            topP: this.config.topP,
            maxTokens: this.config.maxTokens
        });

        return response.content || response;
    }

    /**
     * Limpia la respuesta de la IA
     */
    _cleanResponse(response) {
        // Remover posibles artefactos de formato
        let cleaned = response.trim();

        // Remover comillas si las envolvió en ellas
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.slice(1, -1);
        }

        return cleaned;
    }

    /**
     * Genera narrativa de fallback si la IA no está disponible
     */
    _generateFallbackNarrative(data) {
        const { location, temporal, weather, routine, zeitgeist } = data;

        let narrative = `Estás en tu ${data.apartment?.type || 'departamento'} en ${location.address.split(',')[0]}. `;

        // Hora del día
        if (temporal.period === 'madrugada') {
            narrative += 'Es de madrugada, todo está en silencio. ';
        } else if (temporal.period === 'mañana') {
            narrative += 'Es de mañana, el día está comenzando. ';
        } else if (temporal.period === 'tarde') {
            narrative += 'Es de tarde, el día avanza. ';
        } else if (temporal.period === 'noche') {
            narrative += 'Es de noche, el día termina. ';
        }

        // Clima
        if (weather) {
            if (weather.temperature < 15) {
                narrative += `Hace frío (${weather.temperature}), `;
            } else if (weather.temperature > 25) {
                narrative += `Hace calor (${weather.temperature}), `;
            }
            narrative += `${weather.condition}. `;
        }

        // Rutina
        if (routine) {
            narrative += `${routine.context}. `;
        }

        // Zeitgeist
        if (zeitgeist?.eventName && zeitgeist.eventName !== 'normal') {
            narrative += `Hoy es ${zeitgeist.eventName}. `;
        }

        return narrative.trim();
    }

    _interpretArousal(arousal) {
        if (arousal < 30) return 'muy bajo';
        if (arousal < 50) return 'bajo';
        if (arousal < 70) return 'medio';
        return 'alto';
    }
}

module.exports = { UmweltNarrator };
