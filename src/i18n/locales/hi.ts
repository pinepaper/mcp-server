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
    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'आरेख आकृति बनाएं',
      description: 'कैनवास पर आरेख आकृति बनाएं। फ्लोचार्ट, UML आरेख, नेटवर्क आरेख और तकनीकी चित्रों के लिए विशेष आकृतियां। आकृति प्रकार: फ्लोचार्ट (process, decision, terminal, data, document, database), UML (uml-class, uml-usecase, uml-actor), नेटवर्क (cloud, server), मूल (rectangle, circle, triangle, star)।'
    },
    pinepaper_connect: {
      name: 'आइटम कनेक्ट करें',
      description: 'दो आइटम को स्मार्ट कनेक्टर से जोड़ें। आरेख आकृतियों के बीच रेखाएं/तीर खींचने का प्राथमिक तरीका। रूटिंग प्रकार: orthogonal (समकोण मोड़), direct (सीधी रेखा), curved (बेज़ियर वक्र)। तीर शैली, रेखा रंग, रेखा चौड़ाई और लेबल समर्थित।'
    },
    pinepaper_connect_ports: {
      name: 'पोर्ट कनेक्ट करें',
      description: 'आइटम पर दो विशिष्ट पोर्ट कनेक्ट करें। जब आपको यह नियंत्रित करने की आवश्यकता हो कि कनेक्टर किन पोर्ट से जुड़ता है। जटिल आरेखों या सर्किट जैसे आरेखों के लिए उपयोगी जहां विशिष्ट प्रवेश/निकास बिंदु चाहिए।'
    },
    pinepaper_add_ports: {
      name: 'पोर्ट जोड़ें',
      description: 'मौजूदा आइटम में कनेक्शन पोर्ट जोड़ें। पोर्ट एंकर बिंदु हैं जहां कनेक्टर जुड़ सकते हैं। आकृतियों में कस्टम पोर्ट स्थिति जोड़ने, बिना पोर्ट वाले आइटम पर कनेक्शन सक्षम करने, या जटिल आरेखों के लिए विशेष कनेक्शन बिंदु बनाने के लिए उपयोग करें।'
    },
    pinepaper_auto_layout: {
      name: 'स्वचालित लेआउट',
      description: 'लेआउट एल्गोरिथ्म का उपयोग करके आरेख आइटम को स्वचालित रूप से व्यवस्थित करें। साफ़, पठनीय आरेखों के लिए आइटम को पुनर्गठित करता है। लेआउट प्रकार: hierarchical (फ्लोचार्ट, संगठन चार्ट के लिए), force-directed (नेटवर्क आरेखों के लिए), tree (पदानुक्रमों के लिए), radial (माइंड मैप के लिए), grid (समान-महत्व आइटम के लिए)।'
    },
    pinepaper_get_diagram_shapes: {
      name: 'आरेख आकृतियां प्राप्त करें',
      description: 'उनके गुणों के साथ उपलब्ध आरेख आकृतियों की सूची प्राप्त करें। उपलब्ध आकृतियां देखने, आकृतियों के लिए डिफ़ॉल्ट आकार और स्टाइलिंग जानने, या गतिशील UI बनाने के लिए उपयोग करें। श्रेणी द्वारा फ़िल्टर करें: flowchart, uml, network, basic।'
    },
    pinepaper_update_connector: {
      name: 'कनेक्टर अपडेट करें',
      description: 'मौजूदा कनेक्टर की शैली या लेबल अपडेट करें। निर्माण के बाद कनेक्टर स्वरूप बदलने, कनेक्टर लेबल अपडेट करने, या तीर शैली या रंग बदलने के लिए उपयोग करें।'
    },
    pinepaper_remove_connector: {
      name: 'कनेक्टर हटाएं',
      description: 'कैनवास से कनेक्टर हटाएं। आइटम के बीच कनेक्शन हटाने, गलत लिंक हटाने, या आरेख कनेक्शन को पुनर्गठित करने के लिए उपयोग करें।'
    },
    pinepaper_diagram_mode: {
      name: 'आरेख मोड',
      description: 'इंटरैक्टिव संपादन के लिए आरेख मोड नियंत्रित करें। क्रियाएं: activate (आरेख मोड सक्षम करें), deactivate (सामान्य कैनवास मोड पर लौटें), toggle (मोड के बीच स्विच करें), setMode (विशिष्ट टूल मोड सेट करें)। ड्राइंग और चयन मोड के बीच स्विच करने के लिए उपयोग करें।'
    },
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
