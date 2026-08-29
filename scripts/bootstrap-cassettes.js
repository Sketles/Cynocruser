#!/usr/bin/env node
// Bootstrap Cassettes - 100% Node.js, sin dependencias del sistema

const fs = require('fs');
const path = require('path');
const https = require('https');
const AdmZip = require('adm-zip');

const DRIVE_FILE_ID = process.env.CASSETTE_DRIVE_ID || '1dXFbKbAHmzsKAzF4X0ECkygclsFZBBJu';
const CASSETTES_DIR = path.join(__dirname, '../core/cassettes');
const ZIP_PATH = path.join(__dirname, '../temp-cassettes.zip');

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);

        const request = (url) => {
            https.get(url, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    request(response.headers.location);
                    return;
                }
                response.pipe(file);
                file.on('finish', () => { file.close(); resolve(); });
            }).on('error', (err) => {
                fs.unlink(dest, () => { });
                reject(err);
            });
        };
        request(url);
    });
}

async function main() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  🎵 BOOTSTRAP CASSETTES');
    console.log('═══════════════════════════════════════════════════════════\n');

    const cassetteSettings = require('../core/config/cassette-settings');
    const activeCassettePath = path.join(CASSETTES_DIR, cassetteSettings.cassette);

    if (fs.existsSync(activeCassettePath) && fs.readdirSync(activeCassettePath).length > 0) {
        console.log('✅ Cassettes ya existen, saltando descarga.\n');
        return;
    }

    if (!DRIVE_FILE_ID) {
        console.error('❌ CASSETTE_DRIVE_ID no configurado');
        process.exit(1);
    }

    try {
        console.log('📥 Descargando cassettes desde Drive...');
        console.log(`   ID: ${DRIVE_FILE_ID}`);

        const url = `https://drive.usercontent.google.com/download?id=${DRIVE_FILE_ID}&confirm=t`;
        await downloadFile(url, ZIP_PATH);
        console.log('✅ Descarga completada');

        console.log('📦 Extrayendo cassettes...');
        if (!fs.existsSync(CASSETTES_DIR)) {
            fs.mkdirSync(CASSETTES_DIR, { recursive: true });
        }

        // Usar adm-zip (dependencia existente)
        const zip = new AdmZip(ZIP_PATH);
        zip.extractAllTo(CASSETTES_DIR, true);
        console.log(`✅ Cassettes extraídos en: ${CASSETTES_DIR}`);

        if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);

        console.log('\n✅ Bootstrap completado!\n');

    } catch (error) {
        console.error('❌ Error en bootstrap:', error.message);
        process.exit(1);
    }
}

main();
