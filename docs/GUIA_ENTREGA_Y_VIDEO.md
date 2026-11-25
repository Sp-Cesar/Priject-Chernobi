# GUÍA DE ENTREGABLES, PUBLICACIÓN EN NETLIFY Y VIDEO DEMOSTRATIVO

---

## 1. Checklist de Entregables del Docente

Verifica cada punto antes de enviar la tarea:

- [x] **Portada con Nombre y Apellido:** Visible en [index.html](file:///d:/Documentos/UTP/dise%C3%B1o%20video%20juegos/Project/index.html) (`César Sachun Pozo`) y capturada en `docs/capturas/01_portada.png`.
- [x] **Desarrollado en JavaScript:** Código modular editable en `src/` (`main.js`, `config.js`, `voice.js`, `game.js`, `ui.js`, `audio.js`, `particles.js`, `sprites.js`).
- [x] **Control por voz + Niveles 1 y 2 + Multijugador + Sonidos + Efectos:** Todos integrados y verificados (`1 JUGADOR` por defecto y `2 JUGADORES` opcional, Nivel 1, Nivel 2 con linterna, Pantalla de Pausa, contador Geiger procedural y partículas).
- [x] **Archivos PixelEdit, Sprites y SpriteSheets:**
  - SpriteSheets en `assets/spritesheets/` (11 archivos PNG).
  - Sprites individuales en `assets/sprites/` (`p1/`, `p2/`, `hazards/`, `level1/`, `level2/`, `ui/`).
  - Editables `.pyxel` de PixelEdit en `assets/pixeledit/` (7 archivos `.pyxel` + `sprites_manifest.json`).
- [x] **Pantallazos del juego:** 6 capturas en `docs/capturas/` (`01_portada.png` a `06_victoria_impacto_historico.png`).
- [x] **Documentación y Presentación (10 secciones + Deming + APA):** Listas en `docs/DOCUMENTACION_PROYECTO.md` y `docs/GUION_DIAPOSITIVAS_PPT.md`.
- [ ] **Publicar URL en Netlify:** Sigue los pasos de la Sección 2 de esta guía.
- [ ] **Grabar y subir Video Demostrativo:** Sigue el guion de la Sección 3.

---

## 2. Cómo Publicar en Netlify en 2 Minutos (HTTPS para el Micrófono)

1. Entra a **[https://app.netlify.com/](https://app.netlify.com/)** e inicia sesión (puedes entrar con GitHub o correo).
2. Ve a la pestaña **Sites** (o **Add new site → Deploy manually**).
3. Arrastra y suelta **toda la carpeta `Project`** (`d:\Documentos\UTP\diseño video juegos\Project`) dentro del recuadro de Netlify.
4. En ~10 segundos Netlify te dará una URL con **HTTPS** (ejemplo: `https://chernobil-86-cesar.netlify.app`).
   > *Nota:* El archivo `netlify.toml` ya está configurado con `Permissions-Policy = "microphone=(self)"` para que Google Chrome y Microsoft Edge permitan el micrófono de inmediato en esa URL.
5. **Prueba tu URL** en **Google Chrome o Microsoft Edge**, acepta el permiso del micrófono y copia ese enlace en la Sección 1 de `docs/DOCUMENTACION_PROYECTO.md` y en la Diapositiva 1 de tu PPT.

---

## 3. Guion de Video Demostrativo (90 Segundos)

Puedes grabar la pantalla con **OBS Studio** o el grabador de Windows (`Win + G`) en **Google Chrome** sobre tu URL de Netlify (o `http://127.0.0.1:4173/`):

1. **0:00 – 0:15 | Portada y Calibración:**
   - Muestra la portada en pantalla completa señalando el título, tu nombre **César Sachun Pozo** y el selector `1 JUGADOR / 2 JUGADORES`.
   - Haz clic en **`PROBAR MICRÓFONO`**, acepta el permiso y di `"ARRIBA"` para mostrar cómo sube la barra de volumen y aparece la transcripción.
2. **0:15 – 0:40 | Nivel 1 y Voz Potenciada:**
   - Inicia el Nivel 1, muestra brevemente la guía visual de controles y comienza.
   - Da comandos claros: `"DERECHA"`, `"AGUA"` (muestra cómo extingue el fuego con partículas y sonido de manguera), y cuando salga la alerta roja di `"ESCUDO"` para mostrar el bloqueo del pulso radiactivo (`+150 pts`).
   - Pulsa **`P`** o **`PAUSA [P]`** por 2 segundos para enseñar la pantalla de `MISIÓN EN PAUSA` y reanuda.
3. **0:40 – 1:05 | Multijugador 2J y Nivel 2 (Linterna):**
   - Muestra el cambio de turno (`RELEVO`) en modo 2 jugadores (o avanza al Nivel 2 para enseñar la oscuridad con **linterna dinámica**).
   - Acércate a una válvula roja y di `"VÁLVULA"` o `"ABRIR"` para mostrar cómo cambia a verde y suma progreso (`1/3 VÁLVULAS`).
4. **1:05 – 1:30 | Cierre de Impacto y Entregables:**
   - Muestra la pantalla de Victoria con los hechos históricos reales de los liquidadores.
   - Termina mostrando rápidamente las carpetas `assets/spritesheets/`, `assets/pixeledit/` (`.pyxel`) y el código en `src/voice.js` / `src/game.js`.

---

## 4. Tips Clave para la Exposición en Vivo

* Usa **Google Chrome** o **Microsoft Edge** (nunca un visor integrado ni Firefox para `Web Speech API`).
* Habla palabras **individuales** con una pausa breve (~0.4s) entre comando y comando (`"DERECHA"` ... `"AGUA"` ... `"ESCUDO"`).
* Si hay mucho ruido en el salón durante la exposición, recuerda que tienes activo el botón **`TECLADO`** en la esquina superior derecha como respaldo inmediato.
