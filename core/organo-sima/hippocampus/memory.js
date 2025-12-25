// ╔════════════════════════════════════════════════════════════════╗
// ║  HIPPOCAMPUS - MEMORIA (Sistema Mnésico)                       ║
// ║                                                                ║
// ║  Implementa Marcadores Somáticos (Damasio):                    ║
// ║  No solo recuerda QUÉ pasó, sino CÓMO SE SINTIÓ.               ║
// ║                                                                ║
// ║  Estructura: Concepto → Estado Corporal asociado               ║
// ╚════════════════════════════════════════════════════════════════╝

/**
 * Memory: Sistema de Memoria con Marcadores Somáticos
 */
class Memory {
    constructor() {
        // Marcadores somáticos: concepto → valencia emocional
        this.somaticMarkers = new Map();

        // Memoria episódica: eventos recientes
        this.episodes = [];

        // Límites
        this.maxEpisodes = 100;
        this.markerDecayRate = 0.1; // Cuánto se debilita un marcador por día
    }

    // ════════════════════════════════════════════════════════════════
    // MARCADORES SOMÁTICOS
    // ════════════════════════════════════════════════════════════════

    /**
     * Registra un marcador somático
     * Asocia un concepto con un cambio en el estado corporal
     * 
     * @param {string} concept - Palabra/tema clave
     * @param {Object} somaChange - Cambios en los tanques
     * @param {string} context - Contexto adicional
     */
    registerSomaticMarker(concept, somaChange, context = '') {
        const normalizedConcept = concept.toLowerCase().trim();

        // Calcular valencia del marcador
        const valence = this._calculateValence(somaChange);

        const existing = this.somaticMarkers.get(normalizedConcept);

        if (existing) {
            // Reforzar marcador existente (promedio móvil)
            existing.valence = (existing.valence + valence) / 2;
            existing.strength = Math.min(1, existing.strength + 0.2);
            existing.lastUpdated = Date.now();
            existing.occurrences++;
        } else {
            // Crear nuevo marcador
            this.somaticMarkers.set(normalizedConcept, {
                concept: normalizedConcept,
                valence,
                strength: 0.5,
                createdAt: Date.now(),
                lastUpdated: Date.now(),
                occurrences: 1,
                context,
                originalChange: somaChange
            });
        }
    }

    /**
     * Precarga un marcador somático (para configuración inicial)
     */
    preloadMarker(concept, data) {
        const normalizedConcept = concept.toLowerCase().trim();
        this.somaticMarkers.set(normalizedConcept, {
            concept: normalizedConcept,
            valence: data.valence || 0,
            strength: data.strength || 0.5,
            reaction: data.reaction || '',
            topic: data.topic || '',
            createdAt: Date.now(),
            lastUpdated: Date.now(),
            occurrences: 1,
            context: 'preloaded'
        });
    }

    /**
     * Consulta el marcador somático de un concepto
     * @param {string} concept - Concepto a buscar
     * @returns {Object|null} Marcador si existe
     */
    checkSomaticMarker(concept) {
        const normalized = concept.toLowerCase().trim();
        return this.somaticMarkers.get(normalized) || null;
    }

    /**
     * Busca marcadores en un texto completo
     * @param {string} text - Texto a analizar
     * @returns {Array} Marcadores encontrados
     */
    scanForMarkers(text) {
        const words = text.toLowerCase().split(/\s+/);
        const foundMarkers = [];

        for (const word of words) {
            const marker = this.somaticMarkers.get(word);
            if (marker && marker.strength > 0.3) {
                foundMarkers.push(marker);
            }
        }

        // Ordenar por intensidad (valor absoluto de valencia)
        return foundMarkers.sort((a, b) =>
            Math.abs(b.valence) - Math.abs(a.valence)
        );
    }

