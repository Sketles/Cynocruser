// ╔════════════════════════════════════════════════════════════════╗
// ║                        IDENTITY LOADER                         ║
// ║            Carga personajes desde cassettes YAML               ║
// ╚════════════════════════════════════════════════════════════════╝

const { loadCassette, extractSomaticMarkers } = require('./cassetteLoader');
const cassetteSettings = require('../config/cassette-settings');
const aiSettings = require('../config/ai-settings');

// Cache de identidades cargadas
const identities = new Map();

/**
 * Inicializa el personaje desde el cassette configurado
 */
async function initializeIdentities() {
    console.log('🔄 Cargando cassette...');

    try {
        const cassette = loadCassette(cassetteSettings.cassette);
        const engram = cassette.engram;

        // Construir objeto identity
        const identity = {
            // Identificación
            id: cassetteSettings.cassette,
            cassetteId: cassetteSettings.cassette,
            name: engram.identity?.name || 'Pelao',
            fullName: engram.identity?.full_name || '',

            // IA (desde ai-settings.js)
            ai: {
                temperature: aiSettings.temperature,
                maxTokens: aiSettings.maxTokens
            },

            // Marcadores somáticos (extraídos del cassette)
            markers: extractSomaticMarkers(engram),

            // Contexto del mundo
            world: engram.context || null,

            // El cassette completo para referencia
            cassette
        };

        identities.set(identity.id, identity);
        console.log(`📦 Cassette cargado: ${identity.name} (${cassetteSettings.cassette})`);

        return true;
    } catch (error) {
        console.error(`❌ Error cargando cassette: ${error.message}`);
        return false;
    }
}

/**
 * Obtiene una identidad por ID
 */
function getIdentity(id) {
    return identities.get(id) || null;
}

/**
 * Lista todas las identidades cargadas
 */
function getAllIdentities() {
    return Array.from(identities.values());
}

/**
 * Obtiene los IDs de todas las identidades
 */
function getIdentityIds() {
    return Array.from(identities.keys());
}

/**
 * Recarga las identidades
 */
async function reloadIdentities() {
    identities.clear();
    return initializeIdentities();
}

module.exports = {
    initializeIdentities,
    getIdentity,
    getAllIdentities,
    getIdentityIds,
    reloadIdentities
};
