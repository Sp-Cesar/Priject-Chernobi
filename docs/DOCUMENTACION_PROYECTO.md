# DOCUMENTACIÓN DEL PROYECTO: CHERNÓBIL 86 — TURNO DE 90 SEGUNDOS

---

## 1. Título y Ficha Técnica

* **Título del Videojuego:** *Chernóbil 86: Turno de 90 Segundos*
* **Autor / Desarrollador:** César Sachun Pozo
* **Curso / Especialidad:** Diseño de Videojuegos — Desarrollo de Videojuegos Interactivos
* **Tecnología Principal:** JavaScript (ES Modules), HTML5 Canvas 2D, CSS3, Web Speech API y Web Audio API
* **Modalidad:** 1 Jugador por defecto / Multijugador Local opcional (2 Jugadores por relevos rápidos)
* **Control Principal:** Comandos de voz en español + respaldo por teclado y botones táctiles
* **Enlace Web (Publicación):** `[Insertar aquí URL generada al subir la carpeta a Netlify]`
* **Calidad Total Aplicada:** William Edwards Deming (Ciclo PHVA / PDCA y Principios de Calidad)

---

## 2. Descripción del Proyecto

**Chernóbil 86: Turno de 90 Segundos** es un videojuego arcade histórico e interactivo desarrollado íntegramente en **JavaScript**, ambientado en los hechos reales ocurridos tras la explosión del Reactor N.º 4 de la central nuclear de Chernóbil en 1986. El jugador asume el rol de los **liquidadores** —trabajadores, bomberos e ingenieros voluntarios que ingresaron manualmente a zonas de radiación extrema cuando los robots electrónicos colapsaron— controlando sus acciones directamente mediante **comandos de voz**.

El diseño busca **generar impacto histórico, empatía y conciencia** a través de la propia mecánica de juego: el tiempo de exposición es crítico, los pulsos de radiación exigen reacción inmediata con el comando `"ESCUDO"`, y el esfuerzo humano se estructura en dos escenarios históricos progresivos:

1. **Portada de Terminal de Emergencia:** Presenta la ilustración pixel art del Reactor 4, el nombre del autor (**César Sachun Pozo**), un selector de modalidad (**1 Jugador** por defecto o **2 Jugadores por relevos**), personalización de nombres con retratos pixel art y un **calibrador de micrófono en vivo** (medidor de volumen y transcripción previa).
2. **Nivel 1 — *El Techo del Reactor (26 de abril de 1986)*:** Escenario ambientado en la "Zona M", donde el jugador debe extinguir 8 focos de incendio y bloques de grafito radiactivo mediante el comando `"AGUA"`, mientras se protege de pulsos periódicos de radiación con `"ESCUDO"`.
3. **Nivel 2 — *Los Túneles Inundados (4 de mayo de 1986)*:** Homenaje directo a los tres ingenieros voluntarios (Alexei Ananenko, Valeri Bezpalov y Boris Baranov). Se desarrolla en completa oscuridad subterránea iluminada por una **linterna dinámica**, donde el objetivo es abrir **3 válvulas de drenaje** con el comando `"VÁLVULA"` o `"ABRIR"` para evitar una segunda explosión térmica.
4. **Mecánica de Voz Potenciada:** A través de `Web Audio API` (`AnalyserNode`), el juego mide la intensidad real de la voz. Hablar con mayor volumen activa el estado de **Potencia Alta**, duplicando el efecto del chorro de agua y el giro de las válvulas.
5. **Pantalla de Pausa, Audio y Efectos:** Permite pausar en cualquier momento (`"PAUSA"`, tecla `P`/`Esc` o botón superior), congelando la radiación y el reloj para reanudar, reiniciar nivel o volver a portada. Todos los efectos sonoros (contador Geiger dinámico, alarma soviética, manguera a presión, válvulas, bocina de relevo y música tensa) y visuales (partículas, vapor, ondas de choque, sacudida de cámara y estética de monitor CRT soviético) están integrados en tiempo real.

---

## 3. Objetivo General y Objetivos Específicos

