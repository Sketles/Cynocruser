# Cómo crear un cassette

Un cassette es la identidad completa de un personaje para Cynocruser.
Está compuesto por cuatro archivos YAML que juntos definen quién es,
cómo habla, cómo siente y en qué mundo vive.

---

## Pasos para crear tu personaje

### 1. Copia esta carpeta

Duplica la carpeta `mi-personaje/` y renómbrala con el ID de tu personaje.
El ID debe ser una sola palabra en minúscula, sin espacios ni tildes.

```
core/cassettes/mi-personaje/     <-- original (plantillas)
core/cassettes/luna/             <-- tu copia, renombrada
```

### 2. Rellena los cuatro archivos en orden

| Archivo | Qué define | Dificultad |
|---------|-----------|------------|
| `core-engram.yaml` | Identidad, psicología, historia de vida | Media |
| `core-lexicon.yaml` | Cómo habla, vocabulario, ejemplos reales | Alta (es la más importante) |
| `core-sima-organ.yaml` | Parámetros del sistema cognitivo | Baja (tiene guías numéricas) |
| `core-umwelt.yaml` | El mundo físico donde vive | Baja |

Empieza por `core-engram.yaml` y `core-lexicon.yaml`. Los otros dos tienen
valores por defecto que ya funcionan razonablemente bien.

### 3. Actualiza el ID en cada archivo

En cada YAML busca el campo `cassette_id` o `character_id` y reemplaza
`"mi-personaje"` con el ID que elegiste.

```yaml
meta:
  cassette_id: "luna"    # <-- cambia esto
```

### 4. Activa el cassette

En `core/config/cassette-settings.js`, cambia el valor de `cassette`:

```js
module.exports = {
    cassette: "luna"    // <-- el ID de tu personaje
}
```

### 5. Prueba

```bash
npm run dev        # CLI interactiva
npm run info       # Ver que el cassette cargó correctamente
```

---

## Consejos para mejores resultados

**Lo más importante es `core-lexicon.yaml`.**
Los ejemplos de conversación reales son lo que más impacto tiene en la calidad
del agente. Si puedes conseguir 10 o más ejemplos auténticos de cómo habla
la persona (mensajes de WhatsApp, Discord, etc.), el resultado será muy fiel.

**Para `core-sima-organ.yaml`:**
No tienes que entender la teoría para calibrarlo. Los comentarios en el archivo
tienen referencias directas:
- ¿Es una persona muy sensible a la crítica? Sube `damage_factor`.
- ¿Es muy sociable y se pone mal si nadie le habla? Sube `decay_rate` de afiliación.
- ¿Es tranquilo y estoico? Baja todos los `decay_rate`.

**Para `core-umwelt.yaml`:**
Las coordenadas son lo único realmente técnico. El resto es descripción libre.
Si no tienes las coordenadas exactas, usa las de la ciudad o barrio general.

---

## Estructura mínima que debe funcionar

Si quieres empezar rápido, estos campos son los absolutamente necesarios:

**core-engram.yaml:**
- `meta.cassette_id`
- `identity.name`
- `psychology.general_profile`

**core-lexicon.yaml:**
- `speech_style.general_description`
- Al menos 3 `conversation_examples`

**core-sima-organ.yaml:**
- `meta.character_id`
- `soma.initial_levels` (puedes dejar los valores de la plantilla)

**core-umwelt.yaml:**
- `location.lat` y `location.lon`
- `location.timezone`
