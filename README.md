# Cynocruser

**Cognitive Character Engine based on the Psi-Organ Model (SiMA Framework)**

A research-oriented artificial intelligence system that implements a computational model of the human psyche. Cynocruser simulates dynamic mental states, homeostatic drives, and psychic defense mechanisms to generate contextually adaptive conversational agents, deployed as a real-time voice-capable Discord bot.

---

## Overview

Cynocruser operationalizes the **Psi-Organ model** (Dietrich, 2023 — *"The Psi-Organ in a Nutshell"*), a neuro-cognitive architecture that models the mind as a layered biological system governed by somatic needs, symbolic perception, and ego-mediated decision processes.

Unlike conventional large language model (LLM) wrappers, this system does not rely on a static system prompt. Instead, it constructs a **dynamic, state-dependent prompt** on every inference cycle, encoding the agent's current physiological state, emotional valence, active defense mechanisms, world context, and episodic memory traces. The result is an agent whose behavioral profile is non-deterministic, internally consistent, and sensitive to interaction history.

---

## Scientific Background

The architecture draws from several disciplines:

- **Psychodynamic theory:** Implementation of primary and secondary process thinking, somatic markers, and ego defense mechanisms (repression, somatic avoidance, projection) as discrete computational modules.
- **Homeostatic modeling:** Five independent drive tanks (energy, integrity, affiliation, certainty, competence) decay over time following parameterizable depletion curves. Critical thresholds trigger behavioral mode shifts analogous to motivational urgency in biological systems.
- **Phenomenological world modeling (Umwelt):** Inspired by Jakob von Uexküll's concept of the species-specific perceptual world, the system maintains a generative narrative layer that contextualizes the agent's environment (temporal, meteorological, and social context) using a secondary LLM inference pipeline.
- **Episodic memory with somatic marking:** Damasio's somatic marker hypothesis is partially implemented through a memory module that tags episodic records with affective valence and physiological state at encoding time, influencing subsequent retrieval and behavioral weighting.

---

## Architecture

```
cynocruser/
├── core/
│   ├── organo-sima/
│   │   ├── L1_hypothalamus/     # Soma: homeostatic drive management
│   │   ├── L2_thalamus/         # Perception: symbolic classification of input
│   │   ├── L3_cortex/           # Ego: primary/secondary process + decision engine
│   │   ├── hippocampus/         # Episodic memory with somatic markers
│   │   └── umwelt/              # World simulator: phenomenological context generation
│   ├── builders/                # System prompt construction layer
│   ├── cassettes/               # YAML character definitions (engram, lexicon, organ config)
│   ├── services/
│   │   ├── ai-client.js         # Multi-provider LLM abstraction layer
│   │   ├── tts.js               # Text-to-speech synthesis (Hume AI / ElevenLabs)
│   │   └── weatherService.js    # Environmental data feed for Umwelt
│   └── config/
├── discord/
│   ├── bot.js                   # Discord gateway client and event dispatcher
│   ├── bootstrap.js             # Remote cassette provisioning (Google Drive / Railway)
│   ├── commands/factory.js      # Slash command generation and interaction handling
│   └── services/voiceChannel.js # Voice channel management and audio streaming
├── scripts/                     # Development and diagnostic utilities
├── execute.js                   # Interactive CLI for local testing
└── docs/                        # Research notes and architectural documentation
```

---

## Inference Pipeline

Each user message triggers the following deterministic sequence:

```
Input received
    |
    v
L1 — Metabolic tick: drive tanks depleted by baseline decay rates
    |
    v
L2 — Perceptual classification: input mapped to stimulus type
     (ATTACK / AFFECTION / AMBIGUITY / REJECTION / CHALLENGE / NEUTRAL)
    |
    v
L1 — Somatic update: drive tanks modified by stimulus-specific impact functions
    |
    v
L3 — Ego processing:
       Primary process  →  affective, associative, drive-dominated response
       Secondary process →  reality-adapted, socially regulated response
       Decision engine  →  behavioral mode selection + defense mechanism activation
    |
    v
Hippocampus — Episode recorded with somatic and affective markers
    |
    v
Umwelt — Phenomenological world context generated via secondary LLM inference
    |
    v
Prompt builder — Dynamic system prompt assembled from all subsystem outputs
    |
    v
LLM inference — Response generated under the constructed cognitive context
```

---

## Somatic Drive System

| Drive | Baseline | Depletion Trigger | Critical Threshold |
|-------|----------|-------------------|-------------------|
| Energy | 100 | Per interaction | < 15 |
| Integrity | 100 | Hostile input | < 30 |
| Affiliation | 70 | Social inactivity | < 20 |
| Certainty | 80 | Ambiguous input | Configurable |
| Competence | 75 | Unresolved challenges | Configurable |

When drives breach critical thresholds, the system transitions to altered behavioral modes: heightened primary process dominance, shortened response length, increased use of psychic defenses, or spontaneous proactive output.

---

## Character Definition — Cassette System

