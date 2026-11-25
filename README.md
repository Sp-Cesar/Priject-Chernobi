# Chernóbil 86: Turno de 90 Segundos

Videojuego arcade histórico desarrollado en **JavaScript puro (HTML5 Canvas + ES Modules)** con **control por voz (`Web Speech API` + `Web Audio API`)**, **multijugador local por turnos rápidos**, arte pixel art original, efectos visuales y audio procedural.

**Autor:** César Sachun Pozo

---

## Cómo jugar (Control por Voz)
Se recomienda usar **Google Chrome** o **Microsoft Edge** sobre **HTTPS** (Netlify) o `localhost` para el reconocimiento de voz:

- `ARRIBA` / `ABAJO` / `IZQUIERDA` / `DERECHA`: Desplaza al liquidador activo por la cuadrícula.
- `AGUA` *(o `APAGAR`, `CHORRO`)*: Dispara chorro de agua a presión para apagar fuego o enfriar bloques de grafito (hablar más fuerte activa **Chorro Potenciado** con doble efecto y puntaje extra).
- `ESCUDO` *(o `CUBRIR`, `PROTEGER`)*: Activa el escudo de plomo por 3.5 s para bloquear pulsos de radiación (`+150 pts`).
- `VÁLVULA` *(o `ABRIR`, `GIRAR`)*: En el **Nivel 2 (Túneles Inundados)**, abre las 3 válvulas de drenaje en la oscuridad.
- `RELEVO` *(o `CAMBIO`, `TURNO`)*: Pasa el turno al segundo jugador y reduce la dosis del compañero en reposo.

*(Incluye botón **Respaldo Teclado** con teclas `WASD / Flechas`, `Espacio`, `E`, `V`, `R` en caso de ruido extremo en el aula).*

---

## Inventario de Entregables

- **Código fuente editable del juego:**
  - `index.html`, `styles.css`, `netlify.toml`
  - `src/config.js`, `src/sprites.js`, `src/audio.js`, `src/particles.js`, `src/voice.js`, `src/game.js`, `src/ui.js`, `src/main.js`
  - `tools/generate_assets.mjs` (generador determinista de sprites, spritesheets y archivos `.pyxel`)
- **SpriteSheets (`assets/spritesheets/`):**
  - `portada_chernobyl86.png` (`640x360`)
  - `liquidador_p1_sheet.png`, `liquidador_p2_sheet.png` (`160x32`, 5 frames c/u)
  - `hazards_sheet.png` (`192x32`, 6 frames)
  - `tiles_level1_sheet.png`, `tiles_level2_sheet.png` (`128x32`, 4 tiles c/u)
- **Sprites individuales (`assets/sprites/`):**
  - Carpetas `p1/`, `p2/`, `hazards/`, `level1/`, `level2/` con cada fotograma exportado en PNG.
- **Archivos editables PixelEdit (`assets/pixeledit/`):**
  - `liquidador_p1.pyxel`, `liquidador_p2.pyxel`, `hazards_objects.pyxel`, `escenario_nivel1.pyxel`, `escenario_nivel2.pyxel` y `sprites_manifest.json`.

---

## Publicación en Netlify (3 pasos)
1. Ingresa a [app.netlify.com](https://app.netlify.com) e inicia sesión.
2. Selecciona **Add new site → Deploy manually**.
3. Arrastra toda esta carpeta (`Project`) al recuadro de carga. En segundos tendrás tu URL con **HTTPS** habilitado y permisos de micrófono listos gracias a `netlify.toml`.

---

## Calidad Total Aplicada — William Edwards Deming (Ciclo PHVA)
1. **Planificar (Plan):** Definición del alcance histórico, turnos de relevo de 22s justificados por los liquidadores reales y diccionario fonético tolerante en español.
2. **Hacer (Do):** Construcción modular por capas (`voice.js`, `audio.js`, `particles.js`, `sprites.js`, `game.js`, `ui.js`) y pipeline determinista de SpriteSheets y `.pyxel`.
3. **Verificar (Check):** Pruebas sintácticas (`node --check`), verificación binaria de PNG/ZIP, y pruebas funcionales en vivo de Portada, Nivel 1, Nivel 2 y pantalla final.
4. **Actuar (Act):** Incorporación de reconocimiento en resultados parciales (*interim*) para bajar la latencia de voz, medidor VU de voz potenciada y panel de respaldo por teclado para exposición en aula.
