// ╔════════════════════════════════════════════════════════════════╗
// ║                   PROMPT BUILDER FACTORY                       ║
// ║        Carga dinámicamente el builder seleccionado             ║
// ╚════════════════════════════════════════════════════════════════╝

const promptSettings = require('../config/prompt-settings');

// Obtener configuración del builder activo
const activeConfig = promptSettings.builders[promptSettings.activeBuilder];

if (!activeConfig) {
    throw new Error(`❌ Builder '${promptSettings.activeBuilder}' no existe. Disponibles: ${Object.keys(promptSettings.builders).join(', ')}`);
}

// Cargar el builder dinámicamente
const activeBuilder = require(`./${activeConfig.file}`);

// Log informativo al cargar
console.log(`[PromptBuilder] Usando: ${promptSettings.activeBuilder} - ${activeConfig.description}`);

// Re-exportar las funciones del builder activo
module.exports = activeBuilder;
