# GUION DE DIAPOSITIVAS (PPT / CANVA / GOOGLE SLIDES)
**Proyecto:** *Chernóbil 86: Turno de 90 Segundos*  
**Expositor / Autor:** César Sachun Pozo  
**Duración estimada de exposición:** 6 a 8 minutos + demostración funcional en vivo

> **Consejo visual para Canva / PowerPoint:** Usa fondo oscuro (`#0a120d` o `#141813`), títulos en amarillo ámbar (`#f2d64b`), subtítulos en verde fósforo (`#48ff62`) y texto principal en blanco hueso (`#e6eedb`). Así tus diapositivas combinarán exactamente con la estética del videojuego.

---

### Diapositiva 1 — Portada / Título
* **Título:** CHERNÓBIL 86: TURNO DE 90 SEGUNDOS
* **Texto en lámina:**
  * Videojuego Arcade Histórico Controlado por Voz en JavaScript
  * **Autor:** César Sachun Pozo
  * **Calidad Total aplicada:** William Edwards Deming (Ciclo PHVA)
  * **URL Web (Netlify):** `[Pegar aquí tu enlace de Netlify]`
* **Imagen recomendada:** `docs/capturas/01_portada.png` (o `assets/spritesheets/portada_chernobyl86.png`)
* **Guion del expositor (qué decir):**
  > "Buenas noches docente y compañeros. Mi nombre es César Sachun Pozo y les presento *Chernóbil 86: Turno de 90 Segundos*, un videojuego arcade histórico desarrollado íntegramente en JavaScript donde el jugador controla las mecánicas mediante comandos de voz en tiempo real."

---

### Diapositiva 2 — Descripción del Proyecto
* **Título:** ¿QUÉ ES CHERNÓBIL 86: TURNO DE 90 SEGUNDOS?
* **Texto en lámina:**
  * Basado en hechos reales: **26 de abril y 4 de mayo de 1986**.
  * **Control por voz (`Web Speech API`):** `ARRIBA`, `ABAJO`, `IZQUIERDA`, `DERECHA`, `AGUA`, `ESCUDO`, `VÁLVULA`, `RELEVO` y `PAUSA`.
  * **Voz Potenciada (`Web Audio API`):** hablar con mayor intensidad duplica el efecto de `AGUA` y `VÁLVULA`.
  * **Modalidad flexible:** 1 Jugador por defecto o **2 Jugadores Multijugador Local por relevos**.
  * **Incluye:** Portada con autor, Nivel 1, Nivel 2, Pausa, sonidos procedurales y efectos visuales CRT.
* **Imagen recomendada:** `docs/capturas/02_briefing_controles_voz_teclado.png`
* **Guion del expositor:**
  > "Cuando explotó el Reactor 4 de Chernóbil, la radiación destruyó los robots electrónicos y miles de voluntarios —los liquidadores— tuvieron que entrar en turnos de apenas segundos. En este juego revivimos dos momentos críticos usando nuestra propia voz para dar órdenes rápidas bajo presión, con opción de jugar solo o en relevos de dos jugadores."

---

### Diapositiva 3 — Objetivo General y Objetivos Específicos
* **Título:** OBJETIVOS DEL PROYECTO
* **Texto en lámina:**
  * **Objetivo General:** Diseñar, desarrollar y publicar en la web un videojuego arcade en JavaScript controlado por voz, basado en los hechos reales de Chernóbil (1986), aplicando Calidad Total de Deming para generar impacto histórico.
  * **Objetivos Específicos:**
    1. Implementar reconocimiento de voz en español de baja latencia con medición de volumen y respaldo por teclado.
    2. Crear arte pixel art original (Sprites, SpriteSheets y `.pyxel`), audio procedural y efectos CRT.
    3. Estructurar Portada, Nivel 1 (*Techo del Reactor*), Nivel 2 (*Túneles Inundados*), Pausa y modo 1J/2J.
    4. Aplicar el Ciclo PHVA de Deming y desplegar la versión final con HTTPS en Netlify.
* **Imagen recomendada:** Íconos `assets/sprites/ui/portrait_p1.png`, `trophy.png`, `rad_icon.png`
* **Guion del expositor:**
  > "Nuestro objetivo general fue construir un juego web accesible en JavaScript que una tecnología de control por voz con memoria histórica de alto impacto, respaldado por entregables completos de arte pixel art y validación continua bajo el enfoque de Deming."

---

