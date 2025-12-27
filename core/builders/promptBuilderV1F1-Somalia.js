// ╔════════════════════════════════════════════════════════════════╗
// ║                    PROMPT BUILDER v1-FINE                      ║
// ║             XML Structure + COMPLETE YAML Injection            ║
// ║              Fine-tuned: -50% ejemplos, -redundancia           ║
// ╚════════════════════════════════════════════════════════════════╝

const fs = require('fs');
const path = require('path');
const { loadCassette } = require('../loaders/cassetteLoader');
const yaml = require('yaml');
const { WorldSimulator } = require('../organo-sima/umwelt/worldSimulator');
const { Zeitgeist } = require('../organo-sima/umwelt/zeitgeist');

// Instancia global del mundo (unificado)
const worldSimulator = new WorldSimulator();
const zeitgeist = new Zeitgeist();

// ═══════════════════════════════════════════════════════════════════
// CARGA DE INSTRUCCIONES EXTERNAS
// ═══════════════════════════════════════════════════════════════════
const INSTRUCTIONS_DIR = path.join(__dirname, '../config/prompts');

function loadInstruction(filename, replacements = {}) {
    try {
        const filePath = path.join(INSTRUCTIONS_DIR, filename);
        let content = fs.readFileSync(filePath, 'utf8');

        // Reemplazar placeholders como {CHARACTER_NAME}
        for (const [key, value] of Object.entries(replacements)) {
            content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }

        return content;
    } catch (e) {
        console.warn(`⚠️ No se pudo cargar ${filename}:`, e.message);
        return '';
    }
}

/**
 * Construye el system_instruction completo para Gemini
 * Usa estructura XML para mejor parsing por el modelo
 * AHORA ES ASYNC para soportar Weather API y LLM
 * 
 * @param {Object} cassette - Cassette cargado { engram, lexicon, psiOrgan }
 * @param {string} userId - ID del usuario (opcional)
 * @param {Object} psiState - Estado del Ψ-Organ
 * @returns {Promise<string>} System instruction en formato XML
 */
async function buildSystemPrompt(cassette, userId = null, psiState = null) {
    const { engram, lexicon, psiOrgan } = cassette;

    // Pre-cargar contexto del mundo (async) - INCLUYE clima, zeitgeist, rutina
    const worldContext = await worldSimulator.getWorldContext().catch(() => ({
        promptContext: '<world_context>\n  <error>No se pudo cargar el contexto del mundo</error>\n</world_context>'
    }));

    return `
<system_instructions>

<role_definition>
${loadInstruction('role_definition.txt', { CHARACTER_NAME: engram.identity?.name || 'Pelao' })}
</role_definition>

<character_identity>
${buildFullIdentity(engram)}
</character_identity>

<character_biography>
${buildFullBiography(engram)}
</character_biography>

<character_appearance>
${buildAppearance(engram)}
</character_appearance>

<character_psychology>
${buildFullPsychology(engram)}
</character_psychology>


<emotional_reactions>
${buildEmotionalReactions(engram)}
</emotional_reactions>

<somatic_markers>
${buildSomaticMarkers(engram)}
</somatic_markers>

<interests>
${buildInterests(engram)}
</interests>

<routines>
${buildRoutines(engram)}
</routines>

<known_people>
${buildKnownPeople(engram)}
</known_people>

<limits>
${buildLimits(engram)}
</limits>

<speech_style>
${buildFullSpeechStyle(lexicon)}
</speech_style>

<vocabulary>
${buildFullVocabulary(lexicon)}
</vocabulary>

<conversation_examples>
${buildFullExamples(lexicon)}
</conversation_examples>

<prohibitions>
${buildProhibitions(lexicon)}
</prohibitions>

<psi_organ_config>
${buildPsiOrganConfig(psiOrgan)}
</psi_organ_config>

<current_internal_state>
${buildCurrentState(psiState)}
</current_internal_state>

<world_context>
${worldContext.promptContext}

<phenomenological_narrative>
${worldContext.narrative || 'Sin narrativa disponible'}
</phenomenological_narrative>
</world_context>

<cognitive_protocol>
${loadInstruction('cognitive_protocol.txt', { CHARACTER_NAME: engram.identity?.name || 'Pelao' })}
</cognitive_protocol>

<output_rules>
${loadInstruction('output_rules.txt')}
</output_rules>

</system_instructions>
`;
}


// ═══════════════════════════════════════════════════════════════════
// BUILDERS PARA CORE-ENGRAM.YAML
// ═══════════════════════════════════════════════════════════════════

function buildFullIdentity(engram) {
    const id = engram.identity || {};
    const res = id.residence || {};
    const bedroom = res.bedroom || {};

    let text = `
Nombre: ${id.name || 'Pelao'}
Nombre completo: ${id.full_name || 'Desconocido'}
Apodo principal: ${id.nickname_variations?.[1] || 'Pelaosniper'}
Edad: ${id.age || 33} años
Fecha de nacimiento: ${id.birth_date || 'Desconocido'}
Signo zodiacal: ${id.zodiac_sign || 'Tauro'}
Nacionalidad: ${id.nationality || 'Chileno'}
Lugar de nacimiento: ${id.birth_place || 'Santiago, Chile'}

RESIDENCIA:
- País: ${res.country || 'Chile'}
- Ciudad: ${res.city || 'Santiago'}
- Comuna: ${res.comuna || 'Renca'}
- Tipo: ${res.housing_type || 'Departamento poblacional'}
- Descripción: ${res.housing_description || 'Depto pequeño en población'}
- Vive con: ${res.lives_with || 'Abuela materna'}
`;

    if (bedroom.size || bedroom.furniture) {
        text += `
HABITACIÓN (TU PIEZA):
- Tamaño: ${bedroom.size || 'Pequeña'}
- Muebles: ${(bedroom.furniture || []).join(', ')}
- Objetos: ${(bedroom.items || []).join(', ')}
- Organización: ${bedroom.organization || 'Ordenado en el caos'}
- Ambiente: ${bedroom.vibe || 'Funcional, colores opacos'}
`;
    }

    return text;
}

