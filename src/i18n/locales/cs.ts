/**
 * Czech Translations
 */

import { createBaseTranslation } from './base.js';

export const cs = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Vytvořit položku', description: '' },
    pinepaper_modify_item: { name: 'Upravit položku', description: '' },
    pinepaper_delete_item: { name: 'Smazat položku', description: '' },
    pinepaper_add_relation: { name: 'Přidat vztah', description: '' },
    pinepaper_remove_relation: { name: 'Odebrat vztah', description: '' },
    pinepaper_query_relations: { name: 'Dotaz na vztahy', description: '' },
    pinepaper_animate: { name: 'Animovat', description: '' },
    pinepaper_keyframe_animate: { name: 'Klíčová animace', description: '' },
    pinepaper_play_timeline: { name: 'Přehrát časovou osu', description: '' },
    pinepaper_execute_generator: { name: 'Spustit generátor', description: '' },
    pinepaper_list_generators: { name: 'Seznam generátorů', description: '' },
    pinepaper_apply_effect: { name: 'Použít efekt', description: '' },
    pinepaper_get_items: { name: 'Získat položky', description: '' },
    pinepaper_get_relation_stats: { name: 'Statistiky vztahů', description: '' },
    pinepaper_set_background_color: { name: 'Nastavit barvu pozadí', description: '' },
    pinepaper_set_canvas_size: { name: 'Nastavit velikost plátna', description: '' },
    pinepaper_export_svg: { name: 'Exportovat SVG', description: '' },
    pinepaper_export_training_data: { name: 'Exportovat tréninková data', description: '' },
    // Diagram Tools
    pinepaper_create_diagram_shape: { name: 'Vytvořit tvar diagramu', description: '' },
    pinepaper_connect: { name: 'Propojit položky', description: '' },
    pinepaper_connect_ports: { name: 'Propojit porty', description: '' },
    pinepaper_add_ports: { name: 'Přidat porty', description: '' },
    pinepaper_auto_layout: { name: 'Automatické rozložení', description: '' },
    pinepaper_get_diagram_shapes: { name: 'Získat tvary diagramu', description: '' },
    pinepaper_update_connector: { name: 'Aktualizovat spojení', description: '' },
    pinepaper_remove_connector: { name: 'Odstranit spojení', description: '' },
    pinepaper_diagram_mode: { name: 'Režim diagramu', description: '' },
  },

  errors: {
    itemNotFound: 'Položka nenalezena: {{itemId}}',
    invalidRelation: 'Neplatný vztah: {{relationType}}',
    invalidParams: 'Neplatné parametry: {{details}}',
    generatorNotFound: 'Generátor nenalezen: {{generatorName}}',
    exportFailed: 'Export selhal: {{reason}}',
    executionError: 'Chyba provedení: {{message}}',
    validationError: 'Chyba validace: {{message}}',
    unknownTool: 'Neznámý nástroj: {{toolName}}',
    apiKeyRequired: 'Vyžadován API klíč',
    apiKeyInvalid: 'Neplatný API klíč',
    apiKeyExpired: 'API klíč vypršel',
    rateLimitExceeded: 'Překročen limit požadavků. Zkuste to znovu za {{seconds}} sekund.',
  },

  success: {
    itemCreated: '{{itemType}} vytvořen na pozici ({{x}}, {{y}})',
    itemModified: 'Položka {{itemId}} upravena',
    itemDeleted: 'Položka {{itemId}} smazána',
    relationAdded: 'Vztah {{relationType}} přidán: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Vztah mezi {{sourceId}} a {{targetId}} odebrán',
    animationApplied: 'Animace {{animationType}} použita na {{itemId}}',
    generatorExecuted: 'Generátor {{generatorName}} spuštěn',
    effectApplied: 'Efekt {{effectType}} použit na {{itemId}}',
    backgroundSet: 'Barva pozadí nastavena na {{color}}',
    canvasSizeSet: 'Velikost plátna nastavena na {{width}}×{{height}}',
    exported: '{{format}} úspěšně exportováno',
  },

  itemTypes: {
    text: 'Text',
    circle: 'Kruh',
    star: 'Hvězda',
    rectangle: 'Obdélník',
    triangle: 'Trojúhelník',
    polygon: 'Mnohoúhelník',
    ellipse: 'Elipsa',
    path: 'Cesta',
    line: 'Čára',
    arc: 'Oblouk',
  },

  relationTypes: {
    orbits: 'Obíhá',
    follows: 'Sleduje',
    attached_to: 'Připojeno k',
    maintains_distance: 'Udržuje vzdálenost',
    points_at: 'Ukazuje na',
    mirrors: 'Zrcadlí',
    parallax: 'Paralaxa',
    bounds_to: 'Omezeno na',
  },

  animationTypes: {
    pulse: 'Pulzování',
    rotate: 'Rotace',
    bounce: 'Odraz',
    fade: 'Prolínání',
    wobble: 'Kolébání',
    slide: 'Klouzání',
    typewriter: 'Psací stroj',
  },

  generators: {
    drawSunburst: 'Sluneční paprsky',
    drawSunsetScene: 'Scéna západu slunce',
    drawGrid: 'Mřížka',
    drawStackedCircles: 'Vrstvené kruhy',
    drawCircuit: 'Deska plošných spojů',
    drawWaves: 'Vlny',
    drawPattern: 'Vzor',
  },

  common: {
    at: 'na',
    with: 's',
    to: 'do',
    from: 'z',
    position: 'pozice',
    radius: 'poloměr',
    color: 'barva',
    speed: 'rychlost',
    duration: 'trvání',
  },
});

export default cs;
