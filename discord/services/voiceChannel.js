// ╔════════════════════════════════════════════════════════════════╗
// ║                   VOICE CHANNEL CONNECTION                     ║
// ║              Manejo de canales de voz de Discord               ║
// ╚════════════════════════════════════════════════════════════════╝

const {
    joinVoiceChannel,
    getVoiceConnection,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    NoSubscriberBehavior,
    StreamType,
    entersState
} = require('@discordjs/voice');
const { Readable } = require('stream');

// Almacenamiento local de conexiones y players por guild
const connections = new Map();
const audioPlayers = new Map();
const audioQueues = new Map();
const isPlaying = new Map();

/**
 * Obtiene o crea un audio player para un guild
 */
function getOrCreatePlayer(guildId) {
    if (!audioPlayers.has(guildId)) {
        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        });
        audioPlayers.set(guildId, player);
        console.log(`[Voice] Player creado para guild: ${guildId}`);
    }
    return audioPlayers.get(guildId);
}

/**
 * Une el bot al canal de voz del usuario
 */
async function joinChannel(voiceChannel) {
    const guildId = voiceChannel.guild.id;

    try {
        let existingConn = connections.get(guildId);
        const discordConn = getVoiceConnection(guildId);

        if (existingConn || discordConn) {
            const conn = existingConn || discordConn;
            if (conn.state.status !== VoiceConnectionStatus.Destroyed) {
                if (conn.joinConfig.channelId === voiceChannel.id) {
                    console.log(`[Voice] Ya conectado a: ${voiceChannel.name}`);
                    connections.set(guildId, conn);
                    return true;
                }
                console.log(`[Voice] Cambiando de canal...`);
                conn.destroy();
            }
        }

        console.log(`[Voice] Conectando a: ${voiceChannel.name} (guild: ${guildId})`);

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });

        connections.set(guildId, connection);

        const player = getOrCreatePlayer(guildId);
        connection.subscribe(player);

        // Esperar a que la conexión esté LISTA antes de confirmar
        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
            console.log(`[Voice] ✅ Conexión READY en: ${voiceChannel.name}`);
        } catch (error) {
            console.error('[Voice] Timeout esperando READY:', error);
            connection.destroy();
            throw error;
        }

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log('[Voice] Estado: Disconnected');
            setTimeout(() => {
                const conn = connections.get(guildId);
                if (conn && conn.state.status === VoiceConnectionStatus.Disconnected) {
                    console.log('[Voice] Limpiando conexión desconectada');
                    conn.destroy();
                }
            }, 5000);
        });

        connection.on(VoiceConnectionStatus.Destroyed, () => {
            console.log('[Voice] Conexión destruida, limpiando...');
            connections.delete(guildId);
            audioPlayers.delete(guildId);
        });

        connection.on('error', (error) => {
            console.error('[Voice] Error de conexión:', error.message);
        });

        console.log(`[Voice] ✅ joinChannel completado para: ${voiceChannel.name}`);
        return true;

    } catch (error) {
        console.error('[Voice] Error al unirse:', error);
        connections.delete(guildId);
        return false;
    }
}

/**
 * Desconecta el bot del canal de voz
 */
function leaveChannel(guildId) {
    let connection = connections.get(guildId);
    if (!connection) {
        connection = getVoiceConnection(guildId);
    }

    if (connection) {
        connection.destroy();
        connections.delete(guildId);
        audioPlayers.delete(guildId);
        console.log('[Voice] Desconectado del canal de voz');
        return true;
    }

    return false;
}

/**
 * Verifica si el bot está conectado a un canal de voz
 */
function isConnected(guildId) {
    let connection = connections.get(guildId);

    if (!connection) {
        connection = getVoiceConnection(guildId);
        if (connection) {
            connections.set(guildId, connection);
        }
    }

    if (!connection) {
        return false;
    }

    const state = connection.state.status;
    const isValid = state === VoiceConnectionStatus.Ready ||
        state === VoiceConnectionStatus.Connecting ||
        state === VoiceConnectionStatus.Signalling;

    if (state === VoiceConnectionStatus.Destroyed ||
        state === VoiceConnectionStatus.Disconnected) {
        connections.delete(guildId);
    }

    return isValid;
}

/**
 * Agrega audio a la cola y procesa
 */
async function playAudio(guildId, audioBuffer) {
    let connection = connections.get(guildId);
    if (!connection) {
        connection = getVoiceConnection(guildId);
    }

    if (!connection) {
        throw new Error('No estoy conectado a ningún canal de voz');
    }

    if (!audioQueues.has(guildId)) {
        audioQueues.set(guildId, []);
    }

    const queue = audioQueues.get(guildId);

    return new Promise((resolve, reject) => {
        queue.push({
            buffer: audioBuffer,
            resolve,
            reject
        });

        console.log(`[Voice] Audio agregado a cola (${queue.length} en cola)`);

        if (!isPlaying.get(guildId)) {
            processQueue(guildId);
        }
    });
}

/**
 * Procesa la cola de audio de un guild
 */
async function processQueue(guildId) {
    const queue = audioQueues.get(guildId);

    if (!queue || queue.length === 0) {
        isPlaying.set(guildId, false);
        return;
    }

    isPlaying.set(guildId, true);
    const { buffer, resolve, reject } = queue.shift();

    let connection = connections.get(guildId);
    if (!connection) {
        connection = getVoiceConnection(guildId);
    }

    if (!connection) {
        reject(new Error('Conexión perdida'));
        processQueue(guildId);
        return;
    }

    if (connection.state.status !== VoiceConnectionStatus.Ready) {
        try {
            await new Promise((res, rej) => {
                const timeout = setTimeout(() => rej(new Error('Timeout')), 10000);
                connection.once(VoiceConnectionStatus.Ready, () => {
                    clearTimeout(timeout);
                    res();
                });
                if (connection.state.status === VoiceConnectionStatus.Ready) {
                    clearTimeout(timeout);
                    res();
                }
            });
        } catch (error) {
            reject(error);
            processQueue(guildId);
            return;
        }
    }

    const player = getOrCreatePlayer(guildId);

    try {
        const audioStream = Readable.from(buffer);
        const resource = createAudioResource(audioStream, {
            inputType: StreamType.Arbitrary,
            inlineVolume: true
        });

        if (resource.volume) {
            resource.volume.setVolume(1.0);
        }

        player.play(resource);
        console.log('[Voice] Reproduciendo audio...');

        const cleanup = () => {
            player.removeListener(AudioPlayerStatus.Idle, onIdle);
            player.removeListener('error', onError);
        };

        const onIdle = () => {
            cleanup();
            console.log('[Voice] Audio terminado');
            resolve(true);
            processQueue(guildId);
        };

        const onError = (error) => {
            cleanup();
            console.error('[Voice] Error al reproducir:', error);
            reject(error);
            processQueue(guildId);
        };

        player.once(AudioPlayerStatus.Idle, onIdle);
        player.once('error', onError);

        setTimeout(() => {
            cleanup();
            resolve(true);
            processQueue(guildId);
        }, 60000);

    } catch (error) {
        console.error('[Voice] Error playAudio:', error);
        reject(error);
        processQueue(guildId);
    }
}

/**
 * Obtiene info del canal actual
 */
function getConnectionInfo(guildId) {
    const connection = connections.get(guildId) || getVoiceConnection(guildId);
    if (!connection) return null;
    return {
        channelId: connection.joinConfig.channelId,
        guildId: connection.joinConfig.guildId,
        status: connection.state.status
    };
}

module.exports = {
    joinChannel,
    leaveChannel,
    playAudio,
    isConnected,
    getConnectionInfo
};
