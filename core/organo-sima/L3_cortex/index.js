// L3: CORTEX - Exports
// Modelo Ψ-Organ según Dietrich (2023)

const { Ego } = require('./ego');
const { Id, DRIVE_MAPPING } = require('./id');
const { Superego, DEFAULT_NORMS, DEFENSE_MECHANISMS } = require('./superego');
const { Modulators, MODULATOR_CONFIG, EMOTION_PATTERNS } = require('./modulators');

// Nuevos módulos según el libro
const {
    PsychicIntensity,
    QuotaOfAffects,
    EmotionVector,
    BasicEmotionVector,
    ExtendedEmotionVector,
    Feeling
} = require('./evaluation');

const {
    PrimaryProcess,
    DriveTrack,
    PerceptionTrack,
    DefenseTrack,
    ThingRepresentative
} = require('./primary_process');

const {
    SecondaryProcess,
    WordRepresentative,
    TrialAction,
    DesireAndNeedSelectionTrack,
    ActionDecisionTrack,
    PrimarySecondaryTransformationTrack
} = require('./secondary_process');

module.exports = {
    // Instancias principales
    Ego,
    Id,
    Superego,
    Modulators,

    // Sistema de evaluación (Psychic Intensity)
    PsychicIntensity,
    QuotaOfAffects,
    EmotionVector,
    BasicEmotionVector,
    ExtendedEmotionVector,
    Feeling,

    // Proceso Primario
    PrimaryProcess,
    DriveTrack,
    PerceptionTrack,
    DefenseTrack,
    ThingRepresentative,

    // Proceso Secundario
    SecondaryProcess,
    WordRepresentative,
    TrialAction,
    DesireAndNeedSelectionTrack,
    ActionDecisionTrack,
    PrimarySecondaryTransformationTrack,

    // Configuraciones
    DRIVE_MAPPING,
    DEFAULT_NORMS,
    DEFENSE_MECHANISMS,
    MODULATOR_CONFIG,
    EMOTION_PATTERNS
};