### Diapositiva 4 — Marco Teórico (3 Autores)
* **Título:** MARCO TEÓRICO
* **Texto en lámina:**
  * **Jesse Schell (2019) — *Tétrada Elemental*:** Equilibrio entre Mecánica (turnos y dosis), Estética (terminal CRT soviética), Narrativa (hechos de 1986) y Tecnología (JS + Web Speech + Canvas).
  * **Katie Salen y Eric Zimmerman (2004) — *Juego Significativo*:** Cada acción por voz produce respuesta discernible visual (partículas, aguja Geiger), auditiva (clics Geiger, chorro) y sistémica (`mSv/h`).
  * **William Edwards Deming (1986) — *Calidad Total*:** Calidad integrada desde el diseño y mejora iterativa continua mediante el Ciclo PHVA.
* **Imagen recomendada:** Diagrama simple de 4 bloques (Mecánica / Estética / Narrativa / Tecnología) + `docs/capturas/03_nivel1_techo_reactor.png`
* **Guion del expositor:**
  > "En el marco teórico nos apoyamos en tres pilares: Jesse Schell para equilibrar mecánica, estética, narrativa y tecnología; Salen y Zimmerman para asegurar retroalimentación inmediata tras cada comando de voz; y William Edwards Deming para guiar todo el proceso constructivo con calidad total."

---

### Diapositiva 5 — Estado del Arte (3 Autores y Comparativa)
* **Título:** ESTADO DEL ARTE
* **Texto en lámina:**
  * **Ian Bogost (2007) — *Retórica Procedimental*:** Las reglas del juego comunican el impacto histórico (la presión de los pulsos y relevos).
  * **David Michael y Sande Chen (2006) — *Serious Games*:** Juegos que educan y sensibilizan sobre hechos reales manteniendo el atractivo lúdico.
  * **Adam Chapman (2016) — *Digital Games as History*:** Simulación conceptual histórica accesible en entornos interactivos.
  * **Referentes de Voz:** *Lifeline* (2003), *EndWar* (2008), *One Hand Clapping* (2021) → **Diferenciador:** *Chernóbil 86* corre 100% gratis en navegador web sin descargas y une comandos de voz + intensidad vocal con hechos reales de 1986.
* **Imagen recomendada:** Tabla comparativa compacta (4 filas de la sección 5.4 de `DOCUMENTACION_PROYECTO.md`)
* **Guion del expositor:**
  > "A partir de Bogost, Michael & Chen y Chapman entendemos cómo las mecánicas generan conciencia histórica. A diferencia de juegos comerciales de voz como *Lifeline* o *EndWar*, nuestro proyecto corre directamente en el navegador mediante JavaScript y combina comandos verbales con detección real del volumen de voz."

---

### Diapositiva 6 — Justificación
* **Título:** JUSTIFICACIÓN DEL PROYECTO
* **Texto en lámina:**
  * **Impacto Social e Histórico:** Rescata la memoria de los liquidadores y los tres voluntarios que evitaron una segunda explosión nuclear.
  * **Accesibilidad Tecnológica:** Desarrollado en **JavaScript puro** (sin instalaciones ni motores pesados) y desplegado con **HTTPS en Netlify** para habilitar el micrófono en cualquier PC.
  * **Confiabilidad en Aula:** Incorpora calibrador previo de micrófono, limpieza de búfer anti-repetición, pausa y respaldo táctil/teclado ante ruido ambiental.
* **Imagen recomendada:** `docs/capturas/01_portada.png` (destacando el calibrador de micrófono)
* **Guion del expositor:**
  > "Elegimos JavaScript puro porque permite publicar al instante en Netlify con HTTPS —indispensable para que el navegador habilite el micrófono— y porque facilita demostrar el código fuente línea por línea. Además, la temática histórica busca generar empatía real con quienes arriesgaron su vida en 1986."

---

### Diapositiva 7 — Desarrollo: Arte Pixel Art, Sprites y PixelEdit
* **Título:** DESARROLLO I — DISEÑO VISUAL, SPRITES Y PIXELEDIT
* **Texto en lámina:**
  * **Estética Unificada:** Terminal CRT soviética de acero oxidado remachado, fósforo verde y dosímetro Geiger analógico.
  * **Pipeline Determinista (`tools/generate_assets.mjs`):**
    * **11 SpriteSheets** (`portada`, `liquidador_p1`, `liquidador_p2`, `hazards`, `tiles_level1`, `tiles_level2`, `ui_8bit`, `portraits`, `bg_pripyat_sky`, `gameover`, `victory`).
    * **Sprites individuales** organizados en `assets/sprites/`.
    * **7 archivos editables PixelEdit (`.pyxel`)** + `sprites_manifest.json` en `assets/pixeledit/`.