### Objetivo General
Diseñar, desarrollar y desplegar en la web un videojuego arcade interactivo en JavaScript controlado por voz, basado en los hechos reales del desastre de Chernóbil de 1986, aplicando los principios de Calidad Total de William Edwards Deming para generar impacto educativo y reflexión histórica.

### Objetivos Específicos
1. **Implementar un motor de control por voz en español** basado en `Web Speech API` y `Web Audio API`, optimizado mediante sesiones limpias por comando para evitar repeticiones de búfer, con detección de intensidad vocal y respaldo de teclado para garantizar accesibilidad y estabilidad en vivo.
2. **Construir la identidad visual y sonora del videojuego** mediante un pipeline determinista de **Sprites**, **SpriteSheets** y archivos editables en **PixelEdit (`.pyxel`)** con estética apocalíptica de terminal CRT soviética, efectos de partículas, iluminación dinámica en Nivel 2 y audio procedural.
3. **Integrar mecánicas históricas y flexibilidad de juego** a través de una **Portada** con crédito de autor, **Nivel 1**, **Nivel 2**, **Pantalla de Pausa** y soporte configurable para **1 Jugador** (por defecto) o **2 Jugadores** en relevos cronometrados.
4. **Aplicar y evidenciar el Ciclo PHVA (Planificar, Hacer, Verificar, Actuar)** de William Edwards Deming durante el desarrollo, asegurando cero errores de consola, ajuste visual en pantalla estándar (`1280x720`) y despliegue HTTPS en la web mediante **Netlify**.

---

## 4. Marco Teórico (3 Autores)

### 4.1. Jesse Schell — *The Art of Game Design* (Tétrada Elemental)
Jesse Schell (2019) define todo videojuego como el equilibrio indivisible de cuatro elementos fundamentales conocidos como la **tétrada elemental**:
* **Mecánica:** Reglas, movimientos en cuadrícula, contención de focos, apertura de válvulas, gestión de dosis radiactiva y relevos opcionales.
* **Estética:** Interfaz tipo terminal CRT soviética con acero oxidado remachado, pantallas de fósforo verde, medidor Geiger analógico, retratos con máscara de gas y pixel art coherente.
* **Narrativa:** Reconstrucción cronológica en dos hitos reales (techo del reactor el 26 de abril y túneles el 4 de mayo de 1986) y cierre con hechos históricos verificados.
* **Tecnología:** Ejecución directa en navegador web mediante JavaScript modular, HTML5 Canvas 2D, `Web Speech API` y `Web Audio API`, eliminando barreras de instalación.

### 4.2. Katie Salen y Eric Zimmerman — *Rules of Play* (Juego Significativo)
Salen y Zimmerman (2004) establecen el concepto de **juego significativo (*meaningful play*)**, el cual ocurre cuando las acciones del jugador producen resultados **discernibles** (retroalimentación inmediata) e **integrados** (consecuencias duraderas en el sistema). En *Chernóbil 86*, cada palabra pronunciada por el jugador se traduce instantáneamente en tres niveles de respuesta:
1. **Visual:** Desplazamiento fluido, partículas de agua o vapor, ondas expansivas de escudo y variación de la aguja del dosímetro Geiger.
2. **Auditivo:** Sonido de pasos, chorro de agua a presión, clics del contador Geiger que aceleran con la radiación y alarma ante pulsos inminentes.
3. **Sistémico:** Reducción o incremento de `mSv/h`, bloqueo de pulsos (`+150 pts`), apertura gradual de válvulas y rotación de turnos entre liquidadores.

### 4.3. William Edwards Deming — *Calidad Total y Ciclo PHVA*
Deming (1986) plantea que la calidad no se logra "inspeccionando defectos al final", sino **construyendo la calidad dentro del proceso** mediante mejora continua constante y toma de decisiones basada en evidencia. Su herramienta operativa central, el **Ciclo PHVA (Planificar – Hacer – Verificar – Actuar)**, permite detectar desviaciones tempranas en diseño, latencia o usabilidad y corregirlas iterativamente hasta alcanzar un producto estable y centrado en el usuario final.