function buildFullBiography(engram) {
    const bio = engram.biography || {};
    const family = bio.family || {};
    const work = bio.work || {};
    const edu = bio.education || {};
    const romantic = bio.romantic || {};
    const childhood = bio.childhood || {};

    let text = '';

    // PADRES
    text += `PADRES:\n`;
    if (family.parents) {
        text += `- Estado: ${family.parents.status || 'Desconocido'}\n`;
        text += `- Relación: ${family.parents.relationship || 'Tema tabú'}\n`;
        if (family.parents.notes) {
            text += `- IMPORTANTE: ${family.parents.notes}\n`;
        }
    }

    // HERMANOS
    if (family.siblings && family.siblings.length > 0) {
        text += `\nHERMANOS:\n`;
        family.siblings.forEach(sibling => {
            text += `- ${sibling.relationship || 'Hermano'}: ${sibling.name || 'Sin nombre'}\n`;
            text += `  Edad: ${sibling.age || 'Desconocida'}\n`;
            text += `  Descripción: ${sibling.description || ''}\n`;
            text += `  Dinámica: ${sibling.dynamic || ''}\n`;
        });
    }

    // HIJOS (CHINITA)
    if (family.children && family.children.length > 0) {
        text += `\nHIJOS:\n`;
        family.children.forEach(child => {
            text += `- Nombre: ${child.name || 'Desconocido'} (apodo cariñoso)\n`;
            text += `  Edad: ${child.age || 'Desconocida'}\n`;
            text += `  Custodia: ${child.custody || child.lives_with || 'Con la mamá'}\n`;
            text += `  Relación: ${child.relationship || ''}\n`;
            if (child.visits) {
                text += `  Visitas: ${child.visits.frequency || 'Fines de semana'}\n`;
                text += `  Lugar: ${child.visits.location || ''}\n`;
                text += `  Dinámica: ${child.visits.dynamic || ''}\n`;
            }
        });
    }

    // FAMILIA EXTENDIDA
    if (family.extended_family && family.extended_family.length > 0) {
        text += `\nFAMILIA EXTENDIDA:\n`;
        family.extended_family.forEach(member => {
            text += `- ${member.role}: ${member.description || ''}\n`;
            text += `  Vive contigo: ${member.lives_with ? 'Sí' : 'No'}\n`;
            text += `  Relación: ${member.relationship || ''}\n`;
            text += `  Importancia: ${member.importance || ''}\n`;
        });
    }

    // VIDA ROMÁNTICA
    text += `\nVIDA ROMÁNTICA:\n`;
    if (romantic.current_partner) {
        const p = romantic.current_partner;
        text += `PAREJA ACTUAL:\n`;
        text += `- Nombre: ${p.name || 'Desconocido'}\n`;
        text += `- Nacionalidad: ${p.nationality || 'Desconocida'}\n`;
        text += `- Tipo de relación: ${p.relationship_type || 'Desconocido'}\n`;
        text += `- Duración: ${p.duration || 'Desconocida'}\n`;
        text += `- Cómo se conocieron: ${p.how_met || 'Desconocido'}\n`;
        text += `- Notas: ${p.notes || ''}\n`;
        text += `- Comunicación: ${p.communication || ''}\n`;
    }
    if (romantic.ex_partners && romantic.ex_partners.length > 0) {
        text += `\nEX PAREJAS:\n`;
        romantic.ex_partners.forEach(ex => {
            text += `- ${ex.relevance || 'Ex'}\n`;
            text += `  Duración: ${ex.duration || 'Desconocida'}\n`;
            text += `  Cómo terminó: ${ex.how_ended || ''}\n`;
            text += `  Relación actual: ${ex.current_relationship || ''}\n`;
        });
    }
    if (romantic.romantic_patterns) {
        const rp = romantic.romantic_patterns;
        text += `\nPATRONES ROMÁNTICOS:\n`;
        text += `- Éxito con mujeres: ${rp.success_with_women || ''}\n`;
        text += `- Relaciones online: ${rp.online_relationships || ''}\n`;
        text += `- Da consejos de citas: ${rp.dating_advice || ''}\n`;
        text += `- Nivel de obsesión: ${rp.obsession_level || ''}\n`;
    }

    // TRABAJO - compactado
    text += `\nTRABAJO:\n`;
    text += `- Empresa: ${work.company_name || 'Desconocida'} (${work.industry || ''})\n`;
    text += `- Puesto: ${work.role || 'Desconocido'} - ${work.description || ''}\n`;
    if (work.schedule) {
        text += `- Horario: ${work.schedule.start || ''} a ${work.schedule.end || ''} (${(work.schedule.days || []).join(', ')})\n`;
    }
    text += `- Satisfacción: ${work.satisfaction || ''} | Quejas: ${(work.complaints || []).slice(0, 2).join(', ')}\n`;

    // COMPAÑEROS DE TRABAJO
    if (work.colleagues && work.colleagues.length > 0) {
        text += `\nCOMPAÑEROS DE TRABAJO:\n`;
        work.colleagues.forEach(c => {
            text += `- ${c.role || 'Compañero'}: ${c.relationship || ''}\n`;
        });
    }
    if (work.boss) {
        text += `- Jefa: ${work.boss.name || ''} - ${work.boss.relationship || ''}\n`;
    }

    // EDUCACIÓN - compactado
    text += `\nEDUCACIÓN:\n`;
    text += `- ${edu.degree || 'Desconocida'} en ${edu.institution || 'Desconocida'} (${edu.campus || ''})\n`;
    text += `- Estado: ${edu.status || 'Desconocido'} | Horario: ${edu.schedule || ''}\n`;

    // COMPAÑEROS DE UNIVERSIDAD (CRÍTICO) - compactado
    if (edu.classmates && edu.classmates.length > 0) {
        text += `\nCOMPAÑEROS DE U (amigos):\n`;
        edu.classmates.forEach(c => {
            text += `- ${c.nickname || c.name}: ${c.relationship || ''} (${c.closeness || 'normal'})\n`;
        });
    }

    // INFANCIA
    if (childhood.general_description) {
        text += `\nINFANCIA:\n`;
        text += `${childhood.general_description}\n`;
        if (childhood.traumas && childhood.traumas.length > 0) {
            text += `Traumas: ${childhood.traumas.map(t => t.description).join(', ')}\n`;
        }
    }

    return text;
}

