/**
 * Multilingual Semantic Taxonomy Registry
 *
 * Comprehensive registry of concepts mapped to MCP tools.
 * Each concept has terms in 41+ languages for robust intent detection.
 *
 * Schema.org References:
 * - Actions: https://schema.org/Action
 * - Creative Work: https://schema.org/CreativeWork
 * - Visual Artwork: https://schema.org/VisualArtwork
 * - Drawing: https://schema.org/Drawing
 * - Thing: https://schema.org/Thing
 *
 * Wikidata References (for concepts not in schema.org):
 * - Animation: https://www.wikidata.org/wiki/Q11425
 * - Rotation: https://www.wikidata.org/wiki/Q7397
 * - Orbit: https://www.wikidata.org/wiki/Q54363
 */

import type { TaxonomyNode, ModifierNode, SchemaOrgReference } from './types.js';

/**
 * Common Schema.org type definitions for reuse
 */
const SCHEMA_TYPES = {
  // Actions
  CreateAction: {
    '@type': 'CreateAction',
    '@id': 'https://schema.org/CreateAction',
  } as SchemaOrgReference,

  UpdateAction: {
    '@type': 'UpdateAction',
    '@id': 'https://schema.org/UpdateAction',
  } as SchemaOrgReference,

  MoveAction: {
    '@type': 'MoveAction',
    '@id': 'https://schema.org/MoveAction',
  } as SchemaOrgReference,

  DrawAction: {
    '@type': 'DrawAction',
    '@id': 'https://schema.org/DrawAction',
  } as SchemaOrgReference,

  // Things
  VisualArtwork: {
    '@type': 'VisualArtwork',
    '@id': 'https://schema.org/VisualArtwork',
  } as SchemaOrgReference,

  Drawing: {
    '@type': 'Drawing',
    '@id': 'https://schema.org/Drawing',
  } as SchemaOrgReference,

  // Wikidata concepts (for items not in schema.org)
  Animation: {
    '@type': 'Thing',
    '@id': 'https://www.wikidata.org/wiki/Q11425',
    sameAs: ['https://dbpedia.org/resource/Animation'],
  } as SchemaOrgReference,

  Rotation: {
    '@type': 'Thing',
    '@id': 'https://www.wikidata.org/wiki/Q7397',
    sameAs: ['https://dbpedia.org/resource/Rotation'],
  } as SchemaOrgReference,

  OrbitalMotion: {
    '@type': 'Thing',
    '@id': 'https://www.wikidata.org/wiki/Q54363',
    sameAs: ['https://dbpedia.org/resource/Orbit'],
  } as SchemaOrgReference,

  Circle: {
    '@type': 'Thing',
    '@id': 'https://www.wikidata.org/wiki/Q17278',
    sameAs: ['https://dbpedia.org/resource/Circle'],
  } as SchemaOrgReference,

  Rectangle: {
    '@type': 'Thing',
    '@id': 'https://www.wikidata.org/wiki/Q209',
    sameAs: ['https://dbpedia.org/resource/Rectangle'],
  } as SchemaOrgReference,

  Star: {
    '@type': 'Thing',
    '@id': 'https://www.wikidata.org/wiki/Q58043',
    sameAs: ['https://dbpedia.org/resource/Star_polygon'],
  } as SchemaOrgReference,

  Polygon: {
    '@type': 'Thing',
    '@id': 'https://www.wikidata.org/wiki/Q37555',
    sameAs: ['https://dbpedia.org/resource/Polygon'],
  } as SchemaOrgReference,

  Line: {
    '@type': 'Thing',
    '@id': 'https://www.wikidata.org/wiki/Q37105',
    sameAs: ['https://dbpedia.org/resource/Line_(geometry)'],
  } as SchemaOrgReference,

  Text: {
    '@type': 'Text',
    '@id': 'https://schema.org/Text',
  } as SchemaOrgReference,

  Wave: {
    '@type': 'Thing',
    '@id': 'https://www.wikidata.org/wiki/Q11396',
    sameAs: ['https://dbpedia.org/resource/Wave'],
  } as SchemaOrgReference,

  Grid: {
    '@type': 'Thing',
    '@id': 'https://www.wikidata.org/wiki/Q2221906',
    sameAs: ['https://dbpedia.org/resource/Grid_(graphic_design)'],
  } as SchemaOrgReference,

  ElectronicCircuit: {
    '@type': 'Thing',
    '@id': 'https://www.wikidata.org/wiki/Q163255',
    sameAs: ['https://dbpedia.org/resource/Electronic_circuit'],
  } as SchemaOrgReference,
};

/**
 * Motion-related taxonomy nodes
 */
