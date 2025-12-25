// ╔════════════════════════════════════════════════════════════════╗
// ║  PsiOrgan Persistence Helper                                   ║
// ║                                                                ║
// ║  Guarda el estado del PsiOrgan en archivo JSON local           ║
// ║  Auto-guarda cada N mensajes o N minutos                       ║
// ╚════════════════════════════════════════════════════════════════╝

const fs = require('fs');
const path = require('path');

// Directorio para guardar estados
const STATES_DIR = path.join(__dirname, '../../data/psi-states');

// Asegurar que existe el directorio
if (!fs.existsSync(STATES_DIR)) {
    fs.mkdirSync(STATES_DIR, { recursive: true });
}

/**
 * Obtiene la ruta del archivo de estado
 */
function getStatePath(identityId) {
    return path.join(STATES_DIR, `${identityId}.json`);
}

/**
 * Configura auto-guardado para un PsiOrgan
 */
async function setupPersistence(psiOrgan, identityId, options = {}) {
    const {
        saveIntervalMinutes = 5,
        saveEveryNMessages = 10
    } = options;

    psiOrgan._identityId = identityId;
    psiOrgan._messageCount = 0;
    psiOrgan._lastSaveTime = Date.now();

    // Intentar restaurar estado previo
    const savedState = await loadState(identityId);

    if (savedState) {
        restoreState(psiOrgan, savedState);
        console.log(`[Persist] Estado restaurado: ${identityId}`);
    }

    // Auto-guardado por intervalo
    psiOrgan._saveIntervalId = setInterval(async () => {
        await saveState(psiOrgan);
    }, saveIntervalMinutes * 60 * 1000);

    // Wrapper para auto-guardar después de N mensajes
    const originalProcess = psiOrgan.process.bind(psiOrgan);
    psiOrgan.process = async function (userInput, context) {
        const result = await originalProcess(userInput, context);
        this._messageCount++;

        if (this._messageCount >= saveEveryNMessages) {
            await saveState(this);
            this._messageCount = 0;
        }

        return result;
    };

    return {
        cleanup: () => {
            if (psiOrgan._saveIntervalId) {
                clearInterval(psiOrgan._saveIntervalId);
            }
        },
        forceSave: () => saveState(psiOrgan)
    };
}

/**
 * Guarda el estado en archivo JSON
 */
async function saveState(psiOrgan) {
    if (!psiOrgan._identityId) return false;

    try {
        const somaState = psiOrgan.soma.getState();
        const egoState = psiOrgan.ego.serialize?.() || {};
        const memoryState = psiOrgan.memory.getState?.() || {};

        const stateData = {
            savedAt: new Date().toISOString(),
            soma: somaState.tanks,
            lastEmotion: egoState.modulators?.emotion || null,
            lastFeeling: egoState.modulators?.currentState?.feeling || null,
            lastArousal: egoState.modulators?.currentState?.arousal || null,
            lastMode: egoState.decisionHistory?.[egoState.decisionHistory.length - 1]?.modo || null,
            learnedMarkers: memoryState.markers || {},
            decisionHistory: egoState.decisionHistory?.slice(-50) || [],
            primalRepressions: egoState.primaryProcess?.primalRepressions || []
        };

        const filePath = getStatePath(psiOrgan._identityId);
        fs.writeFileSync(filePath, JSON.stringify(stateData, null, 2));

        psiOrgan._lastSaveTime = Date.now();
        console.log(`[Persist] Estado guardado: ${psiOrgan._identityId}`);
        return true;
    } catch (error) {
        console.error('[Persist] Error guardando:', error.message);
        return false;
    }
}

/**
 * Carga estado desde archivo JSON
 */
async function loadState(identityId) {
    try {
        const filePath = getStatePath(identityId);
        if (!fs.existsSync(filePath)) return null;

        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('[Persist] Error cargando:', error.message);
        return null;
    }
}

/**
 * Restaura el estado del PsiOrgan
 */
function restoreState(psiOrgan, savedState) {
    try {
        // Restaurar soma
        if (savedState.soma) {
            const tanks = savedState.soma;
            if (tanks.energia !== undefined) psiOrgan.soma.tanks.energia = tanks.energia;
            if (tanks.integridad !== undefined) psiOrgan.soma.tanks.integridad = tanks.integridad;
            if (tanks.afiliacion !== undefined) psiOrgan.soma.tanks.afiliacion = tanks.afiliacion;
            if (tanks.certeza !== undefined) psiOrgan.soma.tanks.certeza = tanks.certeza;
            if (tanks.competencia !== undefined) psiOrgan.soma.tanks.competencia = tanks.competencia;
        }

        // Restaurar marcadores
        if (savedState.learnedMarkers && psiOrgan.memory) {
            for (const [concept, marker] of Object.entries(savedState.learnedMarkers)) {
                if (typeof psiOrgan.memory.preloadMarker === 'function') {
                    psiOrgan.memory.preloadMarker(concept, marker);
                }
            }
        }

        // Restaurar represiones
        if (savedState.primalRepressions && psiOrgan.ego?.addPrimalRepression) {
            for (const concept of savedState.primalRepressions) {
                psiOrgan.ego.addPrimalRepression(concept);
            }
        }

        return true;
    } catch (error) {
        console.error('[Persist] Error restaurando:', error.message);
        return false;
    }
}

module.exports = {
    setupPersistence,
    saveState,
    restoreState,
    loadState
};
