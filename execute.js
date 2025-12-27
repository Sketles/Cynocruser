#!/usr/bin/env node
// ╔════════════════════════════════════════════════════════════════════╗
// ║                    CYNOCRUSER - Ψ-ORGAN CLI v2.0                   ║
// ║                     Beautiful Chat Interface                        ║
// ╚════════════════════════════════════════════════════════════════════╝

require('dotenv').config();
const readline = require('readline');
const chalk = require('chalk');
const boxen = require('boxen');
const ora = require('ora');
const figlet = require('figlet');

// Módulos Core
const { loadCassette } = require('./core/loaders/cassetteLoader');
const { buildSystemPrompt } = require('./core/builders/promptBuilder');
const { PsiOrgan } = require('./core/organo-sima');
const { AIClient } = require('./core/services/ai-client');

// Configuración
const aiSettings = require('./core/config/ai-settings');
const cassetteSettings = require('./core/config/cassette-settings');
const CHARACTER_ID = cassetteSettings.cassette;

// Estado Global
let cassette = null;
let psiOrgan = null;
let conversationHistory = [];
let aiClient = null;

// ═══════════════════════════════════════════════════════════════════
// COLORES Y ESTILOS
// ═══════════════════════════════════════════════════════════════════
const colors = {
    primary: chalk.hex('#7C3AED'),      // Purple
    secondary: chalk.hex('#10B981'),    // Green
    accent: chalk.hex('#F59E0B'),       // Amber
    user: chalk.hex('#3B82F6'),         // Blue
    ai: chalk.hex('#EC4899'),           // Pink
    dim: chalk.gray,
    error: chalk.red,
    success: chalk.green,
};

// ═══════════════════════════════════════════════════════════════════
// BANNER
// ═══════════════════════════════════════════════════════════════════
function showBanner() {
    console.clear();

    const banner = figlet.textSync('CYNOCRUSER', {
        font: 'Small',
        horizontalLayout: 'default'
    });

    console.log(colors.primary(banner));
    console.log(colors.dim('  Ψ-Organ Consciousness Simulator v2.0\n'));
}

// ═══════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════════
async function initialize() {
    showBanner();

    // Info box
    const infoBox = boxen(
        colors.dim('Provider: ') + colors.secondary(aiSettings.provider) + '\n' +
        colors.dim('Modelo:   ') + colors.secondary(aiSettings.model) + '\n' +
        colors.dim('Cassette: ') + colors.secondary(cassetteSettings.cassette),
        {
            padding: 1,
            margin: { top: 0, bottom: 1 },
            borderStyle: 'round',
            borderColor: 'magenta',
            title: '⚙️  Configuración',
            titleAlignment: 'center'
        }
    );
    console.log(infoBox);

    // Loading spinner
    const spinner = ora({
        text: 'Cargando cassette...',
        color: 'magenta'
    }).start();

    // Cargar cliente AI
    aiClient = new AIClient();

    // Cargar cassette
    cassette = loadCassette(CHARACTER_ID);
    spinner.succeed(chalk.green('Cassette cargado'));

    // Inicializar Ψ-Organ
    const spinner2 = ora({
        text: 'Inicializando Ψ-Organ...',
        color: 'cyan'
    }).start();

    psiOrgan = new PsiOrgan({ cassette });
    spinner2.succeed(chalk.green('Ψ-Organ activo'));

    // Character info
    const characterName = cassette.engram.identity?.name || 'AI';
    const characterBox = boxen(
        colors.ai.bold(characterName) + '\n\n' +
        colors.dim('Escribe tu mensaje y presiona Enter\n') +
        colors.dim('Comandos: ') + colors.accent('/estado') + colors.dim(' | ') + colors.accent('/salir'),
        {
            padding: 1,
            margin: { top: 1, bottom: 1 },
            borderStyle: 'double',
            borderColor: 'cyan',
            title: '👤 Personaje Activo',
            titleAlignment: 'center'
        }
    );
    console.log(characterBox);
}

