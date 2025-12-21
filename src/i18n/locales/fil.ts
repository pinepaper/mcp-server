/**
 * Filipino Translations
 */

import { TranslationKeys } from '../types.js';

export const fil: TranslationKeys = {
  tools: {
    pinepaper_create_item: {
      name: 'Lumikha ng Item',
      description: `Lumikha ng item sa PinePaper canvas.

GAMITIN KAPAG:
- Gusto ng user na magdagdag ng text, hugis, o graphics sa canvas
- Paglikha ng mga bagong visual element (bilog, bituin, parihaba, atbp.)
- Pagsisimula ng bagong eksena o komposisyon

MGA URI NG ITEM:
- text: Nilalaman ng text na may font styling
- circle: Bilog na hugis na may radius
- star: Hugis bituin na may inner/outer radius
- rectangle: Parihaba na may lapad/taas
- triangle: Tatsulok na hugis
- polygon: Regular na polygon na may N na gilid
- ellipse: Oblong na hugis
- path: Custom na path na may segment o SVG data
- line: Linya sa pagitan ng dalawang punto
- arc: Curved arc sa tatlong punto

MGA HALIMBAWA:
- "Lumikha ng pulang text na nagsasabing HELLO" → type: text, content: "HELLO", color: "#ef4444"
- "Magdagdag ng asul na bilog" → type: circle, radius: 50, color: "#3b82f6"
- "Lumikha ng 5-pointed gold star" → type: star, radius1: 60, radius2: 30, color: "#fbbf24"`,
      params: {
        itemType: 'Uri ng item na lilikhain',
        position: 'Posisyon sa canvas',
        properties: 'Mga katangian na tukoy sa uri (nilalaman, radius, kulay, laki ng font, atbp.)',
      },
    },
    pinepaper_modify_item: {
      name: 'Baguhin ang Item',
      description: `Baguhin ang mga katangian ng isang umiiral na item.

GAMITIN KAPAG:
- Pagpapalit ng kulay, laki, posisyon ng umiiral na item
- Pag-update ng nilalaman ng text
- Pag-aayos ng mga katangian ng estilo

MGA MABABAGONG KATANGIAN:
- position: {x, y} o hiwalay na x, y
- color/fillColor: Kulay ng fill
- strokeColor: Kulay ng balangkas
- strokeWidth: Kapal ng balangkas
- fontSize: Laki ng text
- content: Nilalaman ng text
- opacity: Transparency (0-1)
- rotation: Pag-ikot sa degrees
- scale: Multiplier ng laki`,
      params: {
        itemId: 'Registry ID ng item (hal., "item_1")',
        properties: 'Mga katangiang i-a-update',
      },
    },
    pinepaper_delete_item: {
      name: 'Burahin ang Item',
      description: `Burahin ang item mula sa canvas.

GAMITIN KAPAG:
- Pag-alis ng mga hindi gustong item
- Pag-clear ng mga tukoy na elemento
- Paglilinis ng eksena`,
      params: {
        itemId: 'Registry ID ng item na buburahin',
      },
    },
    pinepaper_add_relation: {
      name: 'Magdagdag ng Relasyon',
      description: `Lumikha ng relasyon ng pag-uugali sa pagitan ng dalawang item. Ang mga relasyon ang PANGUNAHING paraan upang magdagdag ng animation sa PinePaper - inilalarawan nila KUNG PAANO dapat kumilos ang mga item kaugnay sa isa't isa.

GAMITIN KAPAG:
- "buwan umiikot sa mundo" → relationType: orbits
- "label sumusunod sa player" → relationType: follows
- "sombrero nakakabit sa karakter" → relationType: attached_to
- "panatilihin ang satellite 200px mula sa station" → relationType: maintains_distance
- "arrow tumuturo sa target" → relationType: points_at
- "salamin ng orihinal" → relationType: mirrors
- "background gumagalaw na may parallax" → relationType: parallax
- "player nananatili sa arena" → relationType: bounds_to

MGA URI NG RELASYON:
- orbits: Paikot na paggalaw sa paligid ng target (params: radius, speed, direction)
- follows: Gumalaw patungo sa target na may smoothing (params: offset, smoothing, delay)
- attached_to: Fixed offset mula sa target (params: offset, inherit_rotation)
- maintains_distance: Manatili sa fixed na distansya mula sa target (params: distance, strength)
- points_at: Umikot upang humarap sa target (params: offset_angle, smoothing)
- mirrors: Mirror position sa axis (params: axis, center)
- parallax: Gumalaw na relative sa lalim (params: depth, origin)
- bounds_to: Manatili sa loob ng hangganan (params: padding, bounce)

Ang mga relasyon ay COMPOSITIONAL - ang isang item ay maaaring magkaroon ng maraming relasyon na nagtutulungan!`,
      params: {
        sourceId: 'Registry ID ng source item (ang item na maaapektuhan)',
        targetId: 'Registry ID ng target item (ang item na may kaugnayan)',
        relationType: 'Uri ng relasyon',
        params: 'Mga parameter na tukoy sa relasyon',
      },
    },
    pinepaper_remove_relation: {
      name: 'Alisin ang Relasyon',
      description: `Alisin ang relasyon sa pagitan ng mga item.

GAMITIN KAPAG:
- Pagtigil ng orbital animation
- Paghihiwalay ng mga item mula sa isa't isa
- Pag-alis ng mga koneksyon ng pag-uugali`,
      params: {
        sourceId: 'ID ng source item',
        targetId: 'ID ng target item',
        relationType: 'Tukoy na uri ng relasyon na aalisin (opsyonal - aalisin lahat kung hindi tinukoy)',
      },
    },
    pinepaper_query_relations: {
      name: 'Query ng mga Relasyon',
      description: `I-query ang mga relasyon para sa isang item.

GAMITIN KAPAG:
- Paghahanap kung anong mga item ang umiikot sa isang central object
- Pagsusuri ng mga umiiral na relasyon bago magdagdag ng bago
- Pag-debug ng mga animation behavior`,
      params: {
        itemId: 'Item na i-query ang mga relasyon',
        relationType: 'I-filter ayon sa uri ng relasyon (opsyonal)',
        direction: 'outgoing = mga relasyon MULA sa item, incoming = mga relasyon PATUNGO sa item',
      },
    },
    pinepaper_animate: {
      name: 'I-animate',
      description: `Mag-apply ng simpleng LOOP animation sa isang item. Ito ay tuloy-tuloy na mga animation na paulit-ulit nang walang hanggan.

GAMITIN KAPAG:
- "paandarin ito" → animationType: pulse
- "umiikot na logo" → animationType: rotate
- "tumatalon na text" → animationType: bounce
- "kumukupas na effect" → animationType: fade
- "umuugoy na button" → animationType: wobble
- "umuusog na header" → animationType: slide
- "typewriter effect" → animationType: typewriter (text lamang)

HUWAG GAMITIN KAPAG:
- Ang user ay nagtukoy ng eksaktong timing ("fade in sa loob ng 3 segundo") → Gumamit ng keyframe animation
- Gusto ng user ng sunud-sunod na animation ("unang fade, pagkatapos rotate") → Gumamit ng keyframe animation
- Inilalarawan ng user ang mga relasyon ("umikot sa paligid") → Gumamit ng mga relasyon`,
      params: {
        itemId: 'Registry ID ng item',
        animationType: 'Uri ng animation',
        speed: 'Multiplier ng bilis ng animation (default: 1.0)',
      },
    },
    pinepaper_keyframe_animate: {
      name: 'Keyframe Animation',
      description: `Mag-apply ng keyframe-based animation na may tumpak na timing at kontrol ng property.

GAMITIN KAPAG:
- "fade in sa loob ng 3 segundo"
- "gumalaw mula kaliwa patungong kanan sa 2 segundo"
- "palitan ang kulay mula pula patungong asul"
- "unang fade in, pagkatapos rotate, pagkatapos fade out"
- Anumang animation na may tukoy na timing o sunud-sunod na yugto`,
      params: {
        itemId: 'Registry ID ng item',
        keyframes: 'Array ng mga keyframe na may oras, katangian, at easing',
        duration: 'Kabuuang tagal ng animation sa segundo',
        loop: 'Kung i-loop ang animation',
      },
    },
    pinepaper_play_timeline: {
      name: 'I-play ang Timeline',
      description: `Kontrolin ang playback ng keyframe animation.

GAMITIN KAPAG:
- Pagsisimula/pagtigil ng timeline playback
- Paghahanap ng tukoy na oras
- Pagkontrol ng estado ng animation`,
      params: {
        action: 'Aksyon ng playback (play, stop, seek)',
        duration: 'Tagal para sa play action',
        loop: 'Kung i-loop',
        time: 'Oras na hahanapin (para sa seek action)',
      },
    },
    pinepaper_execute_generator: {
      name: 'Isagawa ang Generator',
      description: `Isagawa ang background generator upang lumikha ng procedural patterns.

GAMITIN KAPAG:
- "magdagdag ng sunburst background"
- "lumikha ng wave pattern"
- "grid background"
- "circuit board pattern"
- Paglikha ng dynamic procedural backgrounds`,
      params: {
        generatorName: 'Pangalan ng generator',
        params: 'Mga parameter na tukoy sa generator',
      },
    },
    pinepaper_list_generators: {
      name: 'Ilista ang mga Generator',
      description: `Kumuha ng listahan ng lahat ng available na background generators na may kanilang mga parameter.

GAMITIN KAPAG:
- Nagtanong ang user "anong mga background ang available?"
- Kailangang ipakita ang mga pagpipilian ng generator
- Pag-alam ng mga kakayahan ng generator`,
    },
    pinepaper_apply_effect: {
      name: 'Mag-apply ng Effect',
      description: `Mag-apply ng visual effect sa isang item.

GAMITIN KAPAG:
- Pagdaragdag ng sparkle/glitter effects
- Paglikha ng burst/explosion effects
- Pagpapahusay ng visual impact`,
      params: {
        itemId: 'Registry ID ng item',
        effectType: 'Uri ng effect (sparkle, blast)',
        params: 'Mga parameter ng effect',
      },
    },
    pinepaper_get_items: {
      name: 'Kumuha ng mga Item',
      description: `Kumuha ng lahat o filtered na mga item mula sa canvas.

GAMITIN KAPAG:
- Paglilista ng nasa canvas
- Paghahanap ng mga item ayon sa uri
- Pagsusuri ng mga animated item
- Pagsisiyasat ng eksena`,
      params: {
        filter: 'Opsyonal na filter criteria',
      },
    },
    pinepaper_get_relation_stats: {
      name: 'Kumuha ng Relation Stats',
      description: `Kumuha ng mga istatistika tungkol sa mga aktibong relasyon sa eksena.

GAMITIN KAPAG:
- Pag-debug ng relation system
- Pag-unawa sa complexity ng eksena
- Analytics at pag-uulat`,
    },
    pinepaper_set_background_color: {
      name: 'Itakda ang Kulay ng Background',
      description: `Itakda ang kulay ng background ng canvas.

GAMITIN KAPAG:
- Pagpapalit ng background ng eksena
- Pag-set up ng canvas bago magdagdag ng mga item`,
      params: {
        color: 'Kulay ng background (hex, rgb, o named)',
      },
    },
    pinepaper_set_canvas_size: {
      name: 'Itakda ang Laki ng Canvas',
      description: `Baguhin ang mga dimensyon ng canvas.

GAMITIN KAPAG:
- Pag-set up para sa tukoy na format (Instagram, YouTube, atbp.)
- Mga kinakailangan sa custom na laki ng canvas

MGA KARANIWANG PRESET:
- instagram-square: 1080x1080
- instagram-story: 1080x1920
- youtube-thumbnail: 1280x720
- twitter-post: 1200x675`,
      params: {
        width: 'Lapad ng canvas',
        height: 'Taas ng canvas',
        preset: 'Opsyonal na pangalan ng preset',
      },
    },
    pinepaper_export_svg: {
      name: 'I-export bilang SVG',
      description: `I-export ang eksena bilang animated SVG.

GAMITIN KAPAG:
- Pag-save ng trabaho bilang SVG file
- Paglikha ng shareable graphics
- Final export`,
      params: {
        animated: 'Isama ang CSS animations (default: true)',
      },
    },
    pinepaper_export_training_data: {
      name: 'I-export ang Training Data',
      description: `I-export ang relation data bilang training pairs para sa LLM fine-tuning.

GAMITIN KAPAG:
- Paglikha ng training data para sa fine-tuning
- Paglikha ng mga halimbawa mula sa kasalukuyang eksena
- Pagbuo ng custom animation model training sets`,
      params: {
        format: 'Output format (json o jsonl)',
        includeMetadata: 'Isama ang relation metadata',
      },
    },
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
    invalidRelation: 'Hindi valid na relasyon: {{relationType}}',
    invalidParams: 'Hindi valid na mga parameter: {{details}}',
    generatorNotFound: 'Hindi natagpuan ang generator: {{generatorName}}',
    exportFailed: 'Nabigo ang pag-export: {{reason}}',
    executionError: 'Error sa pagsasagawa: {{message}}',
    validationError: 'Error sa validation: {{message}}',
    unknownTool: 'Hindi kilalang tool: {{toolName}}',
    apiKeyRequired: 'Kailangan ang API key',
    apiKeyInvalid: 'Hindi valid ang API key',
    apiKeyExpired: 'Nag-expire na ang API key',
    rateLimitExceeded: 'Nalampasan ang rate limit. Subukan muli sa {{seconds}} segundo.',
  },

  success: {
    itemCreated: 'Nalikha ang {{itemType}} sa posisyon ({{x}}, {{y}})',
    itemModified: 'Nabago ang item {{itemId}}',
    itemDeleted: 'Nabura ang item {{itemId}}',
    relationAdded: 'Naidagdag ang {{relationType}} relasyon: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Naalis ang relasyon sa pagitan ng {{sourceId}} at {{targetId}}',
    animationApplied: 'Na-apply ang {{animationType}} animation sa {{itemId}}',
    generatorExecuted: 'Naisakatuparan ang {{generatorName}} generator',
    effectApplied: 'Na-apply ang {{effectType}} effect sa {{itemId}}',
    backgroundSet: 'Naitakda ang kulay ng background sa {{color}}',
    canvasSizeSet: 'Naitakda ang laki ng canvas sa {{width}}×{{height}}',
    exported: 'Matagumpay na na-export ang {{format}}',
  },

  itemTypes: {
    text: 'Text',
    circle: 'Bilog',
    star: 'Bituin',
    rectangle: 'Parihaba',
    triangle: 'Tatsulok',
    polygon: 'Polygon',
    ellipse: 'Ellipse',
    path: 'Path',
    line: 'Linya',
    arc: 'Arc',
  },

  relationTypes: {
    orbits: 'Umiikot',
    follows: 'Sumusunod',
    attached_to: 'Nakakabit sa',
    maintains_distance: 'Pinapanatili ang distansya',
    points_at: 'Tumuturo sa',
    mirrors: 'Sumasalamin',
    parallax: 'Parallax',
    bounds_to: 'Nababalangkas sa',
  },

  animationTypes: {
    pulse: 'Pulse',
    rotate: 'Rotate',
    bounce: 'Bounce',
    fade: 'Fade',
    wobble: 'Wobble',
    slide: 'Slide',
    typewriter: 'Typewriter',
  },

  generators: {
    drawSunburst: 'Sunburst',
    drawSunsetScene: 'Sunset Scene',
    drawGrid: 'Grid',
    drawStackedCircles: 'Stacked Circles',
    drawCircuit: 'Circuit Board',
    drawWaves: 'Waves',
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
};
