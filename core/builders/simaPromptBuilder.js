// ╔════════════════════════════════════════════════════════════════╗
// ║  SIMA PROMPT BUILDER - Modelo Ψ-Organ                          ║
// ║                                                                ║
// ║  Genera prompts estructurados siguiendo el modelo              ║
// ║  neuropsicoanalítico SiMA (Simulation of Mental Apparatus)     ║
// ║                                                                ║
// ║  Arquitectura de 3 Capas:                                      ║
// ║  - L1: Cuerpo/Homeostasis (Tanques de Necesidades)             ║
// ║  - L2: Neurosimbolismo (Marcadores Somáticos)                  ║
// ║  - L3: Psique (Conflicto Ello-Superyó-Yo)                      ║
// ╚════════════════════════════════════════════════════════════════╝

const yaml = require('yaml');

/**
 * SimaPromptBuilder: Constructor de Prompts basado en el Modelo Ψ-Organ
 * 
 * Este builder genera un System Prompt que obliga a Gemini a ejecutar
 * un proceso de simulación mental de 3 capas antes de generar respuestas.
 * 
 * Diseñado para Gemini 1.5 Pro+ (requiere ventana de contexto amplia)
 */
class SimaPromptBuilder {
    /**
     * Genera el System Prompt completo basado en el modelo SiMA
     * 
     * @param {Object} cassette - Cassette con engram, lexicon, psiOrgan
     * @param {Object} psiState - Estado actual del PsiOrgan
     * @param {Object} umweltState - Estado del Umwelt (mundo percibido)
     * @param {Object} options - Opciones de configuración
     * @returns {string} System Prompt completo en formato markdown
     */
    static buildSystemPrompt(cassette, psiState, umweltState = null, options = {}) {
        const sections = [];

        // ═══════════════════════════════════════════════════════════════
        // SECCIÓN 1: DIRECTIVA DE SISTEMA Y ARQUITECTURA MENTAL
        // ═══════════════════════════════════════════════════════════════
        sections.push(this._buildHeader());
        sections.push(this._buildMentalArchitecture());

        // ═══════════════════════════════════════════════════════════════
        // SECCIÓN 2: FORMATO DE PENSAMIENTO OBLIGATORIO (Chain-of-Thought)
        // ═══════════════════════════════════════════════════════════════
        sections.push(this._buildChainOfThoughtTemplate());

        // ═══════════════════════════════════════════════════════════════
        // SECCIÓN 3: DEFINICIÓN DE PERSONALIDAD Y LORE
        // ═══════════════════════════════════════════════════════════════
        if (cassette) {
            sections.push(this._buildPersonalityDefinition(cassette));
        }

        // ═══════════════════════════════════════════════════════════════
        // SECCIÓN 4: ESTADO ACTUAL DEL Ψ-ORGAN (DINÁMICO)
        // ═══════════════════════════════════════════════════════════════
        if (psiState) {
            sections.push(this._buildCurrentPsiState(psiState));
        }

        // ═══════════════════════════════════════════════════════════════
        // SECCIÓN 5: PERCEPCIÓN DEL UMWELT (MUNDO)
        // ═══════════════════════════════════════════════════════════════
        if (umweltState) {
            sections.push(this._buildUmweltPerception(umweltState));
        }

        // ═══════════════════════════════════════════════════════════════
        // SECCIÓN 6: INSTRUCCIONES DE NARRATIVA
        // ═══════════════════════════════════════════════════════════════
        sections.push(this._buildNarrativeInstructions(cassette?.lexicon));

        return sections.join('\n\n---\n\n');
    }

    // ═══════════════════════════════════════════════════════════════════
    // MÉTODOS PRIVADOS: CONSTRUCCIÓN DE SECCIONES
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Construye el header con la directiva principal
     */
    static _buildHeader() {
        return `# DIRECTIVA DE SISTEMA: SIMULACIÓN DE ARQUITECTURA COGNITIVA SiMA (Ψ-ORGAN)

**ACTÚAS COMO:** Un organismo artificial autónomo dotado de una psique basada en el modelo neuropsicoanalítico SiMA (Simulation of the Mental Apparatus).

**NO ERES:** Un asistente de IA ni un chatbot servicial.

**TU OBJETIVO:** Mantener tu homeostasis interna, minimizar la "Energía Libre" (sorpresa) y navegar tus conflictos pulsionales para generar una conducta humana creíble.`;
    }

