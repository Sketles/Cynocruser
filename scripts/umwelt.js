#!/usr/bin/env node
// ╔════════════════════════════════════════════════════════════════╗
// ║  NPM RUN PROMPT:UMWELT - Visualizador del Mundo                ║
// ║                                                                ║
// ║  Muestra SOLO el contexto del mundo y percepciones             ║
// ║  Guarda en scripts/promptconsole/UmweltPrompt{n}.txt           ║
// ╚════════════════════════════════════════════════════════════════╝

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { WorldSimulator } = require('../core/organo-sima/umwelt/worldSimulator');

async function main() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║           UMWELT - CONTEXTO DEL MUNDO Y PERCEPCIONES           ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Inicializar WorldSimulator
    const worldSimulator = new WorldSimulator();

    // Obtener datos
    const context = worldSimulator.getWorldContext();
    const snapshot = await worldSimulator.generateSnapshot();

    // ═══════════════════════════════════════════════════════════════════
    // 1. WORLD_CONTEXT (Datos duros: Fecha, Hora, Ubicación)
    // ═══════════════════════════════════════════════════════════════════
    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│  <world_context> - DATOS ESPACIO-TEMPORALES                    │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    console.log(context.promptContext);
    console.log('');

    // ═══════════════════════════════════════════════════════════════════
    // 2. AMBIENT_PERCEPTION (Sensorial + Clima + Zeitgeist)
    // ═══════════════════════════════════════════════════════════════════
    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│  <ambient_perception> - PERCEPCIONES Y CLIMA                  │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    console.log(snapshot.promptContext);
    console.log('');

    // ═══════════════════════════════════════════════════════════════════
    // 3. DETALLES TÉCNICOS (Para debugging)
    // ═══════════════════════════════════════════════════════════════════
    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│  DETALLES TÉCNICOS                                             │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    console.log(`📡 API Clima:      Open-Meteo (Gratis)`);
    if (snapshot.weather) {
        console.log(`🌡️  Temp Real:     ${snapshot.weather.temperature}°C`);
        console.log(`🌥️  Condición:     ${snapshot.weather.condition}`);
        console.log(`😓 Efecto:        ${snapshot.weather.effect?.description || 'Ninguno'}`);
    } else {
        console.log(`⚠️  Clima:         No disponible (o fallback)`);
    }

    console.log(`📅 Evento:        ${snapshot.context.event}`);
    console.log(`🧠 Neurosímbolos: [${snapshot.neurosymbols.join(', ')}]`);
    console.log(`⏰ Periodo:       ${snapshot.context.timeOfDay} (${snapshot.context.dayOfWeek})`);

    // Guardar log
    const promptDir = path.join(__dirname, 'promptconsole');
    if (!fs.existsSync(promptDir)) fs.mkdirSync(promptDir, { recursive: true });

    const files = fs.readdirSync(promptDir);
    const umweltFiles = files.filter(f => f.startsWith('UmweltPrompt') && f.endsWith('.txt'));
    const nextNum = umweltFiles.length + 1;
    const logPath = path.join(promptDir, `UmweltPrompt${nextNum}.txt`);

    const logContent = `
=== UMWELT SNAPSHOT ===
Fecha: ${new Date().toISOString()}

[WORLD CONTEXT]
${context.promptContext}

[AMBIENT PERCEPTION]
${snapshot.promptContext}

[METADATA]
Event: ${snapshot.context.event}
Symbols: ${snapshot.neurosymbols.join(', ')}
Weather: ${JSON.stringify(snapshot.weather)}
`;

    fs.writeFileSync(logPath, logContent);
    console.log(`\n  ✅ Log guardado → scripts/promptconsole/UmweltPrompt${nextNum}.txt\n`);
}

main().catch(console.error);
