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

// Almacenamiento de reproductores y colas
const audioPlayers = new Map();
const audioQueues = new Map();
const isPlaying = new Map();

/**
 * Obtiene o crea un audio player para un guild
 */
function getOrCreatePlayer(guildId) {
    let player = audioPlayers.get(guildId);

    if (!player) {
        player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        });
        audioPlayers.set(guildId, player);
        console.log(`[Voice] Player creado para guild: ${guildId}`);

        player.on('error', error => {
            console.error(`[Voice] Error en player ${guildId}:`, error.message);
        });
    }

    return player;
}

/**
 * Une el bot al canal de voz del usuario
 */
async function joinChannel(voiceChannel) {
    const guildId = voiceChannel.guild.id;

    try {
        const existingConnection = getVoiceConnection(guildId);

        if (existingConnection) {
            if (existingConnection.joinConfig.channelId === voiceChannel.id) {
                console.log(`[Voice] Ya conectado a: ${voiceChannel.name}`);
                return true;
            }
            console.log(`[Voice] Cambiando de canal...`);
            existingConnection.destroy();
        }

        console.log(`[Voice] Conectando a: ${voiceChannel.name} (guild: ${guildId})`);

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });

        const player = getOrCreatePlayer(guildId);
        connection.subscribe(player);

        // Esperar un poco a que conecte, pero no bloquear indefinidamente ni destruir si tarda
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Ready, 5_000),
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000)
            ]);
            console.log(`[Voice] ✅ Conexión establecida (Ready/Signalling/Connecting)`);
        } catch (error) {
            console.warn('[Voice] La conexión tarda un poco, pero continuando en background...', error.message);
            // NO destruimos la conexión, dejamos que intente seguir conectando
        }

        // Manejo de desconexiones
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
                // Se está reconectando
            } catch (error) {
                // Solo limpiar si realmente pasó mucho tiempo desconectado
                if (connection.state.status === VoiceConnectionStatus.Disconnected) {
                    console.log('[Voice] Desconectado permanentemente, limpiando...');
                    connection.destroy();
                    audioPlayers.delete(guildId);
                    audioQueues.delete(guildId);
                    isPlaying.delete(guildId);
                }
            }
        });

        return true;

    } catch (error) {
        console.error('[Voice] Error crítico al unirse:', error.message);
        return false;
    }
}

/**
 * Desconecta el bot del canal de voz
 */
function leaveChannel(guildId) {
    const connection = getVoiceConnection(guildId);

    if (connection) {
        connection.destroy();
        audioPlayers.delete(guildId);
        audioQueues.delete(guildId);
        isPlaying.delete(guildId);
        console.log('[Voice] Desconectado del canal de voz');
        return true;
    }

    return false;
}

/**
 * Verifica si el bot está conectado y listo para reproducir
 */
function isConnected(guildId) {
    const connection = getVoiceConnection(guildId);

    if (!connection) return false;

    const state = connection.state.status;

    // Consideramos válido si está listo, señalizando o conectando
    return state === VoiceConnectionStatus.Ready ||
        state === VoiceConnectionStatus.Signalling ||
        state === VoiceConnectionStatus.Connecting;
}

/**
 * Agrega audio a la cola y procesa
 */
async function playAudio(guildId, audioBuffer) {
    const connection = getVoiceConnection(guildId);

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

    const connection = getVoiceConnection(guildId);

    if (!connection) {
        reject(new Error('Conexión perdida durante reproducción'));
        processQueue(guildId);
        return;
    }

    // Asegurar que estamos listos para reproducir
    if (connection.state.status !== VoiceConnectionStatus.Ready) {
        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 5_000);
        } catch (error) {
            reject(new Error('Conexión inestable (no Ready)'));
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

        // Safety timeout de 2 minutos
        setTimeout(() => {
            if (player.state.status !== AudioPlayerStatus.Idle) {
                console.warn('[Voice] Safety timeout activado');
                cleanup();
                resolve(true);
                processQueue(guildId);
            }
        }, 120000);

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
    const connection = getVoiceConnection(guildId);
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
