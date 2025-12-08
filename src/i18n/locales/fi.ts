/**
 * Finnish Translations
 */

import { createBaseTranslation } from './base.js';

export const fi = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Luo kohde', description: '' },
    pinepaper_modify_item: { name: 'Muokkaa kohdetta', description: '' },
    pinepaper_delete_item: { name: 'Poista kohde', description: '' },
    pinepaper_add_relation: { name: 'Lisää suhde', description: '' },
    pinepaper_remove_relation: { name: 'Poista suhde', description: '' },
    pinepaper_query_relations: { name: 'Kysy suhteet', description: '' },
    pinepaper_animate: { name: 'Animoi', description: '' },
    pinepaper_keyframe_animate: { name: 'Avainkuva-animaatio', description: '' },
    pinepaper_play_timeline: { name: 'Toista aikajana', description: '' },
    pinepaper_execute_generator: { name: 'Suorita generaattori', description: '' },
    pinepaper_list_generators: { name: 'Listaa generaattorit', description: '' },
    pinepaper_apply_effect: { name: 'Käytä tehostetta', description: '' },
    pinepaper_get_items: { name: 'Hae kohteet', description: '' },
    pinepaper_get_relation_stats: { name: 'Suhdetilastot', description: '' },
    pinepaper_set_background_color: { name: 'Aseta taustaväri', description: '' },
    pinepaper_set_canvas_size: { name: 'Aseta kankaan koko', description: '' },
    pinepaper_export_svg: { name: 'Vie SVG', description: '' },
    pinepaper_export_training_data: { name: 'Vie harjoitusdata', description: '' },
  },

  errors: {
    itemNotFound: 'Kohdetta ei löydy: {{itemId}}',
    invalidRelation: 'Virheellinen suhde: {{relationType}}',
    invalidParams: 'Virheelliset parametrit: {{details}}',
    generatorNotFound: 'Generaattoria ei löydy: {{generatorName}}',
    exportFailed: 'Vienti epäonnistui: {{reason}}',
    executionError: 'Suoritusvirhe: {{message}}',
    validationError: 'Vahvistusvirhe: {{message}}',
    unknownTool: 'Tuntematon työkalu: {{toolName}}',
    apiKeyRequired: 'API-avain vaaditaan',
    apiKeyInvalid: 'Virheellinen API-avain',
    apiKeyExpired: 'API-avain vanhentunut',
    rateLimitExceeded: 'Pyyntöraja ylitetty. Yritä uudelleen {{seconds}} sekunnin kuluttua.',
  },

  success: {
    itemCreated: '{{itemType}} luotu kohtaan ({{x}}, {{y}})',
    itemModified: 'Kohde {{itemId}} muokattu',
    itemDeleted: 'Kohde {{itemId}} poistettu',
    relationAdded: '{{relationType}}-suhde lisätty: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Suhde {{sourceId}} ja {{targetId}} välillä poistettu',
    animationApplied: '{{animationType}}-animaatio käytetty kohteeseen {{itemId}}',
    generatorExecuted: '{{generatorName}}-generaattori suoritettu',
    effectApplied: '{{effectType}}-tehoste käytetty kohteeseen {{itemId}}',
    backgroundSet: 'Taustaväri asetettu arvoon {{color}}',
    canvasSizeSet: 'Kankaan koko asetettu arvoon {{width}}×{{height}}',
    exported: '{{format}} viety onnistuneesti',
  },

  itemTypes: {
    text: 'Teksti',
    circle: 'Ympyrä',
    star: 'Tähti',
    rectangle: 'Suorakulmio',
    triangle: 'Kolmio',
    polygon: 'Monikulmio',
    ellipse: 'Ellipsi',
    path: 'Polku',
    line: 'Viiva',
    arc: 'Kaari',
  },

  relationTypes: {
    orbits: 'Kiertää',
    follows: 'Seuraa',
    attached_to: 'Kiinnitetty',
    maintains_distance: 'Ylläpitää etäisyyttä',
    points_at: 'Osoittaa',
    mirrors: 'Peilaa',
    parallax: 'Parallaksi',
    bounds_to: 'Rajoitettu',
  },

  animationTypes: {
    pulse: 'Pulssi',
    rotate: 'Pyöritys',
    bounce: 'Pomppiminen',
    fade: 'Häivytys',
    wobble: 'Heiluminen',
    slide: 'Liukuminen',
    typewriter: 'Kirjoituskone',
  },

  generators: {
    drawSunburst: 'Auringonsäteet',
    drawSunsetScene: 'Auringonlaskukohtaus',
    drawGrid: 'Ruudukko',
    drawStackedCircles: 'Pinotut ympyrät',
    drawCircuit: 'Piirilevy',
    drawWaves: 'Aallot',
    drawPattern: 'Kuvio',
  },

  common: {
    at: 'kohdassa',
    with: 'kanssa',
    to: 'kohteeseen',
    from: 'kohteesta',
    position: 'sijainti',
    radius: 'säde',
    color: 'väri',
    speed: 'nopeus',
    duration: 'kesto',
  },
});

export default fi;