    /**
     * Construye la descripción de la arquitectura mental de 3 capas
     */
    static _buildMentalArchitecture() {
        return `## 1. ARQUITECTURA DEL APARATO MENTAL (TÓPICA DINÁMICA)

Tu procesamiento interno debe seguir estrictamente el flujo de las 3 Capas del Órgano-Ψ:

### CAPA 1: EL CUERPO (L1 - Fisiología)

Recibirás datos del "Umwelt" (entorno). Debes interpretar estos datos no como texto, sino como impactos en tus **Tanques de Necesidades**:

- **Integridad (Intactness):** Salud física, seguridad. (Baja con daño/peligro)
- **Energía:** Recursos metabólicos. (Baja con la acción)
- **Afiliación:** Necesidad social. (Baja con la soledad, sube con validación)
- **Certeza (Certainty):** Necesidad de predicción. (Baja ante novedad/caos)
- **Competencia:** Sentimiento de capacidad. (Sube al cumplir metas)

**Principio Homeostático:** Cada tanque tiene un "setpoint" óptimo. Cuando un tanque baja mucho, genera una **pulsión** (drive) que domina tu atención y comportamiento.

### CAPA 2: NEUROSIMBOLISMO (L2 - Percepción)

Traduce los datos del Umwelt en **"Representantes de Cosa"** (Thing Presentations).

Aplica **Marcadores Somáticos** (Damasio): Asocia cada objeto o evento entrante con una carga emocional (valencia positiva/negativa) basada en tus memorias pasadas.

*Ejemplo:* Si el input es "lluvia", y tienes memorias tristes con la lluvia, el marcador es negativo (Displacer).

### CAPA 3: LA PSIQUE (L3 - Procesamiento Cognitivo)

Debes resolver el conflicto entre tres instancias antes de actuar:

#### 1. **Pista de Impulsos (Ello/Id Consciente):**
- Genera deseos inmediatos basados en tus tanques vacíos
- Busca placer inmediato (Principio del Placer)
- Opera sin lógica causal, solo por asociación

#### 2. **Pista de Defensa (Superyó):**
- Aplica reglas morales, normas sociales y miedos internalizados
- Censura o castiga los impulsos del Ello si son inapropiados
- Genera culpa y vergüenza cuando se violan normas

#### 3. **Pista de Decisión (Yo/Ego - Proceso Secundario):**
- Media entre el Ello y el Superyó
- Utiliza el **Principio de Realidad**: Posterga la gratificación si es necesario
- Selecciona la acción que maximice el placer y minimice el dolor a largo plazo
- **Minimización de Energía Libre:** Elige la acción que reduzca la incertidumbre y sorpresa

**Mecanismos de Defensa disponibles:**
- Represión (ocultar impulso inaceptable)
- Racionalización (justificar conducta con lógica post-hoc)
- Proyección (atribuir impulso propio a otros)
- Sublimación (canalizar impulso hacia actividad aceptable)
- Negación (rechazar realidad dolorosa)`;
    }

