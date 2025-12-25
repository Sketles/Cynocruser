// ╔════════════════════════════════════════════════════════════════╗
// ║  L3: CORTEX - ID (Ello/Pulsiones)                              ║
// ║                                                                ║
// ║  Implementa la "Pista de Impulsos" (Drive Track)               ║
// ║  Transforma necesidades físicas en deseos psíquicos.           ║
// ║  Opera bajo el Principio del Placer.                           ║
// ╚════════════════════════════════════════════════════════════════╝

/**
 * Mapeo de Necesidades a Pulsiones
 * Cada necesidad somática genera un tipo de pulsión
 */
const DRIVE_MAPPING = {
    energia: {
        pulsion: 'autoconservacion',
        deseo: 'descanso',
        conductaImpulsiva: 'evitar esfuerzo',
        frase: 'No tengo energía para esto...'
    },
    integridad: {
        pulsion: 'autodefensa',
        deseo: 'seguridad',
        conductaImpulsiva: 'atacar o huir',
        frase: '¡Defiéndete!'
    },
    afiliacion: {
        pulsion: 'libidinal',
        deseo: 'conexión',
        conductaImpulsiva: 'buscar atención',
        frase: 'Necesito que me hablen...'
    },
    certeza: {
        pulsion: 'epistémica',
        deseo: 'entender',
        conductaImpulsiva: 'pedir clarificación',
        frase: '¿Qué está pasando?'
    },
    competencia: {
        pulsion: 'dominio',
        deseo: 'éxito',
        conductaImpulsiva: 'demostrar capacidad',
        frase: 'Puedo hacerlo mejor...'
    }
};

/**
 * Id (Ello): Sistema de Pulsiones e Impulsos
 * Representa los deseos primitivos y el principio del placer
 */
class Id {
    constructor() {
        this.catexias = new Map(); // Cargas afectivas por símbolo
        this.impulsosActivos = [];
    }

    /**
     * Genera impulsos basados en el estado somático
     * @param {Object} somaState - Estado del Soma (tanques)
     * @returns {Object} Impulso dominante y lista de impulsos
     */
    generateDrives(somaState) {
        const impulsos = [];

        for (const [tank, level] of Object.entries(somaState.tanks)) {
            const deficit = 100 - level; // Cuánto falta
            const mapping = DRIVE_MAPPING[tank];

            if (deficit > 20) { // Umbral de activación
                impulsos.push({
                    fuente: tank,
                    pulsion: mapping.pulsion,
                    deseo: mapping.deseo,
                    intensidad: deficit / 100, // 0-1
                    conductaImpulsiva: mapping.conductaImpulsiva,
                    fraseInterna: mapping.frase,
                    urgencia: this._calcularUrgencia(level, tank)
                });
            }
        }

        // Ordenar por intensidad (Winner-takes-all)
        impulsos.sort((a, b) => b.intensidad - a.intensidad);
        this.impulsosActivos = impulsos;

        return {
            dominante: impulsos[0] || null,
            todos: impulsos,
            hayConflicto: impulsos.length > 1 &&
                impulsos[0]?.intensidad - impulsos[1]?.intensidad < 0.2
        };
    }

    /**
     * Asigna catexia (carga afectiva) a un símbolo
     * @param {string} simbolo - Símbolo a investir
     * @param {number} carga - Cantidad de energía psíquica (+/-)
     */
    investirCatexia(simbolo, carga) {
        const actual = this.catexias.get(simbolo) || 0;
        this.catexias.set(simbolo, actual + carga);
    }

    /**
     * Obtiene la catexia de un símbolo
     */
    getCatexia(simbolo) {
        return this.catexias.get(simbolo) || 0;
    }

    /**
     * Evalúa un estímulo desde la perspectiva del Ello
     * ¿Esto satisface o frustra mis pulsiones?
     * @param {Object} percepcion - Símbolo del L2
     * @param {Object} somaState - Estado actual del Soma
     */
    evaluarEstimulo(percepcion, somaState) {
        const drives = this.generateDrives(somaState);
        const dominante = drives.dominante;

        if (!dominante) {
            return {
                reaccion: 'indiferencia',
                intensidad: 0,
                mensaje: 'Sin necesidades urgentes'
            };
        }

        // ¿El estímulo satisface o frustra la pulsión dominante?
        const esRelevante = percepcion.affectedTanks?.includes(dominante.fuente);

        if (!esRelevante) {
            return {
                reaccion: 'distraccion',
                intensidad: 0.2,
                mensaje: `Pero yo quiero ${dominante.deseo}...`,
                pulsionFrustrada: dominante
            };
        }

        if (percepcion.valence === 'positive') {
            return {
                reaccion: 'placer',
                intensidad: percepcion.intensity * dominante.intensidad,
                mensaje: '¡Esto es lo que necesitaba!',
                pulsionSatisfecha: dominante
            };
        } else if (percepcion.valence === 'negative') {
            return {
                reaccion: 'displacer',
                intensidad: percepcion.intensity * dominante.intensidad,
                mensaje: dominante.fraseInterna,
                pulsionFrustrada: dominante,
                impulsoConductual: dominante.conductaImpulsiva
            };
        }

        return {
            reaccion: 'ambivalencia',
            intensidad: 0.5,
            mensaje: 'No sé qué pensar de esto...'
        };
    }

    _calcularUrgencia(level, tank) {
        if (level < 20) return 'critica';
        if (level < 40) return 'alta';
        if (level < 60) return 'media';
        return 'baja';
    }

    /**
     * Serializa el estado del Id
     */
    serialize() {
        return {
            catexias: Object.fromEntries(this.catexias),
            impulsosActivos: this.impulsosActivos
        };
    }

    restore(data) {
        if (data.catexias) {
            this.catexias = new Map(Object.entries(data.catexias));
        }
    }
}

module.exports = { Id, DRIVE_MAPPING };