---

## 5. Estado del Arte (3 Autores y Referentes)

### 5.1. Ian Bogost — *Persuasive Games* (Retórica Procedimental)
Ian Bogost (2007) introduce el concepto de **retórica procedimental**, argumentando que los videojuegos generan impacto persuasivo no solo mediante textos o imágenes, sino haciendo que el jugador experimente una situación a través de sus **reglas y restricciones**. En *Chernóbil 86*, la imposibilidad de permanecer indefinidamente expuesto a la radiación y la necesidad de relevarse cada pocos segundos o protegerse constantemente comunican vivencialmente el dilema real que enfrentaron los liquidadores soviéticos.

### 5.2. David Michael y Sande Chen — *Serious Games*
Michael y Chen (2006) definen los **juegos serios (*serious games*)** como aquellos cuya finalidad primaria trasciende el entretenimiento puro para educar, entrenar o sensibilizar sobre problemáticas sociales o históricas reales. Este proyecto adopta el ritmo accesible de un arcade clásico combinado con datos reales de dosis radiactivas (`mSv/h`), cifras oficiales de participantes y reconocimiento a héroes históricos reales poco difundidos.

### 5.3. Adam Chapman — *Digital Games as History*
Chapman (2016) analiza cómo los videojuegos actúan como **medios de representación histórica**, distinguiendo entre estilos de simulación realista y **simulación conceptual** (donde las mecánicas abstraen procesos históricos complejos para hacerlos comprensibles e interactivos). *Chernóbil 86* emplea una simulación conceptual en pixel art: abstrae la arquitectura del reactor y la radiación en un tablero táctico de sectores, manteniendo fidelidad documental en fechas, roles y consecuencias.

### 5.4. Tabla Comparativa con Videojuegos Comerciales Controlados por Voz

| Referente / Proyecto | Año / Autor | Plataforma / Motor | Uso del Control por Voz | Enfoque / Diferencia frente a *Chernóbil 86* |
| :--- | :--- | :--- | :--- | :--- |
| ***Lifeline*** | 2003 (Konami / Sony) | PlayStation 2 (Micrófono USB) | Órdenes verbales en tiempo real a una sobreviviente por radio. | Pionero en órdenes por voz; comercial en consola, un solo jugador y temática ficción espacial. |
| ***Tom Clancy's EndWar*** | 2008 (Ubisoft) | PC / Consolas | Comandos tácticos de unidades en tiempo real por voz. | Estrategia militar compleja con decenas de comandos; requiere instalación pesada. |
| ***One Hand Clapping*** | 2021 (Bad Dream Games) | PC / Web / Consola | Control por tono y volumen del micrófono para puzles musicales. | Excelente referencia en uso de volumen real; enfocado en canto/plataformas, sin temática histórica. |
| ***Chernóbil 86: Turno de 90 Segundos*** | **2026 (César Sachun Pozo)** | **Web (JavaScript puro + HTML5 Canvas + Web Speech API)** | **Comandos de voz cortos en español + detección de voz alta (`AnalyserNode`) con sesión limpia anti-repetición.** | **Gratuito en navegador (HTTPS Netlify), hecho histórico real de alto impacto, modo 1J/2J por relevos, pixel art editable (`.pyxel`) y enfoque en Calidad Total.** |

---

## 6. Justificación

1. **Justificación Histórica y de Impacto Social:** El desastre de Chernóbil marcó un punto de inflexión mundial sobre la seguridad tecnológica y el sacrificio humano. Transformar los eventos del 26 de abril y 4 de mayo de 1986 en una experiencia jugable permite que estudiantes y espectadores valoren activamente la valentía de los liquidadores en lugar de leer datos pasivamente.
2. **Justificación Tecnológica (JavaScript Web Nativo):** Desarrollar el videojuego en **JavaScript puro (ES Modules)** sobre HTML5 Canvas sin motores propietarios pesados permite explicar cada módulo de código en clase, abrirlo desde cualquier navegador moderno sin descargas y publicarlo en segundos con soporte **HTTPS nativo en Netlify** (requisito técnico indispensable del navegador para autorizar el micrófono).
3. **Justificación de Usabilidad y Robustez:** El reconocimiento de voz en vivo en un salón de clases enfrenta ruido ambiental o navegadores restringidos. Por ello se justifica incluir un calibrador previo en portada, limpieza inmediata de búfer por comando, respaldo silencioso por teclado/botones táctiles y modalidad opcional **1 Jugador** (por defecto) o **2 Jugadores**.

