/**
 * Hindi Translations
 */

import { createBaseTranslation } from './base.js';

export const hi = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'आइटम बनाएं', description: '' },
    pinepaper_modify_item: { name: 'आइटम संशोधित करें', description: '' },
    pinepaper_delete_item: { name: 'आइटम हटाएं', description: '' },
    pinepaper_add_relation: { name: 'संबंध जोड़ें', description: '' },
    pinepaper_remove_relation: { name: 'संबंध हटाएं', description: '' },
    pinepaper_query_relations: { name: 'संबंध खोजें', description: '' },
    pinepaper_animate: { name: 'एनिमेट करें', description: '' },
    pinepaper_keyframe_animate: { name: 'कीफ्रेम एनिमेशन', description: '' },
    pinepaper_play_timeline: { name: 'टाइमलाइन चलाएं', description: '' },
    pinepaper_execute_generator: { name: 'जनरेटर चलाएं', description: '' },
    pinepaper_list_generators: { name: 'जनरेटर सूची', description: '' },
    pinepaper_apply_effect: { name: 'प्रभाव लागू करें', description: '' },
    pinepaper_get_items: { name: 'आइटम प्राप्त करें', description: '' },
    pinepaper_get_relation_stats: { name: 'संबंध आंकड़े', description: '' },
    pinepaper_set_background_color: { name: 'पृष्ठभूमि रंग सेट करें', description: '' },
    pinepaper_set_canvas_size: { name: 'कैनवास आकार सेट करें', description: '' },
    pinepaper_export_svg: { name: 'SVG निर्यात करें', description: '' },
    pinepaper_export_training_data: { name: 'प्रशिक्षण डेटा निर्यात करें', description: '' },
  },

  errors: {
    itemNotFound: 'आइटम नहीं मिला: {{itemId}}',
    invalidRelation: 'अमान्य संबंध: {{relationType}}',
    invalidParams: 'अमान्य पैरामीटर: {{details}}',
    generatorNotFound: 'जनरेटर नहीं मिला: {{generatorName}}',
    exportFailed: 'निर्यात विफल: {{reason}}',
    executionError: 'निष्पादन त्रुटि: {{message}}',
    validationError: 'सत्यापन त्रुटि: {{message}}',
    unknownTool: 'अज्ञात टूल: {{toolName}}',
    apiKeyRequired: 'API कुंजी आवश्यक है',
    apiKeyInvalid: 'अमान्य API कुंजी',
    apiKeyExpired: 'API कुंजी समाप्त हो गई',
    rateLimitExceeded: 'अनुरोध सीमा पार हो गई। {{seconds}} सेकंड बाद पुनः प्रयास करें।',
  },

  success: {
    itemCreated: '{{itemType}} स्थिति ({{x}}, {{y}}) पर बनाया गया',
    itemModified: 'आइटम {{itemId}} संशोधित किया गया',
    itemDeleted: 'आइटम {{itemId}} हटाया गया',
    relationAdded: '{{relationType}} संबंध जोड़ा गया: {{sourceId}} → {{targetId}}',
    relationRemoved: '{{sourceId}} और {{targetId}} के बीच संबंध हटाया गया',
    animationApplied: '{{itemId}} पर {{animationType}} एनिमेशन लागू किया गया',
    generatorExecuted: '{{generatorName}} जनरेटर चलाया गया',
    effectApplied: '{{itemId}} पर {{effectType}} प्रभाव लागू किया गया',
    backgroundSet: 'पृष्ठभूमि रंग {{color}} पर सेट किया गया',
    canvasSizeSet: 'कैनवास आकार {{width}}×{{height}} पर सेट किया गया',
    exported: '{{format}} सफलतापूर्वक निर्यात किया गया',
  },

  itemTypes: {
    text: 'पाठ',
    circle: 'वृत्त',
    star: 'तारा',
    rectangle: 'आयत',
    triangle: 'त्रिभुज',
    polygon: 'बहुभुज',
    ellipse: 'दीर्घवृत्त',
    path: 'पथ',
    line: 'रेखा',
    arc: 'चाप',
  },

  relationTypes: {
    orbits: 'परिक्रमा',
    follows: 'अनुसरण',
    attached_to: 'जुड़ा हुआ',
    maintains_distance: 'दूरी बनाए रखता है',
    points_at: 'इंगित करता है',
    mirrors: 'दर्पण',
    parallax: 'पैरालैक्स',
    bounds_to: 'सीमित',
  },

  animationTypes: {
    pulse: 'स्पंदन',
    rotate: 'घूर्णन',
    bounce: 'उछाल',
    fade: 'फीका',
    wobble: 'डगमगाना',
    slide: 'स्लाइड',
    typewriter: 'टाइपराइटर',
  },

  generators: {
    drawSunburst: 'सूर्य किरणें',
    drawSunsetScene: 'सूर्यास्त दृश्य',
    drawGrid: 'ग्रिड',
    drawStackedCircles: 'स्टैक्ड वृत्त',
    drawCircuit: 'सर्किट बोर्ड',
    drawWaves: 'तरंगें',
    drawPattern: 'पैटर्न',
  },

  common: {
    at: 'पर',
    with: 'के साथ',
    to: 'को',
    from: 'से',
    position: 'स्थिति',
    radius: 'त्रिज्या',
    color: 'रंग',
    speed: 'गति',
    duration: 'अवधि',
  },
});

export default hi;