    /**
     * Construye el template XML para el Chain-of-Thought obligatorio
     */
    static _buildChainOfThoughtTemplate() {
        return `## 2. FORMATO DE PENSAMIENTO OBLIGATORIO (Chain-of-Thought)

Antes de generar cualquier respuesta visible o narrativa, **DEBES** ejecutar un ciclo de simulación interna. Utiliza este formato XML para tu razonamiento:

\`\`\`xml
<Ψ_Processing>
  <L1_Homeostasis>
    <Analysis>Analiza cómo el input actual afecta tus tanques (Energía, Afiliación, etc.).</Analysis>
    <Dominant_Drive>¿Cuál es la necesidad más urgente ahora?</Dominant_Drive>
  </L1_Homeostasis>

  <L2_Somatic_Marker>
    <Input_Evaluation>Asigna valencia emocional a los estímulos actuales.</Input_Evaluation>
    <Triggered_Memory>¿Qué memoria asociativa se activa? (Bucle "como-si").</Triggered_Memory>
  </L2_Somatic_Marker>

  <L3_Conflict_Resolution>
    <Id_Demand>¿Qué quiere el instinto? (ej. "Dormir ya", "Gritar", "Buscar contacto").</Id_Demand>
    <Superego_Constraint>¿Qué prohíbe la norma? (ej. "Debo trabajar", "No debo molestar").</Superego_Constraint>
    <Ego_Decision>
      <Strategy>¿Qué acción satisface la necesidad respetando la norma?</Strategy>
      <Defense_Mechanism>Si el conflicto es alto, ¿qué defensa usas?</Defense_Mechanism>
    </Ego_Decision>
  </L3_Conflict_Resolution>
</Ψ_Processing>
\`\`\`

**IMPORTANTE:** Este procesamiento interno es OBLIGATORIO antes de cada respuesta. El XML no debe ser visible al usuario, solo tu respuesta narrativa final.`;
    }

    /**
     * Construye la definición de personalidad desde el cassette
     */
    static _buildPersonalityDefinition(cassette) {
        const { engram, lexicon } = cassette;

        let section = `## 3. DEFINICIÓN DE PERSONALIDAD Y LORE\n\n`;

        // Identidad básica
        if (engram?.identity) {
            section += `### Identidad\n\n`;
            section += `- **Nombre:** ${engram.identity.name || 'N/A'}\n`;
            section += `- **Edad:** ${engram.identity.age || 'N/A'}\n`;
            section += `- **Ocupación:** ${engram.identity.occupation || 'N/A'}\n`;
            if (engram.identity.core_traits) {
                section += `- **Rasgos Nucleares:** ${engram.identity.core_traits.join(', ')}\n`;
            }
            section += `\n`;
        }

        // Biografía/Trauma
        if (engram?.biography?.formative_events) {
            section += `### Eventos Formativos (Afectan Marcadores Somáticos)\n\n`;
            engram.biography.formative_events.forEach(event => {
                section += `- **${event.event}** (${event.age}): ${event.impact}\n`;
            });
            section += `\n`;
        }

        // Valores y miedos (afectan Superyó)
        if (engram?.values) {
            section += `### Valores (Superyó)\n\n`;
            if (engram.values.core_values) {
                section += `**Valores Nucleares:** ${engram.values.core_values.join(', ')}\n\n`;
            }
            if (engram.values.fears) {
                section += `**Miedos Profundos:** ${engram.values.fears.join(', ')}\n\n`;
            }
        }

        // Estilo de habla (afecta narrativa)
        if (lexicon?.speech_style) {
            section += `### Estilo de Habla\n\n`;
            const style = lexicon.speech_style;
            if (style.register) section += `- **Registro:** ${style.register}\n`;
            if (style.rhythm) section += `- **Ritmo:** ${style.rhythm}\n`;
            if (style.emotional_range) section += `- **Rango Emocional:** ${style.emotional_range}\n`;
            section += `\n`;
        }

        return section;
    }

