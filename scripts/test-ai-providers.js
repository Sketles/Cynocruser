require('dotenv').config();
const { AIClient } = require('../core/services/ai-client');

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
    bold: "\x1b[1m"
};

// Top 5 models per provider to test
const TEST_SUITE = {
    groq: [
        'groq/compound',
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'qwen/qwen3-32b',
        'meta-llama/llama-4-maverick-17b-128e-instruct'
    ],
    sambanova: [
        'Meta-Llama-3.3-70B-Instruct',
        'Qwen3-32B',
        'DeepSeek-R1-Distill-Llama-70B',
        'DeepSeek-V3.1',
        'Llama-4-Maverick-17B-128E-Instruct'
    ],
    gemini: [
        // Modelos verificados Diciembre 2025 - Google AI Studio
        'gemini-2.5-flash',           // Fast, cost-effective (principal)
        'gemini-2.5-flash-lite',      // Ultra-fast, mobile optimized
        'gemini-2.5-pro',             // Powerful reasoning
        'gemini-3-flash-preview',     // Gemini 3 (preview phase)
        'gemini-2.0-flash'            // Previous gen
    ],
    openrouter: [
        // Gratuitos (verificados desde API)
        'meta-llama/llama-3.3-70b-instruct:free',
        'openai/gpt-oss-120b:free',
        'openai/gpt-oss-20b:free',
        'mistralai/devstral-2512:free',
        'allenai/olmo-3.1-32b-think:free',
        'nvidia/nemotron-3-nano-30b-a3b:free',
        // Pagados (funcionan seguro)
        'anthropic/claude-3.5-sonnet',
        'openai/gpt-4o'
    ]
};

// Clasificar errores de forma simple
function classifyError(errorMsg) {
    const msg = errorMsg.toLowerCase();

    if (msg.includes('api key faltante') || msg.includes('missing')) {
        return { code: 'NO_KEY', label: 'Sin API Key' };
    }
    if (msg.includes('429') || msg.includes('quota') || msg.includes('rate')) {
        return { code: 'QUOTA', label: 'Cuota agotada' };
    }
    if (msg.includes('404') || msg.includes('not found') || msg.includes('no endpoints')) {
        return { code: 'NOT_FOUND', label: 'Modelo no existe' };
    }
    if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid')) {
        return { code: 'AUTH', label: 'Key inválida' };
    }
    if (msg.includes('timeout') || msg.includes('econnrefused')) {
        return { code: 'NETWORK', label: 'Error de red' };
    }
    return { code: 'UNKNOWN', label: 'Error desconocido' };
}

async function testProvider(provider, models, stats) {
    console.log(`\n${colors.cyan}${colors.bold}╔════ ${provider.toUpperCase()} ════╗${colors.reset}`);

    const client = new AIClient();

    for (const model of models) {
        const shortModel = model.length > 35 ? model.substring(0, 32) + '...' : model;
        process.stdout.write(`  ${shortModel.padEnd(38)} `);

        const startTime = Date.now();

        try {
            const response = await client.sendMessage(
                [{ role: 'user', content: 'Say "OK" and nothing else.' }],
                {
                    provider: provider,
                    model: model,
                    maxTokens: 10,
                    temperature: 0.1,
                    silent: true
                }
            );

            const duration = Date.now() - startTime;
            console.log(`${colors.green}✔${colors.reset} ${colors.gray}${duration}ms${colors.reset}`);
            stats.ok++;

        } catch (error) {
            const duration = Date.now() - startTime;
            const classified = classifyError(error.message);
            console.log(`${colors.red}✘${colors.reset} ${colors.yellow}${classified.label}${colors.reset} ${colors.gray}(${duration}ms)${colors.reset}`);
            stats.fail++;
            stats.errors[classified.code] = (stats.errors[classified.code] || 0) + 1;
        }
    }
}

async function runAllTests() {
    console.log(`${colors.bold}I MODEL CONNECTIVITY TEST${colors.reset}`);
    console.log(`${colors.gray}Testing top 5 models per provider...${colors.reset}`);

    const stats = { ok: 0, fail: 0, errors: {} };

    for (const [provider, models] of Object.entries(TEST_SUITE)) {
        await testProvider(provider, models, stats);
    }

    // Resumen final
    console.log(`\n${colors.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}✔ OK: ${stats.ok}${colors.reset}  ${colors.red}✘ FAIL: ${stats.fail}${colors.reset}`);

    if (Object.keys(stats.errors).length > 0) {
        console.log(`\n${colors.yellow}Errores por tipo:${colors.reset}`);
        const errorLabels = {
            NO_KEY: 'Sin API Key',
            QUOTA: 'Cuota agotada',
            NOT_FOUND: 'Modelo no existe',
            AUTH: 'Key inválida',
            NETWORK: 'Error de red',
            UNKNOWN: 'Otros'
        };
        for (const [code, count] of Object.entries(stats.errors)) {
            console.log(`  ${errorLabels[code] || code}: ${count}`);
        }
    }

    console.log(`\n${colors.bold}DONE${colors.reset}`);
}

runAllTests().catch(console.error);
