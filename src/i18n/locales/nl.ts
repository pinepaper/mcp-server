/**
 * Dutch Translations
 */

import { createBaseTranslation } from './base.js';

export const nl = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Item maken', description: '' },
    pinepaper_modify_item: { name: 'Item wijzigen', description: '' },
    pinepaper_delete_item: { name: 'Item verwijderen', description: '' },
    pinepaper_add_relation: { name: 'Relatie toevoegen', description: '' },
    pinepaper_remove_relation: { name: 'Relatie verwijderen', description: '' },
    pinepaper_query_relations: { name: 'Relaties opvragen', description: '' },
    pinepaper_animate: { name: 'Animeren', description: '' },
    pinepaper_keyframe_animate: { name: 'Keyframe-animatie', description: '' },
    pinepaper_play_timeline: { name: 'Tijdlijn afspelen', description: '' },
    pinepaper_execute_generator: { name: 'Generator uitvoeren', description: '' },
    pinepaper_list_generators: { name: 'Generatoren weergeven', description: '' },
    pinepaper_apply_effect: { name: 'Effect toepassen', description: '' },
    pinepaper_get_items: { name: 'Items ophalen', description: '' },
    pinepaper_get_relation_stats: { name: 'Relatiestatistieken', description: '' },
    pinepaper_set_background_color: { name: 'Achtergrondkleur instellen', description: '' },
    pinepaper_set_canvas_size: { name: 'Canvasgrootte instellen', description: '' },
    pinepaper_export_svg: { name: 'SVG exporteren', description: '' },
    pinepaper_export_training_data: { name: 'Trainingsgegevens exporteren', description: '' },
  },

  errors: {
    itemNotFound: 'Item niet gevonden: {{itemId}}',
    invalidRelation: 'Ongeldige relatie: {{relationType}}',
    invalidParams: 'Ongeldige parameters: {{details}}',
    generatorNotFound: 'Generator niet gevonden: {{generatorName}}',
    exportFailed: 'Export mislukt: {{reason}}',
    executionError: 'Uitvoeringsfout: {{message}}',
    validationError: 'Validatiefout: {{message}}',
    unknownTool: 'Onbekend hulpmiddel: {{toolName}}',
    apiKeyRequired: 'API-sleutel vereist',
    apiKeyInvalid: 'Ongeldige API-sleutel',
    apiKeyExpired: 'API-sleutel verlopen',
    rateLimitExceeded: 'Snelheidslimiet overschreden. Probeer opnieuw over {{seconds}} seconden.',
  },

  success: {
    itemCreated: '{{itemType}} gemaakt op positie ({{x}}, {{y}})',
    itemModified: 'Item {{itemId}} gewijzigd',
    itemDeleted: 'Item {{itemId}} verwijderd',
    relationAdded: 'Relatie {{relationType}} toegevoegd: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Relatie verwijderd tussen {{sourceId}} en {{targetId}}',
    animationApplied: 'Animatie {{animationType}} toegepast op {{itemId}}',
    generatorExecuted: 'Generator {{generatorName}} uitgevoerd',
    effectApplied: 'Effect {{effectType}} toegepast op {{itemId}}',
    backgroundSet: 'Achtergrondkleur ingesteld op {{color}}',
    canvasSizeSet: 'Canvasgrootte ingesteld op {{width}}×{{height}}',
    exported: '{{format}} succesvol geëxporteerd',
  },

  itemTypes: {
    text: 'Tekst',
    circle: 'Cirkel',
    star: 'Ster',
    rectangle: 'Rechthoek',
    triangle: 'Driehoek',
    polygon: 'Veelhoek',
    ellipse: 'Ellips',
    path: 'Pad',
    line: 'Lijn',
    arc: 'Boog',
  },

  relationTypes: {
    orbits: 'Draait om',
    follows: 'Volgt',
    attached_to: 'Bevestigd aan',
    maintains_distance: 'Houdt afstand',
    points_at: 'Wijst naar',
    mirrors: 'Spiegelt',
    parallax: 'Parallax',
    bounds_to: 'Begrensd tot',
  },

  animationTypes: {
    pulse: 'Pulseren',
    rotate: 'Roteren',
    bounce: 'Stuiteren',
    fade: 'Vervagen',
    wobble: 'Wiebelen',
    slide: 'Schuiven',
    typewriter: 'Typemachine',
  },

  generators: {
    drawSunburst: 'Zonnestralen',
    drawSunsetScene: 'Zonsondergang',
    drawGrid: 'Raster',
    drawStackedCircles: 'Gestapelde cirkels',
    drawCircuit: 'Circuit',
    drawWaves: 'Golven',
    drawPattern: 'Patroon',
  },

  common: {
    at: 'bij',
    with: 'met',
    to: 'naar',
    from: 'van',
    position: 'positie',
    radius: 'straal',
    color: 'kleur',
    speed: 'snelheid',
    duration: 'duur',
  },
});

export default nl;
