<div align="center">

<img src="logo.jpg" alt="Cynocruser Logo" width="160" />

# Cynocruser

**Motor de Personajes Cognitivos basado en el Modelo Psi-Organ (Marco SiMA)**

*Sistema de inteligencia artificial orientado a la investigación que implementa un modelo computacional de la psique humana.*

---

<!-- Stack badges -->
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=flat-square&logo=discord&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3-FF6B35?style=flat-square)
![Hume AI](https://img.shields.io/badge/Hume_AI-Octave_2-8B5CF6?style=flat-square)
![YAML](https://img.shields.io/badge/Config-YAML-CB171E?style=flat-square&logo=yaml&logoColor=white)
![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

</div>

---

## Descripción general

Cynocruser operacionaliza el **modelo Psi-Organ** (Dietrich, 2023 — *"The Psi-Organ in a Nutshell"*), una arquitectura neurocognitiva que modela la mente como un sistema biológico en capas, gobernado por necesidades somáticas, percepción simbólica y procesos de decisión mediados por el Yo.

A diferencia de los envoltorios convencionales sobre modelos de lenguaje de gran escala (LLM), este sistema no depende de un prompt de sistema estático. En cambio, construye un **prompt dinámico, dependiente del estado interno**, en cada ciclo de inferencia: codifica el estado fisiológico actual del agente, la valencia emocional, los mecanismos de defensa activos, el contexto del mundo y las trazas de memoria episódica. El resultado es un agente cuyo perfil conductual es no determinista, internamente consistente y sensible al historial de interacción.

---

## Fundamentos científicos

La arquitectura integra conceptos de múltiples disciplinas:

- **Teoría psicodinámica:** Implementación del pensamiento de proceso primario y secundario, marcadores somáticos y mecanismos de defensa del Yo (represión, evitación somática, proyección) como módulos computacionales discretos.
- **Modelado homeostático:** Cinco tanques de pulsión independientes (energía, integridad, afiliación, certeza, competencia) se depleccionan con el tiempo siguiendo curvas de desgaste parametrizables. Los umbrales críticos desencadenan cambios de modo conductual análogos a la urgencia motivacional en sistemas biológicos.
- **Modelado fenomenológico del mundo (Umwelt):** Inspirado en el concepto de mundo perceptivo específico de la especie de Jakob von Uexküll, el sistema mantiene una capa narrativa generativa que contextualiza el entorno del agente (contexto temporal, meteorológico y social) mediante un pipeline de inferencia LLM secundario.
- **Memoria episódica con marcadores somáticos:** La hipótesis del marcador somático de Damasio se implementa parcialmente a través de un módulo de memoria que etiqueta los registros episódicos con valencia afectiva y estado fisiológico en el momento de la codificación, influyendo en la recuperación posterior y en la ponderación conductual.

---

## Arquitectura

```
cynocruser/
├── core/
│   ├── organo-sima/
│   │   ├── L1_hypothalamus/     # Soma: gestión de pulsiones homeostáticas
│   │   ├── L2_thalamus/         # Percepción: clasificación simbólica del input
│   │   ├── L3_cortex/           # Yo: proceso primario/secundario + motor de decisión
│   │   ├── hippocampus/         # Memoria episódica con marcadores somáticos
│   │   └── umwelt/              # Simulador del mundo: generación de contexto fenomenológico
│   ├── builders/                # Capa de construcción del system prompt
│   ├── cassettes/               # Definiciones de personaje en YAML (engrama, léxico, config. del órgano)
│   ├── services/
│   │   ├── ai-client.js         # Capa de abstracción multi-proveedor LLM
│   │   ├── tts.js               # Síntesis de texto a voz (Hume AI / ElevenLabs)
│   │   └── weatherService.js    # Datos ambientales para el Umwelt
│   └── config/
├── discord/
│   ├── bot.js                   # Cliente de gateway de Discord y despachador de eventos
│   ├── bootstrap.js             # Aprovisionamiento remoto de cassettes (Google Drive / Railway)
│   ├── commands/factory.js      # Generación de comandos slash y manejo de interacciones
│   └── services/voiceChannel.js # Gestión de canales de voz y streaming de audio
├── scripts/                     # Utilidades de desarrollo y diagnóstico
├── execute.js                   # CLI interactiva para pruebas locales
└── docs/                        # Notas de investigación y documentación arquitectónica
```

---

## Pipeline de inferencia

Cada mensaje del usuario dispara la siguiente secuencia determinista:

```
Input recibido
    |
    v
L1 — Tick metabólico: tanques de pulsión depleccionados por tasas de decaimiento base
    |
    v
L2 — Clasificación perceptual: input mapeado a tipo de estímulo
     (ATAQUE / AFECTO / AMBIGUEDAD / RECHAZO / DESAFIO / NEUTRO)
    |
    v
L1 — Actualización somática: tanques modificados por funciones de impacto específicas al estímulo
    |
    v
L3 — Procesamiento del Yo:
       Proceso primario  →  respuesta afectiva, asociativa y dominada por pulsiones
       Proceso secundario →  respuesta adaptada a la realidad y regulada socialmente
       Motor de decisión  →  selección de modo conductual + activación de mecanismos de defensa
    |
    v
Hipocampo — Episodio registrado con marcadores somáticos y afectivos
    |
    v
Umwelt — Contexto fenomenológico del mundo generado via inferencia LLM secundaria
    |
    v
Constructor de prompt — System prompt dinámico ensamblado desde todas las salidas de subsistemas
    |
    v
Inferencia LLM — Respuesta generada bajo el contexto cognitivo construido
```

---

## Sistema de pulsiones somáticas

| Pulsión | Base | Detonante de deplección | Umbral crítico |
|---------|------|------------------------|----------------|
| Energía | 100 | Por interacción | < 15 |
| Integridad | 100 | Input hostil | < 30 |
| Afiliación | 70 | Inactividad social | < 20 |
| Certeza | 80 | Input ambiguo | Configurable |
| Competencia | 75 | Desafíos no resueltos | Configurable |

Cuando las pulsiones superan los umbrales críticos, el sistema transiciona a modos conductuales alterados: mayor dominancia del proceso primario, respuestas más breves, mayor uso de defensas psíquicas, o producción proactiva espontánea.

---

## Definición de personaje — Sistema de cassettes

Las identidades de los personajes se definen mediante manifiestos YAML estructurados denominados **cassettes**, que separan la configuración conductual de la lógica del motor:

```
core/cassettes/<id_personaje>/
├── core-engram.yaml        # Identidad, biografía, valores, estilo comunicativo
├── core-lexicon.yaml       # Idiolecto, vocabulario característico, patrones lingüísticos
├── core-sima-organ.yaml    # Bases de pulsión, inventario de defensas, parámetros conductuales
└── core-umwelt.yaml        # Configuración del mundo: ubicación, horario, contexto social
```

La arquitectura de cassettes permite iterar personajes rápidamente sin modificar el motor cognitivo. Se pueden definir múltiples personajes y activar cualquiera cambiando un único valor de configuración.

---

## Despliegue — Integración con Discord

El sistema se despliega como aplicación de Discord con modalidades de voz y texto:

**Interfaz de comandos slash (`/<nombre_del_personaje>`):**

| Subcomando | Descripción |
|------------|-------------|
| `hablar` | Se une al canal de voz del usuario; todas las respuestas se sintetizan como audio con voz clonada |
| `textear` | Modo conversacional solo por texto |
| `audiorepite` | Sintetiza texto arbitrario como salida de audio |
| `desconectar` | Termina la sesión del canal de voz |

**Características conductuales:**
- La síntesis de voz utiliza un modelo de voz clonada via la API Hume AI Octave, manteniendo consistencia perceptual con la identidad del personaje.
- La lógica de desconexión automática monitorea la ocupación del canal de voz; el bot sale al detectar el canal vacío.
- El historial de conversación por usuario se mantiene durante la sesión con ventana de memoria configurable (por defecto: 20 intercambios).

---

## Arquitectura de proveedores LLM

El módulo `AIClient` implementa una abstracción agnóstica al proveedor con soporte para cambio en tiempo de ejecución entre backends de inferencia:

| Proveedor | Protocolo | Modelos representativos |
|-----------|-----------|------------------------|
| Google Gemini | API nativa Gemini | gemini-2.5-flash, gemini-2.5-pro |
| Groq | Compatible OpenAI | llama-3.3-70b-versatile, qwen3-32b |
| SambaNova | Compatible OpenAI | DeepSeek-V3.1, Qwen3-235B |
| OpenRouter | Compatible OpenAI | Acceso agregado a modelos |

Dos pipelines de inferencia independientes operan en paralelo:
- **Inferencia principal:** Genera respuestas del personaje bajo el system prompt dinámico completo.
- **Inferencia Umwelt:** Pipeline secundario ligero (proveedor configurable) que genera narrativas fenomenológicas del mundo sin cargar el prompt principal.

---

## Configuración de entorno

```env
# Proveedor LLM principal
GEMINI_API_KEY=
GROQ_API_KEY=
SAMBANOVA_API_KEY=
OPENROUTER_API_KEY=

# Síntesis de voz
HUME_API_KEY=
HUME_SECRET_KEY=
VOICE_ID_PELAO=

# Aplicación de Discord
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=

# Sistema
TZ=America/Santiago
```

---

## Interfaz de desarrollo

```bash
# Instalar dependencias
npm install

# CLI interactiva (sesión local con el personaje)
npm run dev

# CLI con inspección del system prompt
npm run debug

# Bot de Discord con hot-reload
npm run dev:bot

# Bot en modo producción
npm start

# Utilidades de diagnóstico
npm run info           # Resumen de configuración del sistema
npm run test:ia        # Prueba de conectividad con proveedores
npm run prompt:full    # Salida completa del system prompt
npm run prompt:umwelt  # Salida narrativa del Umwelt
```

---

## Despliegue en producción

El sistema está diseñado para despliegue en contenedores sobre [Railway](https://railway.app), aunque puede ejecutarse en cualquier entorno con soporte para Node.js — incluyendo un servidor backend propio (VPS, instancia EC2, servidor dedicado o cualquier host con acceso a terminal). Al iniciar, `discord/bootstrap.js` aprovisiona los archivos de cassette desde un endpoint configurado en Google Drive, permitiendo que los datos del personaje permanezcan externos al repositorio y se actualicen de forma independiente de los despliegues de la aplicación.

---

## Aplicaciones potenciales e investigación

- **Psicodinámica computacional:** Verificación empírica de constructos psicoanalíticos (marcadores somáticos, mecanismos de defensa, proceso primario) mediante medición conductual en entornos conversacionales.
- **Computación afectiva:** Plataforma de referencia para evaluar si el condicionamiento por estado de pulsión produce cambios estadísticamente medibles en las características de salida de modelos de lenguaje.
- **Investigación en interacción humano-computadora:** Estudio de la formación de apego a largo plazo y relaciones parasociales con agentes que exhiben necesidades homeostáticas simuladas.
- **Diseño de personajes sintéticos:** Pipeline de producción para personajes de IA persistentes en entretenimiento, desarrollo de videojuegos o narrativa interactiva, donde se requiere consistencia conductual entre sesiones.
- **Simulación clínica:** Prototipo para aplicaciones de entrenamiento que requieren agentes con respuestas psicológicamente auténticas ante estímulos interpersonales desafiantes.

---

## Requisitos técnicos

- Node.js >= 18.0.0
- Credenciales activas de al menos un proveedor LLM compatible
- Credenciales de Hume AI y voz clonada registrada para despliegue con voz habilitada
- Token de aplicación Discord y bot registrado

---

## Stack tecnológico

<div align="center">

| Categoría | Tecnología | Función |
|-----------|-----------|--------|
| **Runtime** | Node.js 18+ | Motor de ejecución |
| **IA Principal** | Google Gemini 2.5 Flash | Inferencia de respuestas del personaje |
| **IA Principal** | Groq — LLaMA 3.3 70B | Inferencia alternativa de alta velocidad |
| **IA Principal** | SambaNova — DeepSeek V3 | Inferencia de alto rendimiento |
| **IA Narrativa** | Cualquier proveedor OpenAI-compatible | Pipeline Umwelt (contexto del mundo) |
| **Voz** | Hume AI Octave 2 | Síntesis con voz clonada |
| **Voz** | ElevenLabs | Síntesis alternativa |
| **Discord** | discord.js v14 | Gateway y comandos slash |
| **Discord** | @discordjs/voice | Streaming de audio en canales de voz |
| **Config** | YAML | Definición de cassettes de personaje |
| **Deploy** | Railway | Plataforma de producción |
| **CLI** | chalk · boxen · ora · figlet | Interfaz de desarrollo local |

</div>

---

## Referencias

- Dietrich, A. (2023). *The Psi-Organ in a Nutshell.* Marco conceptual para modelado cognitivo por capas.
- Damasio, A. (1994). *El error de Descartes: La emoción, la razón y el cerebro humano.* Crítica.
- von Uexküll, J. (1934). *Incursión en los mundos de los animales y los hombres.* Springer.
- Freud, S. (1911). *Formulaciones sobre los dos principios del acaecer psíquico.* Obras Completas, Vol. 12.

---

## ¿Qué es esto, en definitiva?

Es una pregunta legítima.

A simple vista, Cynocruser es un bot de Discord. Entras a un canal de voz, invocas el comando, y comienza a escucharte. Te escucha en tiempo real, procesa lo que dices y te responde con una voz — no una voz sintética genérica, sino una voz clonada, con timbre, cadencia y carácter propios del personaje que habita el sistema.

Pero lo que ocurre por debajo no es un chatbot respondiendo desde un guión estático.

Antes de que el modelo de lenguaje reciba tu mensaje, el sistema ha procesado internamente una cadena de eventos que ningún prompt convencional contempla: los tanques de energía y afiliación del agente han decaído desde la última interacción; el módulo de percepción ha clasificado el tono de tu mensaje; el Yo ha evaluado si activar un mecanismo de defensa o responder con proceso secundario; la memoria ha recuperado marcadores somáticos de episodios anteriores; y el Umwelt ha generado una narrativa del mundo circundante — la hora, el clima, el entorno físico donde el personaje "existe" — para contextualizar su estado presente.

Solo entonces se construye el prompt. Y desde ese prompt, habla.

El resultado es un agente que no siempre responde igual a la misma pregunta. Que tiene días mejores y peores. Que puede estar cansado, o necesitar conexión, o ponerse defensivo si lo presionas. Que escucha lo que dices y construye una respuesta coherente con quién es, con cómo se siente en ese momento, y con lo que ha vivido en esa conversación.

No es inteligencia artificial general. No es una persona.

Es algo más específico y, posiblemente, más interesante: un sistema que demuestra que la *coherencia psicológica* en un agente conversacional no es una cuestión de cuántos parámetros tiene el modelo, sino de qué arquitectura envuelve su cognición.
