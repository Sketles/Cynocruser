#!/usr/bin/env node
// ╔════════════════════════════════════════════════════════════════╗
// ║  NPM RUN PROMPT - Visualizador del System Prompt COMPLETO     ║
// ║                                                                ║
// ║  Muestra TODO lo que se envía al modelo de IA                  ║
// ║  Guarda en prompt-output.txt para ver completo                 ║
// ╚════════════════════════════════════════════════════════════════╝

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { loadCassette } = require('../core/data/cassette-loader');
const { buildSystemPrompt } = require('../core/data/prompt-builder');
const { PsiOrgan } = require('../core/organo-sima/index');
const cassetteSettings = require('../core/config/cassette-settings');

async function main() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║      📝 FULL PROMPT BUILDER → GUARDANDO LOG DE SYSTEM PROMPT   ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');

    // Cargar cassette
    const cassetteName = cassetteSettings.cassette;
    const cassette = loadCassette(cassetteName);

    // Inicializar PsiOrgan
    const psiOrgan = new PsiOrgan({
        cassette: cassette.psiOrgan
    });

    // Procesar un mensaje de prueba para obtener el estado
    const psiState = psiOrgan.process('Hola, mensaje de prueba', { userId: 'viewer' });

    // Construir el system prompt COMPLETO (ahora es async)
    const systemPrompt = await buildSystemPrompt(cassette, 'viewer', psiState);

    // Estadísticas
    const charCount = systemPrompt.length;
    const estimatedTokens = Math.ceil(charCount / 4);

    // Guardar a archivo en scripts/promptconsole con número correlativo
    const trashDir = path.join(__dirname, 'promptconsole');

    // Crear directorio si no existe
    if (!fs.existsSync(trashDir)) {
        fs.mkdirSync(trashDir, { recursive: true });
    }

    // Contar archivos existentes para número correlativo
    const existingFiles = fs.readdirSync(trashDir)
        .filter(f => f.startsWith('FullBuildPrompt') && f.endsWith('.txt'));
    const nextNumber = existingFiles.length + 1;

    const fileName = `FullBuildPrompt${nextNumber}.txt`;
    const outputPath = path.join(trashDir, fileName);
    fs.writeFileSync(outputPath, systemPrompt, 'utf8');
    console.log('');
    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│                        ESTADÍSTICAS                            │');
    console.log('├────────────────────────────────────────────────────────────────┤');
    console.log(`│  📼 Cassette:          ${cassetteName.padEnd(38)}  │`);
    console.log(`│  📊 Caracteres:        ${charCount.toLocaleString().padEnd(38)}  │`);
    console.log(`│  🎯 Tokens estimados:  ~${estimatedTokens.toLocaleString().padEnd(37)}  │`);
    console.log(`│  🧠 PsiOrgan:          ${(cassetteSettings.psiOrgan?.enabled ?? true ? 'Habilitado' : 'Deshabilitado').padEnd(38)}  │`);
    console.log('└────────────────────────────────────────────────────────────────┘');
    console.log('');
    console.log(`  ✅ Log guardado → scripts/promptconsole/${fileName}`);
    console.log('');
}

main().catch(console.error);