    /**
     * Calcula la valencia general de un cambio somático
     * @returns {number} -1 (muy malo) a +1 (muy bueno)
     */
    _calculateValence(somaChange) {
        // Si la integridad bajó mucho = muy negativo
        if (somaChange.integridad && somaChange.integridad < -10) {
            return -0.8;
        }
        // Si la afiliación subió = positivo
        if (somaChange.afiliacion && somaChange.afiliacion > 5) {
            return 0.6;
        }
        // Si la energía bajó mucho = negativo
        if (somaChange.energia && somaChange.energia < -15) {
            return -0.5;
        }
        // Si varias cosas subieron = positivo
        const totalChange = Object.values(somaChange).reduce((a, b) => a + b, 0);
        return Math.max(-1, Math.min(1, totalChange / 50));
    }

    // ════════════════════════════════════════════════════════════════
    // MEMORIA EPISÓDICA
    // ════════════════════════════════════════════════════════════════

    /**
     * Registra un episodio (interacción completa)
     */
    recordEpisode(episode) {
        this.episodes.push({
            ...episode,
            timestamp: Date.now()
        });

        // Mantener límite
        if (this.episodes.length > this.maxEpisodes) {
            this.episodes.shift();
        }

        // Extraer conceptos clave y registrar marcadores
        if (episode.input && episode.somaChange) {
            const keywords = this._extractKeywords(episode.input);
            for (const keyword of keywords) {
                this.registerSomaticMarker(keyword, episode.somaChange, episode.input);
            }
        }
    }

    /**
     * Obtiene episodios recientes
     */
    getRecentEpisodes(limit = 10) {
        return this.episodes.slice(-limit);
    }

    /**
     * Busca episodios relacionados con un concepto
     */
    findRelatedEpisodes(concept) {
        const normalized = concept.toLowerCase();
        return this.episodes.filter(ep =>
            ep.input?.toLowerCase().includes(normalized)
        );
    }

    /**
     * Extrae palabras clave de un texto
     */
    _extractKeywords(text) {
        // Palabras a ignorar
        const stopwords = ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'que', 'y', 'a', 'en', 'es', 'por'];

        return text
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopwords.includes(w))
            .slice(0, 5); // Máximo 5 keywords por episodio
    }

    // ════════════════════════════════════════════════════════════════
    // DECAY Y MANTENIMIENTO
    // ════════════════════════════════════════════════════════════════

    /**
     * Aplica decaimiento a los marcadores (olvidar gradualmente)
     */
    applyDecay() {
        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;

        for (const [key, marker] of this.somaticMarkers) {
            const daysSinceUpdate = (now - marker.lastUpdated) / dayInMs;
            const decay = daysSinceUpdate * this.markerDecayRate;

            marker.strength = Math.max(0, marker.strength - decay);

            // Remover marcadores muy débiles
            if (marker.strength < 0.1) {
                this.somaticMarkers.delete(key);
            }
        }
    }

    // ════════════════════════════════════════════════════════════════
    // ESTADO Y PERSISTENCIA
    // ════════════════════════════════════════════════════════════════

    /**
     * Obtiene el estado actual de la memoria
     */
    getState() {
        return {
            markers: Object.fromEntries(this.somaticMarkers),
            episodeCount: this.episodes.length,
            strongestPositive: this._getStrongestMarker(1),
            strongestNegative: this._getStrongestMarker(-1)
        };
    }

    _getStrongestMarker(sign) {
        let strongest = null;
        for (const marker of this.somaticMarkers.values()) {
            if (sign > 0 && marker.valence > 0) {
                if (!strongest || marker.valence > strongest.valence) {
                    strongest = marker;
                }
            } else if (sign < 0 && marker.valence < 0) {
                if (!strongest || marker.valence < strongest.valence) {
                    strongest = marker;
                }
            }
        }
        return strongest;
    }

    serialize() {
        return {
            somaticMarkers: Object.fromEntries(this.somaticMarkers),
            episodes: this.episodes.slice(-50) // Últimos 50
        };
    }

    restore(data) {
        if (data.somaticMarkers) {
            this.somaticMarkers = new Map(Object.entries(data.somaticMarkers));
        }
        if (data.episodes) {
            this.episodes = data.episodes;
        }
    }
}

module.exports = { Memory };
