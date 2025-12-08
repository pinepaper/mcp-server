/**
 * Telugu Translations
 */

import { createBaseTranslation } from './base.js';

export const te = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'అంశం సృష్టించు', description: '' },
    pinepaper_modify_item: { name: 'అంశం మార్చు', description: '' },
    pinepaper_delete_item: { name: 'అంశం తొలగించు', description: '' },
    pinepaper_add_relation: { name: 'సంబంధం జోడించు', description: '' },
    pinepaper_remove_relation: { name: 'సంబంధం తొలగించు', description: '' },
    pinepaper_query_relations: { name: 'సంబంధాలు ప్రశ్నించు', description: '' },
    pinepaper_animate: { name: 'యానిమేట్ చేయి', description: '' },
    pinepaper_keyframe_animate: { name: 'కీఫ్రేమ్ యానిమేషన్', description: '' },
    pinepaper_play_timeline: { name: 'టైమ్‌లైన్ ప్లే చేయి', description: '' },
    pinepaper_execute_generator: { name: 'జనరేటర్ అమలు చేయి', description: '' },
    pinepaper_list_generators: { name: 'జనరేటర్ల జాబితా', description: '' },
    pinepaper_apply_effect: { name: 'ఎఫెక్ట్ వర్తింపజేయి', description: '' },
    pinepaper_get_items: { name: 'అంశాలు పొందు', description: '' },
    pinepaper_get_relation_stats: { name: 'సంబంధ గణాంకాలు', description: '' },
    pinepaper_set_background_color: { name: 'నేపథ్య రంగు సెట్ చేయి', description: '' },
    pinepaper_set_canvas_size: { name: 'కాన్వాస్ పరిమాణం సెట్ చేయి', description: '' },
    pinepaper_export_svg: { name: 'SVG ఎగుమతి చేయి', description: '' },
    pinepaper_export_training_data: { name: 'శిక్షణ డేటా ఎగుమతి చేయి', description: '' },
  },

  errors: {
    itemNotFound: 'అంశం కనుగొనబడలేదు: {{itemId}}',
    invalidRelation: 'చెల్లని సంబంధం: {{relationType}}',
    invalidParams: 'చెల్లని పారామీటర్లు: {{details}}',
    generatorNotFound: 'జనరేటర్ కనుగొనబడలేదు: {{generatorName}}',
    exportFailed: 'ఎగుమతి విఫలమైంది: {{reason}}',
    executionError: 'అమలు లోపం: {{message}}',
    validationError: 'ధృవీకరణ లోపం: {{message}}',
    unknownTool: 'తెలియని సాధనం: {{toolName}}',
    apiKeyRequired: 'API కీ అవసరం',
    apiKeyInvalid: 'చెల్లని API కీ',
    apiKeyExpired: 'API కీ గడువు ముగిసింది',
    rateLimitExceeded: 'అభ్యర్థన పరిమితి మించిపోయింది. {{seconds}} సెకన్ల తర్వాత మళ్ళీ ప్రయత్నించండి.',
  },

  success: {
    itemCreated: '{{itemType}} స్థానంలో ({{x}}, {{y}}) సృష్టించబడింది',
    itemModified: 'అంశం {{itemId}} మార్చబడింది',
    itemDeleted: 'అంశం {{itemId}} తొలగించబడింది',
    relationAdded: '{{relationType}} సంబంధం జోడించబడింది: {{sourceId}} → {{targetId}}',
    relationRemoved: '{{sourceId}} మరియు {{targetId}} మధ్య సంబంధం తొలగించబడింది',
    animationApplied: '{{itemId}} కు {{animationType}} యానిమేషన్ వర్తింపజేయబడింది',
    generatorExecuted: '{{generatorName}} జనరేటర్ అమలు చేయబడింది',
    effectApplied: '{{itemId}} కు {{effectType}} ఎఫెక్ట్ వర్తింపజేయబడింది',
    backgroundSet: 'నేపథ్య రంగు {{color}} కు సెట్ చేయబడింది',
    canvasSizeSet: 'కాన్వాస్ పరిమాణం {{width}}×{{height}} కు సెట్ చేయబడింది',
    exported: '{{format}} విజయవంతంగా ఎగుమతి చేయబడింది',
  },

  itemTypes: {
    text: 'టెక్స్ట్',
    circle: 'వృత్తం',
    star: 'నక్షత్రం',
    rectangle: 'దీర్ఘచతురస్రం',
    triangle: 'త్రిభుజం',
    polygon: 'బహుభుజి',
    ellipse: 'దీర్ఘవృత్తం',
    path: 'మార్గం',
    line: 'రేఖ',
    arc: 'చాపం',
  },

  relationTypes: {
    orbits: 'పరిభ్రమణం',
    follows: 'అనుసరణ',
    attached_to: 'జోడించబడింది',
    maintains_distance: 'దూరం నిర్వహిస్తుంది',
    points_at: 'సూచిస్తుంది',
    mirrors: 'ప్రతిబింబిస్తుంది',
    parallax: 'పారలాక్స్',
    bounds_to: 'పరిమితం',
  },

  animationTypes: {
    pulse: 'స్పందన',
    rotate: 'భ్రమణం',
    bounce: 'బౌన్స్',
    fade: 'మసకబారు',
    wobble: 'ఊగిసలాట',
    slide: 'జారు',
    typewriter: 'టైప్‌రైటర్',
  },

  generators: {
    drawSunburst: 'సూర్య కిరణాలు',
    drawSunsetScene: 'సూర్యాస్తమయ దృశ్యం',
    drawGrid: 'గ్రిడ్',
    drawStackedCircles: 'అమర్చిన వృత్తాలు',
    drawCircuit: 'సర్క్యూట్ బోర్డ్',
    drawWaves: 'అలలు',
    drawPattern: 'నమూనా',
  },

  common: {
    at: 'వద్ద',
    with: 'తో',
    to: 'కు',
    from: 'నుండి',
    position: 'స్థానం',
    radius: 'వ్యాసార్థం',
    color: 'రంగు',
    speed: 'వేగం',
    duration: 'వ్యవధి',
  },
});

export default te;
