/**
 * French Translations
 */

import { createBaseTranslation } from './base.js';

export const fr = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Créer un élément', description: '' },
    pinepaper_modify_item: { name: 'Modifier un élément', description: '' },
    pinepaper_delete_item: { name: 'Supprimer un élément', description: '' },
    pinepaper_add_relation: { name: 'Ajouter une relation', description: '' },
    pinepaper_remove_relation: { name: 'Supprimer une relation', description: '' },
    pinepaper_query_relations: { name: 'Interroger les relations', description: '' },
    pinepaper_animate: { name: 'Animer', description: '' },
    pinepaper_keyframe_animate: { name: 'Animation par images-clés', description: '' },
    pinepaper_play_timeline: { name: 'Lire la timeline', description: '' },
    pinepaper_execute_generator: { name: 'Exécuter le générateur', description: '' },
    pinepaper_list_generators: { name: 'Lister les générateurs', description: '' },
    pinepaper_apply_effect: { name: 'Appliquer un effet', description: '' },
    pinepaper_get_items: { name: 'Obtenir les éléments', description: '' },
    pinepaper_get_relation_stats: { name: 'Statistiques des relations', description: '' },
    pinepaper_set_background_color: { name: 'Définir la couleur de fond', description: '' },
    pinepaper_set_canvas_size: { name: 'Définir la taille du canevas', description: '' },
    pinepaper_export_svg: { name: 'Exporter en SVG', description: '' },
    pinepaper_export_training_data: { name: 'Exporter les données d\'entraînement', description: '' },

    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'Créer une forme de diagramme',
      description: `Créer une forme de diagramme spécialisée pour organigrammes, diagrammes UML, diagrammes réseau et dessins techniques. Types : flowchart (process, decision, terminal, data, document, database), UML (uml-class, uml-usecase, uml-actor), network (cloud, server), basic (rectangle, circle, triangle, star).`
    },
    pinepaper_connect: {
      name: 'Connecter les éléments',
      description: `Connecter deux éléments avec un connecteur intelligent. Utilisez pour relier des formes de diagramme avec des flèches ou lignes. Types de routage : orthogonal (angles droits), direct (ligne droite), curved (courbe de Bézier).`
    },
    pinepaper_connect_ports: {
      name: 'Connecter les ports',
      description: `Connecter deux ports spécifiques sur des éléments. Utilisez pour contrôler précisément quel côté de la forme le connecteur s'attache. Idéal pour diagrammes complexes nécessitant des points d'entrée/sortie spécifiques.`
    },
    pinepaper_add_ports: {
      name: 'Ajouter des ports',
      description: `Ajouter des ports de connexion à un élément existant. Les ports sont des points d'ancrage où les connecteurs peuvent s'attacher. Utilisez pour créer des positions de port personnalisées ou activer les connexions sur des éléments.`
    },
    pinepaper_auto_layout: {
      name: 'Mise en page automatique',
      description: `Organiser automatiquement les éléments du diagramme selon un algorithme. Types : hierarchical (organigrammes), force-directed (diagrammes réseau), tree (hiérarchies), radial (cartes mentales), grid (éléments d'importance égale).`
    },
    pinepaper_get_diagram_shapes: {
      name: 'Obtenir les formes de diagramme',
      description: `Obtenir la liste des formes de diagramme disponibles avec leurs propriétés. Utilisez pour voir les formes disponibles, leurs tailles par défaut et options de style. Filtre par catégorie : flowchart, uml, network, basic.`
    },
    pinepaper_update_connector: {
      name: 'Mettre à jour le connecteur',
      description: `Mettre à jour le style ou l'étiquette d'un connecteur existant. Utilisez pour modifier l'apparence du connecteur, changer les couleurs, les styles de flèche ou mettre à jour les étiquettes après création.`
    },
    pinepaper_remove_connector: {
      name: 'Supprimer le connecteur',
      description: `Supprimer un connecteur du canevas. Utilisez pour supprimer une connexion entre éléments, retirer des liens incorrects ou restructurer les connexions du diagramme.`
    },
    pinepaper_diagram_mode: {
      name: 'Mode diagramme',
      description: `Contrôler le mode diagramme pour l'édition interactive. Actions : activate (activer le mode diagramme), deactivate (retour au mode canevas normal), toggle (basculer entre modes), setMode (définir un mode d'outil spécifique).`
    },
  },

  errors: {
    itemNotFound: 'Élément non trouvé : {{itemId}}',
    invalidRelation: 'Relation invalide : {{relationType}}',
    invalidParams: 'Paramètres invalides : {{details}}',
    generatorNotFound: 'Générateur non trouvé : {{generatorName}}',
    exportFailed: 'Échec de l\'exportation : {{reason}}',
    executionError: 'Erreur d\'exécution : {{message}}',
    validationError: 'Erreur de validation : {{message}}',
    unknownTool: 'Outil inconnu : {{toolName}}',
    apiKeyRequired: 'Clé API requise',
    apiKeyInvalid: 'Clé API invalide',
    apiKeyExpired: 'Clé API expirée',
    rateLimitExceeded: 'Limite de requêtes dépassée. Réessayez dans {{seconds}} secondes.',
  },

  success: {
    itemCreated: '{{itemType}} créé à la position ({{x}}, {{y}})',
    itemModified: 'Élément {{itemId}} modifié',
    itemDeleted: 'Élément {{itemId}} supprimé',
    relationAdded: 'Relation {{relationType}} ajoutée : {{sourceId}} → {{targetId}}',
    relationRemoved: 'Relation supprimée entre {{sourceId}} et {{targetId}}',
    animationApplied: 'Animation {{animationType}} appliquée à {{itemId}}',
    generatorExecuted: 'Générateur {{generatorName}} exécuté',
    effectApplied: 'Effet {{effectType}} appliqué à {{itemId}}',
    backgroundSet: 'Couleur de fond définie sur {{color}}',
    canvasSizeSet: 'Taille du canevas définie sur {{width}}×{{height}}',
    exported: '{{format}} exporté avec succès',
  },

  itemTypes: {
    text: 'Texte',
    circle: 'Cercle',
    star: 'Étoile',
    rectangle: 'Rectangle',
    triangle: 'Triangle',
    polygon: 'Polygone',
    ellipse: 'Ellipse',
    path: 'Chemin',
    line: 'Ligne',
    arc: 'Arc',
  },

  relationTypes: {
    orbits: 'Orbite',
    follows: 'Suit',
    attached_to: 'Attaché à',
    maintains_distance: 'Maintient la distance',
    points_at: 'Pointe vers',
    mirrors: 'Reflète',
    parallax: 'Parallaxe',
    bounds_to: 'Limité à',
  },

  animationTypes: {
    pulse: 'Pulsation',
    rotate: 'Rotation',
    bounce: 'Rebond',
    fade: 'Fondu',
    wobble: 'Oscillation',
    slide: 'Glissement',
    typewriter: 'Machine à écrire',
  },

  generators: {
    drawSunburst: 'Rayons de soleil',
    drawSunsetScene: 'Scène de coucher de soleil',
    drawGrid: 'Grille',
    drawStackedCircles: 'Cercles empilés',
    drawCircuit: 'Circuit',
    drawWaves: 'Vagues',
    drawPattern: 'Motif',
  },

  common: {
    at: 'à',
    with: 'avec',
    to: 'vers',
    from: 'de',
    position: 'position',
    radius: 'rayon',
    color: 'couleur',
    speed: 'vitesse',
    duration: 'durée',
  },
});

export default fr;
