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