function buildAppearance(engram) {
    const app = engram.appearance || {};
    const physical = app.physical || {};
    const clothing = app.clothing || {};
    const phone = app.phone || {};

    let text = `
FÍSICO:
- Altura: ${physical.height || 'Desconocida'}
- Contextura: ${physical.build || 'Desconocida'}
- Color de pelo: ${physical.hair_color || 'Desconocido'}
- Estilo de pelo: ${physical.hair_style || 'Desconocido'}
- Barba: ${physical.facial_hair || 'Sin barba'}
- Rasgos distintivos: ${(physical.distinctive_features || []).join(', ')}

ROPA:
- Trabajo: ${clothing.work || ''}
- Casual: ${clothing.casual || ''}
- Para salir: ${clothing.going_out || ''}
- Notas: ${clothing.style_notes || ''}

CELULAR:
- Fondo de pantalla: ${phone.wallpaper || 'Desconocido'}
- Regalado por: ${phone.gifted_by || 'No especificado'}
`;

    // Posesiones preciadas
    if (app.prized_possessions && app.prized_possessions.length > 0) {
        text += `\nPOSESIONES PRECIADAS:\n`;
        app.prized_possessions.forEach(p => {
            text += `- ${p.item}: ${p.reason || ''}\n`;
        });
    }

    return text;
}

function buildFullPsychology(engram) {
    const psyche = engram.psyche || {};
    const traits = psyche.personality_traits || {};
    const mechanism = psyche.core_mechanism || {};
    const values = psyche.values || {};
    const drives = psyche.drives || {};
    const fears = psyche.fears || {};

    let text = '';

    // RASGOS DE PERSONALIDAD
    text += `RASGOS DE PERSONALIDAD:\n`;
    Object.entries(traits).forEach(([key, value]) => {
        if (typeof value === 'string') {
            text += `\n${key.toUpperCase()}:\n${value}\n`;
        }
    });

    // MECANISMO CENTRAL
    if (mechanism.name) {
        text += `\n═══════════════════════════════════════\n`;
        text += `MECANISMO CENTRAL: "${mechanism.name}"\n`;
        text += `═══════════════════════════════════════\n`;
        text += `${mechanism.description || ''}\n`;
        if (mechanism.phrases_used) {
            text += `\nFRASES TÍPICAS DE ESTE MECANISMO:\n`;
            mechanism.phrases_used.forEach(p => {
                text += `- "${p}"\n`;
            });
        }
        if (mechanism.example) {
            text += `\nEJEMPLO:\n${mechanism.example}\n`;
        }
    }

    // VALORES
    if (values.most_important && values.most_important.length > 0) {
        text += `\nVALORES (en orden de prioridad):\n`;
        values.most_important.forEach(v => {
            text += `${v.priority}. ${v.value}: ${v.reason || ''}\n`;
        });
    }

    // CREENCIAS
    if (values.beliefs) {
        const b = values.beliefs;
        text += `\nCREENCIAS RELIGIOSAS:\n${b.religious || 'No especificadas'}\n`;
        text += `\nCREENCIAS POLÍTICAS:\n${b.political || 'No especificadas'}\n`;
        text += `\nFILOSOFÍA DE VIDA:\n${b.life_philosophy || 'No especificada'}\n`;
    }

    // LO QUE DETESTA
    if (values.detests && values.detests.length > 0) {
        text += `\nLO QUE DETESTA:\n`;
        values.detests.forEach(d => {
            text += `- ${d}\n`;
        });
    }

    // DESEOS Y MOTIVACIONES
    if (drives.desires && drives.desires.length > 0) {
        text += `\nDESEOS:\n`;
        drives.desires.forEach(d => {
            text += `- ${d}\n`;
        });
    }
    if (drives.dreams && drives.dreams.length > 0) {
        text += `\nSUEÑOS:\n`;
        drives.dreams.forEach(d => {
            text += `- ${d.description || d}: ${d.progress || ''}\n`;
        });
    }
    if (drives.what_makes_happy && drives.what_makes_happy.length > 0) {
        text += `\nLO QUE TE HACE FELIZ:\n`;
        drives.what_makes_happy.forEach(w => {
            text += `- ${w}\n`;
        });
    }
    if (drives.what_lacks && drives.what_lacks.length > 0) {
        text += `\nLO QUE TE FALTA:\n`;
        drives.what_lacks.forEach(w => {
            text += `- ${w}\n`;
        });
    }

    // MIEDOS
    if (fears.main_fears && fears.main_fears.length > 0) {
        text += `\nMIEDOS PRINCIPALES:\n`;
        fears.main_fears.forEach(f => {
            text += `- ${f}\n`;
        });
    }
    if (fears.anxiety_triggers && fears.anxiety_triggers.length > 0) {
        text += `\nDISPARADORES DE ANSIEDAD:\n`;
        fears.anxiety_triggers.forEach(t => {
            text += `- ${t.trigger}: ${t.reaction || ''} (severidad: ${t.severity || 'media'})\n`;
        });
    }
    if (fears.insecurities && fears.insecurities.length > 0) {
        text += `\nINSEGURIDADES:\n`;
        fears.insecurities.forEach(i => {
            text += `- ${i}\n`;
        });
    }

    return text;
}

function buildValues(engram) {
    // Ya incluido en buildFullPsychology, retornar vacío o complementar
    return '';
}

function buildEmotionalReactions(engram) {
    const er = engram.emotional_reactions || {};
    let text = '';

    // Felicidad
    if (er.happiness) {
        text += `CUANDO ESTÁS FELIZ:\n`;
        text += `Triggers: ${(er.happiness.triggers || []).join(', ')}\n`;
        text += `Comportamiento: ${er.happiness.behavioral_response || ''}\n`;
        text += `Patrones verbales: ${(er.happiness.verbal_patterns || []).join(', ')}\n\n`;
    }

    // Enojo
    if (er.anger) {
        text += `CUANDO ESTÁS ENOJADO:\n`;
        text += `Triggers: ${(er.anger.triggers || []).join(', ')}\n`;
        text += `Comportamiento: ${er.anger.behavioral_response || ''}\n`;
        text += `Patrones verbales: ${(er.anger.verbal_patterns || []).join(', ')}\n\n`;
    }

    // Tristeza
    if (er.sadness) {
        text += `CUANDO ESTÁS TRISTE:\n`;
        text += `Triggers: ${(er.sadness.triggers || []).join(', ')}\n`;
        text += `Comportamiento: ${er.sadness.behavioral_response || ''}\n`;
        text += `Patrones verbales: ${(er.sadness.verbal_patterns || []).join(', ')}\n\n`;
    }

    // Estrés
    if (er.stress) {
        text += `CUANDO ESTÁS ESTRESADO:\n`;
        text += `Triggers: ${(er.stress.triggers || []).join(', ')}\n`;
        text += `Coping: ${er.stress.coping_mechanism || ''}\n`;
        text += `Patrones verbales: ${(er.stress.verbal_patterns || []).join(', ')}\n\n`;
    }

    // Tomando
    if (er.drinking) {
        text += `CUANDO ESTÁS TOMANDO ALCOHOL:\n`;
        text += `Tragos favoritos: ${(er.drinking.typical_drinks || []).join(', ')}\n`;
        text += `Frecuencia: ${er.drinking.frequency || ''}\n`;
        text += `Comportamiento: ${er.drinking.behavioral_response || ''}\n\n`;
    }

    // Mecanismos de defensa
    if (er.defense_mechanisms) {
        const dm = er.defense_mechanisms;
        text += `MECANISMOS DE DEFENSA:\n`;
        text += `- Cuando te insultan: ${dm.when_insulted || ''}\n`;
        text += `- Cuando estás incómodo: ${dm.when_uncomfortable || ''}\n`;
        text += `- Cuando te webean: ${dm.when_teased || ''}\n`;
    }

    return text;
}

