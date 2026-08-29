// ╔════════════════════════════════════════════════════════════════╗
// ║                   PROMPT BUILDER SETTINGS                      ║
// ║     Configuración para seleccionar qué PromptBuilder usar      ║
// ╚════════════════════════════════════════════════════════════════╝

module.exports = {
    // ═══════════════════════════════════════════════════════════════
    // BUILDER ACTIVO
    // Opciones: 'v1', 'v1-fine', 'v2', 'lite'
    // ═══════════════════════════════════════════════════════════════
    activeBuilder: 'v1f1',

    // ═══════════════════════════════════════════════════════════════
    // BUILDERS DISPONIBLES
    // ═══════════════════════════════════════════════════════════════
    builders: {

        v1: {
            file: 'promptBuilder.v1.js',
            description: 'Prompt completo v1 (~14k tokens). XML structure, Umwelt + narrativa IA.',
            lines: '~1294',
            features: [
                'XML Structure completo',
                'Umwelt + narrativa IA',
                'Todas las secciones sin comprimir'
            ]
        },

        v1f1: {
            file: 'promptBuilder.v1f1.js',
            description: 'V1 curado — 8.5% menos tokens, sin redundancias.',
            lines: '~1260',
            features: [
                'Todo de v1',
                '-50% ejemplos de conversación',
                'Sin vocabulario redundante',
                'Biografía compactada'
            ]
        },

        lite: {
            file: 'promptBuilder.lite.js',
            description: 'Versión ligera — 70% menos tokens. Solo lo esencial, sin Umwelt.',
            lines: '~200',
            features: [
                'Solo lo esencial',
                'Para debuggear',
                'Sin Umwelt'
            ]
        }
    }
};
