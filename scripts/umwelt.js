require('dotenv').config();
const { WorldSimulator } = require('../core/organo-sima/umwelt/worldSimulator');

async function main() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║           UMWELT - CONTEXTO DEL MUNDO                          ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const worldSimulator = new WorldSimulator();

    try {
        const context = await worldSimulator.getWorldContext();

        // ============================================================
        // PROMPT YAML (Lo que va a la IA)
        // ============================================================
        console.log(context.promptContext);
        console.log('\n');

        // ============================================================
        // NARRATIVA GENERADA (Mini-IA)
        // ============================================================
        if (context.narrative) {
            console.log('┌────────────────────────────────────────────────────────────────┐');
            console.log('│  NARRATIVA FENOMENOLÓGICA (generada por IA)                    │');
            console.log('└────────────────────────────────────────────────────────────────┘\n');
            console.log(context.narrative);
            console.log('\n');
        }

        // ============================================================
        // PHYSIOLOGICAL IMPACT DESGLOSADO
        // ============================================================
        console.log('┌────────────────────────────────────────────────────────────────┐');
        console.log('│  PHYSIOLOGICAL IMPACT (Impacto Corporal)                       │');
        console.log('└────────────────────────────────────────────────────────────────┘\n');

        const phys = context.physiologicalImpact;

        // Presión Circadiana
        console.log('CIRCADIAN PRESSURE:');
        console.log(`  Level: ${phys.circadian_pressure.level}`);
        console.log(`  Desc:  ${phys.circadian_pressure.description}\n`);

        // Confort Térmico
        console.log('THERMAL COMFORT:');
        console.log(`  Comfort: ${phys.thermal_comfort.comfort}`);
        console.log(`  Desc:    ${phys.thermal_comfort.description}`);
        if (phys.thermal_comfort.affordance) {
            console.log(`  Action:  ${phys.thermal_comfort.affordance}`);
        }
        console.log('');

        // Drenaje de Energía
        console.log('ENERGY DRAIN:');
        console.log(`  Level:  ${phys.energy_drain.level}`);
        console.log(`  Desc:   ${phys.energy_drain.description}`);
        console.log(`  Impact: ${phys.energy_drain.impact}\n`);

        // Affordances Sociales
        console.log('SOCIAL AFFORDANCES:');
        if (phys.social_affordances.length === 0) {
            console.log('  (ninguna)\n');
        } else {
            phys.social_affordances.forEach(aff => {
                if (aff.action) {
                    console.log(`  + ${aff.action} (${aff.availability})`);
                    console.log(`    -> ${aff.reason}`);
                } else if (aff.constraint) {
                    console.log(`  - ${aff.constraint}`);
                    console.log(`    -> ${aff.reason}`);
                }
            });
            console.log('');
        }

        // Nivel de Arousal
        console.log('AROUSAL MODULATION:');
        console.log(`  Level: ${phys.arousal_modulation}/100`);

        if (phys.arousal_modulation < 30) {
            console.log('  Estado: MUY BAJO - Letargo, respuestas lentas');
        } else if (phys.arousal_modulation < 50) {
            console.log('  Estado: BAJO-MEDIO - Relajado, poco reactivo');
        } else if (phys.arousal_modulation < 70) {
            console.log('  Estado: MEDIO-ALTO - Alerta, responsivo');
        } else {
            console.log('  Estado: MUY ALTO - Tenso, irritable, hiperactivo');
        }
        console.log('');

        // ============================================================
        // DATOS BÁSICOS
        // ============================================================
        console.log('┌────────────────────────────────────────────────────────────────┐');
        console.log('│  DATOS BÁSICOS                                                 │');
        console.log('└────────────────────────────────────────────────────────────────┘\n');

        console.log(`Ubicación:      ${context.location.address}`);
        console.log(`Tipo:           ${context.apartment.type}`);
        console.log(`Tamaño:         ${context.apartment.size}`);

        if (context.weather) {
            console.log(`\nTemperatura:    ${context.weather.temperature}`);
            console.log(`Condición:      ${context.weather.condition}`);
            console.log(`Sensación:      ${context.weather.feel}`);
        }

        console.log(`\nRutina:         ${context.routine?.activity || 'N/A'}`);
        console.log(`Contexto:       ${context.routine?.context || 'N/A'}`);

        if (context.zeitgeist?.eventName) {
            console.log(`\nEvento:         ${context.zeitgeist.eventName}`);
            if (context.zeitgeist.symbols) {
                console.log(`Símbolos:       ${context.zeitgeist.symbols.join(', ')}`);
            }
            if (context.zeitgeist.atmosphere) {
                console.log(`Atmósfera:      ${context.zeitgeist.atmosphere.feeling}`);
            }
        }

        console.log('\n');

    } catch (error) {
        console.error('ERROR generando contexto:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
