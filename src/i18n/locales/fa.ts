/**
 * Persian/Farsi Translations (RTL)
 */

import { createBaseTranslation } from './base.js';

export const fa = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'ایجاد آیتم', description: '' },
    pinepaper_modify_item: { name: 'تغییر آیتم', description: '' },
    pinepaper_delete_item: { name: 'حذف آیتم', description: '' },
    pinepaper_add_relation: { name: 'افزودن رابطه', description: '' },
    pinepaper_remove_relation: { name: 'حذف رابطه', description: '' },
    pinepaper_query_relations: { name: 'پرس‌وجوی روابط', description: '' },
    pinepaper_animate: { name: 'متحرک‌سازی', description: '' },
    pinepaper_keyframe_animate: { name: 'انیمیشن کلیدی', description: '' },
    pinepaper_play_timeline: { name: 'پخش خط زمانی', description: '' },
    pinepaper_execute_generator: { name: 'اجرای مولد', description: '' },
    pinepaper_list_generators: { name: 'لیست مولدها', description: '' },
    pinepaper_apply_effect: { name: 'اعمال افکت', description: '' },
    pinepaper_get_items: { name: 'دریافت آیتم‌ها', description: '' },
    pinepaper_get_relation_stats: { name: 'آمار روابط', description: '' },
    pinepaper_set_background_color: { name: 'تنظیم رنگ پس‌زمینه', description: '' },
    pinepaper_set_canvas_size: { name: 'تنظیم اندازه بوم', description: '' },
    pinepaper_export_svg: { name: 'خروجی SVG', description: '' },
    pinepaper_export_training_data: { name: 'خروجی داده‌های آموزشی', description: '' },
    // Diagram Tools
    pinepaper_create_diagram_shape: { name: 'ایجاد شکل نمودار', description: '' },
    pinepaper_connect: { name: 'اتصال آیتم‌ها', description: '' },
    pinepaper_connect_ports: { name: 'اتصال پورت‌ها', description: '' },
    pinepaper_add_ports: { name: 'افزودن پورت‌ها', description: '' },
    pinepaper_auto_layout: { name: 'چیدمان خودکار', description: '' },
    pinepaper_get_diagram_shapes: { name: 'دریافت اشکال نمودار', description: '' },
    pinepaper_update_connector: { name: 'بروزرسانی اتصال‌دهنده', description: '' },
    pinepaper_remove_connector: { name: 'حذف اتصال‌دهنده', description: '' },
    pinepaper_diagram_mode: { name: 'حالت نمودار', description: '' },
  },

  errors: {
    itemNotFound: 'آیتم یافت نشد: {{itemId}}',
    invalidRelation: 'رابطه نامعتبر: {{relationType}}',
    invalidParams: 'پارامترهای نامعتبر: {{details}}',
    generatorNotFound: 'مولد یافت نشد: {{generatorName}}',
    exportFailed: 'خروجی ناموفق: {{reason}}',
    executionError: 'خطای اجرا: {{message}}',
    validationError: 'خطای اعتبارسنجی: {{message}}',
    unknownTool: 'ابزار ناشناخته: {{toolName}}',
    apiKeyRequired: 'کلید API لازم است',
    apiKeyInvalid: 'کلید API نامعتبر',
    apiKeyExpired: 'کلید API منقضی شده',
    rateLimitExceeded: 'محدودیت درخواست تجاوز شده. {{seconds}} ثانیه دیگر دوباره امتحان کنید.',
  },

  success: {
    itemCreated: '{{itemType}} در موقعیت ({{x}}, {{y}}) ایجاد شد',
    itemModified: 'آیتم {{itemId}} تغییر کرد',
    itemDeleted: 'آیتم {{itemId}} حذف شد',
    relationAdded: 'رابطه {{relationType}} اضافه شد: {{sourceId}} ← {{targetId}}',
    relationRemoved: 'رابطه بین {{sourceId}} و {{targetId}} حذف شد',
    animationApplied: 'انیمیشن {{animationType}} روی {{itemId}} اعمال شد',
    generatorExecuted: 'مولد {{generatorName}} اجرا شد',
    effectApplied: 'افکت {{effectType}} روی {{itemId}} اعمال شد',
    backgroundSet: 'رنگ پس‌زمینه به {{color}} تنظیم شد',
    canvasSizeSet: 'اندازه بوم به {{width}}×{{height}} تنظیم شد',
    exported: '{{format}} با موفقیت خروجی گرفته شد',
  },

  itemTypes: {
    text: 'متن',
    circle: 'دایره',
    star: 'ستاره',
    rectangle: 'مستطیل',
    triangle: 'مثلث',
    polygon: 'چندضلعی',
    ellipse: 'بیضی',
    path: 'مسیر',
    line: 'خط',
    arc: 'کمان',
  },

  relationTypes: {
    orbits: 'مدار',
    follows: 'دنبال می‌کند',
    attached_to: 'متصل به',
    maintains_distance: 'فاصله را حفظ می‌کند',
    points_at: 'اشاره می‌کند به',
    mirrors: 'بازتاب',
    parallax: 'اختلاف منظر',
    bounds_to: 'محدود به',
  },

  animationTypes: {
    pulse: 'تپش',
    rotate: 'چرخش',
    bounce: 'جهش',
    fade: 'محو',
    wobble: 'تکان',
    slide: 'لغزش',
    typewriter: 'ماشین تحریر',
  },

  generators: {
    drawSunburst: 'پرتو خورشید',
    drawSunsetScene: 'صحنه غروب',
    drawGrid: 'شبکه',
    drawStackedCircles: 'دایره‌های روی هم',
    drawCircuit: 'برد مدار',
    drawWaves: 'امواج',
    drawPattern: 'الگو',
  },

  common: {
    at: 'در',
    with: 'با',
    to: 'به',
    from: 'از',
    position: 'موقعیت',
    radius: 'شعاع',
    color: 'رنگ',
    speed: 'سرعت',
    duration: 'مدت',
  },
});

export default fa;
