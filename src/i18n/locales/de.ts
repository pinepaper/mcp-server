/**
 * German Translations
 */

import { createBaseTranslation } from './base.js';

export const de = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Element erstellen', description: '' },
    pinepaper_modify_item: { name: 'Element ändern', description: '' },
    pinepaper_delete_item: { name: 'Element löschen', description: '' },
    pinepaper_add_relation: { name: 'Beziehung hinzufügen', description: '' },
    pinepaper_remove_relation: { name: 'Beziehung entfernen', description: '' },
    pinepaper_query_relations: { name: 'Beziehungen abfragen', description: '' },
    pinepaper_animate: { name: 'Animieren', description: '' },
    pinepaper_keyframe_animate: { name: 'Keyframe-Animation', description: '' },
    pinepaper_play_timeline: { name: 'Zeitleiste abspielen', description: '' },
    pinepaper_execute_generator: { name: 'Generator ausführen', description: '' },
    pinepaper_list_generators: { name: 'Generatoren auflisten', description: '' },
    pinepaper_apply_effect: { name: 'Effekt anwenden', description: '' },
    pinepaper_get_items: { name: 'Elemente abrufen', description: '' },
    pinepaper_get_relation_stats: { name: 'Beziehungsstatistik', description: '' },
    pinepaper_set_background_color: { name: 'Hintergrundfarbe festlegen', description: '' },
    pinepaper_set_canvas_size: { name: 'Leinwandgröße festlegen', description: '' },
    pinepaper_export_svg: { name: 'SVG exportieren', description: '' },
    pinepaper_export_training_data: { name: 'Trainingsdaten exportieren', description: '' },
  },

  errors: {
    itemNotFound: 'Element nicht gefunden: {{itemId}}',
    invalidRelation: 'Ungültige Beziehung: {{relationType}}',
    invalidParams: 'Ungültige Parameter: {{details}}',
    generatorNotFound: 'Generator nicht gefunden: {{generatorName}}',
    exportFailed: 'Export fehlgeschlagen: {{reason}}',
    executionError: 'Ausführungsfehler: {{message}}',
    validationError: 'Validierungsfehler: {{message}}',
    unknownTool: 'Unbekanntes Werkzeug: {{toolName}}',
    apiKeyRequired: 'API-Schlüssel erforderlich',
    apiKeyInvalid: 'Ungültiger API-Schlüssel',
    apiKeyExpired: 'API-Schlüssel abgelaufen',
    rateLimitExceeded: 'Anfragelimit überschritten. Versuchen Sie es in {{seconds}} Sekunden erneut.',
  },

  success: {
    itemCreated: '{{itemType}} an Position ({{x}}, {{y}}) erstellt',
    itemModified: 'Element {{itemId}} geändert',
    itemDeleted: 'Element {{itemId}} gelöscht',
    relationAdded: 'Beziehung {{relationType}} hinzugefügt: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Beziehung zwischen {{sourceId}} und {{targetId}} entfernt',
    animationApplied: 'Animation {{animationType}} auf {{itemId}} angewendet',
    generatorExecuted: 'Generator {{generatorName}} ausgeführt',
    effectApplied: 'Effekt {{effectType}} auf {{itemId}} angewendet',
    backgroundSet: 'Hintergrundfarbe auf {{color}} gesetzt',
    canvasSizeSet: 'Leinwandgröße auf {{width}}×{{height}} gesetzt',
    exported: '{{format}} erfolgreich exportiert',
  },

  itemTypes: {
    text: 'Text',
    circle: 'Kreis',
    star: 'Stern',
    rectangle: 'Rechteck',
    triangle: 'Dreieck',
    polygon: 'Polygon',
    ellipse: 'Ellipse',
    path: 'Pfad',
    line: 'Linie',
    arc: 'Bogen',
  },

  relationTypes: {
    orbits: 'Umkreist',
    follows: 'Folgt',
    attached_to: 'Angehängt an',
    maintains_distance: 'Hält Abstand',
    points_at: 'Zeigt auf',
    mirrors: 'Spiegelt',
    parallax: 'Parallaxe',
    bounds_to: 'Begrenzt auf',
  },

  animationTypes: {
    pulse: 'Pulsieren',
    rotate: 'Rotieren',
    bounce: 'Hüpfen',
    fade: 'Verblassen',
    wobble: 'Wackeln',
    slide: 'Gleiten',
    typewriter: 'Schreibmaschine',
  },

  generators: {
    drawSunburst: 'Sonnenstrahlen',
    drawSunsetScene: 'Sonnenuntergang',
    drawGrid: 'Raster',
    drawStackedCircles: 'Gestapelte Kreise',
    drawCircuit: 'Schaltkreis',
    drawWaves: 'Wellen',
    drawPattern: 'Muster',
  },

  common: {
    at: 'bei',
    with: 'mit',
    to: 'zu',
    from: 'von',
    position: 'Position',
    radius: 'Radius',
    color: 'Farbe',
    speed: 'Geschwindigkeit',
    duration: 'Dauer',
  },
});

export default de;