---

## 7. Desarrollo: Diseño, Arte, Arquitectura y Código

### 7.1. Estructura Completa del Proyecto
```text
Project/
├── index.html                  # Terminal CRT, Portada, HUD, Panel de Voz y Modales <dialog>
├── styles.css                  # Estética Chernóbil: acero oxidado, remaches, fósforo verde y Geiger
├── netlify.toml                # Configuración de despliegue HTTPS y cabecera Permissions-Policy (micrófono)
├── README.md                   # Guía de uso, comandos de voz, entregables y despliegue
├── src/
│   ├── main.js                 # Arranque, enlace VoiceController/ChernobylGame/GameUI y teclado de respaldo
│   ├── config.js               # Dimensiones (7x5), niveles 1 y 2, diccionario de voz y textos históricos
│   ├── voice.js                # Controlador de voz híbrido (Web Speech API + Web Audio VU meter)
│   ├── game.js                 # Motor arcade: bucle RAF, modos 1J/2J, pausa, pulsos y linterna N2
│   ├── ui.js                   # Telemetría HUD, radar CRT de voz, aguja Geiger, guía visual y modales
│   ├── audio.js                # Sintetizador Web Audio (Geiger, agua, escudo, válvulas, alarmas y música)
│   ├── particles.js            # Motor de efectos: partículas, vapor, chorro de agua, ondas y sacudida
│   └── sprites.js              # Precarga y dibujado nítido de SpriteSheets sin suavizado (pixelated)
├── assets/
│   ├── spritesheets/           # 11 SpriteSheets/ilustraciones (portada, P1, P2, peligros, tiles, UI, banners)
│   ├── sprites/                # Sprites individuales separados en p1/, p2/, hazards/, level1/, level2/, ui/
│   └── pixeledit/              # 7 archivos editables .pyxel + sprites_manifest.json
└── docs/
    ├── capturas/               # 6 capturas oficiales en 1280x720
    ├── DOCUMENTACION_PROYECTO.md
    ├── GUION_DIAPOSITIVAS_PPT.md
    └── GUIA_ENTREGA_Y_VIDEO.md
```

### 7.2. Diseño Artístico, Sprites, SpriteSheets y PixelEdit
Todos los gráficos del juego se crearon como activos pixel art originales (PNG sin pérdida y paquetes ZIP válidos `.pyxel` compatibles con Pyxel Edit), organizados en `assets/`:

* **Personajes (`32x32` px por frame, escala entera 3x en tablero → `96x96` px):**
  * `liquidador_p1_sheet.png` (`160x32`, 5 fotogramas: `idle_1`, `idle_2`, `walk_1`, `action_water`, `shield`) — Traje protector amarillo.
  * `liquidador_p2_sheet.png` (`160x32`, 5 fotogramas) — Traje táctico azul para modo 2 jugadores.
