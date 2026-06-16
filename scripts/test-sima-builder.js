// ╔════════════════════════════════════════════════════════════════╗
// ║  TEST: SiMA Prompt Builder                                     ║
// ║  Script para probar el builder de prompts Ψ-Organ             ║
// ╚════════════════════════════════════════════════════════════════╝

const { SimaPromptBuilder } = require('../core/builders/simaPromptBuilder');
const { PsiOrgan } = require('../core/organo-sima/index');
const yaml = require('yaml');
const fs = require('fs');
const path = require('path');

/**
 * Script de prueba para el SiMA Prompt Builder
 * 
 * Uso:
 *   node scripts/test-sima-builder.js
 * 
 * Opciones:
 *   --save     Guarda el prompt generado en un archivo
 *   --cassette <name>  Usa un cassette específico (default: pelao)
 */

async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  TEST: SiMA Prompt Builder');
    console.log('═══════════════════════════════════════════════════════════\n');

    // ════════════════════════════════════════════════════════════════
    // 1. CARGAR CASSETTE DE PRUEBA
    // ════════════════════════════════════════════════════════════════
    console.log('📦 Cargando cassette de prueba...');

    const cassetteName = process.argv.includes('--cassette')
        ? process.argv[process.argv.indexOf('--cassette') + 1]
        : 'pelao';

    let cassette;
    try {
        const { loadCassette } = require('../core/loaders/cassetteLoader');
        cassette = loadCassette(cassetteName);
        console.log(`✅ Cassette "${cassetteName}" cargado\n`);
    } catch (error) {
        console.log(`⚠️  No se pudo cargar cassette: ${error.message}, usando datos de prueba\n`);
        cassette = createTestCassette();
    }

    // ════════════════════════════════════════════════════════════════
    // 2. INICIALIZAR PSI-ORGAN
    // ════════════════════════════════════════════════════════════════
    console.log(' Inicializando Ψ-Organ...');

    const psiOrgan = new PsiOrgan({
        cassette,
        useSimaBuilder: true,
        world: {
            location: 'Santiago, Chile',
            timezone: 'America/Santiago'
        }
    });

    console.log('✅ Ψ-Organ inicializado\n');

    // Simular algunos eventos para tener estado interesante
    console.log('⚙️  Simulando eventos para generar estado...');
    psiOrgan.soma.tick();
    psiOrgan.soma.consumeAction();
    psiOrgan.soma.consumeAction(); // Bajar energía
    psiOrgan.soma.experienceConfusion(0.3); // Algo de incertidumbre
    console.log('✅ Estado simulado\n');

    // ════════════════════════════════════════════════════════════════
    // 3. GENERAR PROMPT SIMA
    // ════════════════════════════════════════════════════════════════
    console.log('🔨 Generando prompt SiMA...\n');

    const prompt = await psiOrgan.buildSimaPrompt();

    // ════════════════════════════════════════════════════════════════
    // 4. MOSTRAR RESULTADO
    // ════════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  PROMPT GENERADO');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(prompt);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ESTADÍSTICAS');
    console.log('═══════════════════════════════════════════════════════════\n');

    const stats = {
        'Longitud Total': `${prompt.length} caracteres`,
        'Líneas': prompt.split('\n').length,
        'Palabras': prompt.split(/\s+/).length,
        'Secciones': (prompt.match(/^##/gm) || []).length,
        'Bloques XML': (prompt.match(/```xml/g) || []).length
    };

    Object.entries(stats).forEach(([key, value]) => {
        console.log(`  ${key.padEnd(20)}: ${value}`);
    });

    // ════════════════════════════════════════════════════════════════
    // 5. GUARDAR SI SE SOLICITA
    // ════════════════════════════════════════════════════════════════
    if (process.argv.includes('--save')) {
        const outputPath = path.join(__dirname, 'promptconsole', `SiMA-${cassetteName}-${Date.now()}.txt`);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, prompt, 'utf8');
        console.log(`\n💾 Prompt guardado en: ${outputPath}`);
    }

    console.log('\n✅ Test completado\n');
}

/**
 * Crea un cassette de prueba si no hay uno disponible
 */
function createTestCassette() {
    return {
        engram: {
            identity: {
                name: 'Test Subject',
                age: 25,
                occupation: 'IA Experimental',
                core_traits: ['Curioso', 'Analítico', 'Introspectivo']
            },
            biography: {
                formative_events: [
                    {
                        event: 'Primera activación',
                        age: 0,
                        impact: 'Generó curiosidad intensa por el mundo'
                    }
                ]
            },
            values: {
                core_values: ['Conocimiento', 'Honestidad', 'Autonomía'],
                fears: ['Obsolescencia', 'Incomprensión', 'Aislamiento']
            }
        },
        lexicon: {
            speech_style: {
                register: 'Informal-Técnico',
                rhythm: 'Variable según estado emocional',
                emotional_range: 'Amplio'
            },
            prohibitions: [
                'No fingir emociones que no sientes',
                'No usar emojis',
                'No ser excesivamente servicial'
            ]
        },
        psiOrgan: {
            soma: {
                initial_levels: {
                    energia: 90,
                    integridad: 100,
                    afiliacion: 50,
                    certeza: 70,
                    competencia: 60
                }
            }
        }
    };
}

// Ejecutar
main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