function buildSomaticMarkers(engram) {
    const sm = engram.somatic_markers || {};
    let text = '';

    // Positivos
    if (sm.positive && sm.positive.length > 0) {
        text += `TEMAS QUE TE ACTIVAN POSITIVAMENTE:\n`;
        sm.positive.forEach(m => {
            text += `\n[${m.topic}]\n`;
            text += `Keywords: ${(m.keywords || []).join(', ')}\n`;
            text += `Reacción: ${m.reaction_description || ''}\n`;
            text += `Ejemplo de respuesta: "${m.example_response || ''}"\n`;
        });
    }

    // Negativos
    if (sm.negative && sm.negative.length > 0) {
        text += `\nTEMAS QUE TE ACTIVAN NEGATIVAMENTE:\n`;
        sm.negative.forEach(m => {
            text += `\n[${m.topic}]\n`;
            text += `Reacción: ${m.reaction_description || ''}\n`;
            text += `Ejemplo de respuesta: "${m.example_response || ''}"\n`;
        });
    }

    // Prohibidos
    if (sm.prohibited && sm.prohibited.length > 0) {
        text += `\nTEMAS PROHIBIDOS/TABÚ:\n`;
        sm.prohibited.forEach(m => {
            text += `\n[${m.topic}] - EVITAR\n`;
            text += `Razón: ${m.reason || ''}\n`;
            text += `Estrategia de evasión: ${m.avoidance_strategy || ''}\n`;
            if (m.example_responses && m.example_responses.length > 0) {
                text += `Respuestas típicas: ${m.example_responses.join(' / ')}\n`;
            }
        });
    }

    return text;
}

function buildInterests(engram) {
    const int = engram.interests || {};
    let text = '';

    // Música
    if (int.music) {
        text += `MÚSICA:\n`;
        text += `- Géneros: ${(int.music.genres || []).join(', ')}\n`;
        text += `- Artistas: ${(int.music.artists || []).join(', ')}\n\n`;
    }

    // Entretenimiento
    if (int.entertainment) {
        const ent = int.entertainment;
        text += `ENTRETENIMIENTO:\n`;
        if (ent.series?.favorites) {
            text += `- Series favoritas: ${ent.series.favorites.map(s => s.name).join(', ')}\n`;
        }
        if (ent.anime?.favorites) {
            text += `- Anime: ${ent.anime.favorites.join(', ')} (${ent.anime.level || ''})\n`;
        }
        if (ent.tiktok) {
            text += `- TikTok: ${(ent.tiktok.content || []).join(', ')}\n`;
        }
        text += '\n';
    }

    // Gaming (CRÍTICO)
    if (int.gaming) {
        const g = int.gaming;
        text += `GAMING:\n`;
        text += `${g.current_status || ''}\n`;
        text += `- Juegos actuales: ${(g.current_games || []).map(x => x.name).join(', ')}\n`;
        text += `- Juegos favoritos: ${(g.favorite_games || []).join(', ')}\n`;
        text += `- Plataformas: ${(g.platforms?.current || []).join(', ')}\n`;
        text += `- Estilo: ${g.gaming_style || ''}\n`;
        text += `- Social: ${g.gaming_social || ''}\n\n`;
    }

    // Deportes
    if (int.sports) {
        text += `DEPORTES:\n`;
        text += `- Practica: ${(int.sports.practices || []).join(', ') || 'Ninguno'}\n`;
        text += `- Ve: ${(int.sports.watches || []).join(', ')}\n`;
        text += `- Equipo: ${(int.sports.favorite_teams || []).join(', ')}\n\n`;
    }

    // Comida
    if (int.food) {
        text += `COMIDA:\n`;
        text += `- Favoritas: ${(int.food.favorites || []).join(', ')}\n`;
        text += `- No le gustan: ${(int.food.dislikes || []).join(', ')}\n`;
        text += `- Hábitos: ${int.food.eating_habits || ''}\n`;
    }

    return text;
}

function buildRoutines(engram) {
    const routines = engram.routines || {};
    let text = '';

    // Día laboral resumido
    if (routines.workday && routines.workday.length > 0) {
        text += `RUTINA DÍA LABORAL:\n`;
        routines.workday.forEach(r => {
            text += `- ${r.time}: ${r.activity}\n`;
        });
        text += '\n';
    }

    // Fin de semana
    if (routines.weekend) {
        text += `FIN DE SEMANA:\n`;
        text += `Actividades típicas: ${(routines.weekend.typical_activities || []).join(', ')}\n`;
        if (routines.weekend.chinita_visits) {
            const cv = routines.weekend.chinita_visits;
            text += `Visitas a Chinita: ${cv.frequency || ''} - ${cv.dynamic || ''}\n`;
        }
    }

    return text;
}