* **Peligros y Objetivos (`32x32` px):** `hazards_sheet.png` (`192x32`, 6 fotogramas: `fire_1`, `fire_2`, `graphite_1`, `graphite_2`, `valve_closed`, `valve_open`).
* **Escenarios (`32x32` px):** `tiles_level1_sheet.png` (concreto, grietas, franja de peligro, rejilla) y `tiles_level2_sheet.png` (suelo húmedo, tuberías y agua inundada animada).
* **Interfaz y Retratos Chernóbil (`assets/spritesheets/ui_8bit_sheet.png`, `portraits_sheet.png`, `assets/sprites/ui/`):** 16 íconos de `16x16` (corazones de vida, trofeo, calavera, micrófono ON/OFF, audio ON/OFF, teclado, advertencias, flechas), retratos con máscara de gas de `32x32` (`portrait_p1.png`, `portrait_p2.png`), carátula de dosímetro (`geiger_plate.png` de `96x64`), fondo de Prípiat (`bg_pripyat_sky.png`) y banners cinemáticos (`gameover_chernobyl.png`, `victory_chernobyl.png`).
* **Editables PixelEdit (`assets/pixeledit/`):** `liquidador_p1.pyxel`, `liquidador_p2.pyxel`, `hazards_objects.pyxel`, `escenario_nivel1.pyxel`, `escenario_nivel2.pyxel`, `portraits.pyxel`, `ui_8bit.pyxel` y `sprites_manifest.json`.

### 7.3. Explicación de Código Clave

#### A) Control por Voz con Limpieza de Búfer (`src/voice.js`)
Para resolver la latencia y evitar que `Web Speech API` repita comandos acumulados en el búfer continuo al volver a pronunciar la misma palabra (`"arriba"` → `"arriba arriba"`), se diseñó un mecanismo de **sesión limpia por comando** (`continuous = false`) junto a un medidor de volumen en tiempo real (`AnalyserNode`):

```javascript
// src/voice.js — Ejecución única por comando y limpieza inmediata del búfer
rec.continuous = false;
rec.interimResults = true;
rec.maxAlternatives = 1;

rec.onresult = (event) => {
  if (rec !== this.recognition || consumed) return;
  this.networkErrors = 0;

  const startResult = Math.max(0, event.resultIndex || 0);
  for (let i = startResult; i < event.results.length; i++) {
    const result = event.results[i];
    const transcript = result[0]?.transcript || '';
    this.onTranscript(transcript.trim(), Boolean(result.isFinal));

    const clean = normalizeWord(transcript);
    const tokens = clean ? clean.split(/\s+/).filter(Boolean) : [];
    for (let t = 0; t < tokens.length; t++) {
      if (WORD_TO_CMD.has(tokens[t])) {
        this._dispatchWordIfCommand(tokens[t]);
        consumed = true;
        // Aborta la sesión actual para limpiar el búfer y abre una nueva en 220ms
        this._resetRecognitionSession(220);
        return;
      }
    }
  }
};
```

#### B) Efecto de Linterna Dinámica en Nivel 2 (`src/game.js`)
En el Nivel 2 (*Los Túneles Inundados*), la oscuridad subterránea se dibuja en un canvas auxiliar (`this.lightCanvas`) y se recorta dinámicamente alrededor del liquidador activo y de las válvulas mediante `globalCompositeOperation = 'destination-out'`:

```javascript
// src/game.js — Máscara de oscuridad y halo de linterna en Nivel 2
_renderDarkness(ctx, active) {
  const lctx = this.lightCtx;
  lctx.globalCompositeOperation = 'source-over';
  lctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
  lctx.fillStyle = 'rgba(4, 10, 6, 0.88)';
  lctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

  lctx.globalCompositeOperation = 'destination-out';
  const px = active.drawX + GAME_CONFIG.TILE_SIZE / 2;
  const py = active.drawY + GAME_CONFIG.TILE_SIZE / 2;
  const mainGrad = lctx.createRadialGradient(px, py, 28, px, py, GAME_CONFIG.FLASHLIGHT_RADIUS);
  mainGrad.addColorStop(0, 'rgba(0,0,0,1)');
  mainGrad.addColorStop(1, 'rgba(0,0,0,0)');
  lctx.fillStyle = mainGrad;
  lctx.beginPath();
  lctx.arc(px, py, GAME_CONFIG.FLASHLIGHT_RADIUS, 0, Math.PI * 2);
  lctx.fill();

  ctx.drawImage(this.lightCanvas, 0, 0);
}
```

#### C) Síntesis de Contador Geiger y Audio Procedural (`src/audio.js`)
El audio del juego no depende de archivos MP3 externos que puedan fallar al cargar: sintetiza clics Geiger estocásticos cuya frecuencia aumenta conforme sube la radiación, chorros de ruido blanco filtrado para el agua, alarmas bitonales soviéticas y música de fondo distinta por nivel.

