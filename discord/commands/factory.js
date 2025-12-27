// ╔════════════════════════════════════════════════════════════════╗
// ║                    COMMAND FACTORY                             ║
// ║                                                                ║
// ║   Genera comandos de Discord desde personajes/cassettes        ║
// ║   Importa servicios desde /core                                ║
// ╚════════════════════════════════════════════════════════════════╝

const { EmbedBuilder } = require('discord.js');

// Importar desde /core (modular)
const {
    loadCassette,
    buildSystemPrompt,
    PsiOrgan,
    AIClient,
    textToSpeech,
    cassetteSettings,
    aiSettings,
    ttsSettings
} = require('../../core');

// Servicios locales de Discord
const { joinChannel, leaveChannel, playAudio, isConnected, getConnectionInfo } = require('../services/voiceChannel');

// Timer para auto-desconexión por guild
const autoDisconnectTimers = new Map();

// Cache de PsiOrgans y cassettes por guild
const psiOrgans = new Map();
const cassettes = new Map();
const conversationHistory = new Map();

// Cliente AI compartido
let aiClient = null;

// Mapeo de emociones Ψ-Organ → descripciones para Hume TTS
const EMOTION_TO_VOICE = {
    neutral: 'calm, conversational, relaxed',
    happy: 'cheerful, enthusiastic, warm',
    angry: 'frustrated, intense, firm',
    sad: 'melancholic, subdued, quiet',
    anxious: 'nervous, hesitant, uncertain',
    excited: 'energetic, animated, eager',
    tired: 'drowsy, slow, low energy',
    defensive: 'guarded, tense, cautious'
};

/**
 * Obtiene o crea instancia de AIClient
 */
function getAIClient() {
    if (!aiClient) {
        aiClient = new AIClient();
    }
    return aiClient;
}

/**
 * Obtiene o carga el cassette
 */
function getCassette(cassetteId) {
    if (!cassettes.has(cassetteId)) {
        const cassette = loadCassette(cassetteId);
        cassettes.set(cassetteId, cassette);
    }
    return cassettes.get(cassetteId);
}

/**
 * Obtiene o crea PsiOrgan para un guild
 */
function getPsiOrgan(guildId, cassetteId) {
    const key = `${guildId}-${cassetteId}`;
    if (!psiOrgans.has(key)) {
        const cassette = getCassette(cassetteId);
        psiOrgans.set(key, new PsiOrgan({ cassette }));
    }
    return psiOrgans.get(key);
}

/**
 * Genera respuesta de IA con estado emocional
 * @returns {{ text: string, emotion: string }} Respuesta y emoción para TTS
 */
async function generateResponse(character, userId, userMessage) {
    const cassette = getCassette(character.cassetteId);
    const psiOrgan = getPsiOrgan(userId, character.cassetteId);

    // Procesar con Ψ-Organ
    const psiState = psiOrgan.process(userMessage, { userId });

    // Construir prompt
    const systemPrompt = await buildSystemPrompt(cassette, userId, psiState);

    // Historial
    if (!conversationHistory.has(userId)) {
        conversationHistory.set(userId, []);
    }
    const history = conversationHistory.get(userId);
    history.push({ role: 'user', content: userMessage });

    // Mantener historial corto
    if (history.length > 20) {
        history.splice(0, history.length - 20);
    }

    // Generar respuesta
    const client = getAIClient();
    const response = await client.generateResponse(history, systemPrompt, {
        temperature: character.ai?.temperature || 0.9,
        maxOutputTokens: character.ai?.maxTokens || 500
    });

    history.push({ role: 'assistant', content: response });

    // Mapear emoción del Ψ-Organ a descripción de voz
    const psiEmotion = psiState?.emotion || 'neutral';
    const voiceEmotion = EMOTION_TO_VOICE[psiEmotion] || EMOTION_TO_VOICE.neutral;

    console.log(`[Ψ-Organ] Emoción: ${psiEmotion} → Voz: ${voiceEmotion}`);

    return {
        text: response,
        emotion: voiceEmotion
    };
}