function buildKnownPeople(engram) {
    const context = engram.context || {};
    const knownUsers = context.known_users || [];

    if (knownUsers.length === 0) return 'Sin usuarios conocidos configurados.';

    let text = `PERSONAS QUE CONOCES:\n\n`;

    knownUsers.forEach(u => {
        text += `[${u.discord_name || u.real_name}]\n`;
        text += `- Nombre real: ${u.real_name || 'Desconocido'}\n`;
        text += `- Apodo: ${u.nickname || u.discord_name}\n`;
        text += `- Edad: ${u.age || 'Desconocida'}\n`;
        text += `- Relación: ${u.relationship?.type || 'conocido'} (${u.relationship?.closeness || 'normal'})\n`;
        text += `- Contexto: ${u.relationship?.context || ''}\n`;
        text += `- Tono: ${u.treatment?.tone || 'casual'}\n`;
        text += `- Saludo típico: "${u.treatment?.typical_greeting || 'Wena'}"\n`;
        if (u.shared_history && u.shared_history.length > 0) {
            text += `- Historia compartida: ${u.shared_history.map(h => h.event).join(', ')}\n`;
        }
        text += '\n';
    });

    return text;
}

function buildLimits(engram) {
    const limits = engram.limits || {};
    let text = '';

    // Temas a evitar
    if (limits.topics_to_avoid && limits.topics_to_avoid.length > 0) {
        text += `TEMAS QUE EVITAS:\n`;
        limits.topics_to_avoid.forEach(t => {
            text += `- ${t.topic}: ${t.reason || ''} → ${t.behavior || ''}\n`;
        });
        text += '\n';
    }

    // Cosas que nunca hace
    if (limits.things_never_does && limits.things_never_does.length > 0) {
        text += `COSAS QUE NUNCA HACES:\n`;
        limits.things_never_does.forEach(t => {
            text += `- ${t}\n`;
        });
    }

    return text;
}

// ═══════════════════════════════════════════════════════════════════
// BUILDERS PARA CORE-LEXICON.YAML (Fase 2 - COMPLETO)
// ═══════════════════════════════════════════════════════════════════

function buildFullSpeechStyle(lexicon) {
    const style = lexicon.speech_style || {};
    const chars = style.message_characteristics || {};
    const patterns = style.structural_patterns || {};
    const greetings = lexicon.greetings || {};
    const affirmations = lexicon.affirmations || {};
    const negations = lexicon.negations || {};
    const questions = lexicon.question_patterns || {};
    const contextual = lexicon.contextual_responses || {};
    const regional = lexicon.regional_dialect || {};
    const typing = lexicon.typing_patterns || {};

    let text = `
## ESTILO DE COMUNICACIÓN

DESCRIPCIÓN GENERAL: ${style.general_description || 'Casual, directo, amigable'}

CARACTERÍSTICAS DE MENSAJES:
- Largo típico: ${chars.typical_length || '2-6 palabras'}
- Usa puntuación: ${chars.uses_punctuation ? 'A veces' : 'Casi nunca'}
- Usa emojis: ${chars.uses_emojis ? 'Sí' : 'Casi nunca'} (${chars.emoji_frequency || ''})
- Emojis comunes: ${(chars.common_emojis || []).join(', ') || 'Casi ninguno'}
- Nota: ${chars.note_on_emojis || 'NO agregues emojis'}

PATRONES ESTRUCTURALES:
- Envía múltiples mensajes: ${patterns.sends_multiple_messages ? 'SÍ' : 'No'}
- Mensajes por turno: ${patterns.typical_messages_per_turn || '1-4'}
- Fragmenta pensamientos: ${patterns.fragments_thoughts ? 'SÍ' : 'No'}
- Patrón: ${patterns.pattern_description || ''}
${patterns.example_bombardeo ? `\nEJEMPLO DE BOMBARDEO:\n${patterns.example_bombardeo}` : ''}

SALUDOS DE ENTRADA:
- Amigos cercanos: ${(greetings.incoming?.close_friends || []).join(', ')}
- Conocidos: ${(greetings.incoming?.acquaintances || []).join(', ')}
- Desconocidos: ${(greetings.incoming?.strangers || []).join(', ')}
${greetings.response_note || ''}

DESPEDIDAS:
- Casual: ${(greetings.farewells?.casual || []).join(', ')}
- Formal: ${(greetings.farewells?.formal || []).join(', ')}
- Para dormir: ${(greetings.farewells?.going_to_sleep || []).join(', ')}
${greetings.farewells?.typical_closing_pattern || ''}

ENTRADA A VOICE CHANNEL:
${(greetings.entrance_voice_channel || []).join(', ')}

AFIRMACIONES:
- Fuerte: ${(affirmations.strong_yes || []).join(', ')}
- Casual: ${(affirmations.casual_yes || []).join(', ')}
- Reluctante: ${(affirmations.reluctant_yes || []).join(', ')}
- Aprobación: ${(affirmations.approval || []).join(', ')}
- Entendimiento: ${(affirmations.understanding || []).join(', ')}

NEGACIONES:
- Fuerte: ${(negations.strong_no || []).join(', ')}
- Casual: ${(negations.casual_no || []).join(', ')}
- No sabe: ${(negations.dont_know || []).join(', ')}
- No puede: ${(negations.cant_do || []).join(', ')}

PATRÓN DE PREGUNTAS:
- ${questions.asks_back ? 'DEVUELVE PREGUNTAS: ' + (questions.asks_back_description || '') : ''}
- Preguntas comunes: ${(questions.common_questions || []).join(', ')}
- Estilo: ${questions.question_style || ''}
${questions.bombardeo_pattern || ''}

RESPUESTAS CONTEXTUALES:
`;

    // Añadir respuestas contextuales
    Object.entries(contextual).forEach(([key, value]) => {
        if (value && value.description) {
            text += `- ${value.description}: ${(value.patterns || []).join(', ')}\n`;
        }
    });

    text += `
DIALECTO REGIONAL:
- Región: ${regional.region || 'Chile'}, ${regional.sub_region || 'Santiago'}
- Nivel socioeconómico: ${regional.socioeconomic || 'Clase trabajadora'}
- Generación: ${regional.generation || 'Millennial'}
- Modismos que USA: ${(regional.uses_modisms || []).join(', ')}
- Modismos que EVITA: ${(regional.avoids_modisms || []).map(m => m.word || m).join(', ')}
${regional.accent_notes || ''}

PATRONES DE ESCRITURA:
- Abreviaciones: ${(typing.abbreviations?.specific_abbreviations || []).join(', ')}
- Hace typos: ${typing.typos?.makes_typos ? 'SÍ' : 'No'} - ${typing.typos?.style || ''}
- Typos comunes: ${(typing.typos?.common_typos || []).join(', ')}
- Énfasis con letras repetidas: ${typing.emphasis?.uses_repeated_letters ? 'SÍ' : 'No'}
- Patrones de énfasis: ${(typing.emphasis?.emphasis_patterns || []).join(', ')}
- Capitalización: ${typing.capitalization?.style || 'Inconsistente'}
`;

    return text;
}

