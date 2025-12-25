// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║                                                                             ║
// ║              C O N F I G U R A C I O N   C A S S E T T E                    ║
// ║                                                                             ║
// ║        Configuracion del personaje y su comportamiento                      ║
// ║                                                                             ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

// Estructura esperada:
//   core/cassettes/{ACTIVE_CASSETTE}/
//   ├── core-engram.yaml     (identidad, psique, contexto)
//   ├── core-lexicon.yaml    (lenguaje, ejemplos)
//   └── core-sima-organ.yaml (Ψ-Organ config)

module.exports = {

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                      CASSETTE ACTIVO                                  ║
    // ╠═══════════════════════════════════════════════════════════════════════╣
    // ║   Nombre de la carpeta en core/cassettes/                             ║
    // ║                                                                       ║
    // ║   Cassettes disponibles:                                              ║
    // ║   ┌─────────────────┬────────────────────────────────────────────┐    ║
    // ║   │ 'pelaosniper'   │ Pelao - Gamer chileno, weон simpatico      │    ║
    // ║   └─────────────────┴────────────────────────────────────────────┘    ║
    // ║   ┌─────────────────┬────────────────────────────────────────────┐    ║
    // ║   │ 'another'       │ Otro personaje                             │    ║
    // ║   └─────────────────┴────────────────────────────────────────────┘    ║
    // ║                                                                       ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    cassette: 'pelaosniper',

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║    PSI-ORGAN CONFIG                                                   ║
    // ╠═══════════════════════════════════════════════════════════════════════╣
    // ║   enabled: true  → Activa sistema emocional (usa core-sima-organ.yaml)║
    // ║   enabled: false → Bypass directo al modelo (sin procesamiento)       ║
    // ║                                                                       ║
    // ║   Debug: usar `npm run debug` en vez de config aquí                   ║
    // ║   Tanques iniciales: vienen de core-sima-organ.yaml                   ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

};