/**
 * Crea la definición del comando para Discord
 */
function createCommandDefinition(character) {
    return {
        name: character.commandName,
        description: character.commandDescription,
        options: [
            {
                name: 'ingresa',
                description: `${character.name} entra a tu canal de voz`,
                type: 1
            },
            {
                name: 'hablame',
                description: `${character.name} te responde por el canal de voz`,
                type: 1,
                options: [{
                    name: 'texto',
                    description: `Tu mensaje para ${character.name}`,
                    type: 3,
                    required: true
                }]
            },
            {
                name: 'salete',
                description: `${character.name} sale del canal de voz`,
                type: 1
            },
            {
                name: 'repite',
                description: `${character.name} repite exactamente lo que escribas`,
                type: 1,
                options: [{
                    name: 'texto',
                    description: 'Texto que quieres que repita',
                    type: 3,
                    required: true
                }]
            },
            {
                name: 'info',
                description: `Ver información técnica de ${character.name}`,
                type: 1
            }
        ]
    };
}

/**
 * Crea el handler del comando
 */
function createCommandHandler(character) {
    const COLORS = {
        primary: 0x5865F2,
        success: 0x57F287,
        warning: 0xFEE75C,
        error: 0xED4245,
        voice: 0xEB459E
    };

    return async function handleCommand(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;
        const user = interaction.user;

        // ═══════════════════════════════════════════════════════════════
        // /comando info
        // ═══════════════════════════════════════════════════════════════
        if (subcommand === 'info') {
            const connected = isConnected(guildId);
            const cassette = getCassette(character.cassetteId);
            const psiOrgan = getPsiOrgan(guildId, character.cassetteId);
            const psiState = psiOrgan.getFullState();
            const tanks = psiState.soma?.tanks || {};

            // Usar Embed para un look profesional
            const embed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle('CYNOCRUSER')
                .setDescription('**Ψ-ORGAN & SOULKILLED PSEUDO INTELLECT**')
                .addFields(
                    { name: 'CASSETTE', value: `\`${character.cassetteId}\``, inline: true },
                    { name: 'DISCORD', value: connected ? '🟢 Connected' : '🔴 Disconnected', inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    {
                        name: 'Ψ-ORGAN TANKS',
                        value: [
                            `ENE \`${Math.round(tanks.energia || 0)}%\` | INT \`${Math.round(tanks.integridad || 0)}%\` | AFI \`${Math.round(tanks.afiliacion || 0)}%\``,
                            `CER \`${Math.round(tanks.certeza || 0)}%\` | COM \`${Math.round(tanks.competencia || 0)}%\``
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: 'MOTHER-IA',
                        value: `\`${aiSettings.model || 'N/A'}\``,
                        inline: true
                    },
                    {
                        name: 'UMWELT-IA',
                        value: `\`${aiSettings.umwelt?.model || 'N/A'}\``,
                        inline: true
                    },
                    {
                        name: 'TTS',
                        value: `\`${(ttsSettings.provider || 'hume').toUpperCase()}\` (${ttsSettings.hume?.activeVoice || 'default'})`,
                        inline: true
                    }
                )
                .setFooter({ text: 'L1-Soma • L2-Thalamus • L3-Cortex • Hippocampus' });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ═══════════════════════════════════════════════════════════════
        // /comando ingresa
        // ═══════════════════════════════════════════════════════════════
        if (subcommand === 'ingresa') {
            const voiceChannel = interaction.member.voice?.channel;

            if (!voiceChannel) {
                const embed = new EmbedBuilder()
                    .setColor(COLORS.error)
                    .setDescription('❌ **Únete a un canal de voz primero**');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            await interaction.deferReply();

            try {
                const success = await joinChannel(voiceChannel);

                if (success) {
                    // Saludo de entrada desde cassette
                    const cassette = getCassette(character.cassetteId);
                    const entranceMessages = cassette?.lexicon?.greetings?.entrance_voice_channel || ['Wena cabros'];
                    const randomMessage = entranceMessages[Math.floor(Math.random() * entranceMessages.length)];

                    try {
                        const audioBuffer = await textToSpeech(randomMessage);
                        await playAudio(voiceChannel.guild.id, audioBuffer);
                    } catch (err) {
                        console.error('[Entrance] Error TTS:', err.message);
                    }

                    const embed = new EmbedBuilder()
                        .setColor(COLORS.success)
                        .setAuthor({
                            name: character.name,
                            iconURL: interaction.client.user.displayAvatarURL()
                        })
                        .setDescription(`🎙️ Conectado a **${voiceChannel.name}**`)
                        .addFields({
                            name: '💡 Siguiente paso',
                            value: `\`/${character.commandName} hablame <mensaje>\``,
                            inline: false
                        });

                    return interaction.editReply({ embeds: [embed] });
                }

                const embed = new EmbedBuilder()
                    .setColor(COLORS.error)
                    .setDescription('❌ **No pude conectar al canal**');
                return interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error(`[${character.name}] Error ingresa:`, error);
                const embed = new EmbedBuilder()
                    .setColor(COLORS.error)
                    .setDescription(`❌ **Error:** ${error.message}`);
                return interaction.editReply({ embeds: [embed] });
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // /comando salete
        // ═══════════════════════════════════════════════════════════════
        if (subcommand === 'salete') {
            const left = leaveChannel(guildId);

            if (left) {
                const embed = new EmbedBuilder()
                    .setColor(COLORS.warning)
                    .setDescription(`👋 **${character.name}** se desconectó del canal`);
                return interaction.reply({ embeds: [embed] });
            }

            const embed = new EmbedBuilder()
                .setColor(COLORS.error)
                .setDescription('❌ **No estoy en ningún canal**');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ═══════════════════════════════════════════════════════════════
        // /comando hablame <texto>
        // ═══════════════════════════════════════════════════════════════
        if (subcommand === 'hablame') {
            await interaction.deferReply();

            // Auto-Join Strategy: Si no estamos conectados, intentar conectar al canal del usuario
            if (!isConnected(guildId)) {
                const voiceChannel = interaction.member.voice?.channel;
                if (!voiceChannel) {
                    const embed = new EmbedBuilder()
                        .setColor(COLORS.error)
                        .setDescription('❌ **Únete a un canal de voz primero**');
                    return interaction.editReply({ embeds: [embed] });
                }

                try {
                    // Intento de conexión "silenciosa" (o con log mínimo)
                    const connected = await joinChannel(voiceChannel);
                    if (!connected) {
                        const embed = new EmbedBuilder()
                            .setColor(COLORS.error)
                            .setDescription('❌ **No pude conectar al canal automáticamente**');
                        return interaction.editReply({ embeds: [embed] });
                    }
                } catch (error) {
                    console.error('[Auto-Join] Falló:', error);
                    const embed = new EmbedBuilder()
                        .setColor(COLORS.error)
                        .setDescription('❌ **Error de conexión automático**');
                    return interaction.editReply({ embeds: [embed] });
                }
            }

            const userMessage = interaction.options.getString('texto');

            try {
                console.log(`[Hablame] 1. Generando respuesta IA para: "${userMessage}"`);
                const { text: aiResponse, emotion } = await generateResponse(character, interaction.user.id, userMessage);
                console.log(`[Hablame] 2. Respuesta IA generada: "${aiResponse.substring(0, 50)}..."`);

                console.log(`[Hablame] 3. Generando TTS con emoción: ${emotion}`);
                const audioBuffer = await textToSpeech(aiResponse, { emotion });
                console.log(`[Hablame] 4. TTS generado (${audioBuffer.length} bytes). Reproduciendo...`);

                await playAudio(guildId, audioBuffer);
                console.log(`[Hablame] 5. Audio enviado a cola.`);

                const embed = new EmbedBuilder()
                    .setColor(COLORS.voice)
                    .setAuthor({
                        name: character.name,
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setDescription(`🔊 *"${aiResponse}"*`)
                    .setFooter({ text: `Para ${user.displayName} • ${emotion.split(',')[0]}` });

                return interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error(`[${character.name}] Error hablame:`, error);
                const embed = new EmbedBuilder()
                    .setColor(COLORS.error)
                    .setDescription(`❌ **Error:** ${error.message}`);
                // Usamos followUp o editReply seguro
                try {
                    await interaction.editReply({ embeds: [embed] });
                } catch {
                    await interaction.followUp({ embeds: [embed], ephemeral: true });
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // /comando repite <texto>
        // ═══════════════════════════════════════════════════════════════
        if (subcommand === 'repite') {
            await interaction.deferReply();

            // Auto-Join Strategy
            if (!isConnected(guildId)) {
                const voiceChannel = interaction.member.voice?.channel;
                if (!voiceChannel) {
                    const embed = new EmbedBuilder()
                        .setColor(COLORS.error)
                        .setDescription('❌ **Únete a un canal de voz primero**');
                    return interaction.editReply({ embeds: [embed] });
                }
                try {
                    const connected = await joinChannel(voiceChannel);
                    if (!connected) {
                        const embed = new EmbedBuilder()
                            .setColor(COLORS.error)
                            .setDescription('❌ **No pude conectar al canal automáticamente**');
                        return interaction.editReply({ embeds: [embed] });
                    }
                } catch (error) {
                    const embed = new EmbedBuilder()
                        .setColor(COLORS.error)
                        .setDescription('❌ **Error de conexión automático**');
                    return interaction.editReply({ embeds: [embed] });
                }
            }

            const texto = interaction.options.getString('texto');

            try {
                const audioBuffer = await textToSpeech(texto);
                await playAudio(guildId, audioBuffer);

                const embed = new EmbedBuilder()
                    .setColor(COLORS.voice)
                    .setAuthor({
                        name: character.name,
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setDescription(`🔊 *"${texto}"*`)
                    .setFooter({ text: `Repetido para ${user.displayName}` });

                return interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error(`[${character.name}] Error repite:`, error);
                const embed = new EmbedBuilder()
                    .setColor(COLORS.error)
                    .setDescription(`❌ **Error:** ${error.message}`);
                return interaction.editReply({ embeds: [embed] });
            }
        }
    };
}

/**
 * Auto-desconexión cuando el canal queda vacío
 */
function checkAutoDisconnect(channelId, guildId, client) {
    const connectionInfo = getConnectionInfo(guildId);
    if (!connectionInfo || connectionInfo.channelId !== channelId) return;

    const channel = client.channels.cache.get(channelId);
    if (!channel) return;

    const realUsers = channel.members.filter(m => !m.user.bot).size;

    if (realUsers === 0) {
        if (!autoDisconnectTimers.has(guildId)) {
            console.log(`[Voice] Canal vacío, desconectando en 60s...`);

            const timer = setTimeout(() => {
                const ch = client.channels.cache.get(channelId);
                if (ch && ch.members.filter(m => !m.user.bot).size === 0 && isConnected(guildId)) {
                    console.log(`[Voice] Auto-desconexión`);
                    leaveChannel(guildId);
                }
                autoDisconnectTimers.delete(guildId);
            }, 60000);

            autoDisconnectTimers.set(guildId, timer);
        }
    } else if (autoDisconnectTimers.has(guildId)) {
        clearTimeout(autoDisconnectTimers.get(guildId));
        autoDisconnectTimers.delete(guildId);
    }
}

module.exports = {
    createCommandDefinition,
    createCommandHandler,
    checkAutoDisconnect
};
