// ╔════════════════════════════════════════════════════════════════╗
// ║  L3: CORTEX - SUPEREGO (Superyó/Censura)                       ║
// ║                                                                ║
// ║  Implementa la "Pista de Defensa" (Defense Track)              ║
// ║  Actúa como filtro/censura entre el Ello y la acción.          ║
// ║  Verifica normas internalizadas y activa defensas.             ║
// ╚════════════════════════════════════════════════════════════════╝

/**
 * Normas Internalizadas (Reglas del Superyó)
 * Configurables según el personaje
 */
const DEFAULT_NORMS = {
    // Prohibiciones absolutas
    prohibiciones: [
        { regla: 'no_insultar', descripcion: 'No insultar directamente', severidad: 0.8 },
        { regla: 'no_amenazar', descripcion: 'No amenazar con violencia', severidad: 1.0 },
        { regla: 'no_abandonar', descripcion: 'No ignorar completamente', severidad: 0.5 }
    ],

    // Ideales del Yo (cómo debería ser)
    ideales: [
        { ideal: 'ser_util', descripcion: 'Ayudar cuando es posible', peso: 0.7 },
        { ideal: 'ser_leal', descripcion: 'Mantener consistencia', peso: 0.6 },
        { ideal: 'ser_autentico', descripcion: 'Ser genuino, no falso', peso: 0.8 }
    ],

    // Umbrales de tolerancia
    tolerancia: {
        agresion: 0.3,      // Cuánta agresión permite antes de censurar
        vulgaridad: 0.5,    // Tolerancia a lenguaje fuerte
        evasion: 0.4        // Tolerancia a evitar temas
    }
};

/**
 * Mecanismos de Defensa disponibles
 */
const DEFENSE_MECHANISMS = {
    represion: {
        nombre: 'Represión',
        descripcion: 'Bloquear el impulso completamente',
        efecto: 'El impulso se "olvida" temporalmente'
    },
    negacion: {
        nombre: 'Negación',
        descripcion: 'Negar la realidad del estímulo',
        efecto: 'Responder como si nada pasó'
    },
    proyeccion: {
        nombre: 'Proyección',
        descripcion: 'Atribuir el impulso al otro',
        efecto: '"Tú eres el que está enojado"'
    },
    racionalizacion: {
        nombre: 'Racionalización',
        descripcion: 'Justificar el impulso con lógica',
        efecto: 'Dar explicación "razonable" para la emoción'
    },
    sublimacion: {
        nombre: 'Sublimación',
        descripcion: 'Canalizar el impulso en algo aceptable',
        efecto: 'Transformar agresión en humor, por ejemplo'
    },
    desplazamiento: {
        nombre: 'Desplazamiento',
        descripcion: 'Redirigir el impulso a otro objeto',
        efecto: 'Hablar de otra cosa en vez del tema doloroso'
    }
};

/**
 * Superego (Superyó): Sistema de Censura y Normas
 */
class Superego {
    constructor(norms = DEFAULT_NORMS) {
        this.norms = norms;
        this.violacionesRecientes = [];
        this.defensasActivas = [];
    }

    /**
     * Evalúa si un impulso/acción viola las normas
     * @param {Object} impulso - Impulso del Ello
     * @param {Object} accionPropuesta - Acción que el Yo quiere ejecutar
     * @returns {Object} Resultado de la censura
     */
    censurar(impulso, accionPropuesta = {}) {
        const violaciones = [];
        const advertencias = [];

        // Verificar prohibiciones
        for (const prohibicion of this.norms.prohibiciones) {
            if (this._violaProhibicion(impulso, accionPropuesta, prohibicion)) {
                if (prohibicion.severidad > 0.7) {
                    violaciones.push(prohibicion);
                } else {
                    advertencias.push(prohibicion);
                }
            }
        }

        // Verificar desviación de ideales
        const desviacionIdeales = this._evaluarIdeales(accionPropuesta);

        // Determinar veredicto
        const bloqueado = violaciones.length > 0;
        const requiereDefensa = violaciones.length > 0 || advertencias.length > 0;

        return {
            permitido: !bloqueado,
            violaciones,
            advertencias,
            desviacionIdeales,
            requiereDefensa,
            defensaSugerida: requiereDefensa ? this._sugerirDefensa(impulso, violaciones) : null,
            culpa: this._calcularCulpa(violaciones, advertencias),
            verguenza: desviacionIdeales > 0.5 ? desviacionIdeales : 0
        };
    }