Character identities are defined through structured YAML manifests called **cassettes**, separating behavioral configuration from engine logic:

```
core/cassettes/<character_id>/
├── core-engram.yaml        # Identity, biography, values, communication style
├── core-lexicon.yaml       # Idiolect, characteristic vocabulary, linguistic patterns
├── core-sima-organ.yaml    # Drive baselines, defense inventory, behavioral parameters
└── core-umwelt.yaml        # World configuration: location, schedule, social context
```

The cassette architecture enables rapid character iteration without modifying the cognitive engine. Multiple characters can be defined and activated by changing a single configuration value.

---

## Deployment — Discord Integration

The system is deployed as a Discord application implementing voice and text modalities:

**Slash command interface (`/pelao`):**

| Subcommand | Description |
|------------|-------------|
| `hablar` | Joins the user's voice channel; all responses synthesized as cloned-voice audio |
| `textear` | Text-only conversational mode |
| `audiorepite` | Synthesizes arbitrary input text as audio output |
| `desconectar` | Terminates voice channel session |

**Behavioral features:**
- Voice synthesis uses a cloned voice model via Hume AI Octave API, maintaining perceptual consistency with the character identity.
- Auto-disconnect logic monitors voice channel occupancy; the bot exits upon detecting an empty channel.
- Per-user conversation history is maintained across the session with configurable memory window (default: 20 exchanges).

---

## LLM Provider Architecture

The `AIClient` module implements a provider-agnostic abstraction supporting runtime switching between inference backends:

| Provider | Protocol | Representative Models |
|----------|----------|-----------------------|
| Google Gemini | Native Gemini API | gemini-2.5-flash, gemini-2.5-pro |
| Groq | OpenAI-compatible | llama-3.3-70b-versatile, qwen3-32b |
| SambaNova | OpenAI-compatible | DeepSeek-V3.1, Qwen3-235B |
| OpenRouter | OpenAI-compatible | Aggregated model access |

Two independent inference pipelines operate in parallel:
- **Primary inference:** Generates character responses under the full dynamic system prompt.
- **Umwelt inference:** Lightweight secondary pipeline (configurable provider) generates phenomenological world narratives without loading the primary prompt.

---

## Environment Configuration

```env
# Primary LLM provider
GEMINI_API_KEY=
GROQ_API_KEY=
SAMBANOVA_API_KEY=
OPENROUTER_API_KEY=

# Voice synthesis
HUME_API_KEY=
HUME_SECRET_KEY=
VOICE_ID_PELAO=

# Discord application
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=

# System
TZ=America/Santiago
```

---

## Development Interface

```bash
# Install dependencies
npm install

# Interactive CLI (local character session)
npm run dev

# CLI with system prompt inspection
npm run debug

# Discord bot with hot-reload
npm run dev:bot

# Run bot in production mode
npm start

# Diagnostic utilities
npm run info           # System configuration summary
npm run test:ia        # Provider connectivity test
npm run prompt:full    # Full system prompt output
npm run prompt:umwelt  # Umwelt narrative output
```

---

## Production Deployment

The system is designed for containerized deployment on [Railway](https://railway.app). On startup, `discord/bootstrap.js` provisions the cassette files from a configured Google Drive endpoint, enabling character data to remain external to the repository and updated independently of application deployments.

---

## Potential Research and Applied Use Cases

- **Computational psychodynamics:** Empirical testing of psychoanalytic constructs (somatic markers, defense mechanisms, primary process) through behavioral measurement in conversational settings.
- **Affective computing:** Benchmark platform for evaluating whether drive-state conditioning produces statistically measurable shifts in language model output characteristics.
- **Human-computer interaction research:** Study of long-term user attachment and parasocial relationship formation with agents exhibiting simulated homeostatic needs.
- **Synthetic character design:** Production pipeline for persistent AI characters in entertainment, game development, or interactive narrative, where behavioral consistency across sessions is required.
- **Clinical simulation:** Prototype for training applications requiring agents that exhibit psychologically authentic responses to challenging interpersonal stimuli.

---

## Technical Requirements

- Node.js >= 18.0.0
- Active API credentials for at least one supported LLM provider
- Hume AI credentials and a registered voice clone for voice-enabled deployment
- Discord application token and registered bot

---

## Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| LLM inference | Google Gemini API, Groq, SambaNova, OpenRouter |
| Voice synthesis | Hume AI Octave 2, ElevenLabs |
| Discord integration | discord.js v14, @discordjs/voice |
| Character configuration | YAML |
| Environment | dotenv |
| CLI interface | chalk, boxen, ora, figlet |

---

## References

- Dietrich, A. (2023). *The Psi-Organ in a Nutshell.* Conceptual framework for layered cognitive modeling.
- Damasio, A. (1994). *Descartes' Error: Emotion, Reason, and the Human Brain.* Putnam.
- von Uexküll, J. (1934). *A Foray into the Worlds of Animals and Humans.* Springer.
- Freud, S. (1911). *Formulations on the Two Principles of Mental Functioning.* Standard Edition, Vol. 12.