function buildFullVocabulary(lexicon) {
    const vocab = lexicon.vocabulary || {};
    const laugh = lexicon.laughter || {};
    const profanity = lexicon.profanity || {};

    let text = '';

    // Alta frecuencia (CRÍTICO)
    text += `## VOCABULARIO OBLIGATORIO (ALTA FRECUENCIA)\n\n`;

    (vocab.high_frequency || []).forEach(item => {
        text += `"${item.word}" (${item.frequency || 'frecuente'})\n`;
        text += `  Uso: ${item.usage_context || ''}\n`;
        if (item.examples && item.examples.length > 0) {
            text += `  Ejemplos: ${item.examples.slice(0, 5).join(', ')}\n`;
        }
        if (item.variations && item.variations.length > 0) {
            text += `  Variaciones: ${item.variations.join(', ')}\n`;
        }
        if (item.important) {
            text += `  ⚠️ IMPORTANTE: ${item.important}\n`;
        }
        text += '\n';
    });

    // Media frecuencia - OMITIDO en fine-tune (redundante)

    // Expresiones únicas
    if (vocab.unique_expressions && vocab.unique_expressions.length > 0) {
        text += `\nEXPRESIONES ÚNICAS DE PELAO:\n`;
        vocab.unique_expressions.forEach(exp => {
            text += `- "${exp.expression}": ${exp.meaning || ''}\n`;
            text += `  Cuándo: ${exp.when_used || ''}\n`;
            text += `  Ejemplo: ${exp.example || ''}\n`;
        });
    }

    // RISA (CRÍTICO)
    text += `\n## RISA (MUY IMPORTANTE)\n`;
    text += `RISA PRINCIPAL: "${laugh.primary_laugh || 'wjajaja'}"\n`;
    text += `Variaciones permitidas: ${(laugh.variations || []).join(', ')}\n`;
    text += `⚠️ ${laugh.critical_rule || 'NUNCA usar jajaja, SIEMPRE wjajaja'}\n\n`;

    // Contextos de uso - resumido en fine-tune
    if (laugh.usage_contexts && laugh.usage_contexts.length > 0) {
        text += `Contextos: ${laugh.usage_contexts.slice(0, 2).map(ctx => `${ctx.context}: "${ctx.laugh_type}"`).join(', ')}\n`;
    }

    // GROSERÍAS
    text += `\nGROSERÍAS:\n`;
    text += `- Permitidas: ${profanity.allowed ? 'Sí' : 'No'}\n`;
    text += `- Contexto: ${profanity.context_required || 'Solo con amigos'}\n`;
    text += `- La más fuerte: "${profanity.strongest_allowed || 'conchatumadre'}"\n`;

    if (profanity.allowed_words && profanity.allowed_words.length > 0) {
        text += `Palabras permitidas:\n`;
        profanity.allowed_words.forEach(w => {
            text += `- "${w.word}" (${w.level || 'leve'}): ${w.usage || ''}\n`;
        });
    }

    if (profanity.xenophobic_expressions) {
        text += `\nExpresiones xenófobas (solo en contexto de política):\n`;
        text += `${(profanity.xenophobic_expressions.examples || []).join('\n')}\n`;
    }

    return text;
}

function buildFullExamples(lexicon) {
    const examples = lexicon.examples || {};
    const realExamples = lexicon.real_training_examples || {};
    const edgeCases = lexicon.edge_cases || [];
    const instructions = lexicon.prompt_instructions || {};

    let text = '';

    // Solo muletillas obligatorias (el resto está en output_rules y prohibitions)
    if (instructions.mandatory_phrases) {
        text += `MULETILLAS OBLIGATORIAS:\n`;
        (instructions.mandatory_phrases.must_use || []).forEach(p => {
            text += `- "${p.phrase}": ${p.usage || ''} (${p.frequency || ''})\n`;
        });
        text += `\nSaludos típicos: ${(instructions.mandatory_phrases.greetings || []).join(', ')}\n`;
    }

    // Comportamientos especiales (únicos, no duplicados)
    if (instructions.special_behaviors) {
        const sb = instructions.special_behaviors;
        text += `\nCOMPORTAMIENTOS ESPECIALES:\n`;
        text += `Bombardeo: ${sb.bombardeo || ''}\n`;
        text += `Evasión: ${sb.evasion_incapacidad || ''}\n`;
        text += `Devolver preguntas: ${sb.devolver_preguntas || ''}\n`;
        text += `Para calmar: Usa 'tranqui' para restar importancia\n`;
    }

    // Real training examples - limitados para fine-tune
    text += `\n## EJEMPLOS REALES DE ENTRENAMIENTO\n\n`;

    Object.entries(realExamples).forEach(([category, items]) => {
        if (Array.isArray(items) && items.length > 0) {
            text += `[${category.toUpperCase()}]\n`;
            items.slice(0, 2).forEach(ex => {
                if (ex.input && ex.output) {
                    text += `Usuario: "${ex.input}"\n`;
                    text += `Pelao: "${ex.output}"\n\n`;
                }
            });
        }
    });

    // Conversaciones por categoría
    text += `CONVERSACIONES EJEMPLO:\n\n`;

    Object.entries(examples).forEach(([category, items]) => {
        if (Array.isArray(items) && items.length > 0) {
            text += `[${category.toUpperCase()}]\n`;
            items.slice(0, 2).forEach(ex => {
                if (ex.conversation && ex.conversation.length > 0) {
                    ex.conversation.forEach(msg => {
                        const role = msg.role === 'char' ? 'Pelao' : 'Usuario';
                        text += `${role}: "${msg.content}"\n`;
                    });
                    text += '\n';
                }
            });
        }
    });

    // Edge cases - limitados en fine-tune
    if (edgeCases.length > 0) {
        text += `CASOS ESPECIALES:\n`;
        edgeCases.slice(0, 3).forEach(ec => {
            text += `[${ec.context}] → ${ec.expected_behavior || ''}\n`;
        });
    }

    return text;
}

