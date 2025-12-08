/**
 * Icelandic Translations
 */

import { TranslationKeys } from '../types.js';

export const is: TranslationKeys = {
  tools: {
    pinepaper_create_item: {
      name: 'Búa til hlut',
      description: `Búa til hlut á PinePaper striga.

NOTAÐU ÞEGAR:
- Notandi vill bæta við texta, formum eða grafík á strigann
- Að búa til ný sjónræn element (hringi, stjörnur, rétthyrninga, o.s.frv.)
- Byrja á nýrri senu eða samsetningu

TEGUND HLUTA:
- text: Textainnihald með leturstíl
- circle: Hringlaga form með radíus
- star: Stjörnuform með innri/ytri radíus
- rectangle: Rétthyrningur með breidd/hæð
- triangle: Þríhyrningslaga form
- polygon: Reglulegur marghyrningur með N hliðum
- ellipse: Sporöskjulaga form
- path: Sérsniðin slóð með hlutum eða SVG gögnum
- line: Lína milli tveggja punkta
- arc: Boginn bogi í gegnum þrjá punkta

DÆMI:
- "Búa til rauðan texta sem segir HELLO" → type: text, content: "HELLO", color: "#ef4444"
- "Bæta við bláum hring" → type: circle, radius: 50, color: "#3b82f6"
- "Búa til 5 odda gullstjörnu" → type: star, radius1: 60, radius2: 30, color: "#fbbf24"`,
      params: {
        itemType: 'Tegund hlutar til að búa til',
        position: 'Staðsetning á striga',
        properties: 'Tegundasértækar eiginleikar (innihald, radíus, litur, leturstærð, o.s.frv.)',
      },
    },
    pinepaper_modify_item: {
      name: 'Breyta hlut',
      description: `Breyta eiginleikum núverandi hlutar.

NOTAÐU ÞEGAR:
- Breyta lit, stærð, staðsetningu núverandi hlutar
- Uppfæra textainnihald
- Stilla stíleiginleika

BREYTANLEGIR EIGINLEIKAR:
- position: {x, y} eða aðskilið x, y
- color/fillColor: Fyllilitur
- strokeColor: Útlínulitur
- strokeWidth: Útlínuþykkt
- fontSize: Textastærð
- content: Textainnihald
- opacity: Gegnsæi (0-1)
- rotation: Snúningur í gráðum
- scale: Stærðarmargfaldari`,
      params: {
        itemId: 'Skráar ID hlutar (t.d., "item_1")',
        properties: 'Eiginleikar til að uppfæra',
      },
    },
    pinepaper_delete_item: {
      name: 'Eyða hlut',
      description: `Eyða hlut af striga.

NOTAÐU ÞEGAR:
- Fjarlægja óæskilega hluti
- Hreinsa ákveðin element
- Þrífa senuna`,
      params: {
        itemId: 'Skráar ID hlutar til að eyða',
      },
    },
    pinepaper_add_relation: {
      name: 'Bæta við tengslum',
      description: `Búa til hegðunartengsl milli tveggja hluta. Tengsl eru AÐAL leiðin til að bæta við hreyfimyndum í PinePaper - þau lýsa HVERNIG hlutir eiga að hegða sér gagnvart hvorum öðrum.

NOTAÐU ÞEGAR:
- "tungl umkringir jörð" → relationType: orbits
- "merki fylgir leikmanni" → relationType: follows
- "hattur festur við persónu" → relationType: attached_to
- "halda gervitungli 200px frá stöð" → relationType: maintains_distance
- "ör bendir á skotmark" → relationType: points_at
- "speglun speglar upprunalegt" → relationType: mirrors
- "bakgrunnur hreyfist með parallax" → relationType: parallax
- "leikmaður helst á velli" → relationType: bounds_to

TEGUNDIR TENGSLA:
- orbits: Hringhreyfing umhverfis skotmark (params: radius, speed, direction)
- follows: Hreyfast í átt að skotmarki með sléttun (params: offset, smoothing, delay)
- attached_to: Föst tilfærsla frá skotmarki (params: offset, inherit_rotation)
- maintains_distance: Halda fastri fjarlægð frá skotmarki (params: distance, strength)
- points_at: Snúa til að horfa á skotmark (params: offset_angle, smoothing)
- mirrors: Spegla staðsetningu yfir ás (params: axis, center)
- parallax: Hreyfast hlutfallslega eftir dýpt (params: depth, origin)
- bounds_to: Halda sig innan marka (params: padding, bounce)

Tengsl eru SAMSETNINGSHÆF - hlutur getur haft mörg tengsl sem vinna saman!`,
      params: {
        sourceId: 'Skráar ID upprunahlutar (hluturinn sem verður fyrir áhrifum)',
        targetId: 'Skráar ID skotmarkshlutar (hluturinn sem er tengdur við)',
        relationType: 'Tegund tengsla',
        params: 'Tengsla-sértækar breytur',
      },
    },
    pinepaper_remove_relation: {
      name: 'Fjarlægja tengsl',
      description: `Fjarlægja tengsl milli hluta.

NOTAÐU ÞEGAR:
- Stöðva sporbauga hreyfimynd
- Aftengja hluti frá hvorum öðrum
- Fjarlægja hegðunartengingar`,
      params: {
        sourceId: 'Upprunalegt hlutar ID',
        targetId: 'Skotmarks hlutar ID',
        relationType: 'Sérstök tegund tengsla til að fjarlægja (valfrjálst - fjarlægir öll ef ekki tilgreint)',
      },
    },
    pinepaper_query_relations: {
      name: 'Spyrjast fyrir um tengsl',
      description: `Spyrjast fyrir um tengsl fyrir hlut.

NOTAÐU ÞEGAR:
- Finna hvaða hlutir eru í sporbaug um miðlægan hlut
- Athuga núverandi tengsl áður en nýjum er bætt við
- Kemba hegðun hreyfimynda`,
      params: {
        itemId: 'Hlutur til að spyrjast fyrir um tengsl fyrir',
        relationType: 'Sía eftir tegundum tengsla (valfrjálst)',
        direction: 'outgoing = tengsl FRÁ hlut, incoming = tengsl TIL hlutar',
      },
    },
    pinepaper_animate: {
      name: 'Hreyfimynda',
      description: `Beita einfaldri LYKKJU hreyfimynd á hlut. Þetta eru samfelldar hreyfimyndir sem endurtaka sig endalaust.

NOTAÐU ÞEGAR:
- "láta það púlsa" → animationType: pulse
- "snúast lógó" → animationType: rotate
- "hoppandi texti" → animationType: bounce
- "dofnandi áhrif" → animationType: fade
- "vaggandi hnappur" → animationType: wobble
- "rennandi hausfyrirsögn" → animationType: slide
- "ritvélaráhrif" → animationType: typewriter (aðeins texti)

EKKI NOTA ÞEGAR:
- Notandi tilgreinir nákvæman tíma ("dofna inn yfir 3 sekúndur") → Notaðu keyframe hreyfimynd
- Notandi vill hreyfimyndir í röð ("fyrst dofna, svo snúast") → Notaðu keyframe hreyfimynd
- Notandi lýsir tengslum ("snúast umhverfis") → Notaðu tengsl`,
      params: {
        itemId: 'Skráar ID hlutar',
        animationType: 'Tegund hreyfimyndar',
        speed: 'Hraðamargfaldari hreyfimyndar (sjálfgefið: 1.0)',
      },
    },
    pinepaper_keyframe_animate: {
      name: 'Keyframe hreyfimynd',
      description: `Beita keyframe-byggðri hreyfimynd með nákvæmri tímasetningu og eiginleikastjórnun.

NOTAÐU ÞEGAR:
- "dofna inn yfir 3 sekúndur"
- "færa frá vinstri til hægri á 2 sekúndum"
- "breyta lit úr rauðu í blátt"
- "fyrst dofna inn, svo snúast, svo dofna út"
- Hvaða hreyfimynd sem er með sérstaka tímasetningu eða raðbundna áfanga`,
      params: {
        itemId: 'Skráar ID hlutar',
        keyframes: 'Fylki af keyframes með tíma, eiginleikum og easing',
        duration: 'Heildarlengd hreyfimyndar í sekúndum',
        loop: 'Hvort eigi að lykkja hreyfimyndina',
      },
    },
    pinepaper_play_timeline: {
      name: 'Spila tímalínu',
      description: `Stjórna keyframe hreyfimyndaspilar.

NOTAÐU ÞEGAR:
- Byrja/stöðva tímalínuspilun
- Leita að ákveðnum tíma
- Stjórna stöðu hreyfimyndar`,
      params: {
        action: 'Spilunaraðgerð (play, stop, seek)',
        duration: 'Lengd fyrir spilunaraðgerð',
        loop: 'Hvort eigi að lykkja',
        time: 'Tími til að leita að (fyrir seek aðgerð)',
      },
    },
    pinepaper_execute_generator: {
      name: 'Keyra generator',
      description: `Keyra bakgrunns generator til að búa til procedural mynstur.

NOTAÐU ÞEGAR:
- "bæta við sunburst bakgrunni"
- "búa til bylgjumynstur"
- "rist bakgrunnur"
- "rásamynstur"
- Búa til kvikmyndir procedural bakgrunna`,
      params: {
        generatorName: 'Nafn generator',
        params: 'Generator-sértækar breytur',
      },
    },
    pinepaper_list_generators: {
      name: 'Lista generators',
      description: `Fá lista yfir alla tiltæka bakgrunns generators með þeirra breytum.

NOTAÐU ÞEGAR:
- Notandi spyr "hvaða bakgrunnar eru tiltækir?"
- Þarf að sýna generator valkosti
- Uppgötva generator getu`,
    },
    pinepaper_apply_effect: {
      name: 'Beita áhrifum',
      description: `Beita sjónrænum áhrifum á hlut.

NOTAÐU ÞEGAR:
- Bæta við glitrandi/glansandi áhrifum
- Búa til sprengingu/sprengiáhrif
- Auka sjónræn áhrif`,
      params: {
        itemId: 'Skráar ID hlutar',
        effectType: 'Tegund áhrifa (sparkle, blast)',
        params: 'Breytur áhrifa',
      },
    },
    pinepaper_get_items: {
      name: 'Sækja hluti',
      description: `Sækja alla eða síaða hluti af striga.

NOTAÐU ÞEGAR:
- Lista hvað er á striga
- Finna hluti eftir tegund
- Athuga hreyfimyndaða hluti
- Skoðun senu`,
      params: {
        filter: 'Valfrjálsar síuskilyrði',
      },
    },
    pinepaper_get_relation_stats: {
      name: 'Sækja tengslatölfræði',
      description: `Sækja tölfræði um virk tengsl í senu.

NOTAÐU ÞEGAR:
- Kemba tengslakerfi
- Skilja flækjustig senu
- Greiningar og skýrslugerð`,
    },
    pinepaper_set_background_color: {
      name: 'Stilla bakgrunnslit',
      description: `Stilla bakgrunnslit striga.

NOTAÐU ÞEGAR:
- Breyta bakgrunni senu
- Setja upp striga áður en hlutum er bætt við`,
      params: {
        color: 'Bakgrunnslitur (hex, rgb, eða nafngreindur)',
      },
    },
    pinepaper_set_canvas_size: {
      name: 'Stilla stærð striga',
      description: `Breyta víddum striga.

NOTAÐU ÞEGAR:
- Setja upp fyrir ákveðið snið (Instagram, YouTube, o.s.frv.)
- Sérsniðnar kröfur um strigastærð

ALGENG FORSTILLING:
- instagram-square: 1080x1080
- instagram-story: 1080x1920
- youtube-thumbnail: 1280x720
- twitter-post: 1200x675`,
      params: {
        width: 'Breidd striga',
        height: 'Hæð striga',
        preset: 'Valfrjálst forstillingarheiti',
      },
    },
    pinepaper_export_svg: {
      name: 'Flytja út SVG',
      description: `Flytja út senu sem hreyfimyndað SVG.

NOTAÐU ÞEGAR:
- Vista verk sem SVG skrá
- Búa til delanleg grafík
- Lokaútflutningur`,
      params: {
        animated: 'Innihalda CSS hreyfimyndir (sjálfgefið: true)',
      },
    },
    pinepaper_export_training_data: {
      name: 'Flytja út þjálfunargögn',
      description: `Flytja út tengslgögn sem þjálfunarpör fyrir LLM fínstillingu.

NOTAÐU ÞEGAR:
- Búa til þjálfunargögn fyrir fínstillingu
- Búa til dæmi úr núverandi senu
- Byggja sérsniðin hreyfimyndalíkana þjálfunarsett`,
      params: {
        format: 'Úttakssnið (json eða jsonl)',
        includeMetadata: 'Innihalda tengsl metadata',
      },
    },
  },

  errors: {
    itemNotFound: 'Hlutur fannst ekki: {{itemId}}',
    invalidRelation: 'Ógild tengsl: {{relationType}}',
    invalidParams: 'Ógild færibreytur: {{details}}',
    generatorNotFound: 'Generator fannst ekki: {{generatorName}}',
    exportFailed: 'Útflutningur mistókst: {{reason}}',
    executionError: 'Keyrsluvilla: {{message}}',
    validationError: 'Staðfestingarvilla: {{message}}',
    unknownTool: 'Óþekkt tól: {{toolName}}',
    apiKeyRequired: 'API lykill nauðsynlegur',
    apiKeyInvalid: 'Ógildur API lykill',
    apiKeyExpired: 'API lykill útrunninn',
    rateLimitExceeded: 'Hraðatakmörkun náð. Reyndu aftur eftir {{seconds}} sekúndur.',
  },

  success: {
    itemCreated: 'Bjó til {{itemType}} á staðsetningu ({{x}}, {{y}})',
    itemModified: 'Breytti hlut {{itemId}}',
    itemDeleted: 'Eyddi hlut {{itemId}}',
    relationAdded: 'Bætti við {{relationType}} tengslum: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Fjarlægði tengsl milli {{sourceId}} og {{targetId}}',
    animationApplied: 'Beitti {{animationType}} hreyfimynd á {{itemId}}',
    generatorExecuted: 'Keyrði {{generatorName}} generator',
    effectApplied: 'Beitti {{effectType}} áhrifum á {{itemId}}',
    backgroundSet: 'Stillti bakgrunnslit á {{color}}',
    canvasSizeSet: 'Stillti strigastærð á {{width}}×{{height}}',
    exported: 'Flutti út {{format}} með góðum árangri',
  },

  itemTypes: {
    text: 'Texti',
    circle: 'Hringur',
    star: 'Stjarna',
    rectangle: 'Rétthyrningur',
    triangle: 'Þríhyrningur',
    polygon: 'Marghyrningur',
    ellipse: 'Sporöskja',
    path: 'Slóð',
    line: 'Lína',
    arc: 'Bogi',
  },

  relationTypes: {
    orbits: 'Umkringir',
    follows: 'Fylgir',
    attached_to: 'Fest við',
    maintains_distance: 'Heldur fjarlægð',
    points_at: 'Bendir á',
    mirrors: 'Speglar',
    parallax: 'Parallax',
    bounds_to: 'Bundið við',
  },

  animationTypes: {
    pulse: 'Púls',
    rotate: 'Snúast',
    bounce: 'Hoppa',
    fade: 'Dofna',
    wobble: 'Vagga',
    slide: 'Renna',
    typewriter: 'Ritvél',
  },

  generators: {
    drawSunburst: 'Sólgeisli',
    drawSunsetScene: 'Sólsetur',
    drawGrid: 'Rist',
    drawStackedCircles: 'Staflað hringir',
    drawCircuit: 'Rásamynstur',
    drawWaves: 'Bylgjur',
    drawPattern: 'Mynstur',
  },

  common: {
    at: 'á',
    with: 'með',
    to: 'til',
    from: 'frá',
    position: 'staðsetning',
    radius: 'radíus',
    color: 'litur',
    speed: 'hraði',
    duration: 'lengd',
  },
};
