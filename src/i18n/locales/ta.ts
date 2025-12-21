/**
 * Tamil Translations
 */

import { createBaseTranslation } from './base.js';

export const ta = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'உருப்படியை உருவாக்கு', description: '' },
    pinepaper_modify_item: { name: 'உருப்படியை மாற்று', description: '' },
    pinepaper_delete_item: { name: 'உருப்படியை நீக்கு', description: '' },
    pinepaper_add_relation: { name: 'உறவை சேர்', description: '' },
    pinepaper_remove_relation: { name: 'உறவை நீக்கு', description: '' },
    pinepaper_query_relations: { name: 'உறவுகளை வினவு', description: '' },
    pinepaper_animate: { name: 'அசைவூட்டு', description: '' },
    pinepaper_keyframe_animate: { name: 'கீஃப்ரேம் அசைவூட்டம்', description: '' },
    pinepaper_play_timeline: { name: 'காலவரிசையை இயக்கு', description: '' },
    pinepaper_execute_generator: { name: 'ஜெனரேட்டரை இயக்கு', description: '' },
    pinepaper_list_generators: { name: 'ஜெனரேட்டர் பட்டியல்', description: '' },
    pinepaper_apply_effect: { name: 'விளைவை பயன்படுத்து', description: '' },
    pinepaper_get_items: { name: 'உருப்படிகளை பெறு', description: '' },
    pinepaper_get_relation_stats: { name: 'உறவு புள்ளிவிவரங்கள்', description: '' },
    pinepaper_set_background_color: { name: 'பின்னணி நிறம் அமை', description: '' },
    pinepaper_set_canvas_size: { name: 'கேன்வாஸ் அளவு அமை', description: '' },
    pinepaper_export_svg: { name: 'SVG ஏற்றுமதி', description: '' },
    pinepaper_export_training_data: { name: 'பயிற்சி தரவை ஏற்றுமதி செய்', description: '' },
    // Diagram Tools
    pinepaper_create_diagram_shape: { name: 'வரைபட வடிவத்தை உருவாக்கு', description: '' },
    pinepaper_connect: { name: 'உருப்படிகளை இணை', description: '' },
    pinepaper_connect_ports: { name: 'போர்ட்களை இணை', description: '' },
    pinepaper_add_ports: { name: 'போர்ட்களை சேர்', description: '' },
    pinepaper_auto_layout: { name: 'தானியங்கி அமைப்பு', description: '' },
    pinepaper_get_diagram_shapes: { name: 'வரைபட வடிவங்களைப் பெறு', description: '' },
    pinepaper_update_connector: { name: 'இணைப்பியை புதுப்பி', description: '' },
    pinepaper_remove_connector: { name: 'இணைப்பியை அகற்று', description: '' },
    pinepaper_diagram_mode: { name: 'வரைபட பயன்முறை', description: '' },
  },

  errors: {
    itemNotFound: 'உருப்படி கிடைக்கவில்லை: {{itemId}}',
    invalidRelation: 'தவறான உறவு: {{relationType}}',
    invalidParams: 'தவறான அளவுருக்கள்: {{details}}',
    generatorNotFound: 'ஜெனரேட்டர் கிடைக்கவில்லை: {{generatorName}}',
    exportFailed: 'ஏற்றுமதி தோல்வி: {{reason}}',
    executionError: 'செயல்படுத்தல் பிழை: {{message}}',
    validationError: 'சரிபார்ப்பு பிழை: {{message}}',
    unknownTool: 'அறியப்படாத கருவி: {{toolName}}',
    apiKeyRequired: 'API விசை தேவை',
    apiKeyInvalid: 'தவறான API விசை',
    apiKeyExpired: 'API விசை காலாவதியானது',
    rateLimitExceeded: 'கோரிக்கை வரம்பு மீறப்பட்டது. {{seconds}} வினாடிகளில் மீண்டும் முயற்சிக்கவும்.',
  },

  success: {
    itemCreated: '{{itemType}} நிலையில் ({{x}}, {{y}}) உருவாக்கப்பட்டது',
    itemModified: 'உருப்படி {{itemId}} மாற்றப்பட்டது',
    itemDeleted: 'உருப்படி {{itemId}} நீக்கப்பட்டது',
    relationAdded: '{{relationType}} உறவு சேர்க்கப்பட்டது: {{sourceId}} → {{targetId}}',
    relationRemoved: '{{sourceId}} மற்றும் {{targetId}} இடையே உறவு நீக்கப்பட்டது',
    animationApplied: '{{itemId}} க்கு {{animationType}} அசைவூட்டம் பயன்படுத்தப்பட்டது',
    generatorExecuted: '{{generatorName}} ஜெனரேட்டர் இயக்கப்பட்டது',
    effectApplied: '{{itemId}} க்கு {{effectType}} விளைவு பயன்படுத்தப்பட்டது',
    backgroundSet: 'பின்னணி நிறம் {{color}} ஆக அமைக்கப்பட்டது',
    canvasSizeSet: 'கேன்வாஸ் அளவு {{width}}×{{height}} ஆக அமைக்கப்பட்டது',
    exported: '{{format}} வெற்றிகரமாக ஏற்றுமதி செய்யப்பட்டது',
  },

  itemTypes: {
    text: 'உரை',
    circle: 'வட்டம்',
    star: 'நட்சத்திரம்',
    rectangle: 'செவ்வகம்',
    triangle: 'முக்கோணம்',
    polygon: 'பலகோணம்',
    ellipse: 'நீள்வட்டம்',
    path: 'பாதை',
    line: 'கோடு',
    arc: 'வில்',
  },

  relationTypes: {
    orbits: 'சுற்றுகிறது',
    follows: 'பின்தொடர்கிறது',
    attached_to: 'இணைக்கப்பட்டுள்ளது',
    maintains_distance: 'தூரத்தை பராமரிக்கிறது',
    points_at: 'சுட்டிக்காட்டுகிறது',
    mirrors: 'பிரதிபலிக்கிறது',
    parallax: 'பாரலாக்ஸ்',
    bounds_to: 'வரம்பிடப்பட்டுள்ளது',
  },

  animationTypes: {
    pulse: 'துடிப்பு',
    rotate: 'சுழற்சி',
    bounce: 'குதிப்பு',
    fade: 'மறைவு',
    wobble: 'ஆடுதல்',
    slide: 'நழுவுதல்',
    typewriter: 'தட்டச்சு இயந்திரம்',
  },

  generators: {
    drawSunburst: 'சூரிய கதிர்கள்',
    drawSunsetScene: 'சூரியாஸ்தமன காட்சி',
    drawGrid: 'கட்டம்',
    drawStackedCircles: 'அடுக்கப்பட்ட வட்டங்கள்',
    drawCircuit: 'சர்க்யூட் போர்டு',
    drawWaves: 'அலைகள்',
    drawPattern: 'வடிவமைப்பு',
  },

  common: {
    at: 'இல்',
    with: 'உடன்',
    to: 'க்கு',
    from: 'இருந்து',
    position: 'நிலை',
    radius: 'ஆரம்',
    color: 'நிறம்',
    speed: 'வேகம்',
    duration: 'காலம்',
  },
});

export default ta;
