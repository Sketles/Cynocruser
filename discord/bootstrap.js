// ╔════════════════════════════════════════════════════════════════╗
// ║                   CASSETTE BOOTSTRAP                           ║
// ║      Descarga cassettes desde Drive si no existen              ║
// ╚════════════════════════════════════════════════════════════════╝

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// URL de descarga directa de Google Drive
const DRIVE_FILE_ID = '1dXFbKbAHmzsKAzF4X0ECkygclsFZBBJu';
const CASSETTES_DIR = path.join(__dirname, '..', 'core', 'cassettes');
const CASSETTE_CHECK = path.join(CASSETTES_DIR, 'pelaosniper', 'core-engram.yaml');

/**
 * Descarga archivo desde Google Drive usando fetch nativo
 */
async function downloadFromDrive(fileId, destPath) {
    // Google Drive direct download URL
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

    console.log('📡 Conectando a Google Drive...');

    const response = await fetch(url, {
        redirect: 'follow',
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Verificar si hay confirmación requerida (archivos grandes)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
        // Google pide confirmación, extraer token y reintentar
        const html = await response.text();
        const confirmMatch = html.match(/confirm=([0-9A-Za-z_-]+)/);
        if (confirmMatch) {
            const confirmUrl = `https://drive.google.com/uc?export=download&confirm=${confirmMatch[1]}&id=${fileId}`;
            console.log('📡 Confirmando descarga...');
            const confirmResponse = await fetch(confirmUrl, { redirect: 'follow' });
            if (!confirmResponse.ok) {
                throw new Error(`Confirm failed: ${confirmResponse.status}`);
            }
            const buffer = await confirmResponse.arrayBuffer();
            fs.writeFileSync(destPath, Buffer.from(buffer));
            return;
        }
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(buffer));
}

/**
 * Extrae zip usando tar (disponible en Railway) o unzip
 */
function extractZip(zipPath, destDir) {
    try {
        // Intentar con unzip primero
        execSync(`unzip -o "${zipPath}" -d "${destDir}"`, { stdio: 'pipe' });
    } catch {
        // Fallback: usar Node.js para extraer (requiere instalar alguna lib)
        // Por ahora, intentar con tar si es compatible
        try {
            execSync(`tar -xf "${zipPath}" -C "${destDir}"`, { stdio: 'pipe' });
        } catch (e) {
            throw new Error('No se pudo extraer el zip. Ni unzip ni tar disponibles.');
        }
    }
}

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

        // Descargar usando fetch nativo
        console.log('📡 Descargando cassettes.zip...');
        await downloadFromDrive(DRIVE_FILE_ID, zipPath);

        // Verificar que se descargó
        if (!fs.existsSync(zipPath)) {
            throw new Error('No se pudo descargar el archivo');
        }

        const stats = fs.statSync(zipPath);
        console.log(`📦 Descargado: ${(stats.size / 1024).toFixed(1)} KB`);

        // Extraer
        console.log('📂 Extrayendo...');
        extractZip(zipPath, CASSETTES_DIR);

        // Limpiar zip
        fs.unlinkSync(zipPath);

        // Verificar extracción
        if (fs.existsSync(CASSETTE_CHECK)) {
            console.log('✅ Cassettes instalados correctamente');
            return true;
        } else {
            // Puede que el zip tenga estructura diferente, listar contenido
            const contents = fs.readdirSync(CASSETTES_DIR);
            console.log('📁 Contenido extraído:', contents);
            throw new Error('Estructura de cassettes incorrecta');
        }

    } catch (error) {
        console.error('❌ Error descargando cassettes:', error.message);
        console.error('   Asegúrate de que el link de Drive sea público');
        return false;
    }
}

module.exports = { bootstrapCassettes };
