require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { WorldSimulator } = require('../core/organo-sima/umwelt/worldSimulator');

async function main() {
    // Buffer para guardar el log
    let outputBuffer = '';
    function log(msg = '') {
        const cleanMsg = cleanString(msg);
        console.log(cleanMsg);
        outputBuffer += cleanMsg + '\n';
    }

    function cleanString(str) {
        if (!str) return '';
        // Normalizar saltos de línea y eliminar caracteres de control
        // \x1B es ESC. Lo eliminamos globalmente para evitar secuencias ANSI rotas.
        return str
            .replace(/\r\n/g, '\n') // Windows -> Unix
            .replace(/[\r\x0B\x0C]/g, '') // Eliminar CR y otros
            .replace(/\x1B/g, '') // Eliminar ESC (radical)
            .replace(/[\x00-\x09\x0E-\x1F\x7F]/g, ''); // Otros control chars
    }

    log('\n╔════════════════════════════════════════════════════════════════╗');
    log('║           UMWELT - CONTEXTO DEL MUNDO                          ║');
    log('╚════════════════════════════════════════════════════════════════╝\n');

    const worldSimulator = new WorldSimulator();

    try {
        const context = await worldSimulator.getWorldContext();

        // ============================================================
        // BLOQUE XML FINAL (Lo que recibe promptBuilder.js)
        // ============================================================
        log('┌────────────────────────────────────────────────────────────────┐');
        log('│  XML INYECTADO EN PROMPT (Simulación)                          │');
        log('└────────────────────────────────────────────────────────────────┘\n');

        const xmlBlock = `
<world_context>
${cleanString(context.promptContext)}

<phenomenological_narrative>
${cleanString(context.narrative) || 'Sin narrativa disponible'}
</phenomenological_narrative>
</world_context>`;

        log(xmlBlock);
        log('\n');

        // ============================================================
        // PHYSIOLOGICAL IMPACT DESGLOSADO
        // ============================================================
        log('┌────────────────────────────────────────────────────────────────┐');
        log('│  PHYSIOLOGICAL IMPACT (Impacto Corporal)                       │');
        log('└────────────────────────────────────────────────────────────────┘\n');

        const phys = context.physiologicalImpact;

        // Presión Circadiana
        log('CIRCADIAN PRESSURE:');
        log(`  Level: ${phys.circadian_pressure.level}`);
        log(`  Desc:  ${phys.circadian_pressure.description}\n`);

        // Confort Térmico
        log('THERMAL COMFORT:');
        log(`  Comfort: ${phys.thermal_comfort.comfort}`);
        log(`  Desc:    ${phys.thermal_comfort.description}`);
        if (phys.thermal_comfort.affordance) {
            log(`  Action:  ${phys.thermal_comfort.affordance}`);
        }
        log('');

        // Drenaje de Energía
        log('ENERGY DRAIN:');
        log(`  Level:  ${phys.energy_drain.level}`);
        log(`  Desc:   ${phys.energy_drain.description}`);
        log(`  Impact: ${phys.energy_drain.impact}\n`);

        // Affordances Sociales
        log('SOCIAL AFFORDANCES:');
        if (phys.social_affordances.length === 0) {
            log('  (ninguna)\n');
        } else {
            phys.social_affordances.forEach(aff => {
                if (aff.action) {
                    log(`  + ${aff.action} (${aff.availability})`);
                    log(`    -> ${aff.reason}`);
                } else if (aff.constraint) {
                    log(`  - ${aff.constraint}`);
                    log(`    -> ${aff.reason}`);
                }
            });
            log('');
        }

        // Nivel de Arousal
        log('AROUSAL MODULATION:');
        log(`  Level: ${phys.arousal_modulation}/100`);

        if (phys.arousal_modulation < 30) {
            log('  Estado: MUY BAJO - Letargo, respuestas lentas');
        } else if (phys.arousal_modulation < 50) {
            log('  Estado: BAJO-MEDIO - Relajado, poco reactivo');
        } else if (phys.arousal_modulation < 70) {
            log('  Estado: MEDIO-ALTO - Alerta, responsivo');
        } else {
            log('  Estado: MUY ALTO - Tenso, irritable, hiperactivo');
        }
        log('');

        // ============================================================
        // DATOS BÁSICOS
        // ============================================================
        log('┌────────────────────────────────────────────────────────────────┐');
        log('│  DATOS BÁSICOS                                                 │');
        log('└────────────────────────────────────────────────────────────────┘\n');

        log(`Ubicación:      ${context.location.address}`);
        log(`Tipo:           ${context.apartment.type}`);
        log(`Tamaño:         ${context.apartment.size}`);

        if (context.weather) {
            log(`\nTemperatura:    ${context.weather.temperature}`);
            log(`Condición:      ${context.weather.condition}`);
            log(`Sensación:      ${context.weather.feel}`);
        }

        log(`\nRutina:         ${context.routine?.activity || 'N/A'}`);
        log(`Contexto:       ${context.routine?.context || 'N/A'}`);

        if (context.zeitgeist?.eventName) {
            log(`\nEvento:         ${context.zeitgeist.eventName}`);
            if (context.zeitgeist.symbols) {
                log(`Símbolos:       ${context.zeitgeist.symbols.join(', ')}`);
            }
            if (context.zeitgeist.atmosphere) {
                log(`Atmósfera:      ${context.zeitgeist.atmosphere.feeling}`);
            }
        }

        log('\n');

        // ============================================================
        // GUARDAR A ARCHIVO
        // ============================================================
        const trashDir = path.join(__dirname, 'promptconsole');
        if (!fs.existsSync(trashDir)) {
            fs.mkdirSync(trashDir, { recursive: true });
        }

        const existingFiles = fs.readdirSync(trashDir)
            .filter(f => f.startsWith('UmweltPrompt') && f.endsWith('.txt'));
        const nextNumber = existingFiles.length + 1;

        const fileName = `UmweltPrompt${nextNumber}.txt`;
        const outputPath = path.join(trashDir, fileName);
        fs.writeFileSync(outputPath, outputBuffer, 'utf8');

        console.log(`  ✅ Log guardado → scripts/promptconsole/${fileName}`);
        console.log('');

    } catch (error) {
        console.error('ERROR generando contexto:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
