export const GAME_CONFIG = {
  TITLE: 'CHERNÓBIL 86: TURNO DE 90 SEGUNDOS',
  AUTHOR: 'César Sachun Pozo',
  BOARD_COLS: 7,
  BOARD_ROWS: 5,
  TILE_SIZE: 96, // 32px * 3 exact integer scale
  CANVAS_WIDTH: 7 * 96, // 672
  CANVAS_HEIGHT: 5 * 96, // 480
  SHIFT_DURATION: 22,
  RELAY_BANNER_DURATION: 2.4,
  TEAM_MAX_LIVES: 3,
  SHIELD_DURATION: 3.5,
  VOICE_BOOST_THRESHOLD: 0.55,
  FLASHLIGHT_RADIUS: 185,
};

export const VOICE_COMMANDS = {
  UP: ['arriba', 'ariba', 'sube', 'subir'],
  DOWN: ['abajo', 'avajo', 'baja', 'bajar'],
  LEFT: ['izquierda', 'izquierdas'],
  RIGHT: ['derecha', 'derechas'],
  WATER: ['agua', 'aguas', 'apaga', 'apagar', 'chorro', 'manguera', 'enfria', 'enfriar'],
  SHIELD: ['escudo', 'escudos', 'cubre', 'cubrete', 'cubrir', 'protege', 'proteger', 'defensa'],
  VALVE: ['valvula', 'valvulas', 'balbula', 'abrir', 'gira', 'girar', 'drenar'],
  RELAY: ['relevo', 'releva', 'cambio', 'cambia', 'cambiar', 'turno'],
  PAUSE: ['pausa', 'pausar', 'detener'],
  NEXT: ['iniciar', 'comenzar', 'empezar', 'continuar', 'siguiente', 'reanudar'],
};

export const COMMAND_LABELS = {
  UP: 'ARRIBA',
  DOWN: 'ABAJO',
  LEFT: 'IZQUIERDA',
  RIGHT: 'DERECHA',
  WATER: 'AGUA',
  SHIELD: 'ESCUDO',
  VALVE: 'VÁLVULA',
  RELAY: 'RELEVO',
  PAUSE: 'PAUSA',
  NEXT: 'CONTINUAR',
};

export const LEVELS = {
  1: {
    id: 1,
    name: 'NIVEL 1: EL TECHO DEL REACTOR',
    dateLabel: '26 DE ABRIL DE 1986 — ZONA MASHINNY ZAL',
    briefing:
      'Tras la explosión de la Unidad 4, fragmentos de grafito ardiente quedaron expuestos en el techo. Más de 3,800 liquidadores trabajaron en relevos de apenas segundos para contener la radiación.',
    objectiveText: 'Extingue los 8 focos de fuego y grafito antes de sufrir dosis letales.',
    tip: 'Di ARRIBA, ABAJO, IZQUIERDA o DERECHA para moverte. Di AGUA cerca de un foco (habla fuerte para chorro potenciado) y ESCUDO ante los pulsos de radiación.',
    pulseInterval: 9.5,
    pulseWarning: 3.0,
    pulseDamage: 34,
    sheetKey: 'tiles_l1',
    // 0: concrete, 1: cracked, 2: hazard border, 3: reactor grate
    tileMap: [
      [2, 0, 1, 3, 1, 0, 2],
      [0, 1, 0, 3, 0, 1, 0],
      [2, 0, 3, 3, 3, 0, 2],
      [0, 1, 0, 3, 0, 1, 0],
      [2, 0, 1, 3, 1, 0, 2],
    ],
    p1Start: { col: 0, row: 2 },
    p2Start: { col: 6, row: 2 },
    hazards: [
      { id: 'h1', type: 'fire', col: 1, row: 1, hp: 1, maxHp: 1 },
      { id: 'h2', type: 'graphite', col: 3, row: 0, hp: 2, maxHp: 2 },
      { id: 'h3', type: 'fire', col: 5, row: 1, hp: 1, maxHp: 1 },
      { id: 'h4', type: 'graphite', col: 2, row: 2, hp: 2, maxHp: 2 },
      { id: 'h5', type: 'graphite', col: 4, row: 2, hp: 2, maxHp: 2 },
      { id: 'h6', type: 'fire', col: 1, row: 3, hp: 1, maxHp: 1 },
      { id: 'h7', type: 'graphite', col: 3, row: 4, hp: 2, maxHp: 2 },
      { id: 'h8', type: 'fire', col: 5, row: 3, hp: 1, maxHp: 1 },
    ],
    valves: [],
  },
  2: {
    id: 2,
    name: 'NIVEL 2: LOS TÚNELES INUNDADOS',
    dateLabel: '4 DE MAYO DE 1986 — SUBSUELO DEL REACTOR',
    briefing:
      'El núcleo fundido amenazaba con tocar el agua acumulada bajo el reactor, lo que habría causado una segunda explosión térmica capaz de contaminar gran parte de Europa.',
    objectiveText: 'Abre las 3 válvulas de drenaje en la oscuridad usando el comando "VÁLVULA".',
    tip: 'Avanza usando tu linterna, apaga cortocircuitos con AGUA, cúbrete con ESCUDO y junto a cada válvula roja di VÁLVULA o ABRIR.',
    pulseInterval: 8.2,
    pulseWarning: 2.8,
    pulseDamage: 38,
    sheetKey: 'tiles_l2',
    darkness: true,
    // 0: wet floor, 1: industrial pipe, 2/3: flooded water
    tileMap: [
      [1, 0, 1, 2, 0, 1, 0],
      [0, 2, 0, 0, 2, 0, 1],
      [0, 0, 2, 1, 0, 0, 0],
      [1, 2, 0, 2, 0, 2, 0],
      [0, 0, 1, 0, 1, 0, 1],
    ],
    p1Start: { col: 0, row: 2 },
    p2Start: { col: 6, row: 2 },
    hazards: [
      { id: 't1', type: 'fire', col: 2, row: 1, hp: 1, maxHp: 1 },
      { id: 't2', type: 'graphite', col: 3, row: 2, hp: 2, maxHp: 2 },
      { id: 't3', type: 'fire', col: 4, row: 3, hp: 1, maxHp: 1 },
    ],
    valves: [
      { id: 'v1', label: 'VÁLVULA A (Ananenko)', col: 2, row: 0, progress: 0, maxProgress: 2 },
      { id: 'v2', label: 'VÁLVULA B (Bezpalov)', col: 5, row: 1, progress: 0, maxProgress: 2 },
      { id: 'v3', label: 'VÁLVULA C (Baranov)', col: 4, row: 4, progress: 0, maxProgress: 2 },
    ],
  },
};

export const HISTORICAL_IMPACT = {
  title: 'MEMORIA HISTÓRICA: EL VALOR DE LOS LIQUIDADORES',
  facts: [
    'Entre 600,000 y 800,000 liquidadores participaron en la contención del desastre de Chernóbil (1986–1989).',
    'En el techo del reactor ("Zona M"), robots electrónicos fallaron por la radiación extrema; los turnos humanos duraban entre 40 y 90 segundos.',
    'El 4 de mayo de 1986, los ingenieros Alexei Ananenko, Valeri Bezpalov y Boris Baranov entraron en agua radiactiva con linternas para abrir manualmente las válvulas de drenaje, evitando una explosión de vapor masiva.',
    'Su trabajo por relevos y sacrificio colectivo protegió las fuentes de agua y salvó millones de vidas en Europa.',
  ],
};
