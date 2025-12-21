/**
 * Danish Translations
 */

import { createBaseTranslation } from './base.js';

export const da = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Opret element', description: '' },
    pinepaper_modify_item: { name: 'Ændr element', description: '' },
    pinepaper_delete_item: { name: 'Slet element', description: '' },
    pinepaper_add_relation: { name: 'Tilføj relation', description: '' },
    pinepaper_remove_relation: { name: 'Fjern relation', description: '' },
    pinepaper_query_relations: { name: 'Forespørg relationer', description: '' },
    pinepaper_animate: { name: 'Animer', description: '' },
    pinepaper_keyframe_animate: { name: 'Nøglebillede animation', description: '' },
    pinepaper_play_timeline: { name: 'Afspil tidslinje', description: '' },
    pinepaper_execute_generator: { name: 'Kør generator', description: '' },
    pinepaper_list_generators: { name: 'Liste generatorer', description: '' },
    pinepaper_apply_effect: { name: 'Anvend effekt', description: '' },
    pinepaper_get_items: { name: 'Hent elementer', description: '' },
    pinepaper_get_relation_stats: { name: 'Relationsstatistik', description: '' },
    pinepaper_set_background_color: { name: 'Indstil baggrundsfarve', description: '' },
    pinepaper_set_canvas_size: { name: 'Indstil lærredstørrelse', description: '' },
    pinepaper_export_svg: { name: 'Eksporter SVG', description: '' },
    pinepaper_export_training_data: { name: 'Eksporter træningsdata', description: '' },
    // Diagram Tools
    pinepaper_create_diagram_shape: { name: 'Opret diagramform', description: '' },
    pinepaper_connect: { name: 'Forbind elementer', description: '' },
    pinepaper_connect_ports: { name: 'Forbind porte', description: '' },
    pinepaper_add_ports: { name: 'Tilføj porte', description: '' },
    pinepaper_auto_layout: { name: 'Automatisk layout', description: '' },
    pinepaper_get_diagram_shapes: { name: 'Hent diagramformer', description: '' },
    pinepaper_update_connector: { name: 'Opdater forbindelse', description: '' },
    pinepaper_remove_connector: { name: 'Fjern forbindelse', description: '' },
    pinepaper_diagram_mode: { name: 'Diagramtilstand', description: '' },
  },

  errors: {
    itemNotFound: 'Element ikke fundet: {{itemId}}',
    invalidRelation: 'Ugyldig relation: {{relationType}}',
    invalidParams: 'Ugyldige parametre: {{details}}',
    generatorNotFound: 'Generator ikke fundet: {{generatorName}}',
    exportFailed: 'Eksport mislykkedes: {{reason}}',
    executionError: 'Kørselfejl: {{message}}',
    validationError: 'Valideringsfejl: {{message}}',
    unknownTool: 'Ukendt værktøj: {{toolName}}',
    apiKeyRequired: 'API-nøgle påkrævet',
    apiKeyInvalid: 'Ugyldig API-nøgle',
    apiKeyExpired: 'API-nøgle udløbet',
    rateLimitExceeded: 'Anmodningsgrænse overskredet. Prøv igen om {{seconds}} sekunder.',
  },

  success: {
    itemCreated: '{{itemType}} oprettet ved position ({{x}}, {{y}})',
    itemModified: 'Element {{itemId}} ændret',
    itemDeleted: 'Element {{itemId}} slettet',
    relationAdded: '{{relationType}} relation tilføjet: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Relation mellem {{sourceId}} og {{targetId}} fjernet',
    animationApplied: '{{animationType}} animation anvendt på {{itemId}}',
    generatorExecuted: '{{generatorName}} generator kørt',
    effectApplied: '{{effectType}} effekt anvendt på {{itemId}}',
    backgroundSet: 'Baggrundsfarve sat til {{color}}',
    canvasSizeSet: 'Lærredstørrelse sat til {{width}}×{{height}}',
    exported: '{{format}} eksporteret succesfuldt',
  },

  itemTypes: {
    text: 'Tekst',
    circle: 'Cirkel',
    star: 'Stjerne',
    rectangle: 'Rektangel',
    triangle: 'Trekant',
    polygon: 'Polygon',
    ellipse: 'Ellipse',
    path: 'Sti',
    line: 'Linje',
    arc: 'Bue',
  },

  relationTypes: {
    orbits: 'Kredser',
    follows: 'Følger',
    attached_to: 'Fastgjort til',
    maintains_distance: 'Opretholder afstand',
    points_at: 'Peger på',
    mirrors: 'Spejler',
    parallax: 'Parallakse',
    bounds_to: 'Begrænset til',
  },

  animationTypes: {
    pulse: 'Puls',
    rotate: 'Roter',
    bounce: 'Hoppe',
    fade: 'Fade',
    wobble: 'Vakle',
    slide: 'Glide',
    typewriter: 'Skrivemaskine',
  },

  generators: {
    drawSunburst: 'Solstråler',
    drawSunsetScene: 'Solnedgangsscene',
    drawGrid: 'Gitter',
    drawStackedCircles: 'Stablede cirkler',
    drawCircuit: 'Kredsløb',
    drawWaves: 'Bølger',
    drawPattern: 'Mønster',
  },

  common: {
    at: 'ved',
    with: 'med',
    to: 'til',
    from: 'fra',
    position: 'position',
    radius: 'radius',
    color: 'farve',
    speed: 'hastighed',
    duration: 'varighed',
  },
});

export default da;