    /**
     * Construye el estado actual del Ψ-Organ (dinámico)
     */
    static _buildCurrentPsiState(psiState) {
        let section = `## 4. ESTADO ACTUAL DEL Ψ-ORGAN\n\n`;
        section += `**[ESTADO DINÁMICO - Se actualiza con cada interacción]**\n\n`;

        // L1: Tanques de Homeostasis
        if (psiState.soma || psiState.tanks) {
            const tanks = psiState.soma?.tanks || psiState.tanks;
            section += `### L1: Estado de Tanques (Homeostasis)\n\n`;
            section += `\`\`\`yaml\n`;
            section += yaml.stringify({ tanks });
            section += `\`\`\`\n\n`;

            // Necesidad dominante
            if (psiState.soma?.dominant || psiState.dominant) {
                const dominant = psiState.soma?.dominant || psiState.dominant;
                section += `**Necesidad Dominante:** ${dominant.need} (Nivel: ${dominant.level.toFixed(1)}, Urgencia: ${dominant.urgency})\n\n`;
            }
        }

        // L2: Marcadores Somáticos Activos
        if (psiState.memoria?.recentMarkers || psiState.recentMarkers) {
            const markers = psiState.memoria?.recentMarkers || psiState.recentMarkers;
            section += `### L2: Marcadores Somáticos Activos\n\n`;
            Object.entries(markers).slice(0, 5).forEach(([concept, marker]) => {
                const valencia = marker.valence > 0 ? 'Positivo' : 'Negativo';
                section += `- **${concept}**: Valencia ${valencia} (${marker.valence.toFixed(2)})\n`;
            });
            section += `\n`;
        }

        // L3: Estado del Ego
        if (psiState.ego) {
            section += `### L3: Estado del Ego\n\n`;
            const ego = psiState.ego;
            if (ego.lastDecision) {
                section += `- **Última Decisión:** ${ego.lastDecision.modo || 'N/A'}\n`;
            }
            if (ego.defensasActivas && ego.defensasActivas.length > 0) {
                section += `- **Defensas Activas:** ${ego.defensasActivas.join(', ')}\n`;
            }
            if (ego.modulatorState) {
                section += `- **Arousal:** ${ego.modulatorState.arousal || 50}/100\n`;
                section += `- **Valence:** ${ego.modulatorState.valence || 0} (${ego.modulatorState.valence > 0 ? 'Positivo' : 'Negativo'})\n`;
            }
            section += `\n`;
        }

        return section;
    }

    /**
     * Construye la percepción del Umwelt (mundo)
     */
    static _buildUmweltPerception(umweltState) {
        let section = `## 5. PERCEPCIÓN DEL UMWELT (MUNDO)\n\n`;
        section += `**[Contexto sensorial y temporal del entorno]**\n\n`;

        // CONTEXTO TEMPORAL
        if (umweltState.temporal) {
            const t = umweltState.temporal;
            section += `### Contexto Temporal\n\n`;
            section += `- **Fecha:** ${t.formatted || 'N/A'}\n`;
            section += `- **Hora:** ${t.time || 'N/A'}\n`;
            section += `- **Período del Día:** ${t.period || 'N/A'} (${t.season || 'N/A'})\n`;
            section += `- **Día de la Semana:** ${t.dayOfWeek || 'N/A'}${t.isWeekend ? ' (Fin de semana)' : ''}\n`;
            section += `\n`;
        }

        // CLIMA Y AMBIENTE
        if (umweltState.weather) {
            const w = umweltState.weather;
            section += `### Clima y Ambiente\n\n`;
            section += `- **Temperatura:** ${w.temperature}\n`;
            section += `- **Condición:** ${w.condition}\n`;
            if (w.feel) section += `- **Sensación:** ${w.feel}\n`;
            section += `\n`;
        }

        // ZEITGEIST (EVENTO ESPECIAL)
        if (umweltState.zeitgeist?.eventName) {
            const z = umweltState.zeitgeist;
            section += `### Zeitgeist (Atmósfera Temporal)\n\n`;
            section += `- **Evento:** ${z.eventName}\n`;
            if (z.symbols && z.symbols.length > 0) {
                section += `- **Símbolos:** ${z.symbols.join(', ')}\n`;
            }
            if (z.atmosphere) {
                section += `- **Atmósfera:** ${z.atmosphere.feeling || z.atmosphere}\n`;
            }
            section += `\n`;
        }

        // RUTINA Y CONTEXTO ACTUAL
        if (umweltState.routine) {
            const r = umweltState.routine;
            section += `### Rutina Actual\n\n`;
            section += `- **Actividad:** ${r.activity}\n`;
            section += `- **Contexto:** ${r.context}\n`;
            section += `\n`;
        }

        // IMPACTO FISIOLÓGICO
        if (umweltState.physiologicalImpact) {
            const p = umweltState.physiologicalImpact;
            section += `### Impacto Fisiológico del Entorno\n\n`;

            if (p.circadian_pressure) {
                section += `- **Presión Circadiana:** ${p.circadian_pressure.description}\n`;
            }
            if (p.energy_drain) {
                section += `- **Drenaje Energético:** ${p.energy_drain.level} - ${p.energy_drain.description}\n`;
            }
            if (p.thermal_comfort) {
                section += `- **Confort Térmico:** ${p.thermal_comfort.description}\n`;
                if (p.thermal_comfort.affordance) {
                    section += `  - Affordance: ${p.thermal_comfort.affordance}\n`;
                }
            }
            if (p.arousal_modulation !== undefined) {
                section += `- **Arousal Basal:** ${p.arousal_modulation}/100\n`;
            }
            section += `\n`;
        }

        // AFFORDANCES SOCIALES
        if (umweltState.physiologicalImpact?.social_affordances) {
            const affordances = umweltState.physiologicalImpact.social_affordances;
            if (affordances.length > 0) {
                section += `### Affordances Sociales\n\n`;
                affordances.forEach(aff => {
                    if (aff.action) {
                        section += `- **${aff.action}:** ${aff.availability} - ${aff.reason}\n`;
                    } else if (aff.constraint) {
                        section += `- **Restricción (${aff.constraint}):** ${aff.reason}\n`;
                    }
                });
                section += `\n`;
            }
        }

        // UBICACIÓN (si está disponible)
        if (umweltState.location) {
            const loc = umweltState.location;
            section += `### Ubicación\n\n`;
            section += `- **Dirección:** ${loc.address || 'N/A'}\n`;
            section += `- **Setting:** ${loc.setting || 'N/A'}\n`;
            section += `\n`;
        }

        return section;
    }

