#!/usr/bin/env node
// ╔════════════════════════════════════════════════════════════════╗
// ║  RELEASE SCRIPT - Squash & Push                                ║
// ║                                                                ║
// ║  Convierte múltiples commits locales en 1 commit limpio        ║
// ║  antes de hacer push a origin                                  ║
// ╚════════════════════════════════════════════════════════════════╝

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function exec(cmd, silent = false) {
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
    } catch (e) {
        return null;
    }
}

function question(prompt) {
    return new Promise(resolve => rl.question(prompt, resolve));
}

async function main() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║        RELEASE - Squash & Push         ║');
    console.log('╚════════════════════════════════════════╝\n');

    // 1. Verificar que estamos en main/master
    const branch = exec('git branch --show-current', true)?.trim();
    console.log(`📍 Branch actual: ${branch}`);

    // 2. Contar commits locales no pusheados
    const unpushed = exec('git log origin/main..HEAD --oneline', true);
    const commitCount = unpushed ? unpushed.trim().split('\n').filter(l => l).length : 0;

    if (commitCount === 0) {
        console.log('\n✅ No hay commits locales pendientes de push.\n');
        rl.close();
        return;
    }

    console.log(`\n📦 Commits locales sin push: ${commitCount}`);
    console.log('─────────────────────────────────────────');
    console.log(unpushed);
    console.log('─────────────────────────────────────────\n');

    // 3. Preguntar título del commit final
    const title = await question('📝 Título del commit para GitHub: ');
    if (!title.trim()) {
        console.log('❌ Título vacío, cancelando.\n');
        rl.close();
        return;
    }

    // 4. Preguntar descripción (opcional)
    const desc = await question('📄 Descripción (opcional, Enter para saltar): ');

    // 5. Confirmar
    console.log('\n⚠️  Esto combinará todos los commits locales en 1.');
    const confirm = await question('¿Continuar? (s/n): ');

    if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'si') {
        console.log('❌ Cancelado.\n');
        rl.close();
        return;
    }

    // 6. Hacer soft reset al commit base (antes de los locales)
    console.log('\n🔄 Combinando commits...');

    try {
        // Reset suave: mantiene los cambios pero deshace los commits
        exec(`git reset --soft HEAD~${commitCount}`, true);

        // Crear nuevo commit con todo
        const commitMsg = desc.trim()
            ? `${title.trim()}\n\n${desc.trim()}`
            : title.trim();

        execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });

        console.log('\n✅ Commits combinados exitosamente.');

        // 7. Preguntar si hacer push
        const doPush = await question('\n🚀 ¿Hacer push a origin ahora? (s/n): ');

        if (doPush.toLowerCase() === 's' || doPush.toLowerCase() === 'si') {
            console.log('\n📤 Pusheando a origin...');
            exec('git push origin main', false);
            console.log('\n✅ ¡Release completado!\n');
        } else {
            console.log('\n📦 Commit listo. Usa "git push" cuando quieras.\n');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('💡 Puedes revertir con: git reflog\n');
    }

    rl.close();
}

main().catch(console.error);
