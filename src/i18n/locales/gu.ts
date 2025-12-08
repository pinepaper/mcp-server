/**
 * Gujarati Translations
 */

import { createBaseTranslation } from './base.js';

export const gu = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'આઇટમ બનાવો', description: '' },
    pinepaper_modify_item: { name: 'આઇટમ સુધારો', description: '' },
    pinepaper_delete_item: { name: 'આઇટમ કાઢી નાખો', description: '' },
    pinepaper_add_relation: { name: 'સંબંધ ઉમેરો', description: '' },
    pinepaper_remove_relation: { name: 'સંબંધ દૂર કરો', description: '' },
    pinepaper_query_relations: { name: 'સંબંધો શોધો', description: '' },
    pinepaper_animate: { name: 'એનિમેટ કરો', description: '' },
    pinepaper_keyframe_animate: { name: 'કીફ્રેમ એનિમેશન', description: '' },
    pinepaper_play_timeline: { name: 'ટાઇમલાઇન ચલાવો', description: '' },
    pinepaper_execute_generator: { name: 'જનરેટર ચલાવો', description: '' },
    pinepaper_list_generators: { name: 'જનરેટર યાદી', description: '' },
    pinepaper_apply_effect: { name: 'ઇફેક્ટ લાગુ કરો', description: '' },
    pinepaper_get_items: { name: 'આઇટમ્સ મેળવો', description: '' },
    pinepaper_get_relation_stats: { name: 'સંબંધ આંકડા', description: '' },
    pinepaper_set_background_color: { name: 'પૃષ્ઠભૂમિ રંગ સેટ કરો', description: '' },
    pinepaper_set_canvas_size: { name: 'કેનવાસ કદ સેટ કરો', description: '' },
    pinepaper_export_svg: { name: 'SVG નિકાસ કરો', description: '' },
    pinepaper_export_training_data: { name: 'તાલીમ ડેટા નિકાસ કરો', description: '' },
  },

  errors: {
    itemNotFound: 'આઇટમ મળી નથી: {{itemId}}',
    invalidRelation: 'અમાન્ય સંબંધ: {{relationType}}',
    invalidParams: 'અમાન્ય પરિમાણો: {{details}}',
    generatorNotFound: 'જનરેટર મળ્યું નથી: {{generatorName}}',
    exportFailed: 'નિકાસ નિષ્ફળ: {{reason}}',
    executionError: 'અમલ ભૂલ: {{message}}',
    validationError: 'માન્યતા ભૂલ: {{message}}',
    unknownTool: 'અજ્ઞાત સાધન: {{toolName}}',
    apiKeyRequired: 'API કી જરૂરી છે',
    apiKeyInvalid: 'અમાન્ય API કી',
    apiKeyExpired: 'API કી સમાપ્ત થઈ ગઈ',
    rateLimitExceeded: 'વિનંતી મર્યાદા વટાવી ગઈ. {{seconds}} સેકન્ડ પછી ફરી પ્રયાસ કરો.',
  },

  success: {
    itemCreated: '{{itemType}} સ્થાન ({{x}}, {{y}}) પર બનાવ્યું',
    itemModified: 'આઇટમ {{itemId}} સુધારી',
    itemDeleted: 'આઇટમ {{itemId}} કાઢી નાખી',
    relationAdded: '{{relationType}} સંબંધ ઉમેર્યો: {{sourceId}} → {{targetId}}',
    relationRemoved: '{{sourceId}} અને {{targetId}} વચ્ચેનો સંબંધ દૂર કર્યો',
    animationApplied: '{{itemId}} પર {{animationType}} એનિમેશન લાગુ કર્યું',
    generatorExecuted: '{{generatorName}} જનરેટર ચલાવ્યું',
    effectApplied: '{{itemId}} પર {{effectType}} ઇફેક્ટ લાગુ કરી',
    backgroundSet: 'પૃષ્ઠભૂમિ રંગ {{color}} પર સેટ કર્યો',
    canvasSizeSet: 'કેનવાસ કદ {{width}}×{{height}} પર સેટ કર્યું',
    exported: '{{format}} સફળતાપૂર્વક નિકાસ થયું',
  },

  itemTypes: {
    text: 'ટેક્સ્ટ',
    circle: 'વર્તુળ',
    star: 'તારો',
    rectangle: 'લંબચોરસ',
    triangle: 'ત્રિકોણ',
    polygon: 'બહુકોણ',
    ellipse: 'લંબવર્તુળ',
    path: 'માર્ગ',
    line: 'રેખા',
    arc: 'ચાપ',
  },

  relationTypes: {
    orbits: 'પરિભ્રમણ',
    follows: 'અનુસરે',
    attached_to: 'જોડાયેલ',
    maintains_distance: 'અંતર જાળવે',
    points_at: 'નિર્દેશ કરે',
    mirrors: 'પ્રતિબિંબિત',
    parallax: 'પેરેલેક્સ',
    bounds_to: 'મર્યાદિત',
  },

  animationTypes: {
    pulse: 'ધબકારો',
    rotate: 'ફેરવવું',
    bounce: 'ઉછાળ',
    fade: 'ઝાંખું',
    wobble: 'ડોલવું',
    slide: 'સરકવું',
    typewriter: 'ટાઇપરાઇટર',
  },

  generators: {
    drawSunburst: 'સૂર્યકિરણ',
    drawSunsetScene: 'સૂર્યાસ્ત દૃશ્ય',
    drawGrid: 'ગ્રિડ',
    drawStackedCircles: 'સ્ટેક કરેલા વર્તુળો',
    drawCircuit: 'સર્કિટ બોર્ડ',
    drawWaves: 'તરંગો',
    drawPattern: 'પેટર્ન',
  },

  common: {
    at: 'પર',
    with: 'સાથે',
    to: 'ને',
    from: 'થી',
    position: 'સ્થાન',
    radius: 'ત્રિજ્યા',
    color: 'રંગ',
    speed: 'ઝડપ',
    duration: 'અવધિ',
  },
});

export default gu;
