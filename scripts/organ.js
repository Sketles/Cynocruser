#!/usr/bin/env node
// ╔════════════════════════════════════════════════════════════════╗
// ║  NPM RUN ORGAN - Visualizador de PsiOrgan                      ║
// ║                                                                ║
// ║  Muestra SOLO lo que PsiOrgan inyecta al prompt                ║
// ║  Guarda en scripts/promptconsole/OrganPrompt{n}.txt            ║
// ╚════════════════════════════════════════════════════════════════╝

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { loadCassette } = require('../core/loaders/cassetteLoader');
const { PsiOrgan } = require('../core/organo-sima/index');
const { Umwelt, WorldSimulator } = require('../core/organo-sima/umwelt/worldSimulator');
const cassetteSettings = require('../core/config/cassette-settings');

async function main() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║           Ψ-ORGAN - DATOS INYECTADOS AL PROMPT                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Cargar cassette
    const cassette = loadCassette(cassetteSettings.cassette);

    // Inicializar PsiOrgan
    const psiOrgan = new PsiOrgan({
        cassette: cassette.psiOrgan
    });

    // Inicializar Umwelt y WorldSimulator
    const umwelt = new Umwelt();
    const worldSimulator = new WorldSimulator();

    // Procesar mensaje de prueba
    const psiState = psiOrgan.process('Mensaje de prueba', { userId: 'viewer' });

    // Obtener estado completo
    const fullState = psiOrgan.getFullState();
    const worldContext = umwelt.getWorldContext();

    // Obtener percepciones del mundo (async)
    const snapshot = await worldSimulator.generateSnapshot();

    // ═══════════════════════════════════════════════════════════════════
    // 1. CURRENT_INTERNAL_STATE (Variables dinámicas)
    // ═══════════════════════════════════════════════════════════════════
    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│  <current_internal_state> - VARIABLES DINÁMICAS                │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    console.log('<current_internal_state>');
    console.log('<vital_signs>');
    console.log(`    <energia>${fullState.soma.tanks.energia.toFixed(0)}</energia>`);
    console.log(`    <integridad>${fullState.soma.tanks.integridad.toFixed(0)}</integridad>`);
    console.log(`    <afiliacion>${fullState.soma.tanks.afiliacion.toFixed(0)}</afiliacion>`);
    console.log(`    <certeza>${fullState.soma.tanks.certeza.toFixed(0)}</certeza>`);
    console.log(`    <competencia>${fullState.soma.tanks.competencia.toFixed(0)}</competencia>`);
    console.log('</vital_signs>');
    console.log(`<emotional_state>${psiState.state?.emotion || 'neutral'}</emotional_state>`);
    console.log(`<arousal>${psiState.state?.arousal || 50}</arousal>`);
    console.log(`<mode>${psiState.state?.mode || 'normal'}</mode>`);
    console.log('</current_internal_state>\n');

    // ═══════════════════════════════════════════════════════════════════
    // 2. WORLD_CONTEXT (Umwelt - Fecha/Hora/Ubicación)
    // ═══════════════════════════════════════════════════════════════════
    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│  <world_context> - UMWELT (Contexto del Mundo)                 │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    console.log('<world_context>');
    console.log(worldContext.promptContext);
    console.log('</world_context>\n');

    // ═══════════════════════════════════════════════════════════════════
    // 3. AMBIENT_PERCEPTION (Percepciones Sensoriales + Clima)
    // ═══════════════════════════════════════════════════════════════════
    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│  <ambient_perception> - PERCEPCIONES DEL ENTORNO              │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    console.log('<ambient_perception>');
    if (snapshot) {
        console.log(snapshot.promptContext);
        console.log('');
        console.log(`Evento detectado: ${snapshot.context.event}`);
        if (snapshot.weather) {
            console.log(`Clima real: ${snapshot.weather.temperature}°C, ${snapshot.weather.condition}`);
        }
        console.log(`Neurosímbolos: [${snapshot.neurosymbols?.join(', ') || 'ninguno'}]`);
    } else {
        console.log('[Sin percepciones disponibles]');
    }
    console.log('</ambient_perception>\n');

    // ═══════════════════════════════════════════════════════════════════
    // 3. RESUMEN
    // ═══════════════════════════════════════════════════════════════════
    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│  RESUMEN - Lo que PsiOrgan inyecta dinámicamente               │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    console.log(`Tanques:`);
    console.log(`  • Energía:     ${fullState.soma.tanks.energia.toFixed(1)}%`);
    console.log(`  • Integridad:  ${fullState.soma.tanks.integridad.toFixed(1)}%`);
    console.log(`  • Afiliación:  ${fullState.soma.tanks.afiliacion.toFixed(1)}%`);
    console.log(`  • Certeza:     ${fullState.soma.tanks.certeza.toFixed(1)}%`);
    console.log(`  • Competencia: ${fullState.soma.tanks.competencia.toFixed(1)}%`);
    console.log('');
    console.log(`Estado Emocional: ${psiState.state?.emotion || 'neutral'}`);
    console.log(`Arousal:          ${psiState.state?.arousal || 50}`);
    console.log(`Modo:             ${psiState.state?.mode || 'normal'}`);
    console.log('');
    console.log(`Necesidad dominante: ${fullState.soma.dominant.need} (déficit: ${fullState.soma.dominant.deficit.toFixed(1)})`);
    console.log(`Urgencia: ${fullState.soma.dominant.urgency}`);
    console.log('');
    console.log(`Fecha: ${worldContext.date.formatted}`);
    console.log(`Hora:  ${worldContext.time.formatted} (${worldContext.timeOfDay.period})`);
    console.log(`Ubicación: ${worldContext.location.description}`);

    // Guardar a archivo en scripts/promptconsole con número correlativo
    const promptDir = path.join(__dirname, 'promptconsole');

    // Crear directorio si no existe
    if (!fs.existsSync(promptDir)) {
        fs.mkdirSync(promptDir, { recursive: true });
    }

    // Contar archivos existentes para número correlativo
    const existingFiles = fs.readdirSync(promptDir)
        .filter(f => f.startsWith('OrganPrompt') && f.endsWith('.txt'));
    const nextNumber = existingFiles.length + 1;

    // Construir contenido del archivo
    const fileContent = `<current_internal_state>
<vital_signs>
    <energia>${fullState.soma.tanks.energia.toFixed(0)}</energia>
    <integridad>${fullState.soma.tanks.integridad.toFixed(0)}</integridad>
    <afiliacion>${fullState.soma.tanks.afiliacion.toFixed(0)}</afiliacion>
    <certeza>${fullState.soma.tanks.certeza.toFixed(0)}</certeza>
    <competencia>${fullState.soma.tanks.competencia.toFixed(0)}</competencia>
</vital_signs>
<emotional_state>${psiState.state?.emotion || 'neutral'}</emotional_state>
<arousal>${psiState.state?.arousal || 50}</arousal>
<mode>${psiState.state?.mode || 'normal'}</mode>
</current_internal_state>

<world_context>
${worldContext.promptContext}
</world_context>

--- RESUMEN ---
Tanques:
  • Energía:     ${fullState.soma.tanks.energia.toFixed(1)}%
  • Integridad:  ${fullState.soma.tanks.integridad.toFixed(1)}%
  • Afiliación:  ${fullState.soma.tanks.afiliacion.toFixed(1)}%
  • Certeza:     ${fullState.soma.tanks.certeza.toFixed(1)}%
  • Competencia: ${fullState.soma.tanks.competencia.toFixed(1)}%

Estado Emocional: ${psiState.state?.emotion || 'neutral'}
Arousal:          ${psiState.state?.arousal || 50}
Modo:             ${psiState.state?.mode || 'normal'}

Necesidad dominante: ${fullState.soma.dominant.need} (déficit: ${fullState.soma.dominant.deficit.toFixed(1)})
Urgencia: ${fullState.soma.dominant.urgency}

Fecha: ${worldContext.date.formatted}
Hora:  ${worldContext.time.formatted} (${worldContext.timeOfDay.period})
Ubicación: ${worldContext.location.description}
`;

    const fileName = `OrganPrompt${nextNumber}.txt`;
    const outputPath = path.join(promptDir, fileName);
    fs.writeFileSync(outputPath, fileContent, 'utf8');

    console.log('');
    console.log(`  ✅ Log guardado → scripts/promptconsole/${fileName}`);
    console.log('');
}

main().catch(console.error);