export const MOTION_TAXONOMY: TaxonomyNode[] = [
  // Circular Motion
  {
    id: 'orbital_motion',
    parent: 'circular_motion',
    category: 'motion',
    priority: 10,
    schema: SCHEMA_TYPES.OrbitalMotion,
    tool: {
      tool: 'pinepaper_add_relation',
      defaultParams: { relationType: 'orbits' },
      parameterExtractors: [
        {
          param: 'radius',
          patterns: {
            en: [/(\d+)\s*(?:px|pixels?)?\s*(?:radius|away|from|distance)/i, /radius\s*(?:of\s*)?(\d+)/i],
            es: [/(\d+)\s*(?:px|píxeles?)?\s*(?:radio|lejos|distancia)/i],
            fr: [/(\d+)\s*(?:px|pixels?)?\s*(?:rayon|distance)/i],
            de: [/(\d+)\s*(?:px|Pixel)?\s*(?:Radius|Abstand)/i],
            'zh-CN': [/(\d+)\s*(?:像素|px)?\s*(?:半径|距离)/],
            ja: [/(\d+)\s*(?:ピクセル|px)?\s*(?:半径|距離)/],
          },
          transform: (match) => parseInt(match, 10),
        },
        {
          param: 'speed',
          patterns: {
            en: [/speed\s*(?:of\s*)?(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*speed/i],
            es: [/velocidad\s*(?:de\s*)?(\d+(?:\.\d+)?)/i],
            fr: [/vitesse\s*(?:de\s*)?(\d+(?:\.\d+)?)/i],
          },
          transform: (match) => parseFloat(match),
        },
      ],
    },
    terms: {
      en: ['orbit', 'revolve', 'circle around', 'go around', 'revolve around', 'orbital motion', 'orbiting'],
      es: ['orbitar', 'girar alrededor', 'dar vueltas alrededor', 'revolucionar', 'orbita', 'órbita'],
      fr: ['orbiter', 'tourner autour', 'graviter', 'faire le tour', 'orbite', 'révolution'],
      de: ['umkreisen', 'kreisen um', 'umlaufen', 'Orbit', 'Umlaufbahn'],
      it: ['orbitare', 'girare intorno', 'ruotare attorno', 'orbita'],
      pt: ['orbitar', 'girar em torno', 'dar volta', 'órbita'],
      'pt-BR': ['orbitar', 'girar em torno', 'dar volta ao redor', 'órbita'],
      nl: ['draaien om', 'cirkelen rond', 'omcirkelen', 'baan'],
      pl: ['orbitować', 'krążyć wokół', 'obiegać', 'orbita'],
      ru: ['орбита', 'вращаться вокруг', 'кружить вокруг', 'облетать'],
      uk: ['орбіта', 'обертатися навколо', 'кружляти навколо'],
      'zh-CN': ['轨道', '环绕', '围绕', '绕着转', '公转'],
      'zh-TW': ['軌道', '環繞', '圍繞', '繞著轉'],
      ja: ['軌道を回る', '周回する', '回る', '公転', 'オービット'],
      ko: ['궤도를 돌다', '공전하다', '돌다', '궤도'],
      th: ['โคจร', 'หมุนรอบ', 'วงโคจร'],
      vi: ['quỹ đạo', 'quay quanh', 'xoay quanh'],
      id: ['mengorbit', 'berputar mengelilingi', 'orbit'],
      ms: ['mengorbit', 'berputar mengelilingi', 'orbit'],
      tl: ['umiinog', 'paikutin', 'orbita'],
      hi: ['कक्षा में घूमना', 'परिक्रमा करना', 'चारों ओर घूमना', 'कक्षा'],
      bn: ['কক্ষপথে ঘোরা', 'পরিক্রমা করা', 'চারপাশে ঘোরা'],
      ta: ['சுற்றுப்பாதை', 'சுற்றி வர', 'வட்டமிட'],
      te: ['కక్ష్యలో తిరగడం', 'చుట్టూ తిరగడం'],
      mr: ['कक्षेत फिरणे', 'भोवती फिरणे'],
      gu: ['ભ્રમણકક્ષામાં ફરવું', 'આસપાસ ફરવું'],
      kn: ['ಕಕ್ಷೆಯಲ್ಲಿ ಸುತ್ತು', 'ಸುತ್ತಲೂ ತಿರುಗು'],
      ml: ['ഭ്രമണപഥത്തിൽ കറങ്ങുക', 'ചുറ്റും കറങ്ങുക'],
      pa: ['ਔਰਬਿਟ ਵਿੱਚ ਘੁੰਮਣਾ', 'ਆਲੇ-ਦੁਆਲੇ ਘੁੰਮਣਾ'],
      ar: ['يدور حول', 'يحوم حول', 'مدار', 'الدوران حول'],
      he: ['להקיף', 'לסובב סביב', 'מסלול'],
      fa: ['مدار', 'چرخیدن دور', 'گردش'],
      tr: ['yörünge', 'etrafında dönmek', 'çevresinde dönmek'],
      sv: ['kretsa runt', 'cirkla kring', 'omloppsbana'],
      da: ['kredse om', 'cirkle rundt', 'bane'],
      no: ['kretse rundt', 'sirkle rundt', 'bane'],
      fi: ['kiertää', 'pyöriä ympäri', 'rata'],
      cs: ['obíhat', 'kroužit kolem', 'oběžná dráha'],
      el: ['τροχιά', 'περιστρέφομαι γύρω', 'κινούμαι σε τροχιά'],
      hu: ['keringeni', 'körözni', 'pálya'],
      ro: ['orbita', 'a se roti în jurul', 'a înconjura'],
    },
  },

  {
    id: 'rotation',
    parent: 'circular_motion',
    category: 'transformation',
    priority: 8,
    schema: SCHEMA_TYPES.Rotation,
    tool: {
      tool: 'pinepaper_animate',
      defaultParams: { animationType: 'rotate' },
      parameterExtractors: [
        {
          param: 'speed',
          patterns: {
            en: [/speed\s*(?:of\s*)?(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*(?:rpm|rotations)/i],
            es: [/velocidad\s*(?:de\s*)?(\d+(?:\.\d+)?)/i],
            fr: [/vitesse\s*(?:de\s*)?(\d+(?:\.\d+)?)/i],
          },
          transform: (match) => parseFloat(match),
        },
      ],
    },
    terms: {
      en: ['rotate', 'spin', 'turn', 'twirl', 'revolve on axis', 'spinning', 'rotation'],
      es: ['rotar', 'girar', 'dar vueltas', 'hacer girar', 'rotación', 'giro'],
      fr: ['tourner', 'pivoter', 'faire tourner', 'rotation', 'tournoyer'],
      de: ['drehen', 'rotieren', 'sich drehen', 'kreiseln', 'Rotation'],
      it: ['ruotare', 'girare', 'roteare', 'rotazione'],
      pt: ['rodar', 'girar', 'rotacionar', 'rotação'],
      'pt-BR': ['rodar', 'girar', 'rotacionar', 'rotação'],
      nl: ['draaien', 'roteren', 'tollen', 'rotatie'],
      pl: ['obracać', 'kręcić', 'wirować', 'rotacja'],
      ru: ['вращать', 'крутить', 'поворачивать', 'вращение'],
      uk: ['обертати', 'крутити', 'повертати', 'обертання'],
      'zh-CN': ['旋转', '转动', '打转', '自转'],
      'zh-TW': ['旋轉', '轉動', '打轉'],
      ja: ['回転', '回す', 'スピン', '自転'],
      ko: ['회전', '돌리다', '스핀', '자전'],
      th: ['หมุน', 'หมุนรอบตัวเอง'],
      vi: ['xoay', 'quay', 'xoay tròn'],
      id: ['memutar', 'berputar', 'rotasi'],
      ms: ['memutar', 'berputar', 'putaran'],
      tl: ['iikot', 'paikutin', 'umikot'],
      hi: ['घूमना', 'घुमाना', 'चक्कर लगाना'],
      bn: ['ঘোরা', 'ঘোরানো', 'আবর্তন'],
      ar: ['يدور', 'دوران', 'تدوير'],
      he: ['לסובב', 'להסתובב', 'סיבוב'],
      fa: ['چرخیدن', 'دوران', 'چرخش'],
      tr: ['döndürmek', 'dönmek', 'rotasyon'],
      sv: ['rotera', 'snurra', 'vrida'],
      da: ['rotere', 'dreje', 'snurre'],
      no: ['rotere', 'dreie', 'snurre'],
      fi: ['pyörittää', 'kiertää', 'rotaatio'],
      cs: ['otáčet', 'rotovat', 'točit'],
      el: ['περιστρέφω', 'γυρίζω', 'περιστροφή'],
      hu: ['forgatni', 'pörgetni', 'forgás'],
      ro: ['a roti', 'a învârti', 'rotație'],
    },
  },

  // Linear Motion
  {
    id: 'slide',
    parent: 'linear_motion',
    category: 'motion',
    priority: 7,
    schema: SCHEMA_TYPES.MoveAction,
    tool: {
      tool: 'pinepaper_animate',
      defaultParams: { animationType: 'slide' },
    },
    terms: {
      en: ['slide', 'glide', 'move sideways', 'drift', 'sliding', 'pan'],
      es: ['deslizar', 'mover', 'desplazar', 'deslizamiento'],
      fr: ['glisser', 'coulisser', 'déplacer', 'glissement'],
      de: ['gleiten', 'schieben', 'rutschen', 'Gleiten'],
      it: ['scivolare', 'scorrere', 'spostare'],
      pt: ['deslizar', 'mover', 'escorregar'],
      'pt-BR': ['deslizar', 'mover', 'escorregar'],
      nl: ['glijden', 'schuiven', 'verschuiven'],
      pl: ['przesuwać', 'ślizgać', 'sunąć'],
      ru: ['скользить', 'двигать', 'сдвигать'],
      uk: ['ковзати', 'рухати', 'зсувати'],
      'zh-CN': ['滑动', '移动', '平移'],
      'zh-TW': ['滑動', '移動', '平移'],
      ja: ['スライド', '滑る', '移動'],
      ko: ['슬라이드', '미끄러지다', '이동'],
      ar: ['انزلاق', 'تحريك', 'زحف'],
      he: ['להחליק', 'לגלוש', 'להזיז'],
      tr: ['kaydırmak', 'sürmek', 'hareket ettirmek'],
    },
  },

  {
    id: 'bounce',
    parent: 'linear_motion',
    category: 'motion',
    priority: 7,
    schema: SCHEMA_TYPES.Animation,
    tool: {
      tool: 'pinepaper_animate',
      defaultParams: { animationType: 'bounce' },
    },
    terms: {
      en: ['bounce', 'hop', 'jump', 'bouncing', 'spring', 'boing'],
      es: ['rebotar', 'saltar', 'brincar', 'rebote'],
      fr: ['rebondir', 'sauter', 'bondir', 'rebond'],
      de: ['hüpfen', 'springen', 'prallen', 'Sprung'],
      it: ['rimbalzare', 'saltare', 'balzare'],
      pt: ['saltar', 'pular', 'quicar'],
      'pt-BR': ['pular', 'quicar', 'saltar'],
      nl: ['stuiteren', 'springen', 'opspringen'],
      pl: ['skakać', 'odbijać się', 'podskakiwać'],
      ru: ['прыгать', 'подпрыгивать', 'отскакивать'],
      uk: ['стрибати', 'підстрибувати', 'відскакувати'],
      'zh-CN': ['弹跳', '跳动', '蹦'],
      'zh-TW': ['彈跳', '跳動'],
      ja: ['バウンス', '跳ねる', '弾む'],
      ko: ['튀다', '바운스', '점프'],
      ar: ['ارتداد', 'قفز', 'نط'],
      he: ['לקפוץ', 'לנתר', 'קפיצה'],
      tr: ['zıplamak', 'sıçramak', 'sekme'],
    },
  },

  {
    id: 'follow',
    parent: 'linear_motion',
    category: 'relation',
    priority: 9,
    schema: {
      '@type': 'FollowAction',
      '@id': 'https://schema.org/FollowAction',
    },
    tool: {
      tool: 'pinepaper_add_relation',
      defaultParams: { relationType: 'follows' },
    },
    terms: {
      en: ['follow', 'track', 'chase', 'pursue', 'following', 'trail'],
      es: ['seguir', 'perseguir', 'rastrear', 'seguimiento'],
      fr: ['suivre', 'poursuivre', 'pister', 'traquer'],
      de: ['folgen', 'verfolgen', 'nachgehen', 'Verfolgung'],
      it: ['seguire', 'inseguire', 'tracciare'],
      pt: ['seguir', 'perseguir', 'rastrear'],
      'pt-BR': ['seguir', 'perseguir', 'rastrear'],
      nl: ['volgen', 'achtervolgen', 'nastreven'],
      pl: ['śledzić', 'podążać', 'tropić'],
      ru: ['следовать', 'преследовать', 'идти за'],
      uk: ['слідувати', 'переслідувати', 'йти за'],
      'zh-CN': ['跟随', '追踪', '跟着'],
      'zh-TW': ['跟隨', '追蹤', '跟著'],
      ja: ['追従', '追跡', 'フォロー'],
      ko: ['따라가다', '추적', '따르다'],
      ar: ['يتبع', 'يلاحق', 'تتبع'],
      he: ['לעקוב', 'לרדוף', 'מעקב'],
      tr: ['takip etmek', 'izlemek', 'peşinden gitmek'],
    },
  },

  {
    id: 'attached',
    parent: 'relation',
    category: 'relation',
    priority: 9,
    schema: {
      '@type': 'Action',
      '@id': 'https://schema.org/Action',
      properties: { actionStatus: 'ConnectAction' },
    },
    tool: {
      tool: 'pinepaper_add_relation',
      defaultParams: { relationType: 'attached_to' },
    },
    terms: {
      en: ['attach', 'stick', 'connect', 'parent', 'attached to', 'linked', 'join'],
      es: ['adjuntar', 'pegar', 'conectar', 'unir', 'vincular'],
      fr: ['attacher', 'coller', 'lier', 'connecter', 'joindre'],
      de: ['anhängen', 'kleben', 'verbinden', 'anschließen'],
      it: ['allegare', 'attaccare', 'collegare', 'connettere'],
      pt: ['anexar', 'colar', 'conectar', 'ligar'],
      'pt-BR': ['anexar', 'colar', 'conectar', 'ligar'],
      nl: ['bevestigen', 'plakken', 'verbinden', 'koppelen'],
      pl: ['dołączyć', 'przykleić', 'połączyć', 'przymocować'],
      ru: ['прикрепить', 'присоединить', 'связать', 'привязать'],
      uk: ['прикріпити', 'приєднати', 'зв\'язати'],
      'zh-CN': ['附加', '连接', '粘贴', '绑定'],
      'zh-TW': ['附加', '連接', '貼上', '綁定'],
      ja: ['アタッチ', '接続', '結合', 'くっつける'],
      ko: ['붙이다', '연결', '부착'],
      ar: ['إرفاق', 'لصق', 'ربط', 'توصيل'],
      he: ['לצרף', 'להדביק', 'לחבר'],
      tr: ['bağlamak', 'yapıştırmak', 'eklemek'],
    },
  },
];

/**
 * Transformation-related taxonomy nodes
 */
export const TRANSFORMATION_TAXONOMY: TaxonomyNode[] = [
  {
    id: 'pulse',
    category: 'transformation',
    priority: 7,
    schema: SCHEMA_TYPES.Animation,
    tool: {
      tool: 'pinepaper_animate',
      defaultParams: { animationType: 'pulse' },
    },
    terms: {
      en: ['pulse', 'throb', 'beat', 'pulsate', 'pulsing', 'heartbeat', 'breathe'],
      es: ['pulsar', 'latir', 'palpitar', 'pulso'],
      fr: ['pulser', 'battre', 'palpiter', 'pulsation'],
      de: ['pulsieren', 'pochen', 'schlagen', 'Puls'],
      it: ['pulsare', 'battere', 'palpitare'],
      pt: ['pulsar', 'bater', 'palpitar'],
      'pt-BR': ['pulsar', 'bater', 'palpitar'],
      nl: ['pulseren', 'kloppen', 'slaan'],
      pl: ['pulsować', 'bić', 'tętnić'],
      ru: ['пульсировать', 'биться', 'пульс'],
      uk: ['пульсувати', 'битися', 'пульс'],
      'zh-CN': ['脉冲', '跳动', '脉动', '呼吸效果'],
      'zh-TW': ['脈衝', '跳動', '脈動'],
      ja: ['パルス', '脈動', '鼓動'],
      ko: ['펄스', '맥박', '박동'],
      ar: ['نبض', 'خفقان', 'نبضة'],
      he: ['פועם', 'דופק', 'פעימה'],
      tr: ['nabız', 'atım', 'titreşim'],
    },
  },

  {
    id: 'fade',
    category: 'transformation',
    priority: 7,
    schema: SCHEMA_TYPES.Animation,
    tool: {
      tool: 'pinepaper_animate',
      defaultParams: { animationType: 'fade' },
    },
    terms: {
      en: ['fade', 'fade in', 'fade out', 'appear', 'disappear', 'vanish', 'transparent', 'opacity'],
      es: ['desvanecer', 'aparecer', 'desaparecer', 'fundido', 'transparente'],
      fr: ['fondu', 'apparaître', 'disparaître', 'estomper', 'transparent'],
      de: ['einblenden', 'ausblenden', 'verblassen', 'erscheinen', 'verschwinden'],
      it: ['sfumare', 'apparire', 'scomparire', 'dissolvenza'],
      pt: ['desvanecer', 'aparecer', 'desaparecer', 'fade'],
      'pt-BR': ['desvanecer', 'aparecer', 'desaparecer', 'fade'],
      nl: ['vervagen', 'verschijnen', 'verdwijnen', 'fade'],
      pl: ['zanikać', 'pojawiać się', 'znikać', 'fade'],
      ru: ['затухать', 'появляться', 'исчезать', 'прозрачность'],
      uk: ['затухати', 'з\'являтися', 'зникати'],
      'zh-CN': ['淡入', '淡出', '渐变', '透明度', '消失'],
      'zh-TW': ['淡入', '淡出', '漸變', '透明度'],
      ja: ['フェード', '表示', '消える', '透明度'],
      ko: ['페이드', '나타나다', '사라지다', '투명도'],
      ar: ['تلاشي', 'ظهور', 'اختفاء', 'شفافية'],
      he: ['דעיכה', 'להופיע', 'להיעלם', 'שקיפות'],
      tr: ['solmak', 'belirmek', 'kaybolmak', 'saydamlık'],
    },
  },

  {
    id: 'wobble',
    category: 'transformation',
    priority: 6,
    schema: SCHEMA_TYPES.Animation,
    tool: {
      tool: 'pinepaper_animate',
      defaultParams: { animationType: 'wobble' },
    },
    terms: {
      en: ['wobble', 'shake', 'jiggle', 'wiggle', 'quiver', 'tremble', 'vibrate'],
      es: ['tambalear', 'agitar', 'temblar', 'vibrar'],
      fr: ['vaciller', 'secouer', 'trembler', 'vibrer'],
      de: ['wackeln', 'schütteln', 'zittern', 'vibrieren'],
      it: ['oscillare', 'scuotere', 'tremare', 'vibrare'],
      pt: ['balançar', 'agitar', 'tremer', 'vibrar'],
      'pt-BR': ['balançar', 'agitar', 'tremer', 'vibrar'],
      nl: ['wiebelen', 'schudden', 'trillen'],
      pl: ['chwiać się', 'trząść', 'drgać'],
      ru: ['дрожать', 'трястись', 'вибрировать'],
      uk: ['хитатися', 'трястися', 'вібрувати'],
      'zh-CN': ['摇晃', '抖动', '震动', '颤抖'],
      'zh-TW': ['搖晃', '抖動', '震動'],
      ja: ['ゆらゆら', '震える', '振動'],
      ko: ['흔들리다', '떨다', '진동'],
      ar: ['اهتزاز', 'رجفة', 'ارتعاش'],
      he: ['להתנדנד', 'לרעוד', 'רטט'],
      tr: ['sallanmak', 'titremek', 'titreşmek'],
    },
  },
];

/**
 * Item creation taxonomy nodes
 */
export const ITEM_TAXONOMY: TaxonomyNode[] = [
  {
    id: 'create_circle',
    category: 'item',
    priority: 8,
    schema: SCHEMA_TYPES.Circle,
    tool: {
      tool: 'pinepaper_create_item',
      defaultParams: { itemType: 'circle' },
    },
    terms: {
      en: ['circle', 'dot', 'ball', 'sphere', 'round', 'orb'],
      es: ['círculo', 'punto', 'bola', 'esfera', 'redondo'],
      fr: ['cercle', 'point', 'boule', 'sphère', 'rond'],
      de: ['Kreis', 'Punkt', 'Kugel', 'Ball', 'rund'],
      it: ['cerchio', 'punto', 'palla', 'sfera', 'rotondo'],
      pt: ['círculo', 'ponto', 'bola', 'esfera'],
      'pt-BR': ['círculo', 'ponto', 'bola', 'bolinha'],
      nl: ['cirkel', 'punt', 'bal', 'bol', 'rond'],
      pl: ['koło', 'okrąg', 'kula', 'punkt'],
      ru: ['круг', 'точка', 'шар', 'сфера'],
      uk: ['коло', 'точка', 'куля', 'сфера'],
      'zh-CN': ['圆', '圆形', '球', '点'],
      'zh-TW': ['圓', '圓形', '球', '點'],
      ja: ['円', '丸', 'サークル', '球'],
      ko: ['원', '동그라미', '구', '점'],
      hi: ['वृत्त', 'गोला', 'बिंदु'],
      ar: ['دائرة', 'نقطة', 'كرة'],
      he: ['עיגול', 'נקודה', 'כדור'],
      tr: ['daire', 'çember', 'nokta', 'top'],
    },
  },

  {
    id: 'create_rectangle',
    category: 'item',
    priority: 8,
    schema: SCHEMA_TYPES.Rectangle,
    tool: {
      tool: 'pinepaper_create_item',
      defaultParams: { itemType: 'rectangle' },
    },
    terms: {
      en: ['rectangle', 'square', 'box', 'rect', 'block', 'card'],
      es: ['rectángulo', 'cuadrado', 'caja', 'bloque'],
      fr: ['rectangle', 'carré', 'boîte', 'bloc'],
      de: ['Rechteck', 'Quadrat', 'Box', 'Block'],
      it: ['rettangolo', 'quadrato', 'scatola', 'blocco'],
      pt: ['retângulo', 'quadrado', 'caixa', 'bloco'],
      'pt-BR': ['retângulo', 'quadrado', 'caixa', 'bloco'],
      nl: ['rechthoek', 'vierkant', 'doos', 'blok'],
      pl: ['prostokąt', 'kwadrat', 'pudełko', 'blok'],
      ru: ['прямоугольник', 'квадрат', 'коробка', 'блок'],
      uk: ['прямокутник', 'квадрат', 'коробка', 'блок'],
      'zh-CN': ['矩形', '长方形', '正方形', '方块'],
      'zh-TW': ['矩形', '長方形', '正方形', '方塊'],
      ja: ['四角形', '長方形', '正方形', 'ボックス'],
      ko: ['사각형', '직사각형', '정사각형', '상자'],
      ar: ['مستطيل', 'مربع', 'صندوق'],
      he: ['מלבן', 'ריבוע', 'קופסה'],
      tr: ['dikdörtgen', 'kare', 'kutu'],
    },
  },

  {
    id: 'create_star',
    category: 'item',
    priority: 8,
    schema: SCHEMA_TYPES.Star,
    tool: {
      tool: 'pinepaper_create_item',
      defaultParams: { itemType: 'star' },
    },
    terms: {
      en: ['star', 'asterisk', 'sparkle', 'starburst'],
      es: ['estrella', 'asterisco', 'destello'],
      fr: ['étoile', 'astérisque', 'étincelle'],
      de: ['Stern', 'Sternchen', 'Funkeln'],
      it: ['stella', 'asterisco', 'scintilla'],
      pt: ['estrela', 'asterisco', 'brilho'],
      'pt-BR': ['estrela', 'asterisco', 'brilho'],
      nl: ['ster', 'sterretje', 'schittering'],
      pl: ['gwiazda', 'gwiazdka', 'iskra'],
      ru: ['звезда', 'звёздочка', 'искра'],
      uk: ['зірка', 'зірочка', 'іскра'],
      'zh-CN': ['星', '星形', '星星'],
      'zh-TW': ['星', '星形', '星星'],
      ja: ['星', 'スター', '星形'],
      ko: ['별', '스타', '별모양'],
      ar: ['نجمة', 'نجم'],
      he: ['כוכב', 'כוכבית'],
      tr: ['yıldız', 'yıldızcık'],
    },
  },

  {
    id: 'create_text',
    category: 'item',
    priority: 9,
    schema: SCHEMA_TYPES.Text,
    tool: {
      tool: 'pinepaper_create_item',
      defaultParams: { itemType: 'text' },
    },
    terms: {
      en: ['text', 'label', 'title', 'heading', 'caption', 'words', 'write', 'type'],
      es: ['texto', 'etiqueta', 'título', 'encabezado', 'escribir'],
      fr: ['texte', 'étiquette', 'titre', 'en-tête', 'écrire'],
      de: ['Text', 'Beschriftung', 'Titel', 'Überschrift', 'schreiben'],
      it: ['testo', 'etichetta', 'titolo', 'intestazione', 'scrivere'],
      pt: ['texto', 'rótulo', 'título', 'cabeçalho', 'escrever'],
      'pt-BR': ['texto', 'rótulo', 'título', 'cabeçalho', 'escrever'],
      nl: ['tekst', 'label', 'titel', 'kop', 'schrijven'],
      pl: ['tekst', 'etykieta', 'tytuł', 'nagłówek', 'pisać'],
      ru: ['текст', 'метка', 'заголовок', 'надпись', 'писать'],
      uk: ['текст', 'мітка', 'заголовок', 'напис', 'писати'],
      'zh-CN': ['文本', '文字', '标题', '标签', '写'],
      'zh-TW': ['文本', '文字', '標題', '標籤', '寫'],
      ja: ['テキスト', '文字', 'タイトル', 'ラベル', '書く'],
      ko: ['텍스트', '글자', '제목', '라벨', '쓰다'],
      ar: ['نص', 'عنوان', 'تسمية', 'كتابة'],
      he: ['טקסט', 'כותרת', 'תווית', 'לכתוב'],
      tr: ['metin', 'başlık', 'etiket', 'yazmak'],
    },
  },

  {
    id: 'create_polygon',
    category: 'item',
    priority: 7,
    schema: SCHEMA_TYPES.Polygon,
    tool: {
      tool: 'pinepaper_create_item',
      defaultParams: { itemType: 'polygon' },
    },
    terms: {
      en: ['polygon', 'triangle', 'hexagon', 'pentagon', 'octagon', 'shape'],
      es: ['polígono', 'triángulo', 'hexágono', 'pentágono', 'forma'],
      fr: ['polygone', 'triangle', 'hexagone', 'pentagone', 'forme'],
      de: ['Polygon', 'Dreieck', 'Sechseck', 'Fünfeck', 'Form'],
      it: ['poligono', 'triangolo', 'esagono', 'pentagono', 'forma'],
      pt: ['polígono', 'triângulo', 'hexágono', 'pentágono', 'forma'],
      'pt-BR': ['polígono', 'triângulo', 'hexágono', 'pentágono', 'forma'],
      nl: ['veelhoek', 'driehoek', 'zeshoek', 'vijfhoek', 'vorm'],
      pl: ['wielokąt', 'trójkąt', 'sześciokąt', 'pięciokąt', 'kształt'],
      ru: ['многоугольник', 'треугольник', 'шестиугольник', 'пятиугольник', 'форма'],
      uk: ['багатокутник', 'трикутник', 'шестикутник', 'форма'],
      'zh-CN': ['多边形', '三角形', '六边形', '五边形', '形状'],
      'zh-TW': ['多邊形', '三角形', '六邊形', '五邊形', '形狀'],
      ja: ['多角形', '三角形', '六角形', '五角形', '形'],
      ko: ['다각형', '삼각형', '육각형', '오각형', '모양'],
      ar: ['مضلع', 'مثلث', 'سداسي', 'خماسي', 'شكل'],
      he: ['מצולע', 'משולש', 'משושה', 'מחומש', 'צורה'],
      tr: ['çokgen', 'üçgen', 'altıgen', 'beşgen', 'şekil'],
    },
  },

  {
    id: 'create_line',
    category: 'item',
    priority: 7,
    schema: SCHEMA_TYPES.Line,
    tool: {
      tool: 'pinepaper_create_item',
      defaultParams: { itemType: 'line' },
    },
    terms: {
      en: ['line', 'stroke', 'dash', 'connector', 'segment'],
      es: ['línea', 'trazo', 'guión', 'conector'],
      fr: ['ligne', 'trait', 'tiret', 'connecteur'],
      de: ['Linie', 'Strich', 'Bindestrich', 'Verbindung'],
      it: ['linea', 'tratto', 'trattino', 'connettore'],
      pt: ['linha', 'traço', 'traçado', 'conector'],
      'pt-BR': ['linha', 'traço', 'traçado', 'conector'],
      nl: ['lijn', 'streep', 'verbinder'],
      pl: ['linia', 'kreska', 'łącznik'],
      ru: ['линия', 'черта', 'штрих', 'соединитель'],
      uk: ['лінія', 'риска', 'штрих'],
      'zh-CN': ['线', '线条', '直线', '连接线'],
      'zh-TW': ['線', '線條', '直線', '連接線'],
      ja: ['線', 'ライン', '直線'],
      ko: ['선', '라인', '직선'],
      ar: ['خط', 'شرطة', 'موصل'],
      he: ['קו', 'מקף', 'מחבר'],
      tr: ['çizgi', 'hat', 'bağlayıcı'],
    },
  },
];

/**
 * Background and generator taxonomy nodes
 */
export const BACKGROUND_TAXONOMY: TaxonomyNode[] = [
  {
    id: 'sunburst',
    category: 'background',
    priority: 6,
    schema: {
      '@type': 'Thing',
      '@id': 'https://www.wikidata.org/wiki/Q121855785',
      sameAs: ['https://en.wikipedia.org/wiki/Sunburst_(projection)'],
    },
    tool: {
      tool: 'pinepaper_execute_generator',
      defaultParams: { generatorName: 'drawSunburst' },
    },
    terms: {
      en: ['sunburst', 'sun rays', 'radial rays', 'starburst background', 'rays'],
      es: ['resplandor solar', 'rayos de sol', 'rayos radiales'],
      fr: ['rayon de soleil', 'rayonnement', 'rayons radiaux'],
      de: ['Sonnenstrahlen', 'Strahlen', 'Strahlenkranz'],
      it: ['raggiera', 'raggi di sole', 'raggi radiali'],
      pt: ['raios de sol', 'explosão solar', 'raios'],
      'pt-BR': ['raios de sol', 'explosão solar', 'raios'],
      nl: ['zonnestralen', 'stralen', 'straalkrans'],
      pl: ['promienie słoneczne', 'promienie', 'rozbłysk'],
      ru: ['солнечные лучи', 'лучи', 'сияние'],
      uk: ['сонячні промені', 'промені', 'сяйво'],
      'zh-CN': ['太阳光芒', '放射状', '阳光'],
      'zh-TW': ['太陽光芒', '放射狀', '陽光'],
      ja: ['サンバースト', '太陽光線', '放射状'],
      ko: ['선버스트', '햇살', '방사형'],
      ar: ['أشعة الشمس', 'انفجار شمسي'],
      he: ['קרני שמש', 'התפרצות שמש'],
      tr: ['güneş ışınları', 'patlaması'],
    },
  },

  {
    id: 'waves',
    category: 'background',
    priority: 6,
    schema: SCHEMA_TYPES.Wave,
    tool: {
      tool: 'pinepaper_execute_generator',
      defaultParams: { generatorName: 'drawWaves' },
    },
    terms: {
      en: ['waves', 'wave pattern', 'wavy', 'ocean', 'ripples', 'undulation'],
      es: ['ondas', 'olas', 'ondulado', 'océano', 'ondulaciones'],
      fr: ['vagues', 'ondulations', 'ondulé', 'océan'],
      de: ['Wellen', 'wellig', 'Ozean', 'Wellenmuster'],
      it: ['onde', 'ondulato', 'oceano', 'increspature'],
      pt: ['ondas', 'ondulado', 'oceano', 'ondulações'],
      'pt-BR': ['ondas', 'ondulado', 'oceano', 'ondulações'],
      nl: ['golven', 'golfpatroon', 'golvend'],
      pl: ['fale', 'faliste', 'ocean', 'zmarszczki'],
      ru: ['волны', 'волнистый', 'океан', 'рябь'],
      uk: ['хвилі', 'хвилястий', 'океан'],
      'zh-CN': ['波浪', '波纹', '海浪', '涟漪'],
      'zh-TW': ['波浪', '波紋', '海浪', '漣漪'],
      ja: ['波', 'ウェーブ', '波模様'],
      ko: ['파도', '물결', '웨이브'],
      ar: ['أمواج', 'موجات', 'متموج'],
      he: ['גלים', 'גלי', 'אוקיינוס'],
      tr: ['dalgalar', 'dalga deseni', 'dalgalı'],
    },
  },

  {
    id: 'grid',
    category: 'background',
    priority: 6,
    schema: SCHEMA_TYPES.Grid,
    tool: {
      tool: 'pinepaper_execute_generator',
      defaultParams: { generatorName: 'drawGrid' },
    },
    terms: {
      en: ['grid', 'gridlines', 'graph paper', 'mesh', 'lattice', 'squares'],
      es: ['cuadrícula', 'rejilla', 'malla', 'celosía'],
      fr: ['grille', 'quadrillage', 'maillage', 'treillis'],
      de: ['Gitter', 'Raster', 'Netz', 'Gitternetz'],
      it: ['griglia', 'reticolo', 'maglia', 'reticolato'],
      pt: ['grade', 'grelha', 'malha', 'quadriculado'],
      'pt-BR': ['grade', 'grelha', 'malha', 'quadriculado'],
      nl: ['raster', 'rooster', 'maas', 'grid'],
      pl: ['siatka', 'krata', 'kratka'],
      ru: ['сетка', 'решётка', 'клетка'],
      uk: ['сітка', 'решітка', 'клітинка'],
      'zh-CN': ['网格', '格子', '方格'],
      'zh-TW': ['網格', '格子', '方格'],
      ja: ['グリッド', '格子', '方眼'],
      ko: ['그리드', '격자', '모눈'],
      ar: ['شبكة', 'مربعات'],
      he: ['רשת', 'סריג'],
      tr: ['ızgara', 'kafes', 'grid'],
    },
  },

  {
    id: 'circuit',
    category: 'background',
    priority: 5,
    schema: SCHEMA_TYPES.ElectronicCircuit,
    tool: {
      tool: 'pinepaper_execute_generator',
      defaultParams: { generatorName: 'drawCircuit' },
    },
    terms: {
      en: ['circuit', 'circuit board', 'pcb', 'electronics', 'tech', 'digital'],
      es: ['circuito', 'placa de circuito', 'electrónica', 'tecnología'],
      fr: ['circuit', 'carte de circuit', 'électronique', 'technologie'],
      de: ['Schaltkreis', 'Platine', 'Elektronik', 'Technik'],
      it: ['circuito', 'scheda', 'elettronica', 'tecnologia'],
      pt: ['circuito', 'placa de circuito', 'eletrônica', 'tecnologia'],
      'pt-BR': ['circuito', 'placa de circuito', 'eletrônica', 'tecnologia'],
      nl: ['circuit', 'printplaat', 'elektronica', 'technologie'],
      pl: ['obwód', 'płytka drukowana', 'elektronika', 'technologia'],
      ru: ['схема', 'плата', 'электроника', 'технология'],
      uk: ['схема', 'плата', 'електроніка', 'технологія'],
      'zh-CN': ['电路', '电路板', '电子', '科技'],
      'zh-TW': ['電路', '電路板', '電子', '科技'],
      ja: ['回路', '基板', 'エレクトロニクス', 'テクノロジー'],
      ko: ['회로', '회로판', '전자', '기술'],
      ar: ['دائرة كهربائية', 'لوحة دوائر', 'إلكترونيات'],
      he: ['מעגל', 'לוח מעגלים', 'אלקטרוניקה'],
      tr: ['devre', 'devre kartı', 'elektronik', 'teknoloji'],
    },
  },
];

/**
 * Timing and behavior modifiers
 */
export const MODIFIER_NODES: ModifierNode[] = [
  {
    id: 'duration',
    category: 'timing',
    modifications: { useKeyframes: true },
    terms: {
      en: ['over * seconds', 'in * seconds', 'takes * seconds', '* second duration', 'for * seconds', 'lasting * seconds'],
      es: ['en * segundos', 'durante * segundos', 'toma * segundos', 'por * segundos'],
      fr: ['en * secondes', 'pendant * secondes', 'prend * secondes', 'durant * secondes'],
      de: ['in * Sekunden', 'für * Sekunden', 'dauert * Sekunden', 'über * Sekunden'],
      it: ['in * secondi', 'per * secondi', 'dura * secondi'],
      pt: ['em * segundos', 'durante * segundos', 'por * segundos'],
      'pt-BR': ['em * segundos', 'durante * segundos', 'por * segundos'],
      nl: ['in * seconden', 'gedurende * seconden', 'voor * seconden'],
      pl: ['w * sekund', 'przez * sekund', 'trwa * sekund'],
      ru: ['за * секунд', 'в течение * секунд', '* секунд'],
      uk: ['за * секунд', 'протягом * секунд'],
      'zh-CN': ['* 秒内', '持续 * 秒', '* 秒钟'],
      'zh-TW': ['* 秒內', '持續 * 秒', '* 秒鐘'],
      ja: ['* 秒で', '* 秒間', '* 秒かけて'],
      ko: ['* 초 동안', '* 초 안에', '* 초간'],
      ar: ['في * ثانية', 'خلال * ثانية', '* ثواني'],
      he: ['ב-* שניות', 'במשך * שניות'],
      tr: ['* saniyede', '* saniye boyunca', '* saniye süren'],
    },
  },

  {
    id: 'continuous',
    category: 'timing',
    modifications: { loop: true },
    terms: {
      en: ['forever', 'continuously', 'always', 'infinite', 'non-stop', 'endlessly', 'perpetually', 'keep going', 'never stop'],
      es: ['siempre', 'continuamente', 'infinito', 'sin parar', 'perpetuamente'],
      fr: ['toujours', 'continuellement', 'infini', 'sans arrêt', 'perpétuellement'],
      de: ['immer', 'kontinuierlich', 'unendlich', 'ohne Ende', 'ewig'],
      it: ['sempre', 'continuamente', 'infinito', 'senza sosta', 'perpetuamente'],
      pt: ['sempre', 'continuamente', 'infinito', 'sem parar', 'perpetuamente'],
      'pt-BR': ['sempre', 'continuamente', 'infinito', 'sem parar', 'perpetuamente'],
      nl: ['altijd', 'continu', 'oneindig', 'non-stop', 'eindeloos'],
      pl: ['zawsze', 'ciągle', 'nieskończenie', 'bez przerwy', 'wiecznie'],
      ru: ['всегда', 'постоянно', 'бесконечно', 'непрерывно', 'вечно'],
      uk: ['завжди', 'постійно', 'нескінченно', 'безперервно'],
      'zh-CN': ['永远', '持续', '无限', '不停', '一直'],
      'zh-TW': ['永遠', '持續', '無限', '不停', '一直'],
      ja: ['永遠に', '継続的に', '無限に', 'ずっと', '止まらない'],
      ko: ['영원히', '계속', '무한히', '끊임없이'],
      ar: ['دائماً', 'باستمرار', 'لا نهائي', 'بلا توقف'],
      he: ['לנצח', 'ברציפות', 'אינסופי', 'ללא הפסקה'],
      tr: ['sonsuza kadar', 'sürekli', 'sonsuz', 'durmadan'],
    },
  },

  {
    id: 'sequential',
    category: 'timing',
    modifications: { useSequence: true },
    terms: {
      en: ['then', 'after', 'next', 'followed by', 'afterwards', 'subsequently', 'first then'],
      es: ['entonces', 'después', 'luego', 'seguido de', 'posteriormente'],
      fr: ['puis', 'ensuite', 'après', 'suivi de', 'par la suite'],
      de: ['dann', 'danach', 'anschließend', 'gefolgt von', 'nachher'],
      it: ['poi', 'dopo', 'quindi', 'seguito da', 'successivamente'],
      pt: ['então', 'depois', 'em seguida', 'seguido por'],
      'pt-BR': ['então', 'depois', 'em seguida', 'seguido por'],
      nl: ['dan', 'daarna', 'vervolgens', 'gevolgd door'],
      pl: ['potem', 'następnie', 'po tym', 'a potem'],
      ru: ['затем', 'потом', 'после', 'следом'],
      uk: ['потім', 'після', 'далі'],
      'zh-CN': ['然后', '接着', '之后', '随后'],
      'zh-TW': ['然後', '接著', '之後', '隨後'],
      ja: ['それから', '次に', 'その後', '続いて'],
      ko: ['그런 다음', '후에', '이어서', '그 다음'],
      ar: ['ثم', 'بعد ذلك', 'يليه', 'لاحقاً'],
      he: ['אז', 'אחר כך', 'בעקבות', 'לאחר מכן'],
      tr: ['sonra', 'ardından', 'akabinde', 'takiben'],
    },
  },

  {
    id: 'slow',
    category: 'behavior',
    modifications: { speed: 0.3 },
    terms: {
      en: ['slow', 'slowly', 'gradual', 'gentle', 'leisurely'],
      es: ['lento', 'lentamente', 'gradual', 'suave'],
      fr: ['lent', 'lentement', 'graduel', 'doux'],
      de: ['langsam', 'allmählich', 'sanft'],
      it: ['lento', 'lentamente', 'graduale', 'dolce'],
      pt: ['lento', 'devagar', 'gradual', 'suave'],
      'pt-BR': ['lento', 'devagar', 'gradual', 'suave'],
      nl: ['langzaam', 'geleidelijk', 'zacht'],
      pl: ['wolno', 'powoli', 'stopniowo'],
      ru: ['медленно', 'постепенно', 'плавно'],
      uk: ['повільно', 'поступово', 'плавно'],
      'zh-CN': ['慢', '缓慢', '渐进', '轻柔'],
      'zh-TW': ['慢', '緩慢', '漸進', '輕柔'],
      ja: ['ゆっくり', 'ゆっくりと', '緩やか'],
      ko: ['천천히', '느리게', '서서히'],
      ar: ['ببطء', 'تدريجياً', 'بلطف'],
      he: ['לאט', 'בהדרגה', 'בעדינות'],
      tr: ['yavaş', 'yavaşça', 'kademeli'],
    },
  },

  {
    id: 'fast',
    category: 'behavior',
    modifications: { speed: 2.0 },
    terms: {
      en: ['fast', 'quick', 'rapid', 'swift', 'speedy', 'quickly'],
      es: ['rápido', 'veloz', 'ágil', 'rápidamente'],
      fr: ['rapide', 'vite', 'rapidement', 'prompt'],
      de: ['schnell', 'rasch', 'zügig', 'flink'],
      it: ['veloce', 'rapido', 'svelto', 'pronto'],
      pt: ['rápido', 'veloz', 'ágil', 'rapidamente'],
      'pt-BR': ['rápido', 'veloz', 'ágil', 'rapidamente'],
      nl: ['snel', 'vlug', 'rap', 'vlot'],
      pl: ['szybko', 'prędko', 'błyskawicznie'],
      ru: ['быстро', 'стремительно', 'скоро'],
      uk: ['швидко', 'стрімко', 'скоро'],
      'zh-CN': ['快', '迅速', '快速', '敏捷'],
      'zh-TW': ['快', '迅速', '快速', '敏捷'],
      ja: ['速く', '素早く', '迅速に'],
      ko: ['빠르게', '신속하게', '재빨리'],
      ar: ['سريع', 'بسرعة', 'عاجل'],
      he: ['מהר', 'במהירות', 'חיש'],
      tr: ['hızlı', 'çabuk', 'süratli'],
    },
  },
];

/**
 * Complete taxonomy - all nodes combined
 */
export const ANIMATION_TAXONOMY: TaxonomyNode[] = [
  ...MOTION_TAXONOMY,
  ...TRANSFORMATION_TAXONOMY,
  ...ITEM_TAXONOMY,
  ...BACKGROUND_TAXONOMY,
];

/**
 * Get a taxonomy node by ID
 */
export function getTaxonomyNode(id: string): TaxonomyNode | undefined {
  return ANIMATION_TAXONOMY.find((node) => node.id === id);
}

/**
 * Get all nodes in a category
 */
export function getNodesByCategory(category: TaxonomyNode['category']): TaxonomyNode[] {
  return ANIMATION_TAXONOMY.filter((node) => node.category === category);
}

/**
 * Get modifier by ID
 */
export function getModifier(id: string): ModifierNode | undefined {
  return MODIFIER_NODES.find((mod) => mod.id === id);
}
