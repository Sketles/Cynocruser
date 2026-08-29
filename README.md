# 🧠 CYNOCRUSER — Ψ-Organ AI Character Engine

> **Motor de personalidad artificial basado en el modelo SiMA (Ψ-Organ)**  
> Simula una mente con necesidades, emociones y comportamientos dinámicos. Se despliega como **Bot de Discord** con voz clonada.

---

## ¿Qué hace este proyecto?

Cynocruser es un sistema de IA conversacional que va más allá de un chatbot típico. Implementa el modelo **Ψ-Organ** (basado en Dietrich, 2023 — *"The Ψ-Organ in a Nutshell"*), que simula una psique completa con:

- **Necesidades homeostáticas** que se vacían con el tiempo (energía, integridad, afiliación, certeza, competencia)
- **Percepción emocional** de los mensajes del usuario (ataques, afecto, ambigüedad, desafíos...)
- **Mecanismos de defensa psíquica** (evitación somática, represión, modo primario puro...)
- **Memoria episódica** con marcadores somáticos
- **Conciencia del mundo circundante** (Umwelt) con narrativa fenomenológica generada por IA
- **Voz clonada** que habla en canales de Discord usando Hume AI

Todo esto alimenta un **system prompt dinámico** que cambia en cada mensaje según el estado interno del personaje, creando una conversación genuinamente viva e impredecible.

---

## Arquitectura

```
cynocruser/
├── core/                        # Motor cognitivo central
│   ├── organo-sima/             # Ψ-Organ: el cerebro del sistema
│   │   ├── L1_hypothalamus/     # Soma: tanques de necesidades
│   │   ├── L2_thalamus/         # Percepción y simbolización
│   │   ├── L3_cortex/           # Ego: proceso primario/secundario
│   │   ├── hippocampus/         # Memoria episódica + marcadores somáticos
│   │   └── umwelt/              # Simulador del mundo circundante
│   ├── builders/                # Constructores del system prompt
│   │   ├── simaPromptBuilder.js # Builder principal (SiMA v2)
│   │   └── umweltPromptBuilder.js
│   ├── cassettes/               # Datos del personaje (YAML)
│   │   └── pelaosniper/         # Personaje activo
│   ├── services/
│   │   ├── ai-client.js         # Cliente multi-proveedor de IA
│   │   ├── tts.js               # Text-to-Speech (Hume AI / ElevenLabs)
│   │   └── weatherService.js    # Datos de clima para el Umwelt
│   └── config/                  # Configuración de IA, cassette, TTS, prompts
│
├── discord/                     # Bot de Discord
│   ├── bot.js                   # Entry point del bot
│   ├── bootstrap.js             # Descarga cassettes desde Google Drive (Railway)
│   ├── commands/factory.js      # Generador de comandos slash (/pelao)
│   └── services/voiceChannel.js # Manejo de canales de voz
│
├── scripts/                     # Herramientas de desarrollo
│   ├── organ.js                 # Prueba el Ψ-Organ en consola
│   ├── prompt.js                # Inspecciona el system prompt generado
│   ├── umwelt.js                # Prueba la narrativa del mundo
│   ├── info.js                  # Info del sistema
│   └── test-ai-providers.js     # Prueba todos los providers de IA
│
├── execute.js                   # CLI interactiva (modo local/desarrollo)
└── docs/                        # Documentación técnica y de diseño
```

---

## El Ψ-Organ: Cómo funciona la mente

Cada mensaje del usuario dispara este flujo:

```
Usuario escribe
      ↓
L1 Soma: tick metabólico (los tanques bajan con el tiempo)
      ↓
L2 Percepción: clasifica el mensaje (ATTACK / AFFECTION / AMBIGUITY / CHALLENGE / NEUTRAL...)
      ↓
Soma se actualiza (un ataque daña integridad; afecto sube afiliación)
      ↓
L3 Ego: Proceso Primario → Proceso Secundario → Decisión de conducta
      ↓
Memoria: registra el episodio con marcadores somáticos
      ↓
Umwelt: genera contexto narrativo del mundo (clima, hora, entorno)
      ↓
System Prompt dinámico → IA genera respuesta
```

### Tanques del Soma

| Tanque | Descripción |
|--------|-------------|
| `energía` | Se agota con cada interacción |
| `integridad` | Daña con ataques, insultos |
| `afiliación` | Necesita interacción social |
| `certeza` | Baja con ambigüedad/confusión |
| `competencia` | Sube con desafíos bien resueltos |

Cuando los tanques caen a niveles críticos, el personaje cambia de comportamiento de forma automática.

---

## Cassettes

Los **cassettes** son los archivos YAML que definen la identidad del personaje:

```
core/cassettes/pelaosniper/
├── core-engram.yaml       # Identidad, historia, valores, forma de hablar
├── core-lexicon.yaml      # Vocabulario característico, muletillas, patrones
├── core-sima-organ.yaml   # Config del Ψ-Organ: tanques, mecanismos de defensa
└── core-umwelt.yaml       # Config del mundo: ciudad, clima, contexto vital
```

Para cambiar de personaje, basta con cambiar `cassette` en `core/config/cassette-settings.js`.

---

## Bot de Discord

El bot expone un comando slash `/pelao` que permite:

- **`/pelao hablar`** — El bot se une al canal de voz y responde con voz clonada (TTS via Hume AI)
- **`/pelao textear`** — Responde solo por texto
- **`/pelao audiorepite`** — Repite texto como audio MP3
- **`/pelao desconectar`** — Sale del canal de voz
- **Auto-desconexión** — Si todos se van del canal, el bot se desconecta solo

El bot se despliega en **Railway** con los cassettes descargados automáticamente desde Google Drive al iniciar.

---

## Providers de IA

El sistema soporta múltiples proveedores de forma intercambiable:

| Provider | Modelos destacados |
|----------|--------------------|
| **Gemini** | `gemini-2.5-flash`, `gemini-2.5-pro` |
| **Groq** | `llama-3.3-70b-versatile`, `qwen3-32b` |
| **SambaNova** | `DeepSeek-V3.1`, `Qwen3-235B` |
| **OpenRouter** | Acceso a Claude, GPT-4o, modelos free |

La **IA principal** genera las respuestas del personaje. La **mini-IA Umwelt** (separada, más pequeña/barata) genera la narrativa del mundo circundante.

---

## Configuración rápida

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus API keys
```

Variables clave:

```env
# IA Principal (elige uno)
GEMINI_API_KEY=...
GROQ_API_KEY=...
SAMBANOVA_API_KEY=...
OPENROUTER_API_KEY=...

# TTS (voz)
HUME_API_KEY=...
HUME_SECRET_KEY=...
VOICE_ID_PELAO=...     # ID de la voz clonada en Hume AI

# Discord
DISCORD_TOKEN=...
CLIENT_ID=...
GUILD_ID=...           # Guild para registro de comandos (vacío = global)

# Timezone (importante para Umwelt en Railway)
TZ="America/Santiago"
```

### 3. Ejecutar

```bash
# Bot de Discord (producción)
npm start

# CLI interactiva (desarrollo/pruebas)
npm run dev

# CLI con debug del system prompt
npm run debug
```

---

## Scripts de desarrollo

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | CLI interactiva con el personaje |
| `npm run debug` | CLI con system prompt visible |
| `npm run dev:bot` | Bot de Discord con hot-reload |
| `npm run prompt:organ` | Muestra el output del Ψ-Organ |
| `npm run prompt:full` | Muestra el system prompt completo |
| `npm run prompt:umwelt` | Prueba la narrativa Umwelt |
| `npm run test:ia` | Prueba todos los providers |
| `npm run info` | Info del sistema y configuración |

---

## Comandos CLI (modo `npm run dev`)

| Comando | Descripción |
|---------|-------------|
| `/info` | Ver proveedor, modelo y cassette activos |
| `/estado` | Ver los tanques del Ψ-Organ en tiempo real |
| `/help` | Lista de comandos |
| `/clear` | Limpiar pantalla |
| `/salir` | Salir |

---

## Despliegue en Railway

El proyecto está pensado para desplegarse en [Railway](https://railway.app):

1. Subir el repo
2. Configurar las variables de entorno en Railway
3. El script `discord/bootstrap.js` descarga automáticamente los cassettes desde Google Drive al iniciar
4. El comando de inicio es `node discord/bot.js` (`npm start`)

> **Nota:** Los cassettes están en `.gitignore` por privacidad. Al desplegarse, el bot los descarga del Drive configurado en `bootstrap.js`.

---

## Requisitos

- Node.js >= 18.0.0
- API Key de al menos un proveedor de IA (Gemini, Groq, SambaNova u OpenRouter)
- Para voz: API Key de Hume AI + Voice ID clonada
- Para Discord: Token de bot + Client ID

---

## Stack técnico

- **Runtime:** Node.js 18+
- **IA:** Google Gemini, Groq, SambaNova, OpenRouter (via fetch nativo)
- **TTS:** Hume AI (Octave 2) / ElevenLabs
- **Discord:** discord.js v14, @discordjs/voice
- **Config:** YAML (cassettes), JS (settings), dotenv
- **CLI:** chalk, boxen, ora, figlet

---

*"La diferencia entre un chatbot y Cynocruser es que Cynocruser tiene hambre."*
