/**
 * Urdu Translations (RTL)
 */

import { TranslationKeys } from '../types.js';

export const ur: TranslationKeys = {
  tools: {
    pinepaper_create_item: {
      name: 'آئٹم بنائیں',
      description: `PinePaper کینوس پر آئٹم بنائیں۔

کب استعمال کریں:
- صارف کینوس پر ٹیکسٹ، شکلیں یا گرافکس شامل کرنا چاہے
- نئے بصری عناصر بنانا (دائرے، ستارے، مستطیل وغیرہ)
- نیا منظر یا کمپوزیشن شروع کرنا

آئٹم کی اقسام:
- text: فونٹ سٹائلنگ کے ساتھ ٹیکسٹ مواد
- circle: ریڈیس کے ساتھ دائرے کی شکل
- star: اندرونی/بیرونی ریڈیس کے ساتھ ستارے کی شکل
- rectangle: چوڑائی/اونچائی کے ساتھ مستطیل
- triangle: مثلث کی شکل
- polygon: N اطراف والا باقاعدہ کثیر الاضلاع
- ellipse: بیضوی شکل
- path: سیگمنٹس یا SVG ڈیٹا کے ساتھ کسٹم پاتھ
- line: دو نقطوں کے درمیان لکیر
- arc: تین نقطوں سے گزرنے والی منحنی

مثالیں:
- "HELLO کہنے والا سرخ ٹیکسٹ بنائیں" → type: text, content: "HELLO", color: "#ef4444"
- "نیلا دائرہ شامل کریں" → type: circle, radius: 50, color: "#3b82f6"
- "5 نقطوں والا سنہری ستارہ بنائیں" → type: star, radius1: 60, radius2: 30, color: "#fbbf24"`,
      params: {
        itemType: 'بنانے کے لیے آئٹم کی قسم',
        position: 'کینوس پر پوزیشن',
        properties: 'قسم کے مخصوص خصوصیات (مواد، ریڈیس، رنگ، فونٹ سائز وغیرہ)',
      },
    },
    pinepaper_modify_item: {
      name: 'آئٹم میں ترمیم کریں',
      description: `موجودہ آئٹم کی خصوصیات میں ترمیم کریں۔

کب استعمال کریں:
- موجودہ آئٹم کا رنگ، سائز، پوزیشن بدلنا
- ٹیکسٹ مواد اپڈیٹ کرنا
- سٹائلنگ خصوصیات کو ایڈجسٹ کرنا

قابل ترمیم خصوصیات:
- position: {x, y} یا الگ x، y
- color/fillColor: فل رنگ
- strokeColor: آؤٹ لائن رنگ
- strokeWidth: آؤٹ لائن موٹائی
- fontSize: ٹیکسٹ سائز
- content: ٹیکسٹ مواد
- opacity: شفافیت (0-1)
- rotation: ڈگری میں گردش
- scale: سائز ضارب`,
      params: {
        itemId: 'آئٹم کی رجسٹری ID (مثال "item_1")',
        properties: 'اپڈیٹ کرنے کی خصوصیات',
      },
    },
    pinepaper_delete_item: {
      name: 'آئٹم حذف کریں',
      description: `کینوس سے آئٹم حذف کریں۔

کب استعمال کریں:
- ناپسندیدہ آئٹمز ہٹانا
- مخصوص عناصر صاف کرنا
- منظر کی صفائی`,
      params: {
        itemId: 'حذف کرنے کے لیے آئٹم کی رجسٹری ID',
      },
    },
    pinepaper_add_relation: {
      name: 'تعلق شامل کریں',
      description: `دو آئٹمز کے درمیان رویے کا تعلق بنائیں۔ تعلقات PinePaper میں اینیمیشن شامل کرنے کا بنیادی طریقہ ہیں - یہ بیان کرتے ہیں کہ آئٹمز کو ایک دوسرے کے نسبت کیسے برتاؤ کرنا چاہیے۔

کب استعمال کریں:
- "چاند زمین کے گرد گھومتا ہے" → relationType: orbits
- "لیبل کھلاڑی کا پیچھا کرتا ہے" → relationType: follows
- "ٹوپی کردار سے جڑی ہوئی ہے" → relationType: attached_to
- "سیٹلائٹ کو سٹیشن سے 200px دور رکھیں" → relationType: maintains_distance
- "تیر ہدف کی طرف اشارہ کرتا ہے" → relationType: points_at
- "عکس اصل کا آئینہ ہے" → relationType: mirrors
- "پس منظر parallax کے ساتھ حرکت کرتا ہے" → relationType: parallax
- "کھلاڑی میدان میں رہتا ہے" → relationType: bounds_to

تعلقات کی اقسام:
- orbits: ہدف کے گرد دائروی حرکت (params: radius, speed, direction)
- follows: ہموار کاری کے ساتھ ہدف کی طرف حرکت (params: offset, smoothing, delay)
- attached_to: ہدف سے مقررہ فاصلہ (params: offset, inherit_rotation)
- maintains_distance: ہدف سے مقررہ فاصلہ برقرار رکھنا (params: distance, strength)
- points_at: ہدف کی طرف گھومنا (params: offset_angle, smoothing)
- mirrors: محور پر پوزیشن کا آئینہ (params: axis, center)
- parallax: گہرائی کے لحاظ سے نسبتی حرکت (params: depth, origin)
- bounds_to: حدود میں رہنا (params: padding, bounce)

تعلقات کمپوزیشنل ہیں - ایک آئٹم کے متعدد تعلقات ہو سکتے ہیں جو مل کر کام کرتے ہیں!`,
      params: {
        sourceId: 'ماخذ آئٹم کی رجسٹری ID (وہ آئٹم جو متاثر ہوگا)',
        targetId: 'ہدف آئٹم کی رجسٹری ID (وہ آئٹم جس سے تعلق ہے)',
        relationType: 'تعلق کی قسم',
        params: 'تعلق کے مخصوص پیرامیٹرز',
      },
    },
    pinepaper_remove_relation: {
      name: 'تعلق ہٹائیں',
      description: `آئٹمز کے درمیان تعلق ہٹائیں۔

کب استعمال کریں:
- مداری اینیمیشن روکنا
- آئٹمز کو ایک دوسرے سے الگ کرنا
- رویے کے کنکشن ہٹانا`,
      params: {
        sourceId: 'ماخذ آئٹم ID',
        targetId: 'ہدف آئٹم ID',
        relationType: 'ہٹانے کے لیے مخصوص تعلق کی قسم (اختیاری - اگر نہیں دیا گیا تو سب ہٹ جائیں گے)',
      },
    },
    pinepaper_query_relations: {
      name: 'تعلقات کی چھان بین',
      description: `کسی آئٹم کے لیے تعلقات کی چھان بین کریں۔

کب استعمال کریں:
- تلاش کرنا کہ کون سے آئٹمز مرکزی آبجیکٹ کے گرد گھومتے ہیں
- نئے شامل کرنے سے پہلے موجودہ تعلقات چیک کرنا
- اینیمیشن رویوں کا ڈیبگ کرنا`,
      params: {
        itemId: 'تعلقات کی چھان بین کے لیے آئٹم',
        relationType: 'تعلق کی قسم سے فلٹر کریں (اختیاری)',
        direction: 'outgoing = آئٹم سے تعلقات، incoming = آئٹم کی طرف تعلقات',
      },
    },
    pinepaper_animate: {
      name: 'اینیمیٹ کریں',
      description: `کسی آئٹم پر سادہ لوپ اینیمیشن لگائیں۔ یہ مسلسل اینیمیشنز ہیں جو لامحدود طور پر دہراتی ہیں۔

کب استعمال کریں:
- "اسے دھڑکنے دو" → animationType: pulse
- "گھومتا لوگو" → animationType: rotate
- "اچھلتا ٹیکسٹ" → animationType: bounce
- "مدھم ہوتا اثر" → animationType: fade
- "ہلتا بٹن" → animationType: wobble
- "سرکتا ہیڈر" → animationType: slide
- "ٹائپ رائٹر اثر" → animationType: typewriter (صرف ٹیکسٹ)

کب استعمال نہ کریں:
- صارف درست وقت بتائے ("3 سیکنڈ میں فیڈ ان") → کی فریم اینیمیشن استعمال کریں
- صارف ترتیب وار اینیمیشنز چاہے ("پہلے فیڈ، پھر گھومنا") → کی فریم اینیمیشن استعمال کریں
- صارف تعلقات بیان کرے ("گرد گھومنا") → تعلقات استعمال کریں`,
      params: {
        itemId: 'آئٹم کی رجسٹری ID',
        animationType: 'اینیمیشن کی قسم',
        speed: 'اینیمیشن رفتار ضارب (ڈیفالٹ: 1.0)',
      },
    },
    pinepaper_keyframe_animate: {
      name: 'کی فریم اینیمیشن',
      description: `درست وقت اور پراپرٹی کنٹرول کے ساتھ کی فریم پر مبنی اینیمیشن لگائیں۔

کب استعمال کریں:
- "3 سیکنڈ میں فیڈ ان"
- "2 سیکنڈ میں بائیں سے دائیں منتقل ہو"
- "سرخ سے نیلے میں رنگ بدلو"
- "پہلے فیڈ ان، پھر گھومو، پھر فیڈ آؤٹ"
- کوئی بھی اینیمیشن جس میں مخصوص وقت یا ترتیب وار مراحل ہوں`,
      params: {
        itemId: 'آئٹم کی رجسٹری ID',
        keyframes: 'وقت، خصوصیات اور easing کے ساتھ کی فریمز کی صف',
        duration: 'سیکنڈوں میں کل اینیمیشن دورانیہ',
        loop: 'کیا اینیمیشن لوپ کرنی ہے',
      },
    },
    pinepaper_play_timeline: {
      name: 'ٹائم لائن چلائیں',
      description: `کی فریم اینیمیشن پلے بیک کنٹرول کریں۔

کب استعمال کریں:
- ٹائم لائن پلے بیک شروع/بند کرنا
- مخصوص وقت پر جانا
- اینیمیشن حالت کنٹرول کرنا`,
      params: {
        action: 'پلے بیک ایکشن (play, stop, seek)',
        duration: 'پلے ایکشن کے لیے دورانیہ',
        loop: 'کیا لوپ کرنا ہے',
        time: 'جانے کا وقت (seek ایکشن کے لیے)',
      },
    },
    pinepaper_execute_generator: {
      name: 'جنریٹر چلائیں',
      description: `پروسیجرل پیٹرنز بنانے کے لیے بیک گراؤنڈ جنریٹر چلائیں۔

کب استعمال کریں:
- "سن برسٹ بیک گراؤنڈ شامل کریں"
- "لہر پیٹرن بنائیں"
- "گرڈ بیک گراؤنڈ"
- "سرکٹ بورڈ پیٹرن"
- متحرک پروسیجرل بیک گراؤنڈز بنانا`,
      params: {
        generatorName: 'جنریٹر کا نام',
        params: 'جنریٹر کے مخصوص پیرامیٹرز',
      },
    },
    pinepaper_list_generators: {
      name: 'جنریٹرز کی فہرست',
      description: `تمام دستیاب بیک گراؤنڈ جنریٹرز کی فہرست ان کے پیرامیٹرز کے ساتھ حاصل کریں۔

کب استعمال کریں:
- صارف پوچھے "کون سے بیک گراؤنڈز دستیاب ہیں؟"
- جنریٹر کے اختیارات دکھانے ہوں
- جنریٹر کی صلاحیتوں کی دریافت`,
    },
    pinepaper_apply_effect: {
      name: 'اثر لگائیں',
      description: `کسی آئٹم پر بصری اثر لگائیں۔

کب استعمال کریں:
- چمکدار/گلیٹر اثرات شامل کرنا
- دھماکہ/پھٹنے کے اثرات بنانا
- بصری اثر بڑھانا`,
      params: {
        itemId: 'آئٹم کی رجسٹری ID',
        effectType: 'اثر کی قسم (sparkle, blast)',
        params: 'اثر کے پیرامیٹرز',
      },
    },
    pinepaper_get_items: {
      name: 'آئٹمز حاصل کریں',
      description: `کینوس سے تمام یا فلٹرڈ آئٹمز حاصل کریں۔

کب استعمال کریں:
- کینوس پر کیا ہے اس کی فہرست بنانا
- قسم کے لحاظ سے آئٹمز تلاش کرنا
- اینیمیٹڈ آئٹمز چیک کرنا
- منظر کا معائنہ`,
      params: {
        filter: 'اختیاری فلٹر کی شرائط',
      },
    },
    pinepaper_get_relation_stats: {
      name: 'تعلقات کے اعدادوشمار',
      description: `منظر میں فعال تعلقات کے اعدادوشمار حاصل کریں۔

کب استعمال کریں:
- تعلقات کے نظام کا ڈیبگ کرنا
- منظر کی پیچیدگی سمجھنا
- تجزیات اور رپورٹنگ`,
    },
    pinepaper_set_background_color: {
      name: 'بیک گراؤنڈ رنگ سیٹ کریں',
      description: `کینوس کا بیک گراؤنڈ رنگ سیٹ کریں۔

کب استعمال کریں:
- منظر کا بیک گراؤنڈ بدلنا
- آئٹمز شامل کرنے سے پہلے کینوس سیٹ کرنا`,
      params: {
        color: 'بیک گراؤنڈ رنگ (hex, rgb, یا نام)',
      },
    },
    pinepaper_set_canvas_size: {
      name: 'کینوس سائز سیٹ کریں',
      description: `کینوس کے ابعاد بدلیں۔

کب استعمال کریں:
- مخصوص فارمیٹ کے لیے سیٹ کرنا (Instagram, YouTube وغیرہ)
- کسٹم کینوس سائز کی ضروریات

عام پری سیٹس:
- instagram-square: 1080x1080
- instagram-story: 1080x1920
- youtube-thumbnail: 1280x720
- twitter-post: 1200x675`,
      params: {
        width: 'کینوس چوڑائی',
        height: 'کینوس اونچائی',
        preset: 'اختیاری پری سیٹ نام',
      },
    },
    pinepaper_export_svg: {
      name: 'SVG ایکسپورٹ کریں',
      description: `منظر کو اینیمیٹڈ SVG کے طور پر ایکسپورٹ کریں۔

کب استعمال کریں:
- کام کو SVG فائل کے طور پر محفوظ کرنا
- شیئر کرنے کے قابل گرافکس بنانا
- فائنل ایکسپورٹ`,
      params: {
        animated: 'CSS اینیمیشنز شامل کریں (ڈیفالٹ: true)',
      },
    },
    pinepaper_export_training_data: {
      name: 'ٹریننگ ڈیٹا ایکسپورٹ کریں',
      description: `LLM فائن ٹیوننگ کے لیے تعلقات کا ڈیٹا ٹریننگ جوڑوں کے طور پر ایکسپورٹ کریں۔

کب استعمال کریں:
- فائن ٹیوننگ کے لیے ٹریننگ ڈیٹا بنانا
- موجودہ منظر سے مثالیں بنانا
- کسٹم اینیمیشن ماڈل ٹریننگ سیٹس بنانا`,
      params: {
        format: 'آؤٹ پٹ فارمیٹ (json یا jsonl)',
        includeMetadata: 'تعلقات میٹا ڈیٹا شامل کریں',
      },
    },
    // Diagram Tools
    pinepaper_create_diagram_shape: { name: 'ڈایاگرام شکل بنائیں', description: '' },
    pinepaper_connect: { name: 'آئٹمز جوڑیں', description: '' },
    pinepaper_connect_ports: { name: 'پورٹس جوڑیں', description: '' },
    pinepaper_add_ports: { name: 'پورٹس شامل کریں', description: '' },
    pinepaper_auto_layout: { name: 'خودکار ترتیب', description: '' },
    pinepaper_get_diagram_shapes: { name: 'ڈایاگرام شکلیں حاصل کریں', description: '' },
    pinepaper_update_connector: { name: 'کنیکٹر اپ ڈیٹ کریں', description: '' },
    pinepaper_remove_connector: { name: 'کنیکٹر ہٹائیں', description: '' },
    pinepaper_diagram_mode: { name: 'ڈایاگرام موڈ', description: '' },
  },

  errors: {
    itemNotFound: 'آئٹم نہیں ملا: {{itemId}}',
    invalidRelation: 'غلط تعلق: {{relationType}}',
    invalidParams: 'غلط پیرامیٹرز: {{details}}',
    generatorNotFound: 'جنریٹر نہیں ملا: {{generatorName}}',
    exportFailed: 'ایکسپورٹ ناکام: {{reason}}',
    executionError: 'عمل درآمد میں خرابی: {{message}}',
    validationError: 'توثیق میں خرابی: {{message}}',
    unknownTool: 'نامعلوم ٹول: {{toolName}}',
    apiKeyRequired: 'API کلید درکار ہے',
    apiKeyInvalid: 'غلط API کلید',
    apiKeyExpired: 'API کلید کی میعاد ختم',
    rateLimitExceeded: 'ریٹ لمیٹ سے تجاوز۔ {{seconds}} سیکنڈ بعد دوبارہ کوشش کریں۔',
  },

  success: {
    itemCreated: '{{itemType}} پوزیشن ({{x}}, {{y}}) پر بنایا گیا',
    itemModified: 'آئٹم {{itemId}} میں ترمیم ہوئی',
    itemDeleted: 'آئٹم {{itemId}} حذف ہوا',
    relationAdded: '{{relationType}} تعلق شامل ہوا: {{sourceId}} → {{targetId}}',
    relationRemoved: '{{sourceId}} اور {{targetId}} کے درمیان تعلق ہٹایا گیا',
    animationApplied: '{{itemId}} پر {{animationType}} اینیمیشن لگائی گئی',
    generatorExecuted: '{{generatorName}} جنریٹر چلایا گیا',
    effectApplied: '{{itemId}} پر {{effectType}} اثر لگایا گیا',
    backgroundSet: 'بیک گراؤنڈ رنگ {{color}} پر سیٹ ہوا',
    canvasSizeSet: 'کینوس سائز {{width}}×{{height}} پر سیٹ ہوا',
    exported: '{{format}} کامیابی سے ایکسپورٹ ہوا',
  },

  itemTypes: {
    text: 'ٹیکسٹ',
    circle: 'دائرہ',
    star: 'ستارہ',
    rectangle: 'مستطیل',
    triangle: 'مثلث',
    polygon: 'کثیر الاضلاع',
    ellipse: 'بیضوی',
    path: 'پاتھ',
    line: 'لکیر',
    arc: 'قوس',
  },

  relationTypes: {
    orbits: 'گردش کرتا ہے',
    follows: 'پیچھا کرتا ہے',
    attached_to: 'سے جڑا ہوا',
    maintains_distance: 'فاصلہ برقرار رکھتا ہے',
    points_at: 'اشارہ کرتا ہے',
    mirrors: 'آئینہ کرتا ہے',
    parallax: 'پیرالیکس',
    bounds_to: 'حدود میں رہتا ہے',
  },

  animationTypes: {
    pulse: 'دھڑکن',
    rotate: 'گھومنا',
    bounce: 'اچھلنا',
    fade: 'مدھم ہونا',
    wobble: 'ہلنا',
    slide: 'سرکنا',
    typewriter: 'ٹائپ رائٹر',
  },

  generators: {
    drawSunburst: 'سن برسٹ',
    drawSunsetScene: 'غروب آفتاب',
    drawGrid: 'گرڈ',
    drawStackedCircles: 'ڈھیر لگے دائرے',
    drawCircuit: 'سرکٹ بورڈ',
    drawWaves: 'لہریں',
    drawPattern: 'پیٹرن',
  },

  common: {
    at: 'پر',
    with: 'کے ساتھ',
    to: 'کو',
    from: 'سے',
    position: 'پوزیشن',
    radius: 'ریڈیس',
    color: 'رنگ',
    speed: 'رفتار',
    duration: 'دورانیہ',
  },
};