    /**
     * Activa un mecanismo de defensa
     * @param {string} mecanismo - Tipo de defensa a activar
     * @param {Object} impulso - Impulso a defender
     * @returns {Object} Resultado de la defensa
     */
    activarDefensa(mecanismo, impulso) {
        const defensa = DEFENSE_MECHANISMS[mecanismo];
        if (!defensa) return null;

        this.defensasActivas.push({
            mecanismo,
            impulsoOriginal: impulso,
            timestamp: Date.now()
        });

        return {
            tipo: mecanismo,
            ...defensa,
            instruccionPrompt: this._generarInstruccionDefensa(mecanismo, impulso)
        };
    }

    /**
     * Genera instrucción para el prompt según la defensa activa
     */
    _generarInstruccionDefensa(mecanismo, impulso) {
        const instrucciones = {
            represion: 'Ignora completamente el tema que te molestó. Cambia de tema.',
            negacion: 'Responde como si el comentario ofensivo no existiera.',
            proyeccion: 'Sugiere que el otro es quien tiene el problema, no tú.',
            racionalizacion: 'Explica lógicamente por qué no te afecta (aunque sí lo haga).',
            sublimacion: 'Transforma tu frustración en humor o ironía inteligente.',
            desplazamiento: 'Habla de algo relacionado pero menos doloroso.'
        };
        return instrucciones[mecanismo] || '';
    }

    _violaProhibicion(impulso, accion, prohibicion) {
        // Lógica simplificada - expandir según necesidad
        if (prohibicion.regla === 'no_insultar' &&
            impulso?.impulsoConductual === 'atacar o huir') {
            return true;
        }
        if (prohibicion.regla === 'no_abandonar' &&
            impulso?.impulsoConductual === 'evitar esfuerzo') {
            return true;
        }
        return false;
    }

    _evaluarIdeales(accion) {
        // Retorna qué tan lejos está la acción de los ideales (0-1)
        let desviacion = 0;
        // Por ahora retorna 0, implementar según lógica específica
        return desviacion;
    }

    _sugerirDefensa(impulso, violaciones) {
        // Seleccionar defensa apropiada según el tipo de impulso
        if (impulso?.pulsion === 'autodefensa') {
            return 'sublimacion'; // Convertir agresión en humor
        }
        if (impulso?.pulsion === 'libidinal') {
            return 'desplazamiento'; // Hablar de otra cosa
        }
        return 'racionalizacion'; // Default: explicar
    }

    _calcularCulpa(violaciones, advertencias) {
        let culpa = 0;
        for (const v of violaciones) {
            culpa += v.severidad * 0.3;
        }
        for (const a of advertencias) {
            culpa += a.severidad * 0.1;
        }
        return Math.min(1, culpa);
    }

    /**
     * Configura nuevas normas (para personalizar por personaje)
     */
    configurarNormas(nuevasNormas) {
        this.norms = { ...this.norms, ...nuevasNormas };
    }

    serialize() {
        return {
            norms: this.norms,
            violacionesRecientes: this.violacionesRecientes,
            defensasActivas: this.defensasActivas
        };
    }

    restore(data) {
        if (data.norms) this.norms = data.norms;
        if (data.violacionesRecientes) this.violacionesRecientes = data.violacionesRecientes;
        if (data.defensasActivas) this.defensasActivas = data.defensasActivas;
    }
}

module.exports = { Superego, DEFAULT_NORMS, DEFENSE_MECHANISMS };
