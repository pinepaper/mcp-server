/**
 * PP: VOCABULARY — Types, Edges, Math Functions, Patterns, Generators
 *
 * Ported from FxTool/js/ontology/Vocabulary.js to typed TypeScript.
 *
 * ## Directionality Convention
 * All binary edges read **source → target**: "source <verb> target".
 * Example: `app.addRelation(moonId, earthId, 'orbits')` → "moon orbits earth".
 *
 * ## Behavior Types
 * - **constraint**: Continuously enforced each frame (orbits, follows, attached_to…)
 * - **trigger**: Fire-and-forget or transient (indicates, grows_from, circumscribes)
 * - **procedural**: Expression/noise-driven, no target required (wiggle, time_expression, driven_by)
 *
 * ## MCP Tool References
 * Types and edges include `mcpTool` / `mcpToolRef` fields linking each vocabulary
 * entry to the MCP tool that creates or manipulates it.
 *
 * @module ontology/vocabulary
 * @version 0.4.0
 */

import type { PinePaperVocabulary } from './types.js';

// =============================================================================
// PP: VOCABULARY
// =============================================================================

export const PP_VOCABULARY: PinePaperVocabulary = {
  // --- Node Types (Canvas Primitives) ---
  types: {
    // Abstract hierarchy parents
    'pp:CanvasElement':  { anchor: 'schema:CreativeWork', description: 'Abstract canvas element', abstract: true },
    'pp:CanvasShape':    { anchor: null, description: 'Abstract shape element', abstract: true, parentType: 'pp:CanvasElement' },
    'pp:CanvasText':     { anchor: null, description: 'Abstract text element', abstract: true, parentType: 'pp:CanvasElement' },
    'pp:CanvasContainer':{ anchor: null, description: 'Abstract container element', abstract: true, parentType: 'pp:CanvasElement' },
    'pp:DiagramElement': { anchor: null, description: 'Abstract diagram element', abstract: true, parentType: 'pp:CanvasElement' },
    'pp:GeoElement':     { anchor: null, description: 'Abstract geographic element', abstract: true, parentType: 'pp:CanvasElement' },
    // Concrete types
    'pp:Template':      { anchor: 'schema:VisualArtwork', description: 'A motion graphics template' },
    'pp:Text':          { anchor: 'schema:CreativeWork',  description: 'Text element', parentType: 'pp:CanvasText', mcpTool: 'pinepaper_create_item' },
    'pp:Circle':        { anchor: null, description: 'Circle shape (geometrically: ellipse where rx=ry)', parentType: 'pp:CanvasShape', geometricSupertype: 'pp:Ellipse', mcpTool: 'pinepaper_create_item' },
    'pp:Rectangle':     { anchor: null, description: 'Rectangle shape', parentType: 'pp:CanvasShape', mcpTool: 'pinepaper_create_item' },
    'pp:Path':          { anchor: null, description: 'Vector path — semantically incomplete without open/closed distinction. Defined by its curveType (mathematical function family). Refined to OpenPath or ClosedPath during graph extraction.', parentType: 'pp:CanvasShape', mcpTool: 'pinepaper_create_item' },
    'pp:OpenPath':      { anchor: null, description: 'Open path (trajectory/stroke) — has start and end points, does not enclose area.', parentType: 'pp:Path', mcpTool: 'pinepaper_create_item' },
    'pp:ClosedPath':    { anchor: null, description: 'Closed path (region/boundary) — encloses area, no start/end distinction.', parentType: 'pp:Path', mcpTool: 'pinepaper_create_item' },
    'pp:Star':          { anchor: null, description: 'Star shape (geometrically: concave polygon with alternating radii)', parentType: 'pp:CanvasShape', geometricSupertype: 'pp:Polygon', mcpTool: 'pinepaper_create_item' },
    'pp:Triangle':      { anchor: null, description: 'Triangle shape (geometrically: 3-sided polygon)', parentType: 'pp:CanvasShape', geometricSupertype: 'pp:Polygon', mcpTool: 'pinepaper_create_item' },
    'pp:Polygon':       { anchor: null, description: 'N-sided regular polygon', parentType: 'pp:CanvasShape', mcpTool: 'pinepaper_create_item' },
    'pp:Ellipse':       { anchor: null, description: 'Ellipse shape', parentType: 'pp:CanvasShape', mcpTool: 'pinepaper_create_item' },
    'pp:Line':          { anchor: null, description: 'Line segment — 2-point open path with curveType: linear', parentType: 'pp:CanvasShape', geometricSupertype: 'pp:OpenPath', defaultCurveType: 'linear', mcpTool: 'pinepaper_create_item' },
    'pp:Arc':           { anchor: null, description: 'Arc segment — open path subset with curveType: arc', parentType: 'pp:CanvasShape', geometricSupertype: 'pp:OpenPath', defaultCurveType: 'arc', mcpTool: 'pinepaper_create_item' },
    'pp:Group':         { anchor: null, description: 'Item group/container', parentType: 'pp:CanvasContainer' },
    'pp:LetterCollage': { anchor: null, description: 'Styled text collage', parentType: 'pp:CanvasText', mcpTool: 'pinepaper_create_item' },
    'pp:Precomp':       { anchor: null, description: 'Nested composition', parentType: 'pp:CanvasContainer' },
    'pp:Skeleton':      { anchor: null, description: 'Rigging skeleton', parentType: 'pp:CanvasContainer', mcpTool: 'pinepaper_create_skeleton' },
    'pp:Bone':          { anchor: null, description: 'Skeleton bone', parentType: 'pp:CanvasElement', mcpTool: 'pinepaper_add_bone' },
    'pp:DiagramShape':  { anchor: null, description: 'Flowchart/UML shape', parentType: 'pp:DiagramElement', mcpTool: 'pinepaper_create_diagram_shape' },
    // Flowchart shape subtypes
    'pp:FlowchartShape':    { anchor: null, description: 'Abstract flowchart shape', abstract: true, parentType: 'pp:DiagramShape' },
    'pp:ProcessShape':      { anchor: null, description: 'Process/task step', parentType: 'pp:FlowchartShape', bpmnEquivalent: 'bpmn:Task' },
    'pp:DecisionShape':     { anchor: null, description: 'Decision/gateway diamond', parentType: 'pp:FlowchartShape', bpmnEquivalent: 'bpmn:ExclusiveGateway' },
    'pp:TerminalShape':     { anchor: null, description: 'Start/end terminal', parentType: 'pp:FlowchartShape', bpmnEquivalent: 'bpmn:Event' },
    'pp:DataShape':         { anchor: null, description: 'Data input/output parallelogram', parentType: 'pp:FlowchartShape', bpmnEquivalent: 'bpmn:DataObject' },
    'pp:DocumentShape':     { anchor: null, description: 'Document shape', parentType: 'pp:FlowchartShape', bpmnEquivalent: 'bpmn:DataObject' },
    'pp:DatabaseShape':     { anchor: null, description: 'Database/data store cylinder', parentType: 'pp:FlowchartShape', bpmnEquivalent: 'bpmn:DataStore' },
    'pp:PreparationShape':  { anchor: null, description: 'Preparation/setup step', parentType: 'pp:FlowchartShape', bpmnEquivalent: 'bpmn:Task' },
    // UML shape subtypes
    'pp:UMLShape':          { anchor: null, description: 'Abstract UML shape', abstract: true, parentType: 'pp:DiagramShape' },
    'pp:UMLClassShape':     { anchor: null, description: 'UML class box', parentType: 'pp:UMLShape' },
    'pp:UMLUseCaseShape':   { anchor: null, description: 'UML use case ellipse', parentType: 'pp:UMLShape' },
    'pp:UMLActorShape':     { anchor: null, description: 'UML actor stick figure', parentType: 'pp:UMLShape' },
    // Network shape subtypes
    'pp:NetworkShape':      { anchor: null, description: 'Abstract network topology shape', abstract: true, parentType: 'pp:DiagramShape' },
    'pp:CloudShape':        { anchor: null, description: 'Cloud/service shape', parentType: 'pp:NetworkShape' },
    'pp:ServerShape':       { anchor: null, description: 'Server/host shape', parentType: 'pp:NetworkShape' },
    // Connector subtypes
    'pp:Connector':     { anchor: null, description: 'Diagram connector', parentType: 'pp:DiagramElement', mcpTool: 'pinepaper_connect' },
    'pp:SequenceConnector':    { anchor: null, description: 'Sequence/control flow connector', parentType: 'pp:Connector', bpmnEquivalent: 'bpmn:SequenceFlow' },
    'pp:DataConnector':        { anchor: null, description: 'Data flow connector', parentType: 'pp:Connector', bpmnEquivalent: 'bpmn:DataAssociation' },
    'pp:AssociationConnector': { anchor: null, description: 'Association connector', parentType: 'pp:Connector', bpmnEquivalent: 'bpmn:Association' },
    'pp:DependencyConnector':  { anchor: null, description: 'Dependency connector', parentType: 'pp:Connector' },
    'pp:MapRegion':     { anchor: 'schema:AdministrativeArea', description: 'Geographic region', parentType: 'pp:GeoElement', mcpTool: 'pinepaper_load_map' },
    'pp:Marker':        { anchor: 'schema:Place', description: 'Map marker', parentType: 'pp:GeoElement', mcpTool: 'pinepaper_add_marker' },
    'pp:MaskedItem':    { anchor: null, description: 'Item with clipping mask', parentType: 'pp:CanvasElement' },
    'pp:Image':         { anchor: 'schema:ImageObject', description: 'Raster/bitmap image', parentType: 'pp:CanvasElement' },
    'pp:CompoundPath':  { anchor: null, description: 'Multiple sub-paths as single item (SVG imports, boolean ops)', parentType: 'pp:CanvasShape' },
    // Escape hatch — items that don't match any vocabulary type
    'pp:Unclassified':  { anchor: null, description: 'Item type not expressible in current vocabulary.', parentType: 'pp:CanvasElement' },
  },

  // --- Edge Types (Relations + Structural) ---
  edges: {
    // Abstract hierarchy parents
    'pp:Relation':          { category: 'abstract', description: 'Abstract relation', abstract: true },
    'pp:SpatialRelation':   { category: 'abstract', description: 'Position-based relation', abstract: true, parentType: 'pp:Relation' },
    'pp:TransformRelation': { category: 'abstract', description: 'Orientation/scale-based relation', abstract: true, parentType: 'pp:Relation' },
    'pp:AnimationRelation': { category: 'abstract', description: 'Time-based animation relation', abstract: true, parentType: 'pp:Relation' },
    'pp:ProceduralRelation':{ category: 'abstract', description: 'Procedural/expression relation', abstract: true, parentType: 'pp:Relation' },
    // Structural
    'pp:contains':          { category: 'structural', description: 'Parent-child containment' },
    'pp:maskedBy':          { category: 'structural', description: 'Clipped by mask shape' },
    // Spatial relations
    'pp:orbits':            { category: 'spatial',    behaviorType: 'constraint', mathFunctions: ['parametricCircle', 'sinCos'], parentType: 'pp:SpatialRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:follows':           { category: 'spatial',    behaviorType: 'constraint', description: 'Smooth pursuit with lag — source asymptotically approaches target.', mathFunctions: ['lerp', 'exponentialPursuit'], parentType: 'pp:SpatialRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:attachedTo':        { category: 'spatial',    behaviorType: 'constraint', description: 'Rigid parent-child transform — source moves with target instantly via fixed offset.', mathFunctions: ['rigidOffset'], parentType: 'pp:SpatialRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:maintainsDistance': { category: 'spatial',    behaviorType: 'constraint', mathFunctions: ['euclideanDistance'], parentType: 'pp:SpatialRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:pointsAt':          { category: 'transform',  behaviorType: 'constraint', mathFunctions: ['atan2'], parentType: 'pp:TransformRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:mirrors':           { category: 'transform',  behaviorType: 'constraint', mathFunctions: ['axisReflection'], parentType: 'pp:TransformRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:parallax':          { category: 'spatial',    behaviorType: 'constraint', mathFunctions: ['depthScaledTranslation'], parentType: 'pp:SpatialRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:boundsTo':          { category: 'spatial',    behaviorType: 'constraint', mathFunctions: ['rectClamp'], parentType: 'pp:SpatialRelation', mcpToolRef: 'pinepaper_add_relation' },
    // Animation relations
    'pp:growsFrom':         { category: 'animation',  behaviorType: 'trigger', mathFunctions: ['scaleInterpolation'], parentType: 'pp:TransformRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:staggeredWith':     { category: 'animation',  behaviorType: 'trigger', cardinality: 'group', description: 'Stored as pairwise edges with index param to reconstruct group ordering.', mathFunctions: ['delayOffset'], parentType: 'pp:AnimationRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:waveThrough':       { category: 'animation',  behaviorType: 'constraint', cardinality: 'group', description: 'Stored as pairwise edges with index param for phase offset.', mathFunctions: ['phaseOffsetSinusoid'], parentType: 'pp:AnimationRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:morphsTo':          { category: 'animation',  behaviorType: 'trigger', mathFunctions: ['pathPointLerp'], parentType: 'pp:AnimationRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:circumscribes':     { category: 'animation',  behaviorType: 'trigger', mathFunctions: ['boundingGeometry'], parentType: 'pp:TransformRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:indicates':         { category: 'animation',  behaviorType: 'trigger', description: 'Temporary emphasis effect.', mathFunctions: ['pulseScale'], parentType: 'pp:AnimationRelation', mcpToolRef: 'pinepaper_add_relation' },
    // Procedural relations
    'pp:drivenBy':          { category: 'procedural', behaviorType: 'procedural', mathFunctions: ['linearMap'], parentType: 'pp:ProceduralRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:wiggle':            { category: 'procedural', behaviorType: 'procedural', mathFunctions: ['perlinNoise', 'sinOscillation'], parentType: 'pp:ProceduralRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:timeExpression':    { category: 'procedural', behaviorType: 'procedural', mathFunctions: ['mathExpression'], parentType: 'pp:ProceduralRelation', mcpToolRef: 'pinepaper_add_relation' },
    // Camera
    'pp:cameraFollows':     { category: 'camera',     behaviorType: 'constraint', mathFunctions: ['exponentialPursuit'], parentType: 'pp:SpatialRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:cameraAnimates':    { category: 'camera',     behaviorType: 'trigger', mathFunctions: ['keyframeLerp'], parentType: 'pp:AnimationRelation', mcpToolRef: 'pinepaper_add_relation' },
    // Rigging
    'pp:boneAttached':      { category: 'rigging',    behaviorType: 'constraint', mathFunctions: ['affineTransform', 'deltaRotation'], parentType: 'pp:SpatialRelation', mcpToolRef: 'pinepaper_attach_item_to_bone' },
    'pp:ikTarget':          { category: 'rigging',    behaviorType: 'constraint', mathFunctions: ['fabrikSolver'], parentType: 'pp:SpatialRelation', mcpToolRef: 'pinepaper_add_relation' },
    // Blending
    'pp:blendReactsTo':     { category: 'blending',   behaviorType: 'procedural', mathFunctions: ['proximityThreshold'], parentType: 'pp:ProceduralRelation', mcpToolRef: 'pinepaper_add_relation' },
    'pp:blendTransition':   { category: 'blending',   behaviorType: 'procedural', mathFunctions: ['timedCycling'], parentType: 'pp:ProceduralRelation', mcpToolRef: 'pinepaper_add_relation' },
    // Diagram flow
    'pp:DiagramFlowRelation': { category: 'abstract', description: 'Abstract diagram flow relation', abstract: true, parentType: 'pp:Relation' },
    'pp:sequenceFlow':      { category: 'diagram', description: 'Sequence/control flow between shapes', parentType: 'pp:DiagramFlowRelation', bpmnEquivalent: 'bpmn:SequenceFlow' },
    'pp:dataFlow':          { category: 'diagram', description: 'Data flow between shapes', parentType: 'pp:DiagramFlowRelation', bpmnEquivalent: 'bpmn:DataAssociation' },
    'pp:association':       { category: 'diagram', description: 'Association between diagram elements', parentType: 'pp:DiagramFlowRelation', bpmnEquivalent: 'bpmn:Association' },
    'pp:dependency':        { category: 'diagram', description: 'Dependency between diagram elements', parentType: 'pp:DiagramFlowRelation' },
    'pp:connectsTo':        { category: 'diagram', description: 'Generic diagram connection', parentType: 'pp:DiagramFlowRelation' },
    // Escape hatch
    'pp:unknownRelation':   { category: 'unknown', behaviorType: null, description: 'Relation type not expressible in current vocabulary.', parentType: 'pp:Relation' },
  },

  // --- Mathematical Functions Catalogue ---
  mathFunctions: {
    // Interpolation
    'lerp':                     { category: 'interpolation', formula: 'a + (b-a)*t' },
    'cubicBezier':              { category: 'interpolation', formula: '(1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃' },
    'catmullRom':               { category: 'interpolation', formula: 'Catmull-Rom spline through control points' },
    // Easing
    'easeIn':                   { category: 'easing', formula: 't²' },
    'easeOut':                  { category: 'easing', formula: '1-(1-t)²' },
    'easeInOut':                { category: 'easing', formula: 't<0.5 ? 2t² : 1-(-2t+2)²/2' },
    'easeInCubic':              { category: 'easing', formula: 't³' },
    'easeOutCubic':             { category: 'easing', formula: '1-(1-t)³' },
    'bounce':                   { category: 'easing', formula: 'Piecewise parabolas' },
    'elastic':                  { category: 'easing', formula: '2^(-10t)·sin((10t-0.75)·c₄)+1' },
    'customCubicBezier':        { category: 'easing', formula: 'cubic-bezier(x1,y1,x2,y2)' },
    // Trigonometric
    'sinOscillation':           { category: 'trigonometric', formula: 'center + amplitude·sin(ω·t + φ)' },
    'sinCos':                   { category: 'trigonometric', formula: 'sin(θ), cos(θ)' },
    'phaseOffsetSinusoid':      { category: 'trigonometric', formula: 'A·sin(ω·t - i·φ)' },
    // Parametric
    'parametricCircle':         { category: 'parametric', formula: 'x=r·cos(θ), y=r·sin(θ)' },
    'parametricEllipse':        { category: 'parametric', formula: 'x=rx·cos(θ), y=ry·sin(θ)' },
    'spiral':                   { category: 'parametric', formula: 'r(θ)=a+bθ' },
    // Spatial
    'euclideanDistance':         { category: 'spatial', formula: '√((x₂-x₁)²+(y₂-y₁)²)' },
    'atan2':                    { category: 'spatial', formula: 'atan2(y₂-y₁, x₂-x₁)' },
    'axisReflection':           { category: 'spatial', formula: 'v-2(v·n̂)n̂' },
    'rigidOffset':              { category: 'spatial', formula: 'target.pos + offset' },
    'rectClamp':                { category: 'spatial', formula: 'clamp(x, min, max)' },
    'depthScaledTranslation':   { category: 'spatial', formula: 'base + scroll·depth' },
    // Transform
    'affineTransform':          { category: 'transform', formula: "x'=ax+cy+e, y'=bx+dy+f" },
    'deltaRotation':            { category: 'transform', formula: 'item.rotate(shortestPathDelta)' },
    // Physics
    'exponentialPursuit':       { category: 'physics', formula: 'pos += (target-pos)·lag' },
    'dampedHarmonicOscillator': { category: 'physics', formula: 'e^(-ζω₀t)(Acos(ωd·t)+Bsin(ωd·t))' },
    'gravity':                  { category: 'physics', formula: 'y += vy·dt + ½g·dt²' },
    // Noise
    'perlinNoise':              { category: 'noise', formula: 'Gradient noise [-1,1]' },
    'fbm':                      { category: 'noise', formula: 'Σ persistence^i · noise(x·lacunarity^i)' },
    // Color
    'colorLerp':                { category: 'color', formula: 'lerp per RGB/HSL channel' },
    'gradientInterpolation':    { category: 'color', formula: 'Stop-wise gradient lerp' },
    // Solver
    'fabrikSolver':             { category: 'solver', formula: 'Forward And Backward Reaching IK' },
    // Mapping / Timing / Animation / Geometry / Path / Expression
    'linearMap':                { category: 'mapping', formula: 'source = target·multiplier + offset' },
    'mathExpression':           { category: 'expression', formula: 'User-defined f(t,v)' },
    'keyframeLerp':             { category: 'interpolation', formula: 'Multi-keyframe piecewise lerp' },
    'scaleInterpolation':       { category: 'interpolation', formula: 'Scale 0→1 with easing' },
    'delayOffset':              { category: 'timing', formula: 'delay = index · stagger' },
    'pulseScale':               { category: 'animation', formula: 'Temporary scale pulse' },
    'boundingGeometry':         { category: 'geometry', formula: 'Bounding box/circle calculation' },
    'pathPointLerp':            { category: 'interpolation', formula: 'Per-point path interpolation' },
    'proximityThreshold':       { category: 'spatial', formula: 'dist < radius → trigger' },
    'timedCycling':             { category: 'timing', formula: 'mode[floor(t/cycleDur) % n]' },
    'trimPath':                 { category: 'path', formula: 'dashArray/dashOffset trimming' },
    'staggerDelay':             { category: 'timing', formula: 'index × delay' },
  },

  // --- Design Patterns (structural archetypes) ---
  patterns: {
    'orbitalComposition':    { description: 'Items orbiting a central element', requiredEdges: ['pp:orbits'] },
    'staggeredReveal':       { description: 'Items appearing in sequence', requiredEdges: ['pp:staggeredWith'] },
    'parallaxDepth':         { description: 'Layered depth illusion via differential motion', requiredEdges: ['pp:parallax'] },
    'followChain':           { description: 'Items following each other in chain', requiredEdges: ['pp:follows'] },
    'waveMotion':            { description: 'Wave propagating through items', requiredEdges: ['pp:waveThrough'] },
    'maskReveal':            { description: 'Content revealed through animated mask', nodeTypes: ['pp:MaskedItem'] },
    'skeletalAnimation':     { description: 'Items rigged to bone hierarchy', nodeTypes: ['pp:Skeleton', 'pp:Bone'] },
    'keyframeAnimation':     { description: 'Items animated via keyframe timeline', mathFunctions: ['keyframeLerp'] },
    'proceduralBackground':  { description: 'Algorithmically generated background' },
    'trimPathDraw':          { description: 'Stroke draw-on effect via trim paths', mathFunctions: ['trimPath'] },
    'diagramFlow':           { description: 'Connected flowchart/diagram shapes', nodeTypes: ['pp:DiagramShape', 'pp:Connector'] },
    'diagramFlowchart':      { description: 'Linear/branching flowchart', nodeTypes: ['pp:FlowchartShape', 'pp:SequenceConnector'], requiredEdges: ['pp:sequenceFlow'] },
    'diagramUML':            { description: 'UML class or use-case diagram', nodeTypes: ['pp:UMLShape'] },
    'diagramNetwork':        { description: 'Network topology diagram', nodeTypes: ['pp:NetworkShape'] },
    'diagramDecisionTree':   { description: 'Decision tree with branching paths', nodeTypes: ['pp:DecisionShape'] },
    'mapVisualization':      { description: 'Geographic data visualization', nodeTypes: ['pp:MapRegion'] },
    'morphTransition':       { description: 'Shape morphing between states', requiredEdges: ['pp:morphsTo'] },
    'collageText':           { description: 'Stylized per-letter text', nodeTypes: ['pp:LetterCollage'] },
    'cameraAnimation':       { description: 'Animated viewport zoom/pan', requiredEdges: ['pp:cameraFollows', 'pp:cameraAnimates'] },
    'proceduralNoise':       { description: 'Noise-driven procedural motion', requiredEdges: ['pp:wiggle'] },
    'expressionDriven':      { description: 'Math expression controlling properties', requiredEdges: ['pp:timeExpression'] },
  },

  // --- Generator Types ---
  generators: {
    // Abstract hierarchy parents
    'pp:ProceduralGenerator': { category: 'abstract', description: 'Abstract generator', abstract: true, mathFunctions: [] },
    'pp:ParticleGenerator':   { category: 'abstract', description: 'Particle-based generator', abstract: true, parentType: 'pp:ProceduralGenerator', mathFunctions: [] },
    'pp:FieldGenerator':      { category: 'abstract', description: 'Field-based generator', abstract: true, parentType: 'pp:ProceduralGenerator', mathFunctions: [] },
    'pp:PatternGenerator':    { category: 'abstract', description: 'Pattern-based generator', abstract: true, parentType: 'pp:ProceduralGenerator', mathFunctions: [] },
    'pp:SceneGenerator':      { category: 'abstract', description: 'Scene-based generator', abstract: true, parentType: 'pp:ProceduralGenerator', mathFunctions: [] },
    // Concrete generators
    'drawSunburst':          { category: 'patterns',      mathFunctions: ['sinCos', 'parametricCircle'], parentType: 'pp:PatternGenerator' },
    'drawGrid':              { category: 'patterns',      mathFunctions: ['lerp'], parentType: 'pp:PatternGenerator' },
    'drawWaves':             { category: 'patterns',      mathFunctions: ['sinOscillation'], parentType: 'pp:PatternGenerator' },
    'drawPattern':           { category: 'geometric',     mathFunctions: ['parametricCircle', 'sinCos'], parentType: 'pp:PatternGenerator' },
    'drawSunsetScene':       { category: 'scenes',        mathFunctions: ['lerp', 'colorLerp'], parentType: 'pp:SceneGenerator' },
    'drawStackedCircles':    { category: 'distributions', mathFunctions: ['parametricCircle'], parentType: 'pp:ParticleGenerator' },
    'drawCircuit':           { category: 'tech',          mathFunctions: ['lerp'], parentType: 'pp:PatternGenerator' },
    'drawBokeh':             { category: 'effects',       mathFunctions: ['parametricCircle'], parentType: 'pp:ParticleGenerator' },
    'drawGradientMesh':      { category: 'organic',       mathFunctions: ['perlinNoise'], parentType: 'pp:FieldGenerator' },
    'drawGeometricAbstract': { category: 'geometric',     mathFunctions: ['lerp'], parentType: 'pp:SceneGenerator' },
    'drawWindField':         { category: 'particles',     mathFunctions: ['perlinNoise', 'fbm'], parentType: 'pp:FieldGenerator' },
    'drawFluidFlow':         { category: 'organic',       mathFunctions: ['perlinNoise', 'fbm'], parentType: 'pp:FieldGenerator' },
    'drawOrganicFlow':       { category: 'organic',       mathFunctions: ['sinOscillation', 'perlinNoise'], parentType: 'pp:FieldGenerator' },
    'drawNoiseTexture':      { category: 'textures',      mathFunctions: ['perlinNoise', 'fbm'], parentType: 'pp:PatternGenerator' },
    'drawGlobeWireframe':    { category: 'tech',          mathFunctions: ['sinCos', 'parametricCircle'], parentType: 'pp:SceneGenerator' },
  },

  // --- Formal Properties ---
  properties: {
    // Spatial
    'pp:x':             { valueType: 'number', unit: 'px', appliesTo: ['pp:CanvasElement'], animatable: true },
    'pp:y':             { valueType: 'number', unit: 'px', appliesTo: ['pp:CanvasElement'], animatable: true },
    'pp:width':         { valueType: 'number', unit: 'px', appliesTo: ['pp:Rectangle', 'pp:CanvasElement'] },
    'pp:height':        { valueType: 'number', unit: 'px', appliesTo: ['pp:Rectangle', 'pp:CanvasElement'] },
    'pp:radius':        { valueType: 'number', unit: 'px', appliesTo: ['pp:Circle', 'pp:Star', 'pp:Arc'] },
    'pp:rotation':      { valueType: 'number', unit: 'deg', appliesTo: ['pp:CanvasElement'], animatable: true },
    'pp:scale':         { valueType: 'number', unit: null, appliesTo: ['pp:CanvasElement'], animatable: true },
    'pp:scaleX':        { valueType: 'number', unit: null, appliesTo: ['pp:CanvasElement'], animatable: true },
    'pp:scaleY':        { valueType: 'number', unit: null, appliesTo: ['pp:CanvasElement'], animatable: true },
    'pp:opacity':       { valueType: 'number', unit: null, appliesTo: ['pp:CanvasElement'], animatable: true, range: [0, 1] },
    // Color
    'pp:fillColor':     { valueType: 'color', unit: null, appliesTo: ['pp:CanvasShape', 'pp:CanvasText'], animatable: true },
    'pp:strokeColor':   { valueType: 'color', unit: null, appliesTo: ['pp:CanvasShape'], animatable: true },
    'pp:shadowColor':   { valueType: 'color', unit: null, appliesTo: ['pp:CanvasElement'] },
    // Stroke
    'pp:strokeWidth':   { valueType: 'number', unit: 'px', appliesTo: ['pp:CanvasShape'], animatable: true },
    'pp:strokeCap':     { valueType: 'enum', values: ['butt', 'round', 'square'], appliesTo: ['pp:CanvasShape'] },
    'pp:strokeJoin':    { valueType: 'enum', values: ['miter', 'round', 'bevel'], appliesTo: ['pp:CanvasShape'] },
    'pp:dashArray':     { valueType: 'array', unit: 'px', appliesTo: ['pp:CanvasShape'] },
    // Shadow
    'pp:shadowBlur':    { valueType: 'number', unit: 'px', appliesTo: ['pp:CanvasElement'], animatable: true },
    'pp:shadowOffsetX': { valueType: 'number', unit: 'px', appliesTo: ['pp:CanvasElement'], animatable: true },
    'pp:shadowOffsetY': { valueType: 'number', unit: 'px', appliesTo: ['pp:CanvasElement'], animatable: true },
    // Typography
    'pp:fontSize':      { valueType: 'number', unit: 'px', appliesTo: ['pp:CanvasText'], animatable: true },
    'pp:fontFamily':    { valueType: 'string', unit: null, appliesTo: ['pp:CanvasText'] },
    'pp:fontWeight':    { valueType: 'string', unit: null, appliesTo: ['pp:CanvasText'] },
    'pp:textAlign':     { valueType: 'enum', values: ['left', 'center', 'right'], appliesTo: ['pp:CanvasText'] },
    'pp:content':       { valueType: 'string', unit: null, appliesTo: ['pp:CanvasText'] },
    // Compositing
    'pp:blendMode':     { valueType: 'enum', values: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'], appliesTo: ['pp:CanvasElement'] },
    // Diagram
    'pp:routing':         { valueType: 'enum', values: ['direct', 'orthogonal', 'curved'], appliesTo: ['pp:Connector'] },
    'pp:lineStyle':       { valueType: 'enum', values: ['solid', 'dashed', 'dotted'], appliesTo: ['pp:Connector'] },
    'pp:headStyle':       { valueType: 'enum', values: ['classic', 'stealth', 'sharp', 'open', 'diamond', 'circle', 'none'], appliesTo: ['pp:Connector'] },
    'pp:tailStyle':       { valueType: 'enum', values: ['classic', 'stealth', 'sharp', 'open', 'diamond', 'circle', 'none'], appliesTo: ['pp:Connector'] },
    'pp:connectorLabel':  { valueType: 'string', unit: null, appliesTo: ['pp:Connector'] },
    'pp:shapeCategory':   { valueType: 'enum', values: ['flowchart', 'uml', 'network', 'basic'], appliesTo: ['pp:DiagramShape'] },
    // Path Geometry
    'pp:closed':        { valueType: 'boolean', unit: null, appliesTo: ['pp:Path', 'pp:OpenPath', 'pp:ClosedPath', 'pp:CompoundPath'], description: 'Whether path forms a closed region.' },
    'pp:curveType':     { valueType: 'enum', values: ['linear', 'cubicBezier', 'quadraticBezier', 'catmullRom', 'arc', 'mixed'], appliesTo: ['pp:Path', 'pp:OpenPath', 'pp:ClosedPath', 'pp:Line', 'pp:Arc'], description: 'Mathematical function family governing segment interpolation.' },
    'pp:segmentCount':  { valueType: 'number', unit: null, appliesTo: ['pp:Path', 'pp:OpenPath', 'pp:ClosedPath', 'pp:CompoundPath'], description: 'Number of anchor points defining the path.' },
    // Trim Path
    'pp:trimStart':     { valueType: 'number', unit: null, appliesTo: ['pp:Path', 'pp:OpenPath', 'pp:ClosedPath', 'pp:CanvasShape'], animatable: true, range: [0, 1] },
    'pp:trimEnd':       { valueType: 'number', unit: null, appliesTo: ['pp:Path', 'pp:OpenPath', 'pp:ClosedPath', 'pp:CanvasShape'], animatable: true, range: [0, 1] },
    'pp:trimOffset':    { valueType: 'number', unit: null, appliesTo: ['pp:Path', 'pp:OpenPath', 'pp:ClosedPath', 'pp:CanvasShape'], animatable: true, range: [0, 1] },
  },

  // --- Value Types ---
  valueTypes: {
    'pp:Point2D':          { anchor: null, description: '2D canvas coordinate {x, y}', fields: ['x', 'y'] },
    'pp:BoundingBox':      { anchor: null, description: '2D bounding rectangle', fields: ['x', 'y', 'width', 'height'] },
    'pp:Canvas':           { anchor: 'schema:Place', description: 'Canvas coordinate space', fields: ['width', 'height', 'backgroundColor'] },
    'pp:Keyframe':         { anchor: null, description: 'Property snapshot at time', fields: ['time', 'properties', 'easing'] },
    'pp:KeyframeAnimation':{ anchor: null, description: 'Ordered keyframes with duration', fields: ['keyframes', 'duration', 'loop'] },
    'pp:LoopAnimation':    { anchor: null, description: 'Continuous frame-based animation preset', fields: ['animationType', 'animationSpeed', 'animationDirection'] },
    'pp:EasingFunction':   { anchor: null, description: 'Interpolation timing curve', fields: ['type', 'params'] },
    'pp:Timeline':         { anchor: null, description: 'Global playback controller', fields: ['duration', 'loop', 'currentTime'] },
    'pp:Viewport':         { anchor: null, description: 'Camera/viewport state', fields: ['zoom', 'center', 'rotation'] },
    'pp:MaskAnimation':    { anchor: null, description: 'Animated mask reveal effect', fields: ['maskType', 'keyframes', 'duration', 'easing'] },
  },
};


// =============================================================================
// TYPE / EDGE MAPPING TABLES
// =============================================================================

/** Maps PinePaper item type strings to pp: vocabulary type keys. */
export const ITEM_TYPE_MAP: Record<string, string> = {
  'text':           'pp:Text',
  'circle':         'pp:Circle',
  'rectangle':      'pp:Rectangle',
  'path':           'pp:Path',
  'open-path':      'pp:OpenPath',
  'closed-path':    'pp:ClosedPath',
  'star':           'pp:Star',
  'triangle':       'pp:Triangle',
  'polygon':        'pp:Polygon',
  'ellipse':        'pp:Ellipse',
  'line':           'pp:Line',
  'arc':            'pp:Arc',
  'group':          'pp:Group',
  'image':          'pp:Image',
  'raster':         'pp:Image',
  'compound-path':  'pp:CompoundPath',
  'compoundpath':   'pp:CompoundPath',
  'diagram-shape':  'pp:DiagramShape',
  'connector':      'pp:Connector',
  'unclassified':   'pp:Unclassified',
};

/** Maps ShapeLibrary shapeType strings to specific pp: diagram shape types. */
export const DIAGRAM_SHAPE_MAP: Record<string, string> = {
  'process':     'pp:ProcessShape',
  'decision':    'pp:DecisionShape',
  'terminal':    'pp:TerminalShape',
  'data':        'pp:DataShape',
  'document':    'pp:DocumentShape',
  'database':    'pp:DatabaseShape',
  'preparation': 'pp:PreparationShape',
  'uml-class':   'pp:UMLClassShape',
  'uml-usecase': 'pp:UMLUseCaseShape',
  'uml-actor':   'pp:UMLActorShape',
  'cloud':       'pp:CloudShape',
  'server':      'pp:ServerShape',
};

/** Maps connector lineStyle strings to specific pp: connector types. */
export const CONNECTOR_STYLE_MAP: Record<string, string> = {
  'solid':  'pp:SequenceConnector',
  'dashed': 'pp:DataConnector',
  'dotted': 'pp:AssociationConnector',
};

/** Maps PinePaper relation type strings to pp: vocabulary edge keys. */
export const RELATION_TYPE_MAP: Record<string, string> = {
  'orbits':             'pp:orbits',
  'follows':            'pp:follows',
  'attached_to':        'pp:attachedTo',
  'maintains_distance': 'pp:maintainsDistance',
  'points_at':          'pp:pointsAt',
  'mirrors':            'pp:mirrors',
  'parallax':           'pp:parallax',
  'bounds_to':          'pp:boundsTo',
  'grows_from':         'pp:growsFrom',
  'staggered_with':     'pp:staggeredWith',
  'wave_through':       'pp:waveThrough',
  'morphs_to':          'pp:morphsTo',
  'circumscribes':      'pp:circumscribes',
  'indicates':          'pp:indicates',
  'driven_by':          'pp:drivenBy',
  'wiggle':             'pp:wiggle',
  'time_expression':    'pp:timeExpression',
  'camera_follows':     'pp:cameraFollows',
  'camera_animates':    'pp:cameraAnimates',
  'bone_attached':      'pp:boneAttached',
  'ik_target':          'pp:ikTarget',
  'blend_reacts_to':    'pp:blendReactsTo',
  'blend_transition':   'pp:blendTransition',
  'unknown':            'pp:unknownRelation',
};

/** Known easing names that map to math function keys. */
export const EASING_TO_MATH: Record<string, string | null> = {
  'linear':            null,
  'easeIn':            'easeIn',
  'easeOut':           'easeOut',
  'easeInOut':         'easeInOut',
  'easeInCubic':       'easeInCubic',
  'easeOutCubic':      'easeOutCubic',
  'bounce':            'bounce',
  'elastic':           'elastic',
  'customCubicBezier': 'customCubicBezier',
};
