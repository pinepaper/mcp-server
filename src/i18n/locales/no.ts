/**
 * Norwegian Translations
 */

import { createBaseTranslation } from './base.js';

export const no = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Opprett element', description: '' },
    pinepaper_modify_item: { name: 'Endre element', description: '' },
    pinepaper_delete_item: { name: 'Slett element', description: '' },
    pinepaper_add_relation: { name: 'Legg til relasjon', description: '' },
    pinepaper_remove_relation: { name: 'Fjern relasjon', description: '' },
    pinepaper_query_relations: { name: 'Spør etter relasjoner', description: '' },
    pinepaper_animate: { name: 'Animer', description: '' },
    pinepaper_keyframe_animate: { name: 'Nøkkelbilde animasjon', description: '' },
    pinepaper_play_timeline: { name: 'Spill av tidslinje', description: '' },
    pinepaper_execute_generator: { name: 'Kjør generator', description: '' },
    pinepaper_list_generators: { name: 'Liste generatorer', description: '' },
    pinepaper_apply_effect: { name: 'Bruk effekt', description: '' },
    pinepaper_get_items: { name: 'Hent elementer', description: '' },
    pinepaper_get_relation_stats: { name: 'Relasjonsstatistikk', description: '' },
    pinepaper_set_background_color: { name: 'Angi bakgrunnsfarge', description: '' },
    pinepaper_set_canvas_size: { name: 'Angi lerretstørrelse', description: '' },
    pinepaper_export_svg: { name: 'Eksporter SVG', description: '' },
    pinepaper_export_training_data: { name: 'Eksporter treningsdata', description: '' },
    // Diagram Tools
    pinepaper_create_diagram_shape: { name: 'Opprett diagramform', description: '' },
    pinepaper_connect: { name: 'Koble elementer', description: '' },
    pinepaper_connect_ports: { name: 'Koble porter', description: '' },
    pinepaper_add_ports: { name: 'Legg til porter', description: '' },
    pinepaper_auto_layout: { name: 'Automatisk layout', description: '' },
    pinepaper_get_diagram_shapes: { name: 'Hent diagramformer', description: '' },
    pinepaper_update_connector: { name: 'Oppdater kobling', description: '' },
    pinepaper_remove_connector: { name: 'Fjern kobling', description: '' },
    pinepaper_diagram_mode: { name: 'Diagrammodus', description: '' },
  },

  errors: {
    itemNotFound: 'Element ikke funnet: {{itemId}}',
    invalidRelation: 'Ugyldig relasjon: {{relationType}}',
    invalidParams: 'Ugyldige parametere: {{details}}',
    generatorNotFound: 'Generator ikke funnet: {{generatorName}}',
    exportFailed: 'Eksport mislyktes: {{reason}}',
    executionError: 'Kjøringsfeil: {{message}}',
    validationError: 'Valideringsfeil: {{message}}',
    unknownTool: 'Ukjent verktøy: {{toolName}}',
    apiKeyRequired: 'API-nøkkel påkrevd',
    apiKeyInvalid: 'Ugyldig API-nøkkel',
    apiKeyExpired: 'API-nøkkel utløpt',
    rateLimitExceeded: 'Forespørselsgrense overskredet. Prøv igjen om {{seconds}} sekunder.',
  },

  success: {
    itemCreated: '{{itemType}} opprettet ved posisjon ({{x}}, {{y}})',
    itemModified: 'Element {{itemId}} endret',
    itemDeleted: 'Element {{itemId}} slettet',
    relationAdded: '{{relationType}} relasjon lagt til: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Relasjon mellom {{sourceId}} og {{targetId}} fjernet',
    animationApplied: '{{animationType}} animasjon brukt på {{itemId}}',
    generatorExecuted: '{{generatorName}} generator kjørt',
    effectApplied: '{{effectType}} effekt brukt på {{itemId}}',
    backgroundSet: 'Bakgrunnsfarge satt til {{color}}',
    canvasSizeSet: 'Lerretstørrelse satt til {{width}}×{{height}}',
    exported: '{{format}} eksportert vellykket',
  },

  itemTypes: {
    text: 'Tekst',
    circle: 'Sirkel',
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
    orbits: 'Kretser',
    follows: 'Følger',
    attached_to: 'Festet til',
    maintains_distance: 'Opprettholder avstand',
    points_at: 'Peker på',
    mirrors: 'Speiler',
    parallax: 'Parallakse',
    bounds_to: 'Begrenset til',
  },

  animationTypes: {
    pulse: 'Puls',
    rotate: 'Roter',
    bounce: 'Sprette',
    fade: 'Falme',
    wobble: 'Vakle',
    slide: 'Skli',
    typewriter: 'Skrivemaskin',
  },

  generators: {
    drawSunburst: 'Solstråler',
    drawSunsetScene: 'Solnedgangsscene',
    drawGrid: 'Rutenett',
    drawStackedCircles: 'Stablede sirkler',
    drawCircuit: 'Kretskort',
    drawWaves: 'Bølger',
    drawPattern: 'Mønster',
  },

  common: {
    at: 'ved',
    with: 'med',
    to: 'til',
    from: 'fra',
    position: 'posisjon',
    radius: 'radius',
    color: 'farge',
    speed: 'hastighet',
    duration: 'varighet',
  },
});

export default no;
