#!/usr/bin/env node
// ╔════════════════════════════════════════════════════════════════╗
// ║  BOOTSTRAP CASSETTES - Descarga cassettes desde Google Drive   ║
// ╚════════════════════════════════════════════════════════════════╝

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Configuración - ID del archivo en Google Drive
// Para obtener el ID: click derecho en el archivo → "Obtener enlace" → extraer ID de la URL
// Ejemplo: https://drive.google.com/file/d/ESTE_ES_EL_ID/view
const DRIVE_FILE_ID = process.env.CASSETTE_DRIVE_ID || '1dXFbKbAHmzsKAzF4X0ECkygclsFZBBJu';
const CASSETTES_DIR = path.join(__dirname, '../core/cassettes');
const ZIP_PATH = path.join(__dirname, '../temp-cassettes.zip');

async function downloadFromDrive(fileId, destPath) {
    return new Promise((resolve, reject) => {
        // URL de descarga directa de Google Drive
        const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

        console.log(`📥 Descargando cassettes desde Drive...`);
        console.log(`   ID: ${fileId}`);

        const file = fs.createWriteStream(destPath);

        https.get(url, (response) => {
            // Manejar redirect (Google Drive hace redirect para archivos grandes)
            if (response.statusCode === 302 || response.statusCode === 301) {
                https.get(response.headers.location, (res) => {
                    res.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                }).on('error', reject);
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }
        }).on('error', reject);
    });
}

async function extractZip(zipPath, destDir) {
    console.log(`📦 Extrayendo cassettes...`);

    // Crear directorio destino si no existe
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // Usar unzip del sistema (disponible en Railway/Linux)
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
        console.error('❌ CASSETTE_DRIVE_ID no configurado en variables de entorno');
        console.log('   Configura esta variable en Railway con el ID del archivo ZIP de Drive');
        console.log('   Ejemplo: 1ABC123xyz...\n');
        process.exit(1);
    }

    try {
        // Descargar ZIP
        await downloadFromDrive(DRIVE_FILE_ID, ZIP_PATH);

        // Extraer
        await extractZip(ZIP_PATH, CASSETTES_DIR);

        // Limpiar ZIP temporal
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