* **Imagen recomendada:** Recortes o vista de `assets/spritesheets/liquidador_p1_sheet.png`, `hazards_sheet.png` y `portraits_sheet.png`
* **Guion del expositor:**
  > "En el apartado visual generamos todas nuestras hojas de sprites, fotogramas individuales y siete archivos editables en formato `.pyxel` para PixelEdit. Cada botón, barra segmentada, retrato con máscara de gas y carátula del dosímetro Geiger sigue una única estética apocalíptica coherente."

---

### Diapositiva 8 — Desarrollo: Arquitectura del Proyecto en JavaScript
* **Título:** DESARROLLO II — ARQUITECTURA MODULAR EN JAVASCRIPT
* **Texto en lámina:**
  * `src/main.js` → Orquestación general y eventos de teclado de respaldo.
  * `src/config.js` → Mapas `7x5` de Nivel 1 y 2, diccionario fonético y textos históricos.
  * `src/voice.js` → `VoiceController` (`Web Speech API` + `Web Audio` medidor VU).
  * `src/game.js` → `ChernobylGame` (bucle `requestAnimationFrame`, modos 1J/2J, pausa, linterna N2).
  * `src/audio.js` → `SoundEngine` (contador Geiger dinámico, alarmas y efectos sintetizados).
  * `src/particles.js` → `EffectsEngine` (chorro de agua, vapor, chispas y sacudida de cámara).
  * `src/ui.js` y `src/sprites.js` → Radar CRT, aguja Geiger, modales `<dialog>` y carga de sprites.
* **Imagen recomendada:** Diagrama simple de módulos conectando `voice.js` → `game.js` → `ui.js` / `audio.js` / `particles.js`
* **Guion del expositor:**
  > "El código está separado en 8 módulos ES6 claros y sin dependencias externas. Esto separa limpiamente el reconocimiento de voz, la lógica del juego, el sintetizador de audio, las partículas y la interfaz HUD."

---

### Diapositiva 9 — Desarrollo: Mecánicas de Voz y Código Clave
* **Título:** DESARROLLO III — CÓDIGO DE VOZ Y NIVELES
* **Texto en lámina:**
  * **Solución anti-repetición (`src/voice.js`):** Sesión única por comando (`continuous = false`) + `rec.abort()` inmediato y reinicio limpio en `220ms` para limpiar el búfer tras cada orden.
  * **Linterna Dinámica en Nivel 2 (`src/game.js`):** Uso de canvas auxiliar con `globalCompositeOperation = 'destination-out'` para recortar el haz de luz alrededor del liquidador en los túneles oscuros.
  * **Audio Procedural (`src/audio.js`):** Síntesis en tiempo real sin archivos externos pesados.
* **Imagen recomendada:** Fragmento breve de código de `src/voice.js` o `src/game.js` + `docs/capturas/05_nivel2_tuneles_linterna.png`
* **Guion del expositor:**
  > "Uno de los mayores retos técnicos del control por voz fue evitar que el navegador repitiera el comando anterior al hablar dos veces seguidas. Lo resolvimos reiniciando limpiamente la sesión tras cada comando en 220 milisegundos. Además, en el Nivel 2 implementamos iluminación dinámica con linterna recortando la capa de oscuridad sobre el canvas."

---

### Diapositiva 10 — Desarrollo: Pantallas del Juego (Nivel 1, Pausa y Nivel 2)
* **Título:** PANTALLAS Y JUGABILIDAD EN ACCIÓN
* **Texto en lámina:**
  * **Nivel 1 — El Techo del Reactor:** Extinguir 8 focos de fuego y grafito esquivando pulsos de radiación con `ESCUDO`.
  * **Pantalla de Pausa (`PAUSA` / `P` / `Esc`):** Congela tiempo y radiación; permite reanudar, reiniciar nivel o volver a portada.
  * **Nivel 2 — Los Túneles Inundados:** Abrir las 3 válvulas reales en la oscuridad (`Ananenko`, `Bezpalov` y `Baranov`).
