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


## Calidad Total Aplicada — William Edwards Deming (Ciclo PHVA)
1. **Planificar (Plan):** Definición del alcance histórico, turnos de relevo de 22s justificados por los liquidadores reales y diccionario fonético tolerante en español.
2. **Hacer (Do):** Construcción modular por capas (`voice.js`, `audio.js`, `particles.js`, `sprites.js`, `game.js`, `ui.js`) y pipeline determinista de SpriteSheets y `.pyxel`.
3. **Verificar (Check):** Pruebas sintácticas (`node --check`), verificación binaria de PNG/ZIP, y pruebas funcionales en vivo de Portada, Nivel 1, Nivel 2 y pantalla final.
4. **Actuar (Act):** Incorporación de reconocimiento en resultados parciales (*interim*) para bajar la latencia de voz, medidor VU de voz potenciada y panel de respaldo por teclado para exposición en aula.
