/**
 * Hebrew Translations (RTL)
 */

import { createBaseTranslation } from './base.js';

export const he = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'צור פריט', description: '' },
    pinepaper_modify_item: { name: 'שנה פריט', description: '' },
    pinepaper_delete_item: { name: 'מחק פריט', description: '' },
    pinepaper_add_relation: { name: 'הוסף יחס', description: '' },
    pinepaper_remove_relation: { name: 'הסר יחס', description: '' },
    pinepaper_query_relations: { name: 'שאילתת יחסים', description: '' },
    pinepaper_animate: { name: 'הנפש', description: '' },
    pinepaper_keyframe_animate: { name: 'אנימציית מפתח', description: '' },
    pinepaper_play_timeline: { name: 'נגן ציר זמן', description: '' },
    pinepaper_execute_generator: { name: 'הפעל מחולל', description: '' },
    pinepaper_list_generators: { name: 'רשימת מחוללים', description: '' },
    pinepaper_apply_effect: { name: 'החל אפקט', description: '' },
    pinepaper_get_items: { name: 'קבל פריטים', description: '' },
    pinepaper_get_relation_stats: { name: 'סטטיסטיקות יחסים', description: '' },
    pinepaper_set_background_color: { name: 'הגדר צבע רקע', description: '' },
    pinepaper_set_canvas_size: { name: 'הגדר גודל בד', description: '' },
    pinepaper_export_svg: { name: 'ייצא SVG', description: '' },
    pinepaper_export_training_data: { name: 'ייצא נתוני אימון', description: '' },
  },

  errors: {
    itemNotFound: 'פריט לא נמצא: {{itemId}}',
    invalidRelation: 'יחס לא חוקי: {{relationType}}',
    invalidParams: 'פרמטרים לא חוקיים: {{details}}',
    generatorNotFound: 'מחולל לא נמצא: {{generatorName}}',
    exportFailed: 'הייצוא נכשל: {{reason}}',
    executionError: 'שגיאת ביצוע: {{message}}',
    validationError: 'שגיאת אימות: {{message}}',
    unknownTool: 'כלי לא מוכר: {{toolName}}',
    apiKeyRequired: 'נדרש מפתח API',
    apiKeyInvalid: 'מפתח API לא חוקי',
    apiKeyExpired: 'מפתח API פג תוקף',
    rateLimitExceeded: 'חריגה ממגבלת בקשות. נסה שוב בעוד {{seconds}} שניות.',
  },

  success: {
    itemCreated: '{{itemType}} נוצר במיקום ({{x}}, {{y}})',
    itemModified: 'פריט {{itemId}} שונה',
    itemDeleted: 'פריט {{itemId}} נמחק',
    relationAdded: 'יחס {{relationType}} נוסף: {{sourceId}} ← {{targetId}}',
    relationRemoved: 'יחס בין {{sourceId}} ל-{{targetId}} הוסר',
    animationApplied: 'אנימציית {{animationType}} הוחלה על {{itemId}}',
    generatorExecuted: 'מחולל {{generatorName}} הופעל',
    effectApplied: 'אפקט {{effectType}} הוחל על {{itemId}}',
    backgroundSet: 'צבע רקע הוגדר ל-{{color}}',
    canvasSizeSet: 'גודל בד הוגדר ל-{{width}}×{{height}}',
    exported: '{{format}} יוצא בהצלחה',
  },

  itemTypes: {
    text: 'טקסט',
    circle: 'עיגול',
    star: 'כוכב',
    rectangle: 'מלבן',
    triangle: 'משולש',
    polygon: 'מצולע',
    ellipse: 'אליפסה',
    path: 'נתיב',
    line: 'קו',
    arc: 'קשת',
  },

  relationTypes: {
    orbits: 'מקיף',
    follows: 'עוקב',
    attached_to: 'מחובר ל',
    maintains_distance: 'שומר מרחק',
    points_at: 'מצביע על',
    mirrors: 'משקף',
    parallax: 'פרלקס',
    bounds_to: 'מוגבל ל',
  },

  animationTypes: {
    pulse: 'פעימה',
    rotate: 'סיבוב',
    bounce: 'קפיצה',
    fade: 'דהייה',
    wobble: 'התנדנדות',
    slide: 'החלקה',
    typewriter: 'מכונת כתיבה',
  },

  generators: {
    drawSunburst: 'קרני שמש',
    drawSunsetScene: 'סצנת שקיעה',
    drawGrid: 'רשת',
    drawStackedCircles: 'עיגולים מוערמים',
    drawCircuit: 'לוח מעגלים',
    drawWaves: 'גלים',
    drawPattern: 'דפוס',
  },

  common: {
    at: 'ב',
    with: 'עם',
    to: 'ל',
    from: 'מ',
    position: 'מיקום',
    radius: 'רדיוס',
    color: 'צבע',
    speed: 'מהירות',
    duration: 'משך',
  },
});

export default he;
