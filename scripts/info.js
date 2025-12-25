const path = require('path');
const fs = require('fs');

// Cargar configuraciones
const cassetteSettings = require('../core/config/cassette-settings');
const aiSettings = require('../core/config/ai-settings');
const providers = require('../core/config/providers.json');

function displayInfo() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                   CYNOCRUSER - TECHNICAL INFO                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // 1. Cassette Info
    console.log('📼 CASSETTE COMPONENT');
    console.log('─────────────────────');
    console.log(`• Active Cassette:  \x1b[36m${cassetteSettings.cassette}\x1b[0m`);
    console.log('');

    // 2. AI Platform Info
    const activeProviderId = aiSettings.provider;
    const activeProviderConfig = providers[activeProviderId];

    console.log('🤖 AI PLATFORM');
    console.log('──────────────');
    if (activeProviderConfig) {
        console.log(`• Provider ID:      \x1b[32m${activeProviderConfig.id}\x1b[0m`);
        console.log(`• Provider Name:    ${activeProviderConfig.name}`);
        console.log(`• Endpoint:         ${activeProviderConfig.endpoint}`);
        console.log(`• Protocol:         ${activeProviderConfig.protocol}`);
        console.log(`• Env Key Var:      ${Array.isArray(activeProviderConfig.envKey) ? activeProviderConfig.envKey.join(', ') : activeProviderConfig.envKey}`);
    } else {
        console.log(`• Provider ID:      \x1b[31m${activeProviderId} (Unknown in providers.json)\x1b[0m`);
    }
    console.log('');

    // 3. Model Info
    const activeModelId = aiSettings.model;

    console.log('🧠 ACTIVE MODEL');
    console.log('───────────────');
    console.log(`• Model ID:         \x1b[35m${activeModelId}\x1b[0m`);

    if (activeProviderConfig && activeProviderConfig.models && activeProviderConfig.models[activeModelId]) {
        const modelInfo = activeProviderConfig.models[activeModelId];
        console.log(`• Context Window:   \x1b[33m${modelInfo.context.toLocaleString()} tokens\x1b[0m`);
        console.log(`• Cost Tier:        ${modelInfo.cost}`);

        if (modelInfo.limits) {
            console.log('\n  Rate Limits:');
            console.log(`  • RPM (Requests/Min): ${modelInfo.limits.rpm}`);
            console.log(`  • TPM (Tokens/Min):   ${modelInfo.limits.tpm.toLocaleString()}`);
            console.log(`  • RPD (Requests/Day): ${typeof modelInfo.limits.rpd === 'number' ? modelInfo.limits.rpd.toLocaleString() : modelInfo.limits.rpd}`);
        }
    } else {
        console.log(`• Model Info:       \x1b[31mNot found in providers.json config\x1b[0m`);
    }

    console.log('\n==================================================================\n');
}

displayInfo();
