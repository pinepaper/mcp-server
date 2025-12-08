/**
 * Bengali Translations
 */

import { createBaseTranslation } from './base.js';

export const bn = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'আইটেম তৈরি করুন', description: '' },
    pinepaper_modify_item: { name: 'আইটেম পরিবর্তন করুন', description: '' },
    pinepaper_delete_item: { name: 'আইটেম মুছুন', description: '' },
    pinepaper_add_relation: { name: 'সম্পর্ক যোগ করুন', description: '' },
    pinepaper_remove_relation: { name: 'সম্পর্ক সরান', description: '' },
    pinepaper_query_relations: { name: 'সম্পর্ক জিজ্ঞাসা করুন', description: '' },
    pinepaper_animate: { name: 'অ্যানিমেট করুন', description: '' },
    pinepaper_keyframe_animate: { name: 'কীফ্রেম অ্যানিমেশন', description: '' },
    pinepaper_play_timeline: { name: 'টাইমলাইন চালান', description: '' },
    pinepaper_execute_generator: { name: 'জেনারেটর চালান', description: '' },
    pinepaper_list_generators: { name: 'জেনারেটর তালিকা', description: '' },
    pinepaper_apply_effect: { name: 'ইফেক্ট প্রয়োগ করুন', description: '' },
    pinepaper_get_items: { name: 'আইটেম পান', description: '' },
    pinepaper_get_relation_stats: { name: 'সম্পর্ক পরিসংখ্যান', description: '' },
    pinepaper_set_background_color: { name: 'ব্যাকগ্রাউন্ড রঙ সেট করুন', description: '' },
    pinepaper_set_canvas_size: { name: 'ক্যানভাস আকার সেট করুন', description: '' },
    pinepaper_export_svg: { name: 'SVG এক্সপোর্ট করুন', description: '' },
    pinepaper_export_training_data: { name: 'ট্রেনিং ডেটা এক্সপোর্ট করুন', description: '' },
  },

  errors: {
    itemNotFound: 'আইটেম পাওয়া যায়নি: {{itemId}}',
    invalidRelation: 'অবৈধ সম্পর্ক: {{relationType}}',
    invalidParams: 'অবৈধ প্যারামিটার: {{details}}',
    generatorNotFound: 'জেনারেটর পাওয়া যায়নি: {{generatorName}}',
    exportFailed: 'এক্সপোর্ট ব্যর্থ: {{reason}}',
    executionError: 'এক্সিকিউশন ত্রুটি: {{message}}',
    validationError: 'ভ্যালিডেশন ত্রুটি: {{message}}',
    unknownTool: 'অজানা টুল: {{toolName}}',
    apiKeyRequired: 'API কী প্রয়োজন',
    apiKeyInvalid: 'অবৈধ API কী',
    apiKeyExpired: 'API কী মেয়াদোত্তীর্ণ',
    rateLimitExceeded: 'অনুরোধ সীমা অতিক্রম করেছে। {{seconds}} সেকেন্ড পরে আবার চেষ্টা করুন।',
  },

  success: {
    itemCreated: '{{itemType}} অবস্থানে ({{x}}, {{y}}) তৈরি হয়েছে',
    itemModified: 'আইটেম {{itemId}} পরিবর্তিত হয়েছে',
    itemDeleted: 'আইটেম {{itemId}} মুছে ফেলা হয়েছে',
    relationAdded: '{{relationType}} সম্পর্ক যোগ হয়েছে: {{sourceId}} → {{targetId}}',
    relationRemoved: '{{sourceId}} এবং {{targetId}} এর মধ্যে সম্পর্ক সরানো হয়েছে',
    animationApplied: '{{itemId}} এ {{animationType}} অ্যানিমেশন প্রয়োগ করা হয়েছে',
    generatorExecuted: '{{generatorName}} জেনারেটর চালানো হয়েছে',
    effectApplied: '{{itemId}} এ {{effectType}} ইফেক্ট প্রয়োগ করা হয়েছে',
    backgroundSet: 'ব্যাকগ্রাউন্ড রঙ {{color}} এ সেট করা হয়েছে',
    canvasSizeSet: 'ক্যানভাস আকার {{width}}×{{height}} এ সেট করা হয়েছে',
    exported: '{{format}} সফলভাবে এক্সপোর্ট হয়েছে',
  },

  itemTypes: {
    text: 'টেক্সট',
    circle: 'বৃত্ত',
    star: 'তারা',
    rectangle: 'আয়তক্ষেত্র',
    triangle: 'ত্রিভুজ',
    polygon: 'বহুভুজ',
    ellipse: 'উপবৃত্ত',
    path: 'পথ',
    line: 'রেখা',
    arc: 'চাপ',
  },

  relationTypes: {
    orbits: 'প্রদক্ষিণ',
    follows: 'অনুসরণ',
    attached_to: 'সংযুক্ত',
    maintains_distance: 'দূরত্ব বজায় রাখে',
    points_at: 'নির্দেশ করে',
    mirrors: 'প্রতিফলন',
    parallax: 'প্যারালাক্স',
    bounds_to: 'সীমাবদ্ধ',
  },

  animationTypes: {
    pulse: 'স্পন্দন',
    rotate: 'ঘূর্ণন',
    bounce: 'বাউন্স',
    fade: 'ম্লান',
    wobble: 'দোলন',
    slide: 'স্লাইড',
    typewriter: 'টাইপরাইটার',
  },

  generators: {
    drawSunburst: 'সূর্যরশ্মি',
    drawSunsetScene: 'সূর্যাস্ত দৃশ্য',
    drawGrid: 'গ্রিড',
    drawStackedCircles: 'স্তুপীকৃত বৃত্ত',
    drawCircuit: 'সার্কিট বোর্ড',
    drawWaves: 'তরঙ্গ',
    drawPattern: 'প্যাটার্ন',
  },

  common: {
    at: 'এ',
    with: 'সাথে',
    to: 'তে',
    from: 'থেকে',
    position: 'অবস্থান',
    radius: 'ব্যাসার্ধ',
    color: 'রঙ',
    speed: 'গতি',
    duration: 'সময়কাল',
  },
});

export default bn;
