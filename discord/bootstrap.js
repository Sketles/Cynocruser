// ╔════════════════════════════════════════════════════════════════╗
// ║                   CASSETTE BOOTSTRAP                           ║
// ║      Descarga cassettes desde Drive si no existen              ║
// ╚════════════════════════════════════════════════════════════════╝

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// URL de descarga directa de Google Drive
const CASSETTE_ZIP_URL = 'https://drive.google.com/uc?export=download&id=1dXFbKbAHmzsKAzF4X0ECkygclsFZBBJu';
const CASSETTES_DIR = path.join(__dirname, '..', 'core', 'cassettes');
const CASSETTE_CHECK = path.join(CASSETTES_DIR, 'pelaosniper', 'core-engram.yaml');

/**
 * Descarga y extrae cassettes si no existen
 */
async function bootstrapCassettes() {
    // Si ya existen, no hacer nada
    if (fs.existsSync(CASSETTE_CHECK)) {
        console.log('📼 Cassettes ya existen, saltando descarga');
        return true;
    }

    console.log('📥 Cassettes no encontrados, descargando desde Drive...');

    try {
        // Crear directorio si no existe
        if (!fs.existsSync(CASSETTES_DIR)) {
            fs.mkdirSync(CASSETTES_DIR, { recursive: true });
        }

        const zipPath = path.join(CASSETTES_DIR, 'cassettes.zip');

        // Descargar usando curl (disponible en Railway)
        console.log('📡 Descargando cassettes.zip...');
        execSync(`curl -L "${CASSETTE_ZIP_URL}" -o "${zipPath}"`, { stdio: 'inherit' });

        // Verificar que se descargó
        if (!fs.existsSync(zipPath)) {
            throw new Error('No se pudo descargar el archivo');
        }

        const stats = fs.statSync(zipPath);
        console.log(`📦 Descargado: ${(stats.size / 1024).toFixed(1)} KB`);

        // Extraer usando unzip (disponible en Railway)
        console.log('📂 Extrayendo...');
        execSync(`unzip -o "${zipPath}" -d "${CASSETTES_DIR}"`, { stdio: 'inherit' });

        // Limpiar zip
        fs.unlinkSync(zipPath);

        console.log('✅ Cassettes instalados correctamente');
        return true;

    } catch (error) {
        console.error('❌ Error descargando cassettes:', error.message);
        console.error('   Asegúrate de que el link de Drive sea público');
        return false;
    }
}

module.exports = { bootstrapCassettes };