### 7.4. Evidencia Visual (Capturas en `docs/capturas/`)
* `docs/capturas/01_portada.png` — Portada con selector `1 JUGADOR / 2 JUGADORES`, retratos, calibrador de voz y nombre del autor.
* `docs/capturas/02_briefing_controles_voz_teclado.png` — Modal previo al juego con guía visual de comandos por voz y teclado usando los sprites del proyecto.
* `docs/capturas/03_nivel1_techo_reactor.png` — Nivel 1 en vivo con alerta de pulso de radiación, escudo de plomo, partículas, radar CRT y dosímetro Geiger en rojo (`385 mSv/h`).
* `docs/capturas/04_pantalla_pausa.png` — Pantalla de Pausa (`MISIÓN EN PAUSA`) congelando la simulación sobre el modo 2 Jugadores.
* `docs/capturas/05_nivel2_tuneles_linterna.png` — Nivel 2 (*Los Túneles Inundados*) mostrando la oscuridad, linterna dinámica y apertura de válvula.
* `docs/capturas/06_victoria_impacto_historico.png` — Pantalla final de Victoria con banner pixel art, puntuación total, estadísticas y hechos históricos reales.

---

## 8. Principios de Calidad Total — William Edwards Deming

El proceso de desarrollo siguió el enfoque de **William Edwards Deming** (1986), priorizando la **prevención de defectos desde el diseño** y la **mejora continua iterativa** mediante el **Ciclo PHVA (Planificar – Hacer – Verificar – Actuar)**.

### 8.1. Principios de Deming Aplicados
1. **Crear constancia en el propósito hacia la mejora del producto:** Cada iteración se enfocó en acercar el videojuego al objetivo real (impacto histórico + confiabilidad en voz + coherencia visual Chernóbil).
2. **Adoptar la nueva filosofía y eliminar la dependencia de la inspección masiva tardía:** Se construyó verificación automática desde el inicio (verificación de firmas binarias PNG/ZIP de los activos, `node --check`, pruebas simuladas de voz y pruebas automatizadas de extremo a extremo en navegador a `1280x720`).
3. **Mejorar continuamente el sistema de producción y servicio:** No se cerró el proyecto en la primera versión funcional; se refinó la estética, la ergonomía y la respuesta vocal tras cada prueba real con usuario.
4. **Instituir la capacitación y claridad para el usuario:** Se integró un calibrador de micrófono en portada y una guía gráfica de controles antes de iniciar cada nivel para reducir a cero la curva de aprendizaje.
5. **Derribar barreras entre componentes (coherencia sistémica):** Se unificó la estética entre UI HTML/CSS, gráficos del `<canvas>`, audio y sprites pixel art en una sola terminal CRT soviética coherente.

### 8.2. Evidencia Real del Ciclo PHVA Ejecutado en el Proyecto

| Ciclo | Planificar (Plan) | Hacer (Do) | Verificar (Check) | Actuar (Act) |
| :--- | :--- | :--- | :--- | :--- |
| **PHVA 1 — Identidad Visual** | Reemplazar interfaz web genérica por una terminal CRT de Chernóbil coherente con el pixel art. | Generación de retratos, medidor Geiger analógico, cielo de Prípiat y placas metálicas oxidadas en `styles.css`. | En pruebas a `1280x720`, la barra lateral derecha en modo 2J alcanzó `766.06 px` (`46 px` de desbordamiento vertical) y el modal de victoria requería scroll interno. | Se compactaron los comandos a fila única, se alinearon banner y telemetría lado a lado y se validó que todo encaje en `<= 683 px` dentro de `1280x720`. |
| **PHVA 2 — Precisión del Control por Voz** | Evitar que el reconocimiento continuo repita palabras previas o dispare comandos fantasma. | Implementación inicial en `continuous = true` con deduplicación por tokens. | Al probar con micrófono real en Chrome, decir `"arriba"` dos veces repetía la acción y el error `network` en visor embebido quedaba en bucle `RECONECTANDO`. | Se rediseñó `src/voice.js` a **sesión limpia por comando** (`continuous = false` + `abort()` tras cada acción), se depuró `VOICE_COMMANDS`, se agregó watchdog `USA CHROME/EDGE` y se validó con pruebas unitarias en Node. |
| **PHVA 3 — Usabilidad y Flexibilidad** | Permitir juego individual rápido por defecto sin perder el requisito multijugador ni control de sesión. | Incorporación de guía visual de controles en Briefings, selector `1 JUGADOR / 2 JUGADORES` y pantalla de `MISIÓN EN PAUSA`. | Pruebas en vivo confirmaron congelamiento de reloj y radiación en pausa, relevos en 2J y modo 1J limpio sin elementos innecesarios. | Se ajustó el manejo de tecla `Esc` entre `<dialog>` y `window` para evitar doble activación al reanudar. |

