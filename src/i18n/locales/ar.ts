/**
 * Arabic Translations (RTL)
 */

import { createBaseTranslation } from './base.js';

export const ar = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'إنشاء عنصر', description: '' },
    pinepaper_modify_item: { name: 'تعديل عنصر', description: '' },
    pinepaper_delete_item: { name: 'حذف عنصر', description: '' },
    pinepaper_add_relation: { name: 'إضافة علاقة', description: '' },
    pinepaper_remove_relation: { name: 'إزالة علاقة', description: '' },
    pinepaper_query_relations: { name: 'استعلام العلاقات', description: '' },
    pinepaper_animate: { name: 'تحريك', description: '' },
    pinepaper_keyframe_animate: { name: 'تحريك بالإطارات الرئيسية', description: '' },
    pinepaper_play_timeline: { name: 'تشغيل الخط الزمني', description: '' },
    pinepaper_execute_generator: { name: 'تنفيذ المولد', description: '' },
    pinepaper_list_generators: { name: 'قائمة المولدات', description: '' },
    pinepaper_apply_effect: { name: 'تطبيق تأثير', description: '' },
    pinepaper_get_items: { name: 'الحصول على العناصر', description: '' },
    pinepaper_get_relation_stats: { name: 'إحصائيات العلاقات', description: '' },
    pinepaper_set_background_color: { name: 'تعيين لون الخلفية', description: '' },
    pinepaper_set_canvas_size: { name: 'تعيين حجم اللوحة', description: '' },
    pinepaper_export_svg: { name: 'تصدير SVG', description: '' },
    pinepaper_export_training_data: { name: 'تصدير بيانات التدريب', description: '' },

    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'إنشاء شكل مخطط',
      description: 'إنشاء أشكال متخصصة للمخططات الانسيابية ومخططات UML والرسوم التقنية. أنواع الأشكال: مخططات انسيابية (process, decision, terminal, data, document, database, preparation)، UML (uml-class, uml-usecase, uml-actor)، شبكات (cloud, server)، أساسية (rectangle, circle, triangle, star).'
    },
    pinepaper_connect: {
      name: 'ربط العناصر',
      description: 'ربط عنصرين بموصل ذكي مع أسهم. أنواع التوجيه: orthogonal (زوايا قائمة)، direct (خط مستقيم)، curved (منحنى بيزييه). يستخدم لرسم الأسهم بين خطوات المخططات الانسيابية وربط فئات UML وإنشاء اتصالات الشبكة.'
    },
    pinepaper_connect_ports: {
      name: 'ربط المنافذ',
      description: 'ربط منافذ محددة على العناصر للتحكم الدقيق في نقاط الاتصال. يستخدم عندما تحتاج إلى ربط الموصل بجانب معين من الشكل أو لإنشاء مخططات معقدة بنقاط دخول وخروج محددة.'
    },
    pinepaper_add_ports: {
      name: 'إضافة منافذ',
      description: 'إضافة نقاط ارتساء للاتصال إلى عنصر موجود. المنافذ هي النقاط التي يمكن للموصلات الارتباط بها. يستخدم لإضافة مواضع منافذ مخصصة أو تمكين الاتصالات على العناصر التي لا تحتوي على منافذ.'
    },
    pinepaper_auto_layout: {
      name: 'تخطيط تلقائي',
      description: 'ترتيب عناصر المخطط تلقائياً باستخدام خوارزمية تخطيط. أنواع التخطيط: hierarchical (للمخططات الانسيابية والتنظيمية)، force-directed (لمخططات الشبكة)، tree (للهياكل الشجرية)، radial (للخرائط الذهنية)، grid (للعناصر متساوية الأهمية).'
    },
    pinepaper_get_diagram_shapes: {
      name: 'الحصول على أشكال المخطط',
      description: 'الحصول على قائمة بأشكال المخططات المتاحة مع خصائصها. يستخدم لعرض خيارات الأشكال المتاحة ومعرفة الأحجام والأنماط الافتراضية. يمكن التصفية حسب الفئة: flowchart, uml, network, basic.'
    },
    pinepaper_update_connector: {
      name: 'تحديث الموصل',
      description: 'تحديث نمط أو تسمية موصل موجود. يستخدم لتغيير مظهر الموصل بعد الإنشاء، أو تحديث التسميات، أو تغيير أنماط الأسهم والألوان.'
    },
    pinepaper_remove_connector: {
      name: 'إزالة الموصل',
      description: 'إزالة موصل من اللوحة. يستخدم لحذف اتصال بين العناصر أو إزالة روابط غير صحيحة أو إعادة هيكلة اتصالات المخطط.'
    },
    pinepaper_diagram_mode: {
      name: 'وضع المخطط',
      description: 'التحكم في وضع المخطط للتحرير التفاعلي. الإجراءات: activate (تفعيل وضع المخطط)، deactivate (العودة إلى وضع اللوحة العادي)، toggle (التبديل بين الأوضاع)، setMode (تعيين وضع أداة معين).'
    },
  },

  errors: {
    itemNotFound: 'العنصر غير موجود: {{itemId}}',
    invalidRelation: 'علاقة غير صالحة: {{relationType}}',
    invalidParams: 'معلمات غير صالحة: {{details}}',
    generatorNotFound: 'المولد غير موجود: {{generatorName}}',
    exportFailed: 'فشل التصدير: {{reason}}',
    executionError: 'خطأ في التنفيذ: {{message}}',
    validationError: 'خطأ في التحقق: {{message}}',
    unknownTool: 'أداة غير معروفة: {{toolName}}',
    apiKeyRequired: 'مطلوب مفتاح API',
    apiKeyInvalid: 'مفتاح API غير صالح',
    apiKeyExpired: 'انتهت صلاحية مفتاح API',
    rateLimitExceeded: 'تم تجاوز حد الطلبات. حاول مرة أخرى بعد {{seconds}} ثانية.',
  },

  success: {
    itemCreated: 'تم إنشاء {{itemType}} في الموضع ({{x}}, {{y}})',
    itemModified: 'تم تعديل العنصر {{itemId}}',
    itemDeleted: 'تم حذف العنصر {{itemId}}',
    relationAdded: 'تمت إضافة علاقة {{relationType}}: {{sourceId}} ← {{targetId}}',
    relationRemoved: 'تمت إزالة العلاقة بين {{sourceId}} و {{targetId}}',
    animationApplied: 'تم تطبيق تحريك {{animationType}} على {{itemId}}',
    generatorExecuted: 'تم تنفيذ المولد {{generatorName}}',
    effectApplied: 'تم تطبيق تأثير {{effectType}} على {{itemId}}',
    backgroundSet: 'تم تعيين لون الخلفية إلى {{color}}',
    canvasSizeSet: 'تم تعيين حجم اللوحة إلى {{width}}×{{height}}',
    exported: 'تم تصدير {{format}} بنجاح',
  },

  itemTypes: {
    text: 'نص',
    circle: 'دائرة',
    star: 'نجمة',
    rectangle: 'مستطيل',
    triangle: 'مثلث',
    polygon: 'مضلع',
    ellipse: 'قطع ناقص',
    path: 'مسار',
    line: 'خط',
    arc: 'قوس',
  },

  relationTypes: {
    orbits: 'يدور',
    follows: 'يتبع',
    attached_to: 'مرتبط بـ',
    maintains_distance: 'يحافظ على المسافة',
    points_at: 'يشير إلى',
    mirrors: 'يعكس',
    parallax: 'المنظر',
    bounds_to: 'محدود بـ',
  },

  animationTypes: {
    pulse: 'نبض',
    rotate: 'دوران',
    bounce: 'ارتداد',
    fade: 'تلاشي',
    wobble: 'تذبذب',
    slide: 'انزلاق',
    typewriter: 'آلة كاتبة',
  },

  generators: {
    drawSunburst: 'أشعة الشمس',
    drawSunsetScene: 'مشهد الغروب',
    drawGrid: 'شبكة',
    drawStackedCircles: 'دوائر متراصة',
    drawCircuit: 'لوحة دوائر',
    drawWaves: 'موجات',
    drawPattern: 'نمط',
  },

  common: {
    at: 'في',
    with: 'مع',
    to: 'إلى',
    from: 'من',
    position: 'موضع',
    radius: 'نصف القطر',
    color: 'لون',
    speed: 'سرعة',
    duration: 'مدة',
  },
});

export default ar;
