// ╔═════════════════════════════════════════════════════════════════════════════╗
// ║                      C O N F I G U R A C I O N   I A                        ║
// ╚═════════════════════════════════════════════════════════════════════════════╝

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                     PROVIDERS & MODELS DISPONIBLES                        ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
// 
// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                                                                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
// GROQ
//   groq/compound, groq/compound-mini, llama-3.1-8b-instant,
//   llama-3.3-70b-versatile, meta-llama/llama-4-maverick-17b-128e-instruct,
//   meta-llama/llama-4-scout-17b-16e-instruct, qwen/qwen3-32b, allam-2-7b
// 
// SAMBANOVA
//   DeepSeek-R1-0528, DeepSeek-R1-Distill-Llama-70B, DeepSeek-V3.1,
//   DeepSeek-V3.1-Terminus, Qwen3-235B, Qwen3-32B, gpt-oss-120b,
//   Meta-Llama-3.3-70B-Instruct, Meta-Llama-3.1-8B-Instruct,
//   Llama-4-Maverick-17B-128E-Instruct, ALLaM-7B-Instruct-preview
// 
// GEMINI
//   gemini-2.0-flash, gemini-2.0-flash-exp, gemini-2.5-flash-lite,
//   gemini-2.5-flash, gemini-2.5-pro, gemini-1.5-flash, gemini-1.5-flash-8b,
//   gemini-1.5-pro, gemini-exp-1206
// 
// OPENROUTER
//   google/gemini-2.0-flash-exp:free, google/gemini-exp-1206:free,
//   meta-llama/llama-3.3-70b-instruct:free, meta-llama/llama-4-scout:free,
//   meta-llama/llama-4-maverick:free, deepseek/deepseek-r1:free,
//   qwen/qwen-2.5-72b-instruct:free, nvidia/llama-3.1-nemotron-70b-instruct:free
//   anthropic/claude-3.5-sonnet ($$$), anthropic/claude-3-opus ($$$$),
//   openai/gpt-4o ($$$), openai/o1-preview ($$$$), x-ai/grok-2-1212 ($$$)

module.exports = {
    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                      IA PRINCIPAL (MOTHER-IA)                         ║
    // ╠═══════════════════════════════════════════════════════════════════════╣
    // ║   Esta es la IA principal que genera las respuestas del personaje     ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    provider: 'gemini',
    model: 'gemini-3-flash',

    // Parámetros anti-repetición
    frequencyPenalty: 0.3,  // Penaliza repetir tokens
    presencePenalty: 0.2,   // Penaliza repetir temas

    maxTokens: 666,
    topP: 0.88,
    temperature: 0.88,
    memorySize: 20,
    useEmojis: false,

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║                      MINI-IA UMWELT (Narrativa)                       ║
    // ╠═══════════════════════════════════════════════════════════════════════╣
    // ║   Esta mini-IA genera relatos fenomenológicos del mundo circundante   ║
    // ║   Si está deshabilitada, usa templates estáticos (más rápido/gratis)  ║
    // ╚═══════════════════════════════════════════════════════════════════════╝

    umwelt: {
        enabled: true, //true or false to enable or disable umwelt-ia (narrative)
        provider: 'groq',
        model: 'groq/compound',
        maxTokens: 2000,
        temperature: 0.8,
        topP: 0.9
    }
};
