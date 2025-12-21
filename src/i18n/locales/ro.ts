/**
 * Romanian Translations
 */

import { createBaseTranslation } from './base.js';

export const ro = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Creează element', description: '' },
    pinepaper_modify_item: { name: 'Modifică element', description: '' },
    pinepaper_delete_item: { name: 'Șterge element', description: '' },
    pinepaper_add_relation: { name: 'Adaugă relație', description: '' },
    pinepaper_remove_relation: { name: 'Elimină relație', description: '' },
    pinepaper_query_relations: { name: 'Interogare relații', description: '' },
    pinepaper_animate: { name: 'Animare', description: '' },
    pinepaper_keyframe_animate: { name: 'Animație cu cadre cheie', description: '' },
    pinepaper_play_timeline: { name: 'Redă cronologia', description: '' },
    pinepaper_execute_generator: { name: 'Execută generator', description: '' },
    pinepaper_list_generators: { name: 'Listă generatoare', description: '' },
    pinepaper_apply_effect: { name: 'Aplică efect', description: '' },
    pinepaper_get_items: { name: 'Obține elemente', description: '' },
    pinepaper_get_relation_stats: { name: 'Statistici relații', description: '' },
    pinepaper_set_background_color: { name: 'Setează culoarea fundalului', description: '' },
    pinepaper_set_canvas_size: { name: 'Setează dimensiunea pânzei', description: '' },
    pinepaper_export_svg: { name: 'Exportă SVG', description: '' },
    pinepaper_export_training_data: { name: 'Exportă date de antrenament', description: '' },
    // Diagram Tools
    pinepaper_create_diagram_shape: { name: 'Creează formă diagramă', description: '' },
    pinepaper_connect: { name: 'Conectare elemente', description: '' },
    pinepaper_connect_ports: { name: 'Conectare porturi', description: '' },
    pinepaper_add_ports: { name: 'Adaugă porturi', description: '' },
    pinepaper_auto_layout: { name: 'Aranjare automată', description: '' },
    pinepaper_get_diagram_shapes: { name: 'Obține forme diagramă', description: '' },
    pinepaper_update_connector: { name: 'Actualizează conector', description: '' },
    pinepaper_remove_connector: { name: 'Elimină conector', description: '' },
    pinepaper_diagram_mode: { name: 'Mod diagramă', description: '' },
  },

  errors: {
    itemNotFound: 'Element negăsit: {{itemId}}',
    invalidRelation: 'Relație invalidă: {{relationType}}',
    invalidParams: 'Parametri invalizi: {{details}}',
    generatorNotFound: 'Generator negăsit: {{generatorName}}',
    exportFailed: 'Export eșuat: {{reason}}',
    executionError: 'Eroare de execuție: {{message}}',
    validationError: 'Eroare de validare: {{message}}',
    unknownTool: 'Instrument necunoscut: {{toolName}}',
    apiKeyRequired: 'Cheie API necesară',
    apiKeyInvalid: 'Cheie API invalidă',
    apiKeyExpired: 'Cheie API expirată',
    rateLimitExceeded: 'Limită de cereri depășită. Încercați din nou în {{seconds}} secunde.',
  },

  success: {
    itemCreated: '{{itemType}} creat la poziția ({{x}}, {{y}})',
    itemModified: 'Element {{itemId}} modificat',
    itemDeleted: 'Element {{itemId}} șters',
    relationAdded: 'Relație {{relationType}} adăugată: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Relație eliminată între {{sourceId}} și {{targetId}}',
    animationApplied: 'Animație {{animationType}} aplicată la {{itemId}}',
    generatorExecuted: 'Generator {{generatorName}} executat',
    effectApplied: 'Efect {{effectType}} aplicat la {{itemId}}',
    backgroundSet: 'Culoarea fundalului setată la {{color}}',
    canvasSizeSet: 'Dimensiunea pânzei setată la {{width}}×{{height}}',
    exported: '{{format}} exportat cu succes',
  },

  itemTypes: {
    text: 'Text',
    circle: 'Cerc',
    star: 'Stea',
    rectangle: 'Dreptunghi',
    triangle: 'Triunghi',
    polygon: 'Poligon',
    ellipse: 'Elipsă',
    path: 'Cale',
    line: 'Linie',
    arc: 'Arc',
  },

  relationTypes: {
    orbits: 'Orbitează',
    follows: 'Urmărește',
    attached_to: 'Atașat la',
    maintains_distance: 'Menține distanța',
    points_at: 'Indică spre',
    mirrors: 'Oglindește',
    parallax: 'Paralaxă',
    bounds_to: 'Limitat la',
  },

  animationTypes: {
    pulse: 'Pulsație',
    rotate: 'Rotație',
    bounce: 'Săltare',
    fade: 'Estompare',
    wobble: 'Oscilație',
    slide: 'Alunecare',
    typewriter: 'Mașină de scris',
  },

  generators: {
    drawSunburst: 'Raze de soare',
    drawSunsetScene: 'Scenă de apus',
    drawGrid: 'Grilă',
    drawStackedCircles: 'Cercuri suprapuse',
    drawCircuit: 'Placă de circuit',
    drawWaves: 'Valuri',
    drawPattern: 'Model',
  },

  common: {
    at: 'la',
    with: 'cu',
    to: 'la',
    from: 'de la',
    position: 'poziție',
    radius: 'rază',
    color: 'culoare',
    speed: 'viteză',
    duration: 'durată',
  },
});

export default ro;
