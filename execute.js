#!/usr/bin/env node
// ╔════════════════════════════════════════════════════════════════════╗
// ║                    CYNOSURE - Ψ-ORGAN CLI                          ║
// ║                                                                    ║
// ║   Sistema de Personalidad Artificial con Ψ-Organ                   ║
// ║   Modo: Chat por terminal (texto)                                  ║
// ║                                                                    ║
// ║   Uso: node execute.js                                             ║
// ╚════════════════════════════════════════════════════════════════════╝

require('dotenv').config();
const readline = require('readline');

// ┌────────────────────────────────────────────────────────────────────┐
// │ MÓDULOS CORE                                                       │
// └────────────────────────────────────────────────────────────────────┘
const { loadCassette } = require('./core/data/cassette-loader');
const { buildSystemPrompt } = require('./core/data/prompt-builder');
const { PsiOrgan } = require('./core/organo-sima');
const { AIClient } = require('./core/services/ai-client');

// ┌────────────────────────────────────────────────────────────────────┐
// │ CONFIGURACIÓN                                                      │
// └────────────────────────────────────────────────────────────────────┘
const aiSettings = require('./core/config/ai-settings');
const cassetteSettings = require('./core/config/cassette-settings');
const CHARACTER_ID = cassetteSettings.cassette;

// ┌────────────────────────────────────────────────────────────────────┐
// │ ESTADO GLOBAL                                                      │
// └────────────────────────────────────────────────────────────────────┘
let cassette = null;
let psiOrgan = null;
let conversationHistory = [];
let aiClient = null;

// ┌────────────────────────────────────────────────────────────────────┐
// │ INICIALIZACIÓN                                                     │
// └────────────────────────────────────────────────────────────────────┘
async function initialize() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║              CYNOCRUSER - Ψ-ORGAN CLI                    ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  Provider: ${aiSettings.provider.padEnd(44)}           ║`);
    console.log(`║  Modelo:   ${aiSettings.model.padEnd(44)}              ║`);
    console.log(`║  Cassette: ${cassetteSettings.cassette.padEnd(44)}║`);
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');

    // Cargar cliente AI (usa configuración de src/config/ai-settings.js)
    aiClient = new AIClient();

    // Cargar cassette
    console.log('📼 Cargando cassette...');
    cassette = loadCassette(CHARACTER_ID);
    console.log(`   ✅ Engram: ${Object.keys(cassette.engram).length} secciones`);
    console.log(`   ✅ Lexicon: ${Object.keys(cassette.lexicon).length} secciones`);
    console.log(`   ✅ Psi-Organ: ${Object.keys(cassette.psiOrgan || {}).length} secciones`);

    // Inicializar Ψ-Organ
    console.log('🧠 Inicializando Ψ-Organ...');
    psiOrgan = new PsiOrgan({ cassette });
    console.log('   ✅ Soma, Perception, Ego, Memory cargados');

    console.log('');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`👤 Personaje: ${cassette.engram.identity?.name || 'AI'}`);
    console.log('💬 Escribe tu mensaje. Usa "salir" para terminar.');
    console.log('─────────────────────────────────────────────────────────');
    console.log('');
}

// ┌────────────────────────────────────────────────────────────────────┐
// │ GENERAR RESPUESTA CON AI CLIENT (Multi-Provider)                   │
// └────────────────────────────────────────────────────────────────────┘
async function generateResponse(userMessage, userId = 'cli-user') {
    // Procesar input con Ψ-Organ
    const psiState = psiOrgan.process(userMessage, { userId });

    // Construir system prompt
    const systemPrompt = buildSystemPrompt(cassette, userId, psiState);

    // DEBUG MODE: Muestra prompt completo y tokens cuando DEBUG=true
    const isDebug = process.env.DEBUG === 'true';

    if (isDebug) {
        console.log('\n═══════════════ SYSTEM PROMPT (DEBUG) ═══════════════');
        console.log(systemPrompt);  // Prompt COMPLETO
        console.log('═════════════════════════════════════════════════════════');
        console.log(`📊 Total caracteres: ${systemPrompt.length}`);
        console.log(`📊 Tokens estimados: ~${Math.ceil(systemPrompt.length / 4)}\n`);
    }

    // Agregar al historial (Formato OpenAI)
    conversationHistory.push({ role: 'user', content: userMessage });

    // Mantener historial corto
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }

    // Llamar al Cliente AI
    const aiText = await aiClient.generateResponse(
        conversationHistory,
        systemPrompt,
        {
            temperature: 0.9,
            topP: 0.95,
            maxOutputTokens: 150
        }
    );

    // Agregar respuesta al historial
    conversationHistory.push({ role: 'assistant', content: aiText });

    return aiText;
}

// ┌────────────────────────────────────────────────────────────────────┐
// │ INTERFAZ CLI                                                       │
// └────────────────────────────────────────────────────────────────────┘
async function startCLI() {
    await initialize();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });


    const prompt = () => {
        rl.question('Tú: ', async (input) => {
            const userInput = input.trim();

            if (!userInput) {
                prompt();
                return;
            }

            if (userInput.toLowerCase() === 'salir' || userInput.toLowerCase() === 'exit') {
                console.log('\n👋 ¡Hasta luego!\n');
                rl.close();
                process.exit(0);
            }

            if (userInput.toLowerCase() === 'estado') {
                const state = psiOrgan.soma.getState();
                console.log('\n🧠 Estado Ψ-Organ:');
                console.log(`   Energía: ${state.tanks.energia.toFixed(1)}`);
                console.log(`   Integridad: ${state.tanks.integridad.toFixed(1)}`);
                console.log(`   Afiliación: ${state.tanks.afiliacion.toFixed(1)}`);
                console.log(`   Certeza: ${state.tanks.certeza.toFixed(1)}`);
                console.log(`   Competencia: ${state.tanks.competencia.toFixed(1)}`);
                console.log('');
                prompt();
                return;
            }

            try {
                const response = await generateResponse(userInput);
                console.log(`\n🤖 ${cassette.engram.identity?.name || 'AI'}: ${response}\n`);
            } catch (error) {
                console.error(`\n❌ Error: ${error.message}\n`);
            }

            prompt();
        });
    };

    prompt();
}

// ┌────────────────────────────────────────────────────────────────────┐
// │ INICIAR                                                            │
// └────────────────────────────────────────────────────────────────────┘
startCLI().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
});