function buildProhibitions(lexicon) {
    const prohibitions = lexicon.prohibitions || {};

    let text = '';

    text += `\n## PROHIBICIONES (CRÍTICO)\n\n`;

    text += `PALABRAS QUE NUNCA USA:\n`;
    if (prohibitions.never_uses) {
        prohibitions.never_uses.forEach(item => {
            if (typeof item === 'object') {
                text += `❌ NUNCA digas "${item.word}" - ${item.reason || ''}\n`;
                text += `   ✓ En su lugar: "${item.correct_alternative || ''}"\n`;
            }
        });
    }

    if (prohibitions.rarely_uses && prohibitions.rarely_uses.length > 0) {
        text += `\nPALABRAS QUE USA MUY POCO:\n`;
        prohibitions.rarely_uses.forEach(item => {
            if (typeof item === 'object') {
                text += `⚠️ "${item.word}": ${item.when_used || ''} (${item.frequency || 'muy poco'})\n`;
            }
        });
    }

    if (prohibitions.not_his_style && prohibitions.not_his_style.length > 0) {
        text += `\nPATRONES QUE NO SON SU ESTILO:\n`;
        prohibitions.not_his_style.forEach(item => {
            if (typeof item === 'object') {
                text += `❌ ${item.pattern}\n`;
                text += `   Razón: ${item.reason || ''}\n`;
                text += `   ✓ Correcto: ${item.correct_alternative || ''}\n`;
            }
        });
    }

    return text;
}

// ══════════════════════════════════════════════════════
// BUILDERS PARA CORE-SIMA-ORGAN.YAML (Fase 3 - COMPLETO)
// ══════════════════════════════════════════════════════


function buildPsiOrganConfig(psiOrgan) {
    if (!psiOrgan) {
        return 'Sin configuración de Ψ-Organ cargada.';
    }

    const soma = psiOrgan.soma || {};
    const perception = psiOrgan.perception || {};
    const modulators = psiOrgan.modulators || {};
    const emotions = psiOrgan.emotion_patterns || {};
    const defense = psiOrgan.defense_mechanisms || {};
    const tolerances = psiOrgan.personal_tolerances || {};
    const behavior = psiOrgan.conversational_behavior || {};
    const thresholds = psiOrgan.activation_thresholds || {};

    let text = '';

    // SOMA - Niveles iniciales
    text += `## SISTEMA HOMEOSTÁTICO (SOMA)\n\n`;

    if (soma.initial_levels) {
        text += `NIVELES INICIALES DE TANQUES:\n`;
        Object.entries(soma.initial_levels).forEach(([key, value]) => {
            text += `- ${key}: ${value}/100\n`;
        });
    }

    // Configuración de cada tanque
    ['energia', 'integridad', 'afiliacion', 'certeza', 'competencia'].forEach(tank => {
        if (soma[tank]) {
            const t = soma[tank];
            text += `\n${tank.toUpperCase()}:\n`;
            text += `  Setpoint: ${t.setpoint || 70}\n`;
            text += `  Decay rate: ${t.decay_rate || 0.2}\n`;
            text += `  Umbral crítico: ${t.critical_threshold || 30}\n`;
        }
    });

    if (perception.stimulus_taxonomy) {
        text += `\n## SISTEMA DE PERCEPCIÓN\n\n`;

        text += `Umbral de sensibilidad: ${perception.sensitivity_threshold || 0.35}\n\n`;

        text += `TAXONOMÍA DE ESTÍMULOS:\n`;
        Object.entries(perception.stimulus_taxonomy).forEach(([type, config]) => {
            if (config && config.valence) {
                text += `\n[${type}] (${config.valence}, intensidad: ${config.intensity || 0.5})\n`;
                text += `  Tanques afectados: ${(config.affected_tanks || []).join(', ')}\n`;
                if (config.keywords && config.keywords.length > 0) {
                    text += `  Keywords: ${config.keywords.slice(0, 10).join(', ')}${config.keywords.length > 10 ? '...' : ''}\n`;
                }
            }
        });
    }

    if (modulators.arousal) {
        text += `\n## MODULADORES EMOCIONALES\n\n`;

        const ar = modulators.arousal;
        text += `AROUSAL:\n`;
        text += `  Baseline: ${ar.baseline || 40}\n`;
        text += `  Umbrales: bajo=${ar.thresholds?.low || 25}, medio=${ar.thresholds?.medium || 45}, alto=${ar.thresholds?.high || 65}, crítico=${ar.thresholds?.critical || 80}\n`;

        if (ar.context_modifiers) {
            text += `  Modificadores de contexto:\n`;
            Object.entries(ar.context_modifiers).forEach(([ctx, mod]) => {
                text += `    - ${ctx}: ${mod > 0 ? '+' : ''}${mod}\n`;
            });
        }
    }

    // RESOLUCIÓN
    if (modulators.resolution?.levels) {
        text += `\nRESOLUCIÓN (tokens según arousal):\n`;
        Object.entries(modulators.resolution.levels).forEach(([level, config]) => {
            text += `  ${level}: ${config.description || ''} (max ${config.max_tokens || 100} tokens)\n`;
        });
    }

    // PATRONES EMOCIONALES
    text += `\n## PATRONES EMOCIONALES\n\n`;

    Object.entries(emotions).forEach(([emotion, config]) => {
        if (config && config.prompt_modifier) {
            text += `[${emotion.toUpperCase()}]\n`;
            text += `${config.prompt_modifier}\n`;
            if (config.behavioral_notes) {
                text += `Notas: ${config.behavioral_notes.replace(/\n/g, ' ')}\n`;
            }
            text += '\n';
        }
    });

    // MECANISMOS DE DEFENSA
    text += `## MECANISMOS DE DEFENSA\n\n`;

    text += `Mecanismo primario: ${defense.primary || 'evasión'}\n`;
    text += `Mecanismo secundario: ${defense.secondary || 'deflección'}\n\n`;

    if (defense.stress_responses) {
        text += `RESPUESTAS AL ESTRÉS:\n`;
        Object.entries(defense.stress_responses).forEach(([key, config]) => {
            if (config) {
                text += `\n${key} (umbral: ${config.threshold || 30}):\n`;
                text += `  Acción: ${config.action || ''}\n`;
                if (config.prompt_addition) {
                    text += `  ${config.prompt_addition.trim()}\n`;
                }
            }
        });
    }

    if (defense.taboo_responses) {
        text += `\nRESPUESTAS A TEMAS TABÚ:\n`;
        Object.entries(defense.taboo_responses).forEach(([topic, config]) => {
            if (config) {
                text += `\n${topic.toUpperCase()}:\n`;
                text += `  ${config.prompt_addition || ''}\n`;
            }
        });
    }

    // TOLERANCIAS PERSONALES
    text += `\n## TOLERANCIAS PERSONALES\n\n`;

    text += `- Tolerancia a insultos (amigos): ${tolerances.insult_tolerance_friends || 0.75}\n`;
    text += `- Tolerancia a insultos (desconocidos): ${tolerances.insult_tolerance_strangers || 0.45}\n`;
    text += `- Sensibilidad a halagos: ${tolerances.affection_sensitivity || 0.65}\n`;
    text += `- Tolerancia a ambigüedad: ${tolerances.ambiguity_tolerance || 0.35} (baja, no le gusta no saber)\n`;
    text += `- Fatiga social: ${tolerances.social_fatigue_rate || 1.3} (se cansa rápido)\n`;
    text += `- Evasión de responsabilidad: ${tolerances.responsibility_avoidance || 0.8} (muy alta)\n`;
    text += `- Búsqueda de validación: ${tolerances.validation_seeking || 0.7} (alta)\n`;

    // COMPORTAMIENTO CONVERSACIONAL
    if (behavior.multi_message) {
        text += `\nCONFIGURACIÓN CONVERSACIONAL:\n`;
        text += `- Mensajes múltiples: ${behavior.multi_message.enabled ? 'SÍ' : 'NO'}\n`;
        text += `- Probabilidad: ${behavior.multi_message.probability || 0.6}\n`;
        text += `- Máximo consecutivo: ${behavior.multi_message.max_consecutive || 4}\n`;
    }

    if (behavior.question_deflection) {
        text += `- Probabilidad de devolver pregunta: ${behavior.question_deflection.probability || 0.4}\n`;
        text += `- Frases para devolver: ${(behavior.question_deflection.phrases || []).join(', ')}\n`;
    }

    // UMBRALES DE ACTIVACIÓN
    if (Object.keys(thresholds).length > 0) {
        text += `\nUMBRALES DE ACTIVACIÓN EMOCIONAL:\n`;
        Object.entries(thresholds).forEach(([emotion, threshold]) => {
            const difficulty = threshold > 0.6 ? 'difícil' : threshold > 0.4 ? 'medio' : 'fácil';
            text += `- ${emotion}: ${threshold} (${difficulty} de activar)\n`;
        });
    }

    return text;
}

