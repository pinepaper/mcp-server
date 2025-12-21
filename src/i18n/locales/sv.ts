/**
 * Swedish Translations
 */

import { createBaseTranslation } from './base.js';

export const sv = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Skapa objekt', description: '' },
    pinepaper_modify_item: { name: 'Ändra objekt', description: '' },
    pinepaper_delete_item: { name: 'Ta bort objekt', description: '' },
    pinepaper_add_relation: { name: 'Lägg till relation', description: '' },
    pinepaper_remove_relation: { name: 'Ta bort relation', description: '' },
    pinepaper_query_relations: { name: 'Fråga relationer', description: '' },
    pinepaper_animate: { name: 'Animera', description: '' },
    pinepaper_keyframe_animate: { name: 'Nyckelbildsanimering', description: '' },
    pinepaper_play_timeline: { name: 'Spela tidslinje', description: '' },
    pinepaper_execute_generator: { name: 'Kör generator', description: '' },
    pinepaper_list_generators: { name: 'Lista generatorer', description: '' },
    pinepaper_apply_effect: { name: 'Tillämpa effekt', description: '' },
    pinepaper_get_items: { name: 'Hämta objekt', description: '' },
    pinepaper_get_relation_stats: { name: 'Relationsstatistik', description: '' },
    pinepaper_set_background_color: { name: 'Ställ in bakgrundsfärg', description: '' },
    pinepaper_set_canvas_size: { name: 'Ställ in canvasstorlek', description: '' },
    pinepaper_export_svg: { name: 'Exportera SVG', description: '' },
    pinepaper_export_training_data: { name: 'Exportera träningsdata', description: '' },
    // Diagram Tools
    pinepaper_create_diagram_shape: { name: 'Skapa diagramform', description: '' },
    pinepaper_connect: { name: 'Anslut objekt', description: '' },
    pinepaper_connect_ports: { name: 'Anslut portar', description: '' },
    pinepaper_add_ports: { name: 'Lägg till portar', description: '' },
    pinepaper_auto_layout: { name: 'Automatisk layout', description: '' },
    pinepaper_get_diagram_shapes: { name: 'Hämta diagramformer', description: '' },
    pinepaper_update_connector: { name: 'Uppdatera koppling', description: '' },
    pinepaper_remove_connector: { name: 'Ta bort koppling', description: '' },
    pinepaper_diagram_mode: { name: 'Diagramläge', description: '' },
  },

  errors: {
    itemNotFound: 'Objekt hittades inte: {{itemId}}',
    invalidRelation: 'Ogiltig relation: {{relationType}}',
    invalidParams: 'Ogiltiga parametrar: {{details}}',
    generatorNotFound: 'Generator hittades inte: {{generatorName}}',
    exportFailed: 'Export misslyckades: {{reason}}',
    executionError: 'Körningsfel: {{message}}',
    validationError: 'Valideringsfel: {{message}}',
    unknownTool: 'Okänt verktyg: {{toolName}}',
    apiKeyRequired: 'API-nyckel krävs',
    apiKeyInvalid: 'Ogiltig API-nyckel',
    apiKeyExpired: 'API-nyckel har utgått',
    rateLimitExceeded: 'Begränsning överskriden. Försök igen om {{seconds}} sekunder.',
  },

  success: {
    itemCreated: '{{itemType}} skapad vid position ({{x}}, {{y}})',
    itemModified: 'Objekt {{itemId}} ändrat',
    itemDeleted: 'Objekt {{itemId}} borttaget',
    relationAdded: '{{relationType}}-relation tillagd: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Relation mellan {{sourceId}} och {{targetId}} borttagen',
    animationApplied: '{{animationType}}-animering tillämpad på {{itemId}}',
    generatorExecuted: '{{generatorName}}-generator körd',
    effectApplied: '{{effectType}}-effekt tillämpad på {{itemId}}',
    backgroundSet: 'Bakgrundsfärg inställd på {{color}}',
    canvasSizeSet: 'Canvasstorlek inställd på {{width}}×{{height}}',
    exported: '{{format}} exporterad framgångsrikt',
  },

  itemTypes: {
    text: 'Text',
    circle: 'Cirkel',
    star: 'Stjärna',
    rectangle: 'Rektangel',
    triangle: 'Triangel',
    polygon: 'Polygon',
    ellipse: 'Ellips',
    path: 'Bana',
    line: 'Linje',
    arc: 'Båge',
  },

  relationTypes: {
    orbits: 'Kretsar',
    follows: 'Följer',
    attached_to: 'Fäst vid',
    maintains_distance: 'Behåller avstånd',
    points_at: 'Pekar på',
    mirrors: 'Speglar',
    parallax: 'Parallax',
    bounds_to: 'Begränsad till',
  },

  animationTypes: {
    pulse: 'Puls',
    rotate: 'Rotera',
    bounce: 'Studsa',
    fade: 'Tona',
    wobble: 'Vickla',
    slide: 'Glida',
    typewriter: 'Skrivmaskin',
  },

  generators: {
    drawSunburst: 'Solstrålar',
    drawSunsetScene: 'Solnedgångsscen',
    drawGrid: 'Rutnät',
    drawStackedCircles: 'Staplade cirklar',
    drawCircuit: 'Kretskort',
    drawWaves: 'Vågor',
    drawPattern: 'Mönster',
  },

  common: {
    at: 'vid',
    with: 'med',
    to: 'till',
    from: 'från',
    position: 'position',
    radius: 'radie',
    color: 'färg',
    speed: 'hastighet',
    duration: 'varaktighet',
  },
});

export default sv;