* **Imagen recomendada:** Collage con `docs/capturas/03_nivel1_techo_reactor.png`, `04_pantalla_pausa.png` y `05_nivel2_tuneles_linterna.png`
* **Guion del expositor:**
  > "Aquí observamos las capturas reales del juego funcionando en `1280x720`: el Nivel 1 con las alertas de pulso y el dosímetro Geiger marcando `385 mSv/h`, la pantalla de pausa, y el Nivel 2 en los túneles oscuros al abrir la primera válvula."

---

### Diapositiva 11 — Principios de Calidad Total (William Edwards Deming)
* **Título:** CALIDAD TOTAL APLICADA — WILLIAM EDWARDS DEMING
* **Texto en lámina:**
  * **Principios de Deming aplicados:**
    * Calidad integrada desde el diseño (no solo al final).
    * Mejora continua basada en pruebas reales con usuario.
    * Claridad y capacitación al jugador (calibrador de voz + guía visual).
  * **Ciclos PHVA ejecutados en este proyecto:**
    1. **Estética y Encaje (`1280x720`):** Se corrigió desbordamiento vertical de `46px` en barra lateral y scroll en modal final.
    2. **Motor de Voz:** Se eliminaron falsos positivos, el bucle `network` y las repeticiones de comandos.
    3. **Usabilidad:** Se añadieron modo `1 JUGADOR` por defecto (2J opcional) y pantalla de `PAUSA`.
* **Imagen recomendada:** Diagrama circular PHVA (Planificar → Hacer → Verificar → Actuar) + `docs/capturas/06_victoria_impacto_historico.png`
* **Guion del expositor:**
  > "Aplicamos la filosofía de William Edwards Deming mediante ciclos reales de Planificar-Hacer-Verificar-Actuar. Cada vez que detectamos un defecto —como el desbordamiento de 46 píxeles en pantalla o la repetición de comandos de voz— corregimos la causa raíz en el código y volvimos a verificar hasta lograr cero errores de consola."

---

### Diapositiva 12 — Conclusiones
* **Título:** CONCLUSIONES
* **Texto en lámina:**
  1. Se construyó un videojuego web completo en **JavaScript** controlado por voz y basado en hechos reales de **Chernóbil 1986**.
  2. El uso de mecánicas de exposición radiactiva y turnos limitados logra un **impacto educativo y humano** superior a la exposición pasiva de texto.
  3. La estrategia de **sesión limpia por comando** + medidor de intensidad (`Web Audio API`) garantizó un control por voz preciso y sin repeticiones.
  4. El pipeline de **Sprites, SpriteSheets y `.pyxel`** consolidó una identidad visual CRT retro coherente en toda la interfaz.
  5. El **Ciclo PHVA de Deming** aseguró estabilidad técnica, encaje exacto en `1280x720` y despliegue inmediato en **Netlify**.
* **Imagen recomendada:** `docs/capturas/06_victoria_impacto_historico.png`
* **Guion del expositor:**
  > "En conclusión, logramos un videojuego estable, impactante e intuitivo que demuestra cómo JavaScript nativo, el reconocimiento de voz y los principios de calidad total de Deming pueden integrarse en un proyecto funcional listo para la web. Muchas gracias; ahora pasamos a la demostración en vivo."

---

### Diapositiva 13 — Bibliografía (Norma APA)
* **Título:** REFERENCIAS BIBLIOGRÁFICAS (APA 7.ª ED.)
* **Texto en lámina:**
  * Bogost, I. (2007). *Persuasive games: The expressive power of videogames*. MIT Press.
  * Chapman, A. (2016). *Digital games as history*. Routledge.
  * Deming, W. E. (1986). *Out of the crisis*. MIT Center for Advanced Engineering Study.
  * IAEA. (2006). *Chernobyl’s legacy: Health, environmental and socio-economic impacts*. IAEA.
  * Michael, D., & Chen, S. (2006). *Serious games: Games that educate, train, and inform*. Thomson.
  * MDN Web Docs. (2025). *Web Speech API* y *Web Audio API*. Mozilla.
  * Salen, K., & Zimmerman, E. (2004). *Rules of play: Game design fundamentals*. MIT Press.
  * Schell, J. (2019). *The art of game design: A book of lenses* (3rd ed.). CRC Press.
* **Guion del expositor:**
  > "Estas son las referencias académicas, técnicas e históricas que respaldan nuestro marco teórico, estado del arte y modelo de calidad. Quedo atento a sus preguntas mientras iniciamos la demostración funcional."
