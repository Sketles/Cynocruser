#!/usr/bin/env node
// ╔════════════════════════════════════════════════════════════════╗
// ║  BOOTSTRAP CASSETTES - Descarga cassettes desde Google Drive   ║
// ╚════════════════════════════════════════════════════════════════╝

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración - ID del archivo en Google Drive
const DRIVE_FILE_ID = process.env.CASSETTE_DRIVE_ID || '1dXFbKbAHmzsKAzF4X0ECkygclsFZBBJu';
const CASSETTES_DIR = path.join(__dirname, '../core/cassettes');
const ZIP_PATH = path.join(__dirname, '../temp-cassettes.zip');

async function downloadFromDrive(fileId, destPath) {
    console.log(`📥 Descargando cassettes desde Drive...`);
    console.log(`   ID: ${fileId}`);

    // Usar curl con la cookie de confirmación para archivos grandes
    // Este método funciona para archivos públicos en Drive
    const curlCmd = `curl -L -o "${destPath}" "https://drive.google.com/uc?export=download&id=${fileId}&confirm=t"`;

    try {
        execSync(curlCmd, { stdio: 'inherit' });

        // Verificar que el archivo descargado sea un ZIP válido
        const fileBuffer = fs.readFileSync(destPath);
        const isZip = fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4B; // PK signature

        if (!isZip) {
            console.log('⚠️  El archivo no parece ser un ZIP, intentando método alternativo...');
            // Método alternativo para archivos que requieren confirmación
            const altCmd = `curl -L -o "${destPath}" "https://drive.usercontent.google.com/download?id=${fileId}&confirm=xxx"`;
            execSync(altCmd, { stdio: 'inherit' });
        }

        console.log(`✅ Descarga completada`);
    } catch (error) {
        console.error(`❌ Error descargando:`, error.message);
        throw error;
    }
}

async function extractZip(zipPath, destDir) {
    console.log(`📦 Extrayendo cassettes...`);

    // Crear directorio destino
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    try {
        execSync(`unzip -o "${zipPath}" -d "${destDir}"`, { stdio: 'inherit' });
        console.log(`✅ Cassettes extraídos en: ${destDir}`);
    } catch (error) {
        console.error(`❌ Error extrayendo ZIP:`, error.message);
        throw error;
    }
}

async function main() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  🎵 BOOTSTRAP CASSETTES');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Verificar si ya existen cassettes
    const pelaoPath = path.join(CASSETTES_DIR, 'pelaosniper');
    if (fs.existsSync(pelaoPath) && fs.readdirSync(pelaoPath).length > 0) {
        console.log('✅ Cassettes ya existen, saltando descarga.\n');
        return;
    }

    // Verificar configuración
    if (!DRIVE_FILE_ID) {
        console.error('❌ CASSETTE_DRIVE_ID no configurado');
        process.exit(1);
    }

    try {
        await downloadFromDrive(DRIVE_FILE_ID, ZIP_PATH);
        await extractZip(ZIP_PATH, CASSETTES_DIR);

        // Limpiar ZIP
        if (fs.existsSync(ZIP_PATH)) {
            fs.unlinkSync(ZIP_PATH);
        }

        console.log('\n✅ Bootstrap completado!\n');

    } catch (error) {
        console.error('❌ Error en bootstrap:', error.message);
        process.exit(1);
    }
}

main();
