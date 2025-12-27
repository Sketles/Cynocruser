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
            file: 'PromptBuilder-V1-Somalia.js',
            description: 'Full Prompt primera version Somalia (~14k tokens)',
            lines: '~1294',
            features: [
                'XML Structure completo',
                'Umwelt + narrativa IA',
                'Todas las secciones sin comprimir'
            ]
        },

        v1f1: {
            file: 'promptBuilderV1F1-Somalia.js',
            description: 'V1 curado 8.5% de reducción de tokens y redundancias',
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
            description: 'Reduccion del 70% de tokens de V1 modelo ligero',
            lines: '~200',
            features: [
                'Solo lo esencial',
                'Para debuggear',
                'Sin Umwelt'
            ]
        }
    }
};
