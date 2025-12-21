/**
 * Hungarian Translations
 */

import { createBaseTranslation } from './base.js';

export const hu = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Elem létrehozása', description: '' },
    pinepaper_modify_item: { name: 'Elem módosítása', description: '' },
    pinepaper_delete_item: { name: 'Elem törlése', description: '' },
    pinepaper_add_relation: { name: 'Kapcsolat hozzáadása', description: '' },
    pinepaper_remove_relation: { name: 'Kapcsolat eltávolítása', description: '' },
    pinepaper_query_relations: { name: 'Kapcsolatok lekérdezése', description: '' },
    pinepaper_animate: { name: 'Animálás', description: '' },
    pinepaper_keyframe_animate: { name: 'Kulcskocka animáció', description: '' },
    pinepaper_play_timeline: { name: 'Idővonal lejátszása', description: '' },
    pinepaper_execute_generator: { name: 'Generátor futtatása', description: '' },
    pinepaper_list_generators: { name: 'Generátorok listája', description: '' },
    pinepaper_apply_effect: { name: 'Effektus alkalmazása', description: '' },
    pinepaper_get_items: { name: 'Elemek lekérése', description: '' },
    pinepaper_get_relation_stats: { name: 'Kapcsolat statisztikák', description: '' },
    pinepaper_set_background_color: { name: 'Háttérszín beállítása', description: '' },
    pinepaper_set_canvas_size: { name: 'Vászonméret beállítása', description: '' },
    pinepaper_export_svg: { name: 'SVG exportálás', description: '' },
    pinepaper_export_training_data: { name: 'Képzési adatok exportálása', description: '' },
    // Diagram Tools
    pinepaper_create_diagram_shape: { name: 'Diagramforma létrehozása', description: '' },
    pinepaper_connect: { name: 'Elemek összekapcsolása', description: '' },
    pinepaper_connect_ports: { name: 'Portok összekapcsolása', description: '' },
    pinepaper_add_ports: { name: 'Portok hozzáadása', description: '' },
    pinepaper_auto_layout: { name: 'Automatikus elrendezés', description: '' },
    pinepaper_get_diagram_shapes: { name: 'Diagramformák lekérése', description: '' },
    pinepaper_update_connector: { name: 'Csatlakozó frissítése', description: '' },
    pinepaper_remove_connector: { name: 'Csatlakozó eltávolítása', description: '' },
    pinepaper_diagram_mode: { name: 'Diagram mód', description: '' },
  },

  errors: {
    itemNotFound: 'Az elem nem található: {{itemId}}',
    invalidRelation: 'Érvénytelen kapcsolat: {{relationType}}',
    invalidParams: 'Érvénytelen paraméterek: {{details}}',
    generatorNotFound: 'A generátor nem található: {{generatorName}}',
    exportFailed: 'Az exportálás sikertelen: {{reason}}',
    executionError: 'Végrehajtási hiba: {{message}}',
    validationError: 'Érvényesítési hiba: {{message}}',
    unknownTool: 'Ismeretlen eszköz: {{toolName}}',
    apiKeyRequired: 'API kulcs szükséges',
    apiKeyInvalid: 'Érvénytelen API kulcs',
    apiKeyExpired: 'Az API kulcs lejárt',
    rateLimitExceeded: 'Kérési korlát túllépve. Próbálja újra {{seconds}} másodperc múlva.',
  },

  success: {
    itemCreated: '{{itemType}} létrehozva a ({{x}}, {{y}}) pozícióban',
    itemModified: '{{itemId}} elem módosítva',
    itemDeleted: '{{itemId}} elem törölve',
    relationAdded: '{{relationType}} kapcsolat hozzáadva: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Kapcsolat eltávolítva {{sourceId}} és {{targetId}} között',
    animationApplied: '{{animationType}} animáció alkalmazva {{itemId}}-re',
    generatorExecuted: '{{generatorName}} generátor végrehajtva',
    effectApplied: '{{effectType}} effektus alkalmazva {{itemId}}-re',
    backgroundSet: 'Háttérszín beállítva: {{color}}',
    canvasSizeSet: 'Vászonméret beállítva: {{width}}×{{height}}',
    exported: '{{format}} sikeresen exportálva',
  },

  itemTypes: {
    text: 'Szöveg',
    circle: 'Kör',
    star: 'Csillag',
    rectangle: 'Téglalap',
    triangle: 'Háromszög',
    polygon: 'Sokszög',
    ellipse: 'Ellipszis',
    path: 'Útvonal',
    line: 'Vonal',
    arc: 'Ív',
  },

  relationTypes: {
    orbits: 'Kering',
    follows: 'Követ',
    attached_to: 'Csatolva',
    maintains_distance: 'Távolságot tart',
    points_at: 'Mutat',
    mirrors: 'Tükröz',
    parallax: 'Parallaxis',
    bounds_to: 'Korlátozott',
  },

  animationTypes: {
    pulse: 'Lüktetés',
    rotate: 'Forgás',
    bounce: 'Pattogás',
    fade: 'Elhalványulás',
    wobble: 'Imbolygás',
    slide: 'Csúszás',
    typewriter: 'Írógép',
  },

  generators: {
    drawSunburst: 'Napsugarak',
    drawSunsetScene: 'Naplemente jelenet',
    drawGrid: 'Rács',
    drawStackedCircles: 'Egymásra rakott körök',
    drawCircuit: 'Áramköri lap',
    drawWaves: 'Hullámok',
    drawPattern: 'Minta',
  },

  common: {
    at: 'itt',
    with: 'val',
    to: 'hoz',
    from: 'tól',
    position: 'pozíció',
    radius: 'sugár',
    color: 'szín',
    speed: 'sebesség',
    duration: 'időtartam',
  },
});

export default hu;