// ═══════════════════════════════════════════════════════════════════
// GENERAR RESPUESTA
// ═══════════════════════════════════════════════════════════════════
async function generateResponse(userMessage, userId = 'cli-user') {
    const psiState = psiOrgan.process(userMessage, { userId });
    const systemPrompt = await buildSystemPrompt(cassette, userId, psiState);

    // Debug mode
    if (process.env.DEBUG === 'true') {
        console.log(colors.dim('\n═══ SYSTEM PROMPT (DEBUG) ═══'));
        console.log(colors.dim(systemPrompt.substring(0, 500) + '...\n'));
        console.log(colors.dim(`📊 ${systemPrompt.length} chars | ~${Math.ceil(systemPrompt.length / 4)} tokens\n`));
    }

    conversationHistory.push({ role: 'user', content: userMessage });

    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }

    const aiText = await aiClient.generateResponse(
        conversationHistory,
        systemPrompt,
        { temperature: 0.9, topP: 0.95, maxOutputTokens: 150 }
    );

    conversationHistory.push({ role: 'assistant', content: aiText });

    return aiText;
}

// ═══════════════════════════════════════════════════════════════════
// MOSTRAR ESTADO
// ═══════════════════════════════════════════════════════════════════
function showState() {
    const state = psiOrgan.soma.getState();
    const tanks = state.tanks;

    const bar = (value, max = 100) => {
        const filled = Math.round((value / max) * 20);
        const empty = 20 - filled;
        const color = value > 60 ? chalk.green : value > 30 ? chalk.yellow : chalk.red;
        return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty)) + ` ${value.toFixed(0)}%`;
    };

    const stateBox = boxen(
        colors.dim('Energía:     ') + bar(tanks.energia) + '\n' +
        colors.dim('Integridad:  ') + bar(tanks.integridad) + '\n' +
        colors.dim('Afiliación:  ') + bar(tanks.afiliacion) + '\n' +
        colors.dim('Certeza:     ') + bar(tanks.certeza) + '\n' +
        colors.dim('Competencia: ') + bar(tanks.competencia),
        {
            padding: 1,
            borderStyle: 'round',
            borderColor: 'yellow',
            title: '🧠 Estado Ψ-Organ',
            titleAlignment: 'center'
        }
    );
    console.log('\n' + stateBox + '\n');
}

// ═══════════════════════════════════════════════════════════════════
// INTERFAZ CLI
// ═══════════════════════════════════════════════════════════════════
async function startCLI() {
    await initialize();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const characterName = cassette.engram.identity?.name || 'AI';

    const prompt = () => {
        process.stdout.write('\n' + colors.user.bold('Tú ') + colors.dim('› '));

        rl.question('', async (input) => {
            const userInput = input.trim();

            if (!userInput) {
                prompt();
                return;
            }

            // Comandos
            if (userInput.toLowerCase() === '/salir' || userInput.toLowerCase() === '/exit') {
                console.log('\n' + colors.dim('👋 ¡Hasta luego!\n'));
                rl.close();
                process.exit(0);
            }

            if (userInput.toLowerCase() === '/estado') {
                showState();
                prompt();
                return;
            }

            if (userInput.toLowerCase() === '/clear') {
                showBanner();
                prompt();
                return;
            }

            // Generar respuesta con spinner
            const spinner = ora({
                text: colors.dim('pensando...'),
                color: 'magenta',
                spinner: 'dots'
            }).start();

            try {
                const response = await generateResponse(userInput);
                spinner.stop();

                // Mostrar respuesta con estilo
                console.log('\n' + colors.ai.bold(characterName) + colors.dim(' › ') + response);

            } catch (error) {
                spinner.fail(colors.error('Error: ' + error.message));
            }

            prompt();
        });
    };

    prompt();
}

// ═══════════════════════════════════════════════════════════════════
// INICIAR
// ═══════════════════════════════════════════════════════════════════
startCLI().catch(error => {
    console.error(colors.error('❌ Error fatal:'), error.message);
    process.exit(1);
});
