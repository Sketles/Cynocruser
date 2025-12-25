// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║                              CORE API CLIENT v3.0                           ║
// ║                     Professional Multi-Provider Architecture                ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

const providersConfig = require('../config/providers.json');
const aiSettings = require('../config/ai-settings');

class AIClient {
    constructor() {
        // Cargar configuración desde src/config/ai-settings.js
        this.providerId = aiSettings.provider;
        this.model = aiSettings.model;
        this.temperature = aiSettings.temperature;
        this.maxTokens = aiSettings.maxTokens;

        // Validar provider
        if (!providersConfig[this.providerId]) {
            const available = Object.keys(providersConfig).join(', ');
            throw new Error(`❌ Provider '${this.providerId}' no existe. Disponibles: ${available}`);
        }

        this.provider = providersConfig[this.providerId];
        this.apiKey = this._resolveApiKey();
    }

    /**
     * Resuelve la API key desde variables de entorno
     */
    _resolveApiKey() {
        const envKeys = Array.isArray(this.provider.envKey)
            ? this.provider.envKey
            : [this.provider.envKey];

        for (const key of envKeys) {
            if (process.env[key]) return process.env[key];
        }

        throw new Error(`❌ API Key faltante. Configura ${envKeys[0]} en tu .env`);
    }

    /**
     * Genera una respuesta usando el provider configurado
     */
    async generateResponse(messages, systemPrompt, settings = {}) {
        console.log(`${this.provider.emoji} Conectando a: ${this.provider.name}`);
        console.log(`🎯 Modelo: ${this.model}`);

        try {
            switch (this.provider.protocol) {
                case 'openai':
                    return await this._callOpenAI(messages, systemPrompt, settings);
                case 'gemini':
                    return await this._callGemini(messages, systemPrompt, settings);
                default:
                    throw new Error(`Protocolo desconocido: ${this.provider.protocol}`);
            }
        } catch (error) {
            console.error(`❌ Error en ${this.provider.name}:`, error.message);
            throw error;
        }
    }

    /**
     * Llamada a APIs compatibles con OpenAI
     */
    async _callOpenAI(messages, systemPrompt, settings) {
        const payload = {
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
            temperature: settings.temperature ?? 0.7,
            max_tokens: settings.maxOutputTokens ?? 1024,
            top_p: settings.topP ?? 1,
            stream: false
        };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            ...this.provider.headers
        };

        const response = await fetch(this.provider.endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`HTTP ${response.status}: ${err}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content ?? '';
    }

    /**
     * Llamada a API nativa de Google Gemini
     */
    async _callGemini(messages, systemPrompt, settings) {
        const url = this.provider.endpoint
            .replace('{model}', this.model) + `?key=${this.apiKey}`;

        const payload = {
            contents: messages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            })),
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
                temperature: settings.temperature ?? 0.9,
                topP: settings.topP ?? 0.95,
                maxOutputTokens: settings.maxOutputTokens ?? 1024
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini Error: ${err}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

    /**
     * Información del provider actual
     */
    getInfo() {
        return {
            provider: this.provider.name,
            model: this.model,
            availableModels: Object.keys(this.provider.models)
        };
    }

    /**
     * Lista todos los providers disponibles
     */
    static listProviders() {
        return Object.entries(providersConfig).map(([id, p]) => ({
            id,
            name: p.name,
            emoji: p.emoji,
            models: Object.keys(p.models)
        }));
    }
}

module.exports = { AIClient };
