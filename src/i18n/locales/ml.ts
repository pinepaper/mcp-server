/**
 * Malayalam Translations
 */

import { createBaseTranslation } from './base.js';

export const ml = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'ഇനം സൃഷ്ടിക്കുക', description: '' },
    pinepaper_modify_item: { name: 'ഇനം പരിഷ്കരിക്കുക', description: '' },
    pinepaper_delete_item: { name: 'ഇനം ഇല്ലാതാക്കുക', description: '' },
    pinepaper_add_relation: { name: 'ബന്ധം ചേർക്കുക', description: '' },
    pinepaper_remove_relation: { name: 'ബന്ധം നീക്കം ചെയ്യുക', description: '' },
    pinepaper_query_relations: { name: 'ബന്ധങ്ങൾ അന്വേഷിക്കുക', description: '' },
    pinepaper_animate: { name: 'ആനിമേറ്റ് ചെയ്യുക', description: '' },
    pinepaper_keyframe_animate: { name: 'കീഫ്രെയിം ആനിമേഷൻ', description: '' },
    pinepaper_play_timeline: { name: 'ടൈംലൈൻ പ്ലേ ചെയ്യുക', description: '' },
    pinepaper_execute_generator: { name: 'ജനറേറ്റർ പ്രവർത്തിപ്പിക്കുക', description: '' },
    pinepaper_list_generators: { name: 'ജനറേറ്റർ ലിസ്റ്റ്', description: '' },
    pinepaper_apply_effect: { name: 'ഇഫക്ട് പ്രയോഗിക്കുക', description: '' },
    pinepaper_get_items: { name: 'ഇനങ്ങൾ നേടുക', description: '' },
    pinepaper_get_relation_stats: { name: 'ബന്ധ സ്ഥിതിവിവരക്കണക്കുകൾ', description: '' },
    pinepaper_set_background_color: { name: 'പശ്ചാത്തല നിറം സജ്ജമാക്കുക', description: '' },
    pinepaper_set_canvas_size: { name: 'ക്യാൻവാസ് വലുപ്പം സജ്ജമാക്കുക', description: '' },
    pinepaper_export_svg: { name: 'SVG എക്സ്പോർട്ട് ചെയ്യുക', description: '' },
    pinepaper_export_training_data: { name: 'പരിശീലന ഡാറ്റ എക്സ്പോർട്ട് ചെയ്യുക', description: '' },
  },

  errors: {
    itemNotFound: 'ഇനം കണ്ടെത്തിയില്ല: {{itemId}}',
    invalidRelation: 'അസാധുവായ ബന്ധം: {{relationType}}',
    invalidParams: 'അസാധുവായ പാരാമീറ്ററുകൾ: {{details}}',
    generatorNotFound: 'ജനറേറ്റർ കണ്ടെത്തിയില്ല: {{generatorName}}',
    exportFailed: 'എക്സ്പോർട്ട് പരാജയപ്പെട്ടു: {{reason}}',
    executionError: 'എക്സിക്യൂഷൻ പിശക്: {{message}}',
    validationError: 'മൂല്യനിർണ്ണയ പിശക്: {{message}}',
    unknownTool: 'അജ്ഞാത ടൂൾ: {{toolName}}',
    apiKeyRequired: 'API കീ ആവശ്യമാണ്',
    apiKeyInvalid: 'അസാധുവായ API കീ',
    apiKeyExpired: 'API കീ കാലഹരണപ്പെട്ടു',
    rateLimitExceeded: 'അഭ്യർത്ഥന പരിധി കവിഞ്ഞു. {{seconds}} സെക്കൻഡ് കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക.',
  },

  success: {
    itemCreated: '{{itemType}} സ്ഥാനത്ത് ({{x}}, {{y}}) സൃഷ്ടിച്ചു',
    itemModified: 'ഇനം {{itemId}} പരിഷ്കരിച്ചു',
    itemDeleted: 'ഇനം {{itemId}} ഇല്ലാതാക്കി',
    relationAdded: '{{relationType}} ബന്ധം ചേർത്തു: {{sourceId}} → {{targetId}}',
    relationRemoved: '{{sourceId}}, {{targetId}} എന്നിവ തമ്മിലുള്ള ബന്ധം നീക്കം ചെയ്തു',
    animationApplied: '{{itemId}}-ൽ {{animationType}} ആനിമേഷൻ പ്രയോഗിച്ചു',
    generatorExecuted: '{{generatorName}} ജനറേറ്റർ പ്രവർത്തിപ്പിച്ചു',
    effectApplied: '{{itemId}}-ൽ {{effectType}} ഇഫക്ട് പ്രയോഗിച്ചു',
    backgroundSet: 'പശ്ചാത്തല നിറം {{color}}-ലേക്ക് സജ്ജമാക്കി',
    canvasSizeSet: 'ക്യാൻവാസ് വലുപ്പം {{width}}×{{height}}-ലേക്ക് സജ്ജമാക്കി',
    exported: '{{format}} വിജയകരമായി എക്സ്പോർട്ട് ചെയ്തു',
  },

  itemTypes: {
    text: 'വാചകം',
    circle: 'വൃത്തം',
    star: 'നക്ഷത്രം',
    rectangle: 'ദീർഘചതുരം',
    triangle: 'ത്രികോണം',
    polygon: 'ബഹുഭുജം',
    ellipse: 'ദീർഘവൃത്തം',
    path: 'പാത',
    line: 'രേഖ',
    arc: 'ചാപം',
  },

  relationTypes: {
    orbits: 'ഭ്രമണം',
    follows: 'പിന്തുടരുന്നു',
    attached_to: 'ഘടിപ്പിച്ചിരിക്കുന്നു',
    maintains_distance: 'ദൂരം നിലനിർത്തുന്നു',
    points_at: 'ചൂണ്ടുന്നു',
    mirrors: 'പ്രതിഫലിപ്പിക്കുന്നു',
    parallax: 'പാരലാക്സ്',
    bounds_to: 'പരിമിതം',
  },

  animationTypes: {
    pulse: 'സ്പന്ദനം',
    rotate: 'ഭ്രമണം',
    bounce: 'ബൗൺസ്',
    fade: 'മങ്ങൽ',
    wobble: 'ആന്ദോളനം',
    slide: 'സ്ലൈഡ്',
    typewriter: 'ടൈപ്പ്റൈറ്റർ',
  },

  generators: {
    drawSunburst: 'സൂര്യകിരണങ്ങൾ',
    drawSunsetScene: 'സൂര്യാസ്തമയ രംഗം',
    drawGrid: 'ഗ്രിഡ്',
    drawStackedCircles: 'അടുക്കിയ വൃത്തങ്ങൾ',
    drawCircuit: 'സർക്യൂട്ട് ബോർഡ്',
    drawWaves: 'തിരമാലകൾ',
    drawPattern: 'പാറ്റേൺ',
  },

  common: {
    at: 'ൽ',
    with: 'ഉടൻ',
    to: 'ലേക്ക്',
    from: 'ൽ നിന്ന്',
    position: 'സ്ഥാനം',
    radius: 'ആരം',
    color: 'നിറം',
    speed: 'വേഗത',
    duration: 'ദൈർഘ്യം',
  },
});

export default ml;
