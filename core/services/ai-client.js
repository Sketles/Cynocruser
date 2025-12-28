// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║                              CORE API CLIENT v3.0                           ║
// ║                     Professional Multi-Provider Architecture                ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

const providersConfig = require('../config/providers.json');
const aiSettings = require('../config/ai-settings');

class AIClient {
    constructor() {
        // Cargar configuración default desde src/config/ai-settings.js
        this.providerId = aiSettings.provider;
        this.model = aiSettings.model;
        this.temperature = aiSettings.temperature;
        this.maxTokens = aiSettings.maxTokens;

        // Validar provider default
        if (this.providerId && !providersConfig[this.providerId]) {
            const available = Object.keys(providersConfig).join(', ');
            console.warn(`⚠️ Provider default '${this.providerId}' no existe. Disponibles: ${available}`);
        }

        this.provider = providersConfig[this.providerId];

        // Instanciar API Key default
        try {
            // Si hay apiKeyEnv en settings, usarlo en vez del provider default
            if (aiSettings.apiKeyEnv && process.env[aiSettings.apiKeyEnv]) {
                this.apiKey = process.env[aiSettings.apiKeyEnv];
            } else {
                this.apiKey = this.provider ? this._resolveApiKey(this.provider) : null;
            }
        } catch (e) {
            this.apiKey = null; // Se resolverá en runtime si es necesario
        }
    }

    /**
     * Resuelve la API key desde variables de entorno
     */
    _resolveApiKey(providerConfig) {
        const provider = providerConfig || this.provider;
        if (!provider) return null;

        const envKeys = Array.isArray(provider.envKey)
            ? provider.envKey
            : [provider.envKey];

        for (const key of envKeys) {
            if (process.env[key]) return process.env[key];
        }

        // Si es un test o no hay key, retornamos null o throw según el caso
        throw new Error(`❌ API Key faltante. Configura ${envKeys[0]} en tu .env`);
    }

    /**
     * Método principal para enviar mensajes (Compatible con array de mensajes)
     * @param {Array} messages - Array de mensajes {role, content}
     * @param {Object} settings - Configuración opcional (provider, model, etc)
     */
    async sendMessage(messages, settings = {}) {
        return this.generateResponse(messages, null, settings);
    }

    /**
     * Genera una respuesta usando el provider configurado o sobreescrito
     */
    async generateResponse(messages, systemPrompt, settings = {}) {
        // 1. Determinar Provider y Modelo (Default o Sobreescrito)
        let activeProviderId = settings.provider || this.providerId;
        let activeModel = settings.model || this.model;
        let activeProvider = providersConfig[activeProviderId];

        if (!activeProvider) {
            throw new Error(`❌ Provider '${activeProviderId}' no existe.`);
        }

        // 2. Determinar API Key (necesaria si cambiamos de provider)
        let activeApiKey = settings.apiKey || this.apiKey;
        if (activeProviderId !== this.providerId || !activeApiKey) {
            // Si settings.apiKey no está definido, resolver del provider
            if (!settings.apiKey) {
                activeApiKey = this._resolveApiKey(activeProvider);
            }
        }

        // 3. Extraer System Prompt si viene aparte
        let finalMessages = [...messages];
        let finalSystemPrompt = systemPrompt;

        // Si systemPrompt es null, tratar de sacarlo de messages
        if (!finalSystemPrompt) {
            const sysMsg = finalMessages.find(m => m.role === 'system');
            if (sysMsg) {
                finalSystemPrompt = sysMsg.content;
                // Dejamos el mensaje system en el array para OpenAI, 
                // pero lo filtramos para Gemini más abajo.
            }
        }

        // Logueo limpio (solo si no es un script de prueba masivo que sature)
        if (!settings.silent) {
            // console.log(`${activeProvider.emoji} Conectando a: ${activeProvider.name} [${activeModel}]`);
        }

        const context = {
            provider: activeProvider,
            model: activeModel,
            apiKey: activeApiKey,
            settings: { ...settings, maxOutputTokens: settings.maxTokens }
        };

        try {
            switch (activeProvider.protocol) {
                case 'openai':
                    return await this._callOpenAI(finalMessages, finalSystemPrompt, context);
                case 'gemini':
                    return await this._callGemini(finalMessages, finalSystemPrompt, context);
                default:
                    throw new Error(`Protocolo desconocido: ${activeProvider.protocol}`);
            }
        } catch (error) {
            if (!settings.silent) console.error(`❌ Error en ${activeProvider.name}:`, error.message);
            throw error;
        }
    }

    /**
     * Llamada a APIs compatibles con OpenAI
     */
    async _callOpenAI(messages, systemPrompt, context) {
        const { provider, model, apiKey, settings } = context;

        // Inyectar system prompt como primer mensaje si existe
        let finalMessages = [...messages];
        if (systemPrompt && !finalMessages.find(m => m.role === 'system')) {
            finalMessages.unshift({ role: 'system', content: systemPrompt });
        }

        const payload = {
            model: model,
            messages: finalMessages,
            temperature: settings.temperature ?? 0.7,
            max_tokens: settings.maxOutputTokens ?? 1024,
            top_p: settings.topP ?? 1,
            stream: false
        };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...provider.headers
        };

        // Soporte específico para OpenRouter headers
        if (provider.id === 'openrouter') {
            headers['HTTP-Referer'] = 'https://github.com/cynosure-project';
            headers['X-Title'] = 'Cynosure CLI';
        }

        const response = await fetch(provider.endpoint, {
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
    async _callGemini(messages, systemPrompt, context) {
        const { provider, model, apiKey, settings } = context;

        const url = provider.endpoint
            .replace('{model}', model) + `?key=${apiKey}`;

        // Gemini prefiere system prompt separado y mensajes User/Model
        const geminiMessages = messages
            .filter(m => m.role !== 'system') // Quitar system, va aparte
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

        const payload = {
            contents: geminiMessages,
            generationConfig: {
                temperature: settings.temperature ?? 0.9,
                topP: settings.topP ?? 0.95,
                maxOutputTokens: settings.maxOutputTokens ?? 1024,
                stopSequences: [
                    '\ny me dice\n',  // Detectar bucles
                    '\n\ny me dice',
                    'y me dice\ny me dice\ny me dice'
                ],
                candidateCount: 1
            }
        };

        // Agregar system prompt si existe
        if (systemPrompt) {
            payload.systemInstruction = {
                parts: [{ text: systemPrompt }]
            };
        }

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
            provider: this.provider?.name || 'Unknown',
            model: this.model,
            availableModels: this.provider ? Object.keys(this.provider.models) : []
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
