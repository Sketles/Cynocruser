// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║                                                                             ║
// ║              C O N F I G U R A C I O N   Ψ - O R G A N                      ║
// ║                                                                             ║
// ║        Sistema cognitivo/emocional basado en SiMA (Dietrich 2023)           ║
// ║                                                                             ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

module.exports = {

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                      SISTEMA PRINCIPAL                                ║
    // ╠═══════════════════════════════════════════════════════════════════════╣
    // ║   enabled: true  → Activa el sistema Ψ-Organ completo                 ║
    // ║   enabled: false → Bypass directo al modelo (sin procesamiento)       ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    enabled: true,

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                         UMWELT                                        ║
    // ╠═══════════════════════════════════════════════════════════════════════╣
    // ║   Contexto del mundo: ubicación, zona horaria, horarios               ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    umwelt: {
        enabled: true,              // Inyectar fecha/hora/ubicación al prompt
        location: {
            city: 'Santiago',
            country: 'Chile',
            comuna: 'Renca',
            timezone: 'America/Santiago'
        },
        schedule: {
            alarmHour: 5.5,         // Alarma 5:30 AM
            wakeUpHour: 6,          // Se levanta
            workStartHour: 7,       // Entra a trabajar
            workEndHour: 18,        // Sale del trabajo
            lunchHour: 13,          // Almuerzo
            dinnerHour: 21,         // Cena
            sleepHour: 23.5         // Hora de dormir
        }
    },

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                      SOMA (Tanques)                                   ║
    // ╠═══════════════════════════════════════════════════════════════════════╣
    // ║   tickInterval: ms entre actualizaciones automáticas                  ║
    // ║   Los valores iniciales vienen de core-sima-organ.yaml                ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    soma: {
        tickInterval: 60000,        // Tick cada 60 segundos
        autoDecay: true,            // Decay automático de tanques
        persistState: false         // Guardar estado entre sesiones (TODO)
    },

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                      PERCEPCIÓN                                       ║
    // ╠═══════════════════════════════════════════════════════════════════════╣
    // ║   Cómo el sistema interpreta mensajes del usuario                     ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    perception: {
        sensitivityThreshold: 0.35, // Umbral mínimo de detección
        enableMarkers: true         // Usar marcadores somáticos de memoria
    },

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                      MODULADORES                                      ║
    // ╠═══════════════════════════════════════════════════════════════════════╣
    // ║   Arousal y resolución de respuestas                                  ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    modulators: {
        arousalBaseline: 40,        // Nivel base de arousal
        resolutionLevels: {
            HIGH: 150,              // Max tokens en arousal bajo
            MEDIUM: 80,             // Max tokens normal
            LOW: 50,                // Max tokens en estrés
            TUNNEL: 30              // Max tokens en pánico
        }
    },

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                      DEBUG                                            ║
    // ╠═══════════════════════════════════════════════════════════════════════╣
    // ║   Usar `npm run debug` para activar debug mode                        ║
    // ║   O setear DEBUG=true en .env                                         ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    debug: {
        logPerception: false,       // Log de percepción de mensajes
        logSoma: false,             // Log de cambios en tanques
        logEgo: false,              // Log de decisiones del ego
        logPrompt: false            // Log del prompt generado
    }

};
