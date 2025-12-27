// ╔════════════════════════════════════════════════════════════════════╗
// ║                    CYNOCRUSER - DISCORD BOT                        ║
// ║                                                                    ║
// ║   Bot de Discord con Ψ-Organ + Voz Clonada                         ║
// ║   Arquitectura modular: importa solo de /core                      ║
// ╚════════════════════════════════════════════════════════════════════╝

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

// ╔════════════════════════════════════════════════════════════════════╗
// ║                    CYNOCRUSER - DISCORD BOT                        ║
// ║                                                                    ║
// ║   Bot de Discord con Ψ-Organ + Voz Clonada                         ║
// ║   Arquitectura modular: importa solo de /core                      ║
// ╚════════════════════════════════════════════════════════════════════╝

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { bootstrapCassettes } = require('./bootstrap');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════
const config = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildIds: [
        process.env.GUILD_ID,
        process.env.GUILD_ID_2
    ].filter(Boolean)
};

// ═══════════════════════════════════════════════════════════════════
// VALIDAR CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════
function validateConfig() {
    const required = ['DISCORD_TOKEN', 'CLIENT_ID'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ Variables faltantes:', missing.join(', '));
        process.exit(1);
    }

    console.log('✅ Configuración validada');
}

// ═══════════════════════════════════════════════════════════════════
// CLIENTE DE DISCORD
// ═══════════════════════════════════════════════════════════════════
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Variables para comandos
let commands = [];
const handlers = new Map();

// ═══════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════════
async function initialize() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    CYNOCRUSER DISCORD BOT                      ║');
    console.log('║                     Ψ-Organ + Voice Clone                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');

    // 1. Validar configuración
    validateConfig();

    // 2. Bootstrap: Descargar cassettes si no existen (Railway volume)
    await bootstrapCassettes();

    // 3. Cargar módulos (AHORA QUE LOS CASSETTES EXISTEN)
    // Esto previene warnings de WeatherService
    console.log('📦 Cargando módulos...');
    const { loadCassette, cassetteSettings } = require('../core');
    const { createCommandDefinition, createCommandHandler, checkAutoDisconnect } = require('./commands/factory');

    // 4. Cargar cassette
    console.log('📼 Cargando cassette...');
    const cassetteId = cassetteSettings.cassette;
    const cassette = loadCassette(cassetteId);

    if (!cassette) {
        console.error('❌ No se pudo cargar el cassette');
        process.exit(1);
    }

    // 5. Crear identidad desde cassette
    const identity = {
        id: cassetteId,
        cassetteId: cassetteId,
        name: cassette.engram.identity?.name || 'AI',
        fullName: cassette.engram.identity?.full_name || '',
        commandName: cassetteId.toLowerCase().replace(/[^a-z0-9]/g, ''),
        commandDescription: `Habla con ${cassette.engram.identity?.name || 'AI'}`,
        ai: {
            model: 'gemini-2.0-flash',
            temperature: 0.9,
            maxTokens: 150
        }
    };

    // 6. Generar comandos
    commands = [createCommandDefinition(identity)];
    handlers.set(identity.commandName, createCommandHandler(identity));

    console.log(`✅ Comando /${identity.commandName} creado para ${identity.name}`);
    console.log('');

    // 7. Configurar eventos (dentro de initialize para acceder a imports)

    // Auto-desconexión
    client.on('voiceStateUpdate', (oldState, newState) => {
        if (oldState.channelId) {
            checkAutoDisconnect(oldState.channelId, newState.guild.id, client);
        }
    });

    // Manejo de comandos
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;

        const handler = handlers.get(interaction.commandName);
        if (handler) {
            await handler(interaction);
        }
    });

    client.once('ready', async () => {
        console.log(`🤖 Conectado como ${client.user.tag}`);

        // Registrar comandos
        const rest = new REST({ version: '9' }).setToken(config.token);
        try {
            if (config.guildIds.length > 0) {
                for (const guildId of config.guildIds) {
                    await rest.put(
                        Routes.applicationGuildCommands(config.clientId, guildId),
                        { body: commands }
                    );
                    console.log(`✅ Comandos registrados en guild: ${guildId}`);
                }
            } else {
                await rest.put(
                    Routes.applicationCommands(config.clientId),
                    { body: commands }
                );
                console.log('🌍 Comandos registrados GLOBALMENTE');
            }
        } catch (error) {
            console.error('❌ Error registrando comandos:', error);
        }

        console.log('');
        console.log('✅ Bot listo y funcionando!');
        console.log('');
    });

    // 8. Conectar a Discord
    await client.login(config.token);
}

// ═══════════════════════════════════════════════════════════════════
// INICIAR
// ═══════════════════════════════════════════════════════════════════
initialize().catch(error => {
    console.error('❌ Error fatal al iniciar:', error);
    process.exit(1);
});
