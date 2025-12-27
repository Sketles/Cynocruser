// ╔════════════════════════════════════════════════════════════════╗
// ║                       CASSETTE LOADER                          ║
// ║           Carga y parsea YAML cassettes de personajes          ║
// ╚════════════════════════════════════════════════════════════════╝

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Cache de cassettes cargados
const cassetteCache = new Map();

/**
 * Carga un cassette completo de un personaje
 * @param {string} cassetteId - ID del cassette (ej: "pelaosniper")
 * @returns {Object} { engram, lexicon, meta }
 */
function loadCassette(cassetteId) {
    // Verificar cache
    if (cassetteCache.has(cassetteId)) {
        console.log(`📦 [Cassette] Cache hit: ${cassetteId}`);
        return cassetteCache.get(cassetteId);
    }

    const cassettePath = path.join(__dirname, '../cassettes', cassetteId);

    // Verificar que existe
    if (!fs.existsSync(cassettePath)) {
        throw new Error(`Cassette no encontrado: ${cassetteId}`);
    }

    // Cargar archivos YAML
    const engramPath = path.join(cassettePath, 'core-engram.yaml');
    const lexiconPath = path.join(cassettePath, 'core-lexicon.yaml');
    const psiOrganPath = path.join(cassettePath, 'core-sima-organ.yaml');

    let engram = {};
    let lexicon = {};
    let psiOrganConfig = {};

    if (fs.existsSync(engramPath)) {
        const content = fs.readFileSync(engramPath, 'utf8');
        engram = yaml.parse(content);
        console.log(`📦 [Cassette] Loaded engram: ${Object.keys(engram).length} sections`);
    }

    if (fs.existsSync(lexiconPath)) {
        const content = fs.readFileSync(lexiconPath, 'utf8');
        lexicon = yaml.parse(content);
        console.log(`📦 [Cassette] Loaded lexicon: ${Object.keys(lexicon).length} sections`);
    }

    if (fs.existsSync(psiOrganPath)) {
        const content = fs.readFileSync(psiOrganPath, 'utf8');
        psiOrganConfig = yaml.parse(content);
        console.log(`📦 [Cassette] Loaded psi-organ config: ${Object.keys(psiOrganConfig).length} sections`);
    }

    const cassette = {
        id: cassetteId,
        engram,
        lexicon,
        psiOrgan: psiOrganConfig,  // Configuración del Ψ-Organ
        meta: engram.meta || lexicon.meta || {},
        loadedAt: new Date().toISOString()
    };

    // Cachear
    cassetteCache.set(cassetteId, cassette);
    console.log(`📦 [Cassette] Cached: ${cassetteId}`);

    return cassette;
}

/**
 * Obtiene una sección específica del cassette usando dot notation
 * @param {Object} data - Objeto de datos (engram o lexicon)
 * @param {string} path - Path en dot notation (ej: "identity.name")
 * @returns {any} Valor en el path
 */
function getSection(data, pathStr) {
    return pathStr.split('.').reduce((obj, key) => obj?.[key], data);
}

/**
 * Extrae los marcadores somáticos del engram en formato para PsiOrgan
 * @param {Object} engram - Engram del cassette
 * @returns {Object} { positive: [...], negative: [...] }
 */
function extractSomaticMarkers(engram) {
    const markers = engram.somatic_markers;
    if (!markers) return { positive: [], negative: [] };

    return {
        positive: (markers.positive || []).map(m => ({
            topic: m.topic,
            keywords: m.keywords || [],
            valence: m.valence || 0.5,
            arousal_delta: m.arousal_delta || 10,
            reaction: m.reaction_description || '',
            example: m.example_response || ''
        })),
        negative: (markers.negative || []).map(m => ({
            topic: m.topic,
            keywords: m.keywords || [],
            valence: m.valence || -0.5,
            arousal_delta: m.arousal_delta || 10,
            reaction: m.reaction_description || '',
            example: m.example_response || ''
        })),
        prohibited: (markers.prohibited || []).map(m => ({
            topic: m.topic,
            reason: m.reason || '',
            avoidance: m.avoidance_strategy || '',
            examples: m.example_responses || []
        }))
    };
}

/**
 * Extrae ejemplos de conversación para few-shot learning
 * @param {Object} lexicon - Lexicon del cassette
 * @param {string} category - Categoría opcional (ej: "gaming", "greetings")
 * @returns {Array} Array de ejemplos formateados
 */
function extractExamples(lexicon, category = null) {
    const examples = lexicon.examples;
    if (!examples) return [];

    const result = [];

    // Si se especifica categoría, solo esa
    if (category && examples[category]) {
        return examples[category].map(formatExample);
    }

    // Si no, todas las categorías
    for (const [cat, items] of Object.entries(examples)) {
        if (Array.isArray(items)) {
            items.forEach(item => result.push(formatExample(item)));
        }
    }

    return result;
}

/**
 * Formatea un ejemplo para incluir en el prompt
 */
function formatExample(example) {
    if (!example.conversation) return null;

    const lines = example.conversation.map(msg => {
        const role = msg.role === 'user' ? 'Usuario' : '{{char}}';
        return `${role}: ${msg.content}`;
    });

    return {
        id: example.id,
        context: example.context,
        tags: example.tags || [],
        formatted: lines.join('\n')
    };
}

/**
 * Obtiene el contexto temporal basado en la hora actual
 * @param {Object} engram - Engram del cassette
 * @returns {Object} { contextName, description, isWorking, ... }
 */
function getTemporalContext(engram) {
    const temporal = engram.context?.temporal;
    if (!temporal) return { contextName: 'default', description: '' };

    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = domingo, 6 = sábado
    const isWeekend = day === 0 || day === 6;

    const contexts = temporal.time_based_contexts;
    if (!contexts) return { contextName: 'default', description: '' };

    // Determinar contexto
    let contextName = 'default';
    let description = '';

    if (isWeekend && contexts.weekend) {
        contextName = 'weekend';
        description = contexts.weekend.context;
    } else if (hour >= 0 && hour < 6 && contexts.night) {
        contextName = 'night';
        description = contexts.night.context;
    } else if (hour >= 5 && hour < 7 && contexts.early_morning) {
        contextName = 'early_morning';
        description = contexts.early_morning.context;
    } else if (hour >= 7 && hour < 18 && contexts.working_hours) {
        contextName = 'working_hours';
        description = contexts.working_hours.context;
    } else if (hour >= 18 && contexts.after_work) {
        contextName = 'after_work';
        description = contexts.after_work.context;
    }

    return {
        contextName,
        description,
        isWeekend,
        hour,
        dayOfWeek: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][day]
    };
}

/**
 * Limpia el cache (útil para recargar)
 */
function clearCache(cassetteId = null) {
    if (cassetteId) {
        cassetteCache.delete(cassetteId);
    } else {
        cassetteCache.clear();
    }
}

module.exports = {
    loadCassette,
    getSection,
    extractSomaticMarkers,
    extractExamples,
    getTemporalContext,
    clearCache
};
