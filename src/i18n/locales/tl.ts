/**
 * Filipino/Tagalog Translations
 */

import { createBaseTranslation } from './base.js';

export const tl = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Lumikha ng Item', description: '' },
    pinepaper_modify_item: { name: 'Baguhin ang Item', description: '' },
    pinepaper_delete_item: { name: 'Burahin ang Item', description: '' },
    pinepaper_add_relation: { name: 'Magdagdag ng Relasyon', description: '' },
    pinepaper_remove_relation: { name: 'Alisin ang Relasyon', description: '' },
    pinepaper_query_relations: { name: 'Mag-query ng Relasyon', description: '' },
    pinepaper_animate: { name: 'I-animate', description: '' },
    pinepaper_keyframe_animate: { name: 'Keyframe Animation', description: '' },
    pinepaper_play_timeline: { name: 'I-play ang Timeline', description: '' },
    pinepaper_execute_generator: { name: 'Patakbuhin ang Generator', description: '' },
    pinepaper_list_generators: { name: 'Listahan ng Generators', description: '' },
    pinepaper_apply_effect: { name: 'Ilapat ang Epekto', description: '' },
    pinepaper_get_items: { name: 'Kunin ang mga Item', description: '' },
    pinepaper_get_relation_stats: { name: 'Estadistika ng Relasyon', description: '' },
    pinepaper_set_background_color: { name: 'Itakda ang Kulay ng Background', description: '' },
    pinepaper_set_canvas_size: { name: 'Itakda ang Sukat ng Canvas', description: '' },
    pinepaper_export_svg: { name: 'I-export ang SVG', description: '' },
    pinepaper_export_training_data: { name: 'I-export ang Training Data', description: '' },
    // Diagram Tools
    pinepaper_create_diagram_shape: { name: 'Lumikha ng hugis ng dayagram', description: '' },
    pinepaper_connect: { name: 'Ikonekta ang mga item', description: '' },
    pinepaper_connect_ports: { name: 'Ikonekta ang mga port', description: '' },
    pinepaper_add_ports: { name: 'Magdagdag ng mga port', description: '' },
    pinepaper_auto_layout: { name: 'Auto na layout', description: '' },
    pinepaper_get_diagram_shapes: { name: 'Kunin ang mga hugis ng dayagram', description: '' },
    pinepaper_update_connector: { name: 'I-update ang connector', description: '' },
    pinepaper_remove_connector: { name: 'Alisin ang connector', description: '' },
    pinepaper_diagram_mode: { name: 'Mode ng dayagram', description: '' },
  },

  errors: {
    itemNotFound: 'Hindi natagpuan ang item: {{itemId}}',
    invalidRelation: 'Di-wastong relasyon: {{relationType}}',
    invalidParams: 'Di-wastong parameters: {{details}}',
    generatorNotFound: 'Hindi natagpuan ang generator: {{generatorName}}',
    exportFailed: 'Nabigo ang pag-export: {{reason}}',
    executionError: 'Error sa execution: {{message}}',
    validationError: 'Error sa validation: {{message}}',
    unknownTool: 'Hindi kilalang tool: {{toolName}}',
    apiKeyRequired: 'Kailangan ang API key',
    apiKeyInvalid: 'Di-wasto ang API key',
    apiKeyExpired: 'Expired na ang API key',
    rateLimitExceeded: 'Lumampas sa limitasyon ng request. Subukan muli sa {{seconds}} segundo.',
  },

  success: {
    itemCreated: 'Nalikha ang {{itemType}} sa posisyon ({{x}}, {{y}})',
    itemModified: 'Nabago ang item {{itemId}}',
    itemDeleted: 'Nabura ang item {{itemId}}',
    relationAdded: 'Naidagdag ang relasyon {{relationType}}: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Naalis ang relasyon sa pagitan ng {{sourceId}} at {{targetId}}',
    animationApplied: 'Nailapat ang {{animationType}} animation sa {{itemId}}',
    generatorExecuted: 'Naipatakbo ang {{generatorName}} generator',
    effectApplied: 'Nailapat ang {{effectType}} epekto sa {{itemId}}',
    backgroundSet: 'Naitakda ang kulay ng background sa {{color}}',
    canvasSizeSet: 'Naitakda ang sukat ng canvas sa {{width}}×{{height}}',
    exported: 'Matagumpay na na-export ang {{format}}',
  },

  itemTypes: {
    text: 'Teksto',
    circle: 'Bilog',
    star: 'Bituin',
    rectangle: 'Parihaba',
    triangle: 'Tatsulok',
    polygon: 'Poligon',
    ellipse: 'Elipse',
    path: 'Landas',
    line: 'Linya',
    arc: 'Arko',
  },

  relationTypes: {
    orbits: 'Umiikot',
    follows: 'Sumusunod',
    attached_to: 'Nakakabit sa',
    maintains_distance: 'Pinapanatili ang distansya',
    points_at: 'Nakaturo sa',
    mirrors: 'Salamin',
    parallax: 'Parallax',
    bounds_to: 'Limitado sa',
  },

  animationTypes: {
    pulse: 'Pagtibok',
    rotate: 'Pag-ikot',
    bounce: 'Pagtalon',
    fade: 'Pagkupas',
    wobble: 'Pag-ugoy',
    slide: 'Pagdulas',
    typewriter: 'Typewriter',
  },

  generators: {
    drawSunburst: 'Sinag ng Araw',
    drawSunsetScene: 'Eksena ng Paglubog ng Araw',
    drawGrid: 'Grid',
    drawStackedCircles: 'Magkapatong na Bilog',
    drawCircuit: 'Circuit Board',
    drawWaves: 'Alon',
    drawPattern: 'Pattern',
  },

  common: {
    at: 'sa',
    with: 'kasama',
    to: 'sa',
    from: 'mula sa',
    position: 'posisyon',
    radius: 'radius',
    color: 'kulay',
    speed: 'bilis',
    duration: 'tagal',
  },
});

export default tl;