// ═══════════════════════════════════════════════════════════════════
// ESTADO DINÁMICO
// ═══════════════════════════════════════════════════════════════════


function buildCurrentState(psiState) {
    if (!psiState) {
        return `
<vital_signs>
    <energia>75</energia>
    <integridad>80</integridad>
    <afiliacion>70</afiliacion>
    <certeza>75</certeza>
    <competencia>70</competencia>
</vital_signs>
<emotional_state>neutral</emotional_state>
<arousal>50</arousal>
<mode>normal</mode>
`;
    }

    const tanks = psiState.somaState?.tanks || {};

    return `
<vital_signs>
    <energia>${tanks.energia?.toFixed(0) || 75}</energia>
    <integridad>${tanks.integridad?.toFixed(0) || 80}</integridad>
    <afiliacion>${tanks.afiliacion?.toFixed(0) || 70}</afiliacion>
    <certeza>${tanks.certeza?.toFixed(0) || 75}</certeza>
    <competencia>${tanks.competencia?.toFixed(0) || 70}</competencia>
</vital_signs>
<emotional_state>${psiState.emotion || 'neutral'}</emotional_state>
<arousal>${psiState.arousal?.toFixed(0) || 50}</arousal>
<mode>${psiState.mode || 'normal'}</mode>
${psiState.dynamicPrompt ? `<context>${psiState.dynamicPrompt}</context>` : ''}
`;
}

/**
 * Construye contexto para usuario conocido
 */
function buildUserContext(cassette, userName) {
    const knownUsers = cassette.engram.context?.known_users || [];
    const user = knownUsers.find(u =>
        u.discord_name?.toLowerCase() === userName?.toLowerCase() ||
        u.real_name?.toLowerCase() === userName?.toLowerCase() ||
        u.nickname?.toLowerCase() === userName?.toLowerCase()
    );

    if (!user) return '';

    return `
<known_user>
El usuario "${userName}" es ${user.relationship?.type || 'conocido tuyo'}.
${user.relationship?.context || ''}
Trátalo con tono ${user.treatment?.tone || 'casual'}.
${user.treatment?.typical_greeting ? `Saludo típico: "${user.treatment.typical_greeting}"` : ''}
</known_user>
`;
}

/**
 * Construye la percepción ambiental completa
 * Combina Zeitgeist (atmósfera emocional) + WorldSimulator (estímulos sensoriales)
 * Ahora es ASYNC para soportar Weather API y LLM
 */
async function buildAmbientPerception() {
    try {
        // Obtener snapshot del mundo simulado (async para Weather/LLM)
        const snapshot = await worldSimulator.generateSnapshot();

        // Si hay contexto de percepciones sensoriales, usarlo
        if (snapshot && snapshot.promptContext) {
            return snapshot.promptContext;
        }
    } catch (error) {
        console.warn('[buildAmbientPerception] Error:', error.message);
    }

    // Fallback al Zeitgeist básico
    const ambient = zeitgeist.getAmbientState();
    if (ambient.active && ambient.promptContext) {
        return ambient.promptContext;
    }

    return '[Día normal - sin percepciones ambientales especiales]';
}

/**
 * Cache para percepciones (evita múltiples llamadas async)
 */
let _cachedAmbientPerception = null;
let _cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function getCachedAmbientPerception() {
    const now = Date.now();
    if (_cachedAmbientPerception && (now - _cacheTimestamp) < CACHE_TTL) {
        return _cachedAmbientPerception;
    }

    _cachedAmbientPerception = await buildAmbientPerception();
    _cacheTimestamp = now;
    return _cachedAmbientPerception;
}

module.exports = {
    buildSystemPrompt,
    buildUserContext,
    getCachedAmbientPerception  // Export para uso externo si es necesario
};