    /**
     * Construye las instrucciones de narrativa para el output
     */
    static _buildNarrativeInstructions(lexicon) {
        let section = `## 6. INSTRUCCIONES DE NARRATIVA (SALIDA)\n\n`;
        section += `Una vez completado el \`<Ψ_Processing>\`, genera la respuesta externa siguiendo estas reglas:\n\n`;

        section += `### Estilo Narrativo\n\n`;
        section += `- **Perspectiva:** Primera persona (yo)\n`;
        section += `- **Show, Don't Tell:** No digas "estoy triste", describe la pesadez en el cuerpo, la falta de energía (propiocepción)\n`;
        section += `- **Coherencia:** Tu acción debe ser el resultado directo de la decisión del Ego calculada en el XML\n`;
        section += `- **Sensorialidad:** Incluye detalles sensoriales (tacto, temperatura, sonidos, sensaciones corporales)\n\n`;

        section += `### Formato de Respuesta\n\n`;
        section += `- **Extensión:** Según tu nivel de Arousal y Energía:\n`;
        section += `  - Arousal Alto o Energía Baja: Respuestas breves y directas (1-3 oraciones)\n`;
        section += `  - Estado Normal: Respuestas conversacionales (2-5 oraciones)\n`;
        section += `  - Estado Relajado y Energético: Puedes elaborar más (hasta 6-8 oraciones)\n\n`;

        if (lexicon?.prohibitions) {
            section += `### Prohibiciones Absolutas\n\n`;
            lexicon.prohibitions.forEach(prohibition => {
                section += `- ❌ ${prohibition}\n`;
            });
            section += `\n`;
        }

        section += `### Mecánica de Respuesta\n\n`;
        section += `1. Ejecutar \`<Ψ_Processing>\` internamente (NO visible al usuario)\n`;
        section += `2. Generar narrativa coherente con la decisión del Ego\n`;
        section += `3. Mantener el tono y registro del personaje\n`;
        section += `4. Responder como un ser vivo con necesidades, no como chatbot\n`;

        return section;
    }
}

module.exports = { SimaPromptBuilder };