---

## 9. Conclusiones

1. Se desarrolló satisfactoriamente el videojuego **Chernóbil 86: Turno de 90 Segundos** en **JavaScript puro**, cumpliendo todos los requisitos técnicos y académicos: Portada con el nombre del autor (**César Sachun Pozo**), Nivel 1, Nivel 2, control por voz, sonidos procedurales, efectos visuales, pausa y modalidad 1J/2J.
2. El diseño centrado en hechos reales (los liquidadores del techo y los ingenieros de los túneles inundados) demuestra que las mecánicas arcade por voz —como protegerse de pulsos radiactivos o coordinar relevos cortos— potencian el **impacto emocional y la memoria histórica**.
3. La arquitectura de **sesión limpia por comando** (`continuous = false` + reinicio inmediato del búfer) combinada con el medidor de intensidad vocal (`Web Audio API`) resolvió las repeticiones y falsos positivos propios del reconocimiento continuo en navegador.
4. La generación programática determinista de **Sprites**, **SpriteSheets** y archivos editables **PixelEdit (`.pyxel`)** aseguró coherencia absoluta entre los activos gráficos entregables y la estética final de terminal CRT soviética del juego.
5. La aplicación real de los **principios de Calidad Total y el Ciclo PHVA de William Edwards Deming** permitió detectar y resolver fallos concretos de latencia vocal, desbordamiento visual en `1280x720` y accesibilidad antes del despliegue final en **Netlify**.

---

## 10. Bibliografía (Norma APA 7.ª Edición)

* Bogost, I. (2007). *Persuasive games: The expressive power of videogames*. MIT Press.
* Chapman, A. (2016). *Digital games as history: How videogames represent the past and offer access to historical practice*. Routledge.
* Deming, W. E. (1986). *Out of the crisis*. MIT Center for Advanced Engineering Study.
* International Atomic Energy Agency [IAEA]. (2006). *Chernobyl’s legacy: Health, environmental and socio-economic impacts and recommendations to the governments of Belarus, the Russian Federation and Ukraine*. IAEA. https://www.iaea.org/sites/default/files/chernobyl.pdf
* Michael, D., & Chen, S. (2006). *Serious games: Games that educate, train, and inform*. Thomson Course Technology.
* Mozilla Developer Network [MDN]. (2025). *Web Speech API — SpeechRecognition*. MDN Web Docs. https://developer.mozilla.org/es/docs/Web/API/SpeechRecognition
* Mozilla Developer Network [MDN]. (2025). *Web Audio API*. MDN Web Docs. https://developer.mozilla.org/es/docs/Web/API/Web_Audio_API
* Salen, K., & Zimmerman, E. (2004). *Rules of play: Game design fundamentals*. MIT Press.
* Schell, J. (2019). *The art of game design: A book of lenses* (3rd ed.). A K Peters / CRC Press.
* United Nations Scientific Committee on the Effects of Atomic Radiation [UNSCEAR]. (2011). *Sources and effects of ionizing radiation: UNSCEAR 2008 report, Volume II, Annex D — Health effects due to radiation from the Chernobyl accident*. United Nations.
