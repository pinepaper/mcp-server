/**
 * Greek Translations
 */

import { createBaseTranslation } from './base.js';

export const el = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Δημιουργία στοιχείου', description: '' },
    pinepaper_modify_item: { name: 'Τροποποίηση στοιχείου', description: '' },
    pinepaper_delete_item: { name: 'Διαγραφή στοιχείου', description: '' },
    pinepaper_add_relation: { name: 'Προσθήκη σχέσης', description: '' },
    pinepaper_remove_relation: { name: 'Αφαίρεση σχέσης', description: '' },
    pinepaper_query_relations: { name: 'Ερώτημα σχέσεων', description: '' },
    pinepaper_animate: { name: 'Κίνηση', description: '' },
    pinepaper_keyframe_animate: { name: 'Κίνηση με καρέ-κλειδιά', description: '' },
    pinepaper_play_timeline: { name: 'Αναπαραγωγή χρονολογίου', description: '' },
    pinepaper_execute_generator: { name: 'Εκτέλεση γεννήτριας', description: '' },
    pinepaper_list_generators: { name: 'Λίστα γεννητριών', description: '' },
    pinepaper_apply_effect: { name: 'Εφαρμογή εφέ', description: '' },
    pinepaper_get_items: { name: 'Λήψη στοιχείων', description: '' },
    pinepaper_get_relation_stats: { name: 'Στατιστικά σχέσεων', description: '' },
    pinepaper_set_background_color: { name: 'Ορισμός χρώματος φόντου', description: '' },
    pinepaper_set_canvas_size: { name: 'Ορισμός μεγέθους καμβά', description: '' },
    pinepaper_export_svg: { name: 'Εξαγωγή SVG', description: '' },
    pinepaper_export_training_data: { name: 'Εξαγωγή δεδομένων εκπαίδευσης', description: '' },
    // Diagram Tools
    pinepaper_create_diagram_shape: { name: 'Δημιουργία σχήματος διαγράμματος', description: '' },
    pinepaper_connect: { name: 'Σύνδεση στοιχείων', description: '' },
    pinepaper_connect_ports: { name: 'Σύνδεση θυρών', description: '' },
    pinepaper_add_ports: { name: 'Προσθήκη θυρών', description: '' },
    pinepaper_auto_layout: { name: 'Αυτόματη διάταξη', description: '' },
    pinepaper_get_diagram_shapes: { name: 'Λήψη σχημάτων διαγράμματος', description: '' },
    pinepaper_update_connector: { name: 'Ενημέρωση συνδέσμου', description: '' },
    pinepaper_remove_connector: { name: 'Αφαίρεση συνδέσμου', description: '' },
    pinepaper_diagram_mode: { name: 'Λειτουργία διαγράμματος', description: '' },
  },

  errors: {
    itemNotFound: 'Το στοιχείο δεν βρέθηκε: {{itemId}}',
    invalidRelation: 'Μη έγκυρη σχέση: {{relationType}}',
    invalidParams: 'Μη έγκυρες παράμετροι: {{details}}',
    generatorNotFound: 'Η γεννήτρια δεν βρέθηκε: {{generatorName}}',
    exportFailed: 'Η εξαγωγή απέτυχε: {{reason}}',
    executionError: 'Σφάλμα εκτέλεσης: {{message}}',
    validationError: 'Σφάλμα επικύρωσης: {{message}}',
    unknownTool: 'Άγνωστο εργαλείο: {{toolName}}',
    apiKeyRequired: 'Απαιτείται κλειδί API',
    apiKeyInvalid: 'Μη έγκυρο κλειδί API',
    apiKeyExpired: 'Το κλειδί API έληξε',
    rateLimitExceeded: 'Υπέρβαση ορίου αιτημάτων. Δοκιμάστε ξανά σε {{seconds}} δευτερόλεπτα.',
  },

  success: {
    itemCreated: '{{itemType}} δημιουργήθηκε στη θέση ({{x}}, {{y}})',
    itemModified: 'Το στοιχείο {{itemId}} τροποποιήθηκε',
    itemDeleted: 'Το στοιχείο {{itemId}} διαγράφηκε',
    relationAdded: 'Προστέθηκε σχέση {{relationType}}: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Αφαιρέθηκε η σχέση μεταξύ {{sourceId}} και {{targetId}}',
    animationApplied: 'Εφαρμόστηκε κίνηση {{animationType}} στο {{itemId}}',
    generatorExecuted: 'Η γεννήτρια {{generatorName}} εκτελέστηκε',
    effectApplied: 'Εφαρμόστηκε εφέ {{effectType}} στο {{itemId}}',
    backgroundSet: 'Το χρώμα φόντου ορίστηκε σε {{color}}',
    canvasSizeSet: 'Το μέγεθος καμβά ορίστηκε σε {{width}}×{{height}}',
    exported: '{{format}} εξήχθη επιτυχώς',
  },

  itemTypes: {
    text: 'Κείμενο',
    circle: 'Κύκλος',
    star: 'Αστέρι',
    rectangle: 'Ορθογώνιο',
    triangle: 'Τρίγωνο',
    polygon: 'Πολύγωνο',
    ellipse: 'Έλλειψη',
    path: 'Διαδρομή',
    line: 'Γραμμή',
    arc: 'Τόξο',
  },

  relationTypes: {
    orbits: 'Περιστρέφεται',
    follows: 'Ακολουθεί',
    attached_to: 'Συνδεδεμένο με',
    maintains_distance: 'Διατηρεί απόσταση',
    points_at: 'Δείχνει προς',
    mirrors: 'Αντικατοπτρίζει',
    parallax: 'Παράλλαξη',
    bounds_to: 'Περιορισμένο σε',
  },

  animationTypes: {
    pulse: 'Παλμός',
    rotate: 'Περιστροφή',
    bounce: 'Αναπήδηση',
    fade: 'Σβήσιμο',
    wobble: 'Ταλάντευση',
    slide: 'Ολίσθηση',
    typewriter: 'Γραφομηχανή',
  },

  generators: {
    drawSunburst: 'Ηλιακές ακτίνες',
    drawSunsetScene: 'Σκηνή ηλιοβασιλέματος',
    drawGrid: 'Πλέγμα',
    drawStackedCircles: 'Στοιβαγμένοι κύκλοι',
    drawCircuit: 'Πλακέτα κυκλώματος',
    drawWaves: 'Κύματα',
    drawPattern: 'Μοτίβο',
  },

  common: {
    at: 'στο',
    with: 'με',
    to: 'προς',
    from: 'από',
    position: 'θέση',
    radius: 'ακτίνα',
    color: 'χρώμα',
    speed: 'ταχύτητα',
    duration: 'διάρκεια',
  },
});

export default el;
