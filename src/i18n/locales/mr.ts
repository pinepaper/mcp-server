/**
 * Marathi Translations
 */

import { createBaseTranslation } from './base.js';

export const mr = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'आयटम तयार करा', description: '' },
    pinepaper_modify_item: { name: 'आयटम बदला', description: '' },
    pinepaper_delete_item: { name: 'आयटम हटवा', description: '' },
    pinepaper_add_relation: { name: 'संबंध जोडा', description: '' },
    pinepaper_remove_relation: { name: 'संबंध काढा', description: '' },
    pinepaper_query_relations: { name: 'संबंध शोधा', description: '' },
    pinepaper_animate: { name: 'अॅनिमेट करा', description: '' },
    pinepaper_keyframe_animate: { name: 'कीफ्रेम अॅनिमेशन', description: '' },
    pinepaper_play_timeline: { name: 'टाइमलाइन चालवा', description: '' },
    pinepaper_execute_generator: { name: 'जनरेटर चालवा', description: '' },
    pinepaper_list_generators: { name: 'जनरेटर यादी', description: '' },
    pinepaper_apply_effect: { name: 'इफेक्ट लागू करा', description: '' },
    pinepaper_get_items: { name: 'आयटम मिळवा', description: '' },
    pinepaper_get_relation_stats: { name: 'संबंध आकडेवारी', description: '' },
    pinepaper_set_background_color: { name: 'पार्श्वभूमी रंग सेट करा', description: '' },
    pinepaper_set_canvas_size: { name: 'कॅनव्हास आकार सेट करा', description: '' },
    pinepaper_export_svg: { name: 'SVG निर्यात करा', description: '' },
    pinepaper_export_training_data: { name: 'प्रशिक्षण डेटा निर्यात करा', description: '' },
  },

  errors: {
    itemNotFound: 'आयटम सापडला नाही: {{itemId}}',
    invalidRelation: 'अवैध संबंध: {{relationType}}',
    invalidParams: 'अवैध पॅरामीटर्स: {{details}}',
    generatorNotFound: 'जनरेटर सापडला नाही: {{generatorName}}',
    exportFailed: 'निर्यात अयशस्वी: {{reason}}',
    executionError: 'अंमलबजावणी त्रुटी: {{message}}',
    validationError: 'प्रमाणीकरण त्रुटी: {{message}}',
    unknownTool: 'अज्ञात साधन: {{toolName}}',
    apiKeyRequired: 'API की आवश्यक आहे',
    apiKeyInvalid: 'अवैध API की',
    apiKeyExpired: 'API की कालबाह्य झाली',
    rateLimitExceeded: 'विनंती मर्यादा ओलांडली. {{seconds}} सेकंदांनंतर पुन्हा प्रयत्न करा.',
  },

  success: {
    itemCreated: '{{itemType}} स्थानावर ({{x}}, {{y}}) तयार केले',
    itemModified: 'आयटम {{itemId}} बदलला',
    itemDeleted: 'आयटम {{itemId}} हटवला',
    relationAdded: '{{relationType}} संबंध जोडला: {{sourceId}} → {{targetId}}',
    relationRemoved: '{{sourceId}} आणि {{targetId}} मधील संबंध काढला',
    animationApplied: '{{itemId}} वर {{animationType}} अॅनिमेशन लागू केले',
    generatorExecuted: '{{generatorName}} जनरेटर चालवला',
    effectApplied: '{{itemId}} वर {{effectType}} इफेक्ट लागू केला',
    backgroundSet: 'पार्श्वभूमी रंग {{color}} वर सेट केला',
    canvasSizeSet: 'कॅनव्हास आकार {{width}}×{{height}} वर सेट केला',
    exported: '{{format}} यशस्वीरित्या निर्यात केले',
  },

  itemTypes: {
    text: 'मजकूर',
    circle: 'वर्तुळ',
    star: 'तारा',
    rectangle: 'आयत',
    triangle: 'त्रिकोण',
    polygon: 'बहुभुज',
    ellipse: 'लंबवर्तुळ',
    path: 'मार्ग',
    line: 'रेषा',
    arc: 'कंस',
  },

  relationTypes: {
    orbits: 'परिभ्रमण',
    follows: 'अनुसरण',
    attached_to: 'जोडलेले',
    maintains_distance: 'अंतर राखते',
    points_at: 'निर्देश करते',
    mirrors: 'प्रतिबिंबित',
    parallax: 'पॅरॅलॅक्स',
    bounds_to: 'मर्यादित',
  },

  animationTypes: {
    pulse: 'स्पंदन',
    rotate: 'फिरणे',
    bounce: 'उडी',
    fade: 'मंद',
    wobble: 'डोलणे',
    slide: 'सरकणे',
    typewriter: 'टाइपरायटर',
  },

  generators: {
    drawSunburst: 'सूर्यकिरण',
    drawSunsetScene: 'सूर्यास्त दृश्य',
    drawGrid: 'जाळी',
    drawStackedCircles: 'रचलेली वर्तुळे',
    drawCircuit: 'सर्किट बोर्ड',
    drawWaves: 'लाटा',
    drawPattern: 'नमुना',
  },

  common: {
    at: 'येथे',
    with: 'सोबत',
    to: 'ला',
    from: 'पासून',
    position: 'स्थान',
    radius: 'त्रिज्या',
    color: 'रंग',
    speed: 'वेग',
    duration: 'कालावधी',
  },
});

export default mr;
