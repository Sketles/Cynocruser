// ╔════════════════════════════════════════════════════════════════╗
// ║                      CORE INDEX                                ║
// ║           Exports unificados para módulos externos             ║
// ╚════════════════════════════════════════════════════════════════╝

// ═══════════════════════════════════════════════════════════════════
// LOADERS
// ═══════════════════════════════════════════════════════════════════
const { loadCassette } = require('./loaders/cassetteLoader');

// ═══════════════════════════════════════════════════════════════════
// BUILDERS
// ═══════════════════════════════════════════════════════════════════
const { buildSystemPrompt, buildUserContext } = require('./builders');

// ═══════════════════════════════════════════════════════════════════
// PSI-ORGAN
// ═══════════════════════════════════════════════════════════════════
const { PsiOrgan } = require('./organo-sima');

// ═══════════════════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════════════════
const { AIClient } = require('./services/ai-client');
const { textToSpeech, textToSpeechWithStyle } = require('./services/tts');

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════
const cassetteSettings = require('./config/cassette-settings');
const aiSettings = require('./config/ai-settings');
const ttsSettings = require('./config/tts-settings');
const promptSettings = require('./config/prompt-settings');

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════
module.exports = {
    // Loaders
    loadCassette,

    // Builders
    buildSystemPrompt,
    buildUserContext,

    // PsiOrgan
    PsiOrgan,

    // Services
    AIClient,
    textToSpeech,
    textToSpeechWithStyle,

    // Config
    cassetteSettings,
    aiSettings,
    ttsSettings,
    promptSettings,
};
