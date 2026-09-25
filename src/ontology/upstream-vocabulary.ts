/**
 * GENERATED — DO NOT EDIT. Run `bun run sync:ontology-vocabulary`.
 *
 * FxTool's ITEM_TYPE_MAP and type classes (anchor, description, parentType,
 * mcpTool, mcpAction), read from the loaded module.
 *
 * Source: FxTool origin/main fca09aba5bedd567901db87ce25780a77a3dd5b8
 *   js/ontology/Vocabulary.js
 * sha256: 8c39f8ad6d2da359
 *
 * vocabulary.ts merges these over its hand-written port: the engine's map
 * wins where the two disagree, and a class the port lacks is added.
 */

export interface UpstreamTypeDef {
  anchor?: string | null;
  description?: string;
  parentType?: string;
  mcpTool?: string;
  mcpAction?: string;
}

export const UPSTREAM_ITEM_TYPE_MAP: Readonly<Record<string, string>> = Object.freeze({
  "arc": "pp:Arc",
  "areaChart": "pp:AreaChart",
  "areachart": "pp:AreaChart",
  "audio": "pp:AudioClip",
  "barChart": "pp:BarChart",
  "barchart": "pp:BarChart",
  "causticsraster": "pp:CausticsField",
  "character-eye": "pp:CharacterEye",
  "character-eyes": "pp:CharacterEye",
  "circle": "pp:Circle",
  "circle-outline": "pp:Circle",
  "closed-path": "pp:ClosedPath",
  "cloudsraster": "pp:CloudField",
  "compound-path": "pp:CompoundPath",
  "compoundpath": "pp:CompoundPath",
  "connector": "pp:Connector",
  "diagram-shape": "pp:DiagramShape",
  "disk": "pp:Disk",
  "ellipse": "pp:Ellipse",
  "event": "pp:Event",
  "formularaster": "pp:ProceduralField",
  "group": "pp:Group",
  "image": "pp:Image",
  "indexed-store": "pp:IndexedStore",
  "intro-scene": "pp:IntroScene",
  "letter-collage": "pp:LetterCollage",
  "letterCollage": "pp:LetterCollage",
  "lettercollage": "pp:LetterCollage",
  "line": "pp:Line",
  "lineChart": "pp:LineChart",
  "linechart": "pp:LineChart",
  "local-store": "pp:LocalStore",
  "marker": "pp:Marker",
  "motion-scene": "pp:MotionScene",
  "mountainsraster": "pp:ProceduralField",
  "oceanraster": "pp:OceanField",
  "open-path": "pp:OpenPath",
  "outro-scene": "pp:OutroScene",
  "path": "pp:Path",
  "pattern": "pp:Pattern",
  "plasmaraster": "pp:PlasmaField",
  "polygon": "pp:Polygon",
  "precomp": "pp:Precomp",
  "raster": "pp:Image",
  "rectangle": "pp:Rectangle",
  "region": "pp:MapRegion",
  "rigged-character": "pp:RiggedCharacter",
  "scatterPlot": "pp:ScatterPlot",
  "scatterplot": "pp:ScatterPlot",
  "shaderraster": "pp:ProceduralField",
  "sound": "pp:Sound",
  "star": "pp:Star",
  "starfieldraster": "pp:StarfieldField",
  "text": "pp:Text",
  "text-effect": "pp:TextEffect",
  "text-effect-glyph": "pp:TextEffectGlyph",
  "transition-scene": "pp:TransitionScene",
  "triangle": "pp:Triangle",
  "tunnelraster": "pp:TunnelField",
  "unclassified": "pp:Unclassified",
  "video": "pp:VideoClip",
  "voronoiraster": "pp:VoronoiField",
  "world-character": "pp:WorldCharacter",
  "world-light": "pp:WorldLight",
  "world-material": "pp:WorldMaterial",
  "world-mesh": "pp:ShaderMesh",
  "world-object": "pp:WorldObject"
});

export const UPSTREAM_TYPES: Readonly<Record<string, UpstreamTypeDef>> = Object.freeze({
  "pp:AnalyticalTask": {
    "description": "Abstract analytical task — the question a visualization helps answer"
  },
  "pp:AngleEncoding": {
    "description": "Rotation or arc sweep — encodes proportion Read least accurately of the common channels — acceptable for part-to-whole, poor for comparison.",
    "parentType": "pp:EncodingChannel"
  },
  "pp:Arc": {
    "anchor": null,
    "description": "An open curved path through three points — `from`, `through`, `to` — where the middle point sets the bulge. The curve is defined by geometry rather than by control handles, so it is the cheapest way to get a controlled curve without authoring béziers. Choose pp:Path for anything needing more than one bend.",
    "parentType": "pp:CanvasShape",
    "mcpTool": "pinepaper_create_item"
  },
  "pp:ArcMark": {
    "description": "Angular sector mark (pie slice, donut, sunburst) Angle is read poorly, so reserve it for part-to-whole with few slices — a pie with many segments is a bar chart that has been made harder.",
    "parentType": "pp:MarkType"
  },
  "pp:AreaChart": {
    "description": "Area chart — filled region under a line, showing volume and trends",
    "parentType": "pp:DataVisualization",
    "mcpTool": "pinepaper_create_chart",
    "mcpAction": "create"
  },
  "pp:AreaMark": {
    "description": "Filled region mark (area, stream, band) Fills emphasise volume and accumulation; stacked areas make the TOTAL easy and the individual series hard.",
    "parentType": "pp:MarkType"
  },
  "pp:AssociationConnector": {
    "anchor": null,
    "description": "A plain link between elements with no direction of control or data implied — UML's weakest relationship. Use it when a stronger edge would overstate the coupling.",
    "parentType": "pp:Connector",
    "mcpTool": "pinepaper_connect"
  },
  "pp:AudioClip": {
    "anchor": "schema:AudioObject",
    "description": "Audio media item — sample-buffer source with volume, gain, and timeline placement. May coexist with a video pp:MediaRef or stand alone.",
    "parentType": "pp:CanvasElement",
    "mcpTool": "pinepaper_media",
    "mcpAction": "upload_audio"
  },
  "pp:AudioSync": {
    "anchor": null,
    "description": "A composition timed to an audio track — the detected tempo and onset times that decide when each item lands. Held in the graph so a beat-synced piece can be re-cut or re-timed rather than re-detected.",
    "parentType": "pp:Concept",
    "mcpTool": "pinepaper_compose",
    "mcpAction": "set_treatment"
  },
  "pp:BarChart": {
    "description": "Bar chart — rectangular marks on Cartesian axes for categorical comparison",
    "parentType": "pp:DataVisualization",
    "mcpTool": "pinepaper_create_chart",
    "mcpAction": "create"
  },
  "pp:BarMark": {
    "description": "Rectangular extent mark (bar, column, histogram bin) Length from a common baseline is the most accurately-read encoding there is, which is why bars beat pie for comparison. The baseline must be zero or the lengths lie.",
    "parentType": "pp:MarkType"
  },
  "pp:Bone": {
    "anchor": null,
    "description": "One segment of a skeleton: a joint position, a length and an angle, with children starting at its tip. Rotating a bone rotates everything below it — which is forward kinematics, and why a rig is authored root-first.",
    "parentType": "pp:CanvasElement",
    "mcpTool": "pinepaper_rigging",
    "mcpAction": "add_bone"
  },
  "pp:BoneCollider": {
    "anchor": null,
    "description": "Collision shape that bone-physics particles bump against. Lives on a skeleton; multiple colliders per skeleton are allowed. Concrete subtypes select the shape primitive.",
    "parentType": "pp:Concept"
  },
  "pp:BoneJiggle": {
    "anchor": null,
    "description": "Secondary-motion config attached to a bone — overshoots and oscillates around the animated angle with stiffness/damping. Use for jiggly accessories (ponytail, antenna, scarf) without authoring per-frame keyframes.",
    "parentType": "pp:Concept"
  },
  "pp:BonePhysics": {
    "anchor": null,
    "description": "Verlet integration layer over a skeleton — each bone has a particle at its tip, distance constraints preserve bone lengths, spring motors pull toward animated angles. Enabled per skeleton; blendWeight per bone mixes animated vs simulated. Use for hit reactions, hair/tail secondary motion, ragdoll.",
    "parentType": "pp:Concept"
  },
  "pp:BreakdownPose": {
    "anchor": null,
    "description": "A pose keyframe that shapes the ARC and SPACING of the transition between key poses rather than being a storytelling extreme. Carries `favor` (−1..1, biases spacing toward the previous/next key) and a `breakdown` flag; interpolation naturally arcs in bone-angle space. Breakdowns are what turn robotic pose-to-pose into believable motion (traditional keys → breakdowns → in-betweens).",
    "parentType": "pp:Pose",
    "mcpTool": "pinepaper_rigging",
    "mcpAction": "add_pose_keyframe"
  },
  "pp:BubbleChart": {
    "description": "Bubble chart — scatter plot with size-encoded third variable",
    "parentType": "pp:ScatterPlot",
    "mcpTool": "pinepaper_create_chart",
    "mcpAction": "create"
  },
  "pp:CameraTreatment": {
    "anchor": null,
    "description": "A named shot-list recipe (sheet-reveal, hero-then-details, slow-pan, push-through) compiled into a camera_animates track. Held separately from the pattern so one composition can be filmed several ways.",
    "parentType": "pp:CompositionPattern",
    "mcpTool": "pinepaper_compose",
    "mcpAction": "set_treatment"
  },
  "pp:CanvasContainer": {
    "anchor": null,
    "description": "Abstract: elements that hold other elements and transform them as a unit. Containment comes from the scene tree, so a child inherits the parent's transform, opacity and blend unit.",
    "parentType": "pp:CanvasElement"
  },
  "pp:CanvasElement": {
    "anchor": "schema:CreativeWork",
    "description": "Abstract root of everything drawn on the canvas. Every element has a position, a transform and an identity in the registry, which is what lets a relation address it and an export find it."
  },
  "pp:CanvasShape": {
    "anchor": null,
    "description": "Abstract: elements defined by vector geometry — paths, closed forms, strokes. They can be filled, stroked, trimmed, morphed and deformed at the vertex level, none of which a raster or a text run supports.",
    "parentType": "pp:CanvasElement"
  },
  "pp:CanvasText": {
    "anchor": null,
    "description": "Abstract: elements whose content is language. They carry the scene's meaning, are what a screen reader announces, and re-measure when the content changes — so anything depending on their bounds must run after.",
    "parentType": "pp:CanvasElement"
  },
  "pp:CartesianCoordinates": {
    "anchor": "wd:Q62912",
    "description": "Cartesian X/Y axes — the most common coordinate system for charts",
    "parentType": "pp:CoordinateSystem"
  },
  "pp:CausticsField": {
    "anchor": "wd:Q9185267",
    "description": "Refracted light patterns on a submerged surface. The anchor is the COMPUTER-GRAPHICS technique rather than the optics concept, because that is what this is — a rendering of caustics, not a measurement of them.",
    "parentType": "pp:ProceduralField"
  },
  "pp:CellMark": {
    "description": "Grid cell mark (heatmap, matrix, waffle) For dense matrices where the PATTERN matters more than any single value; colour carries the value, so the scale choice decides what a reader sees.",
    "parentType": "pp:MarkType"
  },
  "pp:CellularNode": {
    "anchor": null,
    "description": "Distance to the nearest of a set of scattered feature points. Its INVERSE is what reads as caustics or as the walls of a foam pattern — a structure value noise cannot produce at any octave count, which is exactly why it is a separate node and not a parameter.",
    "parentType": "pp:ShaderNode"
  },
  "pp:Character": {
    "anchor": "wd:Q95074",
    "description": "A figure that is ONE THING made of many drawn parts — addressed, placed, recoloured and directed as a unit. The graph could not say this before 2026-09-11: it could name a rigged character, a 3D world body and a drawn eye, and had no word for the ordinary case of a figure assembled from parts. Three realisations exist and they are not interchangeable: pp:RiggedCharacter is skeleton-driven (bones, IK, poses); pp:WorldCharacter is a body in a pp:World3D; and a figure composed from the design graph is a set of sibling parts bound by pp:partOfFigure, each carrying its own keyframe track. Abstract on purpose — there is no create(\"character\") and inventing one would be the phantom this file exists to prevent. The parts are made with create(\"path\") and bound by pp:partOfFigure — NOT by addParts, which writes pp:partOf and would cascade the root's position onto parts that already carry that motion in their own tracks. NO engineMethod is claimed here on purpose: there is no one call that makes a character, and naming the nearest one would send a model to the wrong door — which is the phantom in miniature. The composing door is the MCP pinepaper_character tool, which expands a concept and its beats into create + keyframe + pp:partOfFigure calls.",
    "parentType": "pp:Concept"
  },
  "pp:CharacterAction": {
    "anchor": "wd:Q1156828",
    "description": "A dynamic storytelling pose, gait, motion brick, or facial expression executed on a target pp:Character.",
    "parentType": "pp:Concept"
  },
  "pp:CharacterAsset": {
    "anchor": "schema:CreativeWork",
    "description": "Abstract: a generated character part — eyes, a skin, a rigged body. Produced by an asset generator from parameters, so it is modifiable and re-generatable rather than a fixed file.",
    "parentType": "pp:CanvasElement"
  },
  "pp:CharacterEye": {
    "anchor": null,
    "description": "A parametric eye: an outer silhouette, an optional pupil and a highlight, emitted under the eye_/pupil_ roles the expression system drives so it blinks and looks without further wiring. Not the anatomical organ — a drawn component of a character.",
    "parentType": "pp:CharacterAsset"
  },
  "pp:CharacterPart": {
    "anchor": null,
    "description": "One semantic role-bearing raster or shape component of a pp:Character bound via pp:partOf relation.",
    "parentType": "pp:CanvasElement"
  },
  "pp:CharacterSkin": {
    "anchor": null,
    "description": "A named appearance for a character body — palette plus proportions. A starting point that accepts overrides, not a fixed costume.",
    "parentType": "pp:CharacterAsset"
  },
  "pp:Chord": {
    "anchor": null,
    "description": "A renowned, instrument-agnostic frequency-ratio pattern (major, minor, dom7, maj7, min7, sus2/4, dim, aug, power) named over a root note; expands deterministically to N pp:Tone partials. \"Name it, the engine computes the frequencies\" — a weak model supplies root+kind, not Hz.",
    "parentType": "pp:Sound"
  },
  "pp:Circle": {
    "anchor": "wd:Q17278",
    "description": "The CURVE — every point at `radius` from the centre, drawn as a stroke with no interior. A circle has no width/height (passing them sizes it by the SMALLER of the two) and stays round under any scaling, where an ellipse with equal axes drifts the moment either is animated. Distinct from pp:Disk, the region this curve bounds: an item with the `circle` shape id is typed by what it PAINTS — `create('circle', { fillColor: null, strokeColor })` is a pp:Circle; `create('circle')` with any fill (the default) is a pp:Disk. Wikidata Q17278 is the curve, so this token is the outline, never the dot. Make one with the `circle-outline` shape id, whose default paint IS the curve; `regionType` points at the pp:Disk this curve bounds.",
    "parentType": "pp:CanvasShape",
    "mcpTool": "pinepaper_create_item"
  },
  "pp:CircleCollider": {
    "anchor": null,
    "description": "Circular obstacle. Bones pushed out radially when they enter the disc. Use for balls, posts, round platforms.",
    "parentType": "pp:BoneCollider"
  },
  "pp:ClosedPath": {
    "anchor": null,
    "description": "Closed path (region/boundary) — encloses area, no start/end distinction. Functionally equivalent to a shape defined by its boundary equation.",
    "parentType": "pp:Path",
    "mcpTool": "pinepaper_create_item"
  },
  "pp:CloudField": {
    "anchor": "wd:Q8074",
    "description": "Drifting volumetric cloud cover over a sky gradient. Distinct from pp:CloudShape, which is a DIAGRAM symbol: one is weather, the other is a box you put text in, and a graph that conflated them would compose nonsense.",
    "parentType": "pp:ProceduralField"
  },
  "pp:CloudShape": {
    "anchor": null,
    "description": "A cloud outline: a network or service whose internals are deliberately out of scope — the internet, a third party, anything you do not control.",
    "parentType": "pp:NetworkShape",
    "mcpTool": "pinepaper_create_diagram_shape"
  },
  "pp:CollagePattern": {
    "anchor": null,
    "description": "A named arrangement of N sibling items (grid-2x2, hero-plus-strip, editorial-split, stacked-depth). Instantiating one positions a single root and wires beside/below/on_top_of edges for the rest.",
    "parentType": "pp:CompositionPattern",
    "mcpTool": "pinepaper_compose",
    "mcpAction": "apply"
  },
  "pp:ColorEncoding": {
    "description": "Fill, stroke, or opacity — encodes category or intensity Use a sequential ramp for magnitude and distinct hues for categories — and keep categories under about seven, past which they stop being distinguishable.",
    "parentType": "pp:EncodingChannel"
  },
  "pp:ComparisonTask": {
    "description": "Compare magnitudes across categories (which is bigger?) Favours position and length: bars and dot plots. This is the most common task and the one most often served by the wrong chart.",
    "parentType": "pp:AnalyticalTask"
  },
  "pp:CompositionMode": {
    "description": "Abstract composition mode — how multiple data series are visually arranged"
  },
  "pp:CompositionPattern": {
    "anchor": "skos:Concept",
    "description": "Abstract named composition — an arrangement recipe expressed as structural relations rather than coordinates.",
    "parentType": "pp:Concept"
  },
  "pp:CompositionTask": {
    "description": "Show parts of a whole (what proportion?) Favours stacked bars or a treemap; reach for a pie only with very few parts, since angle is read poorly.",
    "parentType": "pp:AnalyticalTask"
  },
  "pp:CompoundPath": {
    "anchor": null,
    "description": "Multiple sub-paths as single item (SVG imports, boolean ops)",
    "parentType": "pp:CanvasShape"
  },
  "pp:Concept": {
    "anchor": "skos:Concept",
    "description": "Abstract conceptual resource — addressable independently of canvas items."
  },
  "pp:Connector": {
    "anchor": null,
    "description": "An edge between two diagram shapes that re-routes as they move, with configurable `routing` (direct, orthogonal, curved), head and tail arrowheads and an optional label. It binds to PORTS, not coordinates — which is why it survives layout changes and why a plain pp:Line, which does not, is the wrong tool for joining nodes.",
    "parentType": "pp:Diagram",
    "mcpTool": "pinepaper_connect"
  },
  "pp:ConstructionSequence": {
    "anchor": null,
    "description": "Ordered set of pp:ConstructionStep, played on the timeline to reveal a geometric construction one step at a time (replayable, scrubbable). Persisted as timed pp:constructionReveal relations, not a script.",
    "parentType": "pp:Concept"
  },
  "pp:ConstructionStep": {
    "anchor": null,
    "description": "One step of a pp:ConstructionSequence: the item(s) introduced at a given stepOrder, mapped to a timeline reveal time (stepOrder × stepDuration).",
    "parentType": "pp:Concept"
  },
  "pp:CoordinateSystem": {
    "description": "Abstract coordinate system for spatial data mapping (its three concrete members carry Wikidata anchors; the rest of the visualization taxonomy — marks, encoding channels, analytical tasks, composition modes — deliberately does NOT, because Vega-Lite and the Grammar of Graphics are specifications rather than published RDF vocabularies, and Wikidata has chart TYPES where we have mark PRIMITIVES. A bar mark is not a bar chart, and asserting it is would publish a claim we do not mean) The choice decides which comparisons are easy: Cartesian favours magnitude, polar favours cycles, geographic favours location."
  },
  "pp:CustomShaderEffect": {
    "anchor": null,
    "description": "A fragment shader supplied by the author and rendered over an item's silhouette. Registered at runtime through registerShaderEffect, which COMPILES AND LINKS it first and refuses it with the driver log — a shader that fails otherwise renders nothing while appearing to apply, because the error goes to a console production strips.",
    "parentType": "pp:Concept"
  },
  "pp:DataConnector": {
    "anchor": null,
    "description": "A connector carrying DATA rather than control — what is passed, not what happens next. Drawn distinctly so the two can be told apart at a glance.",
    "parentType": "pp:Connector",
    "mcpTool": "pinepaper_connect"
  },
  "pp:DataShape": {
    "anchor": null,
    "description": "A parallelogram: input or output crossing the process boundary. Distinct from pp:DatabaseShape, which is where data RESTS rather than where it moves.",
    "parentType": "pp:FlowchartShape",
    "mcpTool": "pinepaper_create_diagram_shape"
  },
  "pp:DataVisualization": {
    "anchor": "schema:CreativeWork",
    "description": "Abstract data visualization — classified along 5 orthogonal dimensions: mark primitive, coordinate system, encoding channel, analytical task, and composition mode",
    "parentType": "pp:CanvasElement"
  },
  "pp:DatabaseShape": {
    "anchor": null,
    "description": "A cylinder: a persistent data store. Signals that state SURVIVES the process, which is the distinction a reader most wants from a diagram.",
    "parentType": "pp:FlowchartShape",
    "mcpTool": "pinepaper_create_diagram_shape"
  },
  "pp:DecisionShape": {
    "anchor": null,
    "description": "A diamond: a branch point with two or more labelled outgoing edges. The labels are load-bearing — an unlabelled decision tells a reader that a choice happens but not what decides it.",
    "parentType": "pp:FlowchartShape",
    "mcpTool": "pinepaper_create_diagram_shape"
  },
  "pp:DependencyConnector": {
    "anchor": null,
    "description": "A connector meaning \"a change there may force a change here\". Conventionally dashed, because the coupling is weaker than containment but stronger than an association.",
    "parentType": "pp:Connector",
    "mcpTool": "pinepaper_connect"
  },
  "pp:Diagram": {
    "anchor": null,
    "description": "Abstract diagram domain — flowcharts, UML, network topologies. Parent of pp:DiagramShape, pp:Connector, and the flow-relation hierarchy.",
    "parentType": "pp:CanvasElement"
  },
  "pp:DiagramShape": {
    "anchor": null,
    "description": "A flowchart, UML or network node — a shape that carries PORTS, so connectors attach to it and keep tracking it when it moves. That attachment is the whole difference from the plain shape of the same outline: choose this whenever anything will be connected to it, and a plain pp:Rectangle or pp:Ellipse when nothing will.",
    "parentType": "pp:Diagram",
    "mcpTool": "pinepaper_create_diagram_shape"
  },
  "pp:Disk": {
    "anchor": "wd:Q238231",
    "description": "The plane REGION bounded by a circle — the filled dot, orb or ball, defined by `radius` alone. What almost every round shape on a canvas is, and what `create('circle')` produces by default (the id has always drawn filled); `create('disk')` says so explicitly. Its boundary is a pp:Circle; the two are typed apart because a ring and a dot are different things to a screen reader, a training corpus and a boolean operation. Wikidata Q238231, the disk (mathematics), not Q17278 the curve. `boundaryType` points back at that curve; a filled circle is a disk because filling a circle is exactly what makes the region.",
    "parentType": "pp:CanvasShape",
    "mcpTool": "pinepaper_create_item"
  },
  "pp:DistanceJoint": {
    "anchor": null,
    "description": "Fixed-length tether between two bodies — like a rigid rope. Use for tethers, pendulums and ropes; unlike a weld it permits rotation at both ends.",
    "parentType": "pp:PhysicsJoint",
    "mcpTool": "pinepaper_physics",
    "mcpAction": "create_joint"
  },
  "pp:DistributionTask": {
    "description": "Show spread or frequency of values (how is it distributed?) Favours histograms and box plots. Bin width IS the analysis — the same data tells different stories at different widths.",
    "parentType": "pp:AnalyticalTask"
  },
  "pp:DitherNode": {
    "anchor": null,
    "description": "A sub-pixel offset added before quantisation, to trade banding for noise. An 8-bit target shows visible steps across any smooth falloff; a dither node breaks the step edges so the eye integrates them away.",
    "parentType": "pp:ShaderNode"
  },
  "pp:DocumentShape": {
    "anchor": null,
    "description": "A rectangle with a wavy lower edge: a printed or reported artefact produced by the process — something a person receives, rather than data a system stores.",
    "parentType": "pp:FlowchartShape",
    "mcpTool": "pinepaper_create_diagram_shape"
  },
  "pp:DynamicBody": {
    "anchor": null,
    "description": "Fully simulated rigid body — gravity, forces, impulses, collisions all act on it.",
    "parentType": "pp:PhysicsBody",
    "mcpTool": "pinepaper_physics",
    "mcpAction": "add_body"
  },
  "pp:Ellipse": {
    "anchor": null,
    "description": "A closed oval defined by independent `width` and `height`. Choose pp:Circle when the shape must remain round; use an ellipse precisely when the two axes should differ or animate apart.",
    "parentType": "pp:CanvasShape",
    "mcpTool": "pinepaper_create_item"
  },
  "pp:EncodingChannel": {
    "description": "Abstract visual encoding channel — maps data values to perceptual properties"
  },
  "pp:Event": {
    "anchor": null,
    "description": "Named event channel — pulsed by interaction relations (on_click_fire, etc.) and listened to by reaction relations (on_event_set_property, etc.). Carries optional payload (Numeric/String/Boolean/Pulse). Frame-coherent dispatch.",
    "parentType": "pp:CanvasElement",
    "mcpTool": "pinepaper_event",
    "mcpAction": "create"
  },
  "pp:FacetedSeries": {
    "description": "Small multiples — separate panels per series Small multiples: each panel is simple and all share a scale, so comparison is across panels rather than within one. The scale must be shared or the panels lie.",
    "parentType": "pp:CompositionMode"
  },
  "pp:FlowchartShape": {
    "anchor": null,
    "description": "Abstract: shapes in flowchart notation, where the OUTLINE carries the meaning. A reader infers the role from the silhouette before reading a word, so using the wrong shape actively misinforms.",
    "parentType": "pp:DiagramShape"
  },
  "pp:FractalNode": {
    "anchor": null,
    "description": "A sum of octaves — the same noise sampled at doubling frequency and halving amplitude. This is what turns one smooth field into something with detail at every scale, which is why natural-looking terrain, cloud and fire all go through one.",
    "parentType": "pp:ShaderNode"
  },
  "pp:GeoFeature": {
    "anchor": null,
    "description": "Abstract geographic feature — regions, markers, administrative areas. Parent of pp:MapRegion and pp:Marker. Matches the GeoJSON \"feature\" concept.",
    "parentType": "pp:CanvasElement"
  },
  "pp:GeographicCoordinates": {
    "anchor": "wd:Q22664",
    "description": "Geographic lat/lon projection (choropleth, bubble map) The projection is a real decision — every one distorts something, and the usual default exaggerates area toward the poles.",
    "parentType": "pp:CoordinateSystem"
  },
  "pp:Glyph": {
    "anchor": null,
    "description": "A single character rendered as an editable vector outline (CompoundPath) — distinct from pp:Text (system-font text). Use to animate, morph, scale, or boolean a letter/digit as geometry. Emitted as custom Paper.js code (a CompoundPath per glyph).",
    "parentType": "pp:CanvasShape",
    "mcpTool": "pinepaper_execute_custom_code"
  },
  "pp:GroundCollider": {
    "anchor": null,
    "description": "Horizontal ground plane at a fixed y. Bones above this y stay above it — used for floors and standing surfaces.",
    "parentType": "pp:BoneCollider"
  },
  "pp:Group": {
    "anchor": null,
    "description": "A container whose children transform, animate and export as one unit: moving, scaling or rotating the group applies to everything inside it. Selection resolves to the group, so click-through requires ⌥/Alt. Choose pp:Precomp instead when the contents need their OWN timeline — a group shares the scene's clock and cannot loop independently.",
    "parentType": "pp:CanvasContainer"
  },
  "pp:GroupedSeries": {
    "description": "Series placed side by side for comparison Keeps every series on a common baseline so all are comparable, at the cost of width — it degrades quickly past a handful of groups.",
    "parentType": "pp:CompositionMode"
  },
  "pp:HandDrawnAnimation": {
    "anchor": "schema:VisualArtwork",
    "description": "Procedural hand-drawn canvas animation, sketchy stroke jitter, and stop-motion line reveals.",
    "parentType": "pp:Concept"
  },
  "pp:HashNode": {
    "anchor": null,
    "description": "A deterministic pseudo-random value from a coordinate — the seed of every procedural pattern here. Not random: the same input always gives the same output, which is what makes a shader reproducible frame to frame and across machines. Dave Hoskins' family, chosen over the naive sin-based hash because that one shows axis-aligned artefacts at low frequency, and an aura is often only 200px across.",
    "parentType": "pp:ShaderNode"
  },
  "pp:Heatmap": {
    "description": "Heatmap — cell marks with color encoding for matrix data For dense matrices where the pattern matters more than any single cell; the colour scale decides what a reader sees.",
    "parentType": "pp:DataVisualization",
    "mcpTool": "pinepaper_create_chart",
    "mcpAction": "create"
  },
  "pp:HierarchyTask": {
    "description": "Show nested structure (how is it organized?) Favours treemaps, sunbursts and node-link trees. Treemaps show magnitude well and structure poorly; node-link trees do the reverse.",
    "parentType": "pp:AnalyticalTask"
  },
  "pp:Histogram": {
    "description": "Histogram — binned bar chart showing value distribution Bin width is the analysis, not a display detail — the same data tells different stories at different widths.",
    "parentType": "pp:DataVisualization",
    "mcpTool": "pinepaper_create_chart",
    "mcpAction": "create"
  },
  "pp:IKChain": {
    "anchor": null,
    "description": "Inverse-kinematics chain on a skeleton — ordered bones + solver (fabrik / two_bone / ccd), optional pole vector, optional driving target item.",
    "parentType": "pp:Concept",
    "mcpTool": "pinepaper_rigging",
    "mcpAction": "create_ik_chain"
  },
  "pp:IKTargetPath": {
    "anchor": null,
    "description": "A spatial motion PATH (Lottie ti/to-style waypoints with bezier tangents) that an IK chain's effector follows, so it travels an ARC instead of a straight line to a static target. Temporal ease (pp:TimingCurve) is orthogonal to this spatial curvature.",
    "parentType": "pp:Concept",
    "mcpTool": "pinepaper_rigging",
    "mcpAction": "set_target_path"
  },
  "pp:Image": {
    "anchor": "schema:ImageObject",
    "description": "A raster bitmap placed from `src` — pixels, not vectors, so it does not scale infinitely and cannot be morphed or path-animated. `crossOrigin` defaults to 'anonymous' so a CORS-friendly host keeps exports untainted; a non-CORS host fails VISIBLY as an empty slot rather than silently tainting every export of the scene.",
    "parentType": "pp:CanvasElement"
  },
  "pp:IndexedStore": {
    "anchor": null,
    "description": "Asynchronous structured storage, large enough for scene-sized state. Resolves LATER than the frame that asked, so it suits loading and saving rather than per-frame reads — that asynchrony is the whole reason it is a separate type from pp:LocalStore.",
    "parentType": "pp:Store"
  },
  "pp:IntroScene": {
    "anchor": "schema:VisualArtwork",
    "description": "Motion scene configured for title reveals, openers, and intro presentation hooks.",
    "parentType": "pp:MotionScene"
  },
  "pp:KinematicBody": {
    "anchor": null,
    "description": "Animation-driven rigid body — ignores forces but pushes dynamic bodies. Used for animated platforms, controlled characters.",
    "parentType": "pp:PhysicsBody",
    "mcpTool": "pinepaper_physics",
    "mcpAction": "add_body"
  },
  "pp:LayeredSeries": {
    "description": "Series overlaid with transparency Preserves each series' own baseline, but overlapping fills obscure one another; best with two or three.",
    "parentType": "pp:CompositionMode"
  },
  "pp:LetterCollage": {
    "anchor": null,
    "description": "Text rebuilt as per-letter artwork so each character can be styled independently — tiles, magazine cut-out, gradient fills. It REPLACES the text item, so apply it once the wording is settled; the letters are hit-tested by their ink, not by a bounding box.",
    "parentType": "pp:CanvasText",
    "mcpTool": "pinepaper_create_item"
  },
  "pp:Line": {
    "anchor": null,
    "description": "An open two-point path from `from` to `to`, drawn with `strokeColor`/`strokeWidth` and NOT filled — a fill on an open path renders as the region between its endpoints, which is rarely what is wanted. Choose pp:Connector when the line joins two diagram nodes and should follow them; a plain line is fixed in place and will not.",
    "parentType": "pp:CanvasShape",
    "mcpTool": "pinepaper_create_item"
  },
  "pp:LineChart": {
    "description": "Line chart — connected marks showing trends over a continuous axis",
    "parentType": "pp:DataVisualization",
    "mcpTool": "pinepaper_create_chart",
    "mcpAction": "create"
  },
  "pp:LineMark": {
    "description": "Connected trajectory mark (line, step, spline) Connecting points asserts CONTINUITY between them, so it is wrong for unordered categories no matter how good it looks.",
    "parentType": "pp:MarkType"
  },
  "pp:LocalStore": {
    "anchor": null,
    "description": "Synchronous key/value storage of strings, around 5 MB. Readable and writable during a frame, which is why a counter can increment on click and be read in the same tick. Shares the HOST PAGE's origin, so keys are namespaced and nothing private belongs here.",
    "parentType": "pp:Store"
  },
  "pp:MapRegion": {
    "anchor": null,
    "description": "A rendered region shape on a map, filled and selectable. Unanchored for the same reason as pp:Marker: the drawn polygon DEPICTS an administrative area, it is not one, and rdfs:subClassOf would say it is.",
    "parentType": "pp:GeoFeature",
    "mcpTool": "pinepaper_map",
    "mcpAction": "load"
  },
  "pp:MarkType": {
    "description": "Abstract mark primitive — the visual element used to represent data points"
  },
  "pp:Marker": {
    "anchor": null,
    "description": "A pin drawn on a map at a geographic coordinate. Deliberately UNANCHORED: `anchor` compiles to rdfs:subClassOf, and a marker is a graphical annotation that POINTS AT a place — it is not one. Asserting schema:Place would publish that every marker has an address and real-world coordinates, when what it has is a fill colour and a canvas position.",
    "parentType": "pp:GeoFeature",
    "mcpTool": "pinepaper_map_regions",
    "mcpAction": "add_marker"
  },
  "pp:MaskedItem": {
    "anchor": null,
    "description": "An item clipped to a mask shape, existing as a composite of the two. The registry identity follows the COMPOSITE rather than the original, which is why relations pointing at the item keep working after a mask is applied.",
    "parentType": "pp:CanvasElement",
    "mcpTool": "pinepaper_apply_custom_mask"
  },
  "pp:MediaRef": {
    "anchor": null,
    "description": "Shared media handle for a video / audio source. Multiple clips can reference the same source — two timeline copies of one uploaded video share one MediaRef. Use this to deduplicate media across a scene and across exports.",
    "parentType": "pp:Concept"
  },
  "pp:MotionScene": {
    "anchor": "schema:VisualArtwork",
    "description": "Dynamic 2.5D vector motion canvas scene containing animation, procedural backgrounds, shaders, and audio synthesis.",
    "parentType": "pp:CanvasElement"
  },
  "pp:MovingHold": {
    "anchor": null,
    "description": "A pose hold that slowly DRIFTS toward the next key (by a small holdDrift) instead of dead-stopping — keeps a held pose alive and anticipating the next action.",
    "parentType": "pp:Concept",
    "mcpTool": "pinepaper_rigging",
    "mcpAction": "add_pose_keyframe"
  },
  "pp:NetworkShape": {
    "anchor": null,
    "description": "Abstract: shapes in network-topology notation, where the subject is what CONNECTS to what rather than what happens first.",
    "parentType": "pp:DiagramShape"
  },
  "pp:NoiseNode": {
    "anchor": null,
    "description": "Band-limited continuous noise: smooth between lattice points, random at them. The difference from a hash is interpolation — a hash is discontinuous everywhere, so it reads as static; a noise node reads as cloud, smoke or flow.",
    "parentType": "pp:ShaderNode"
  },
  "pp:OceanField": {
    "anchor": "wd:Q9430",
    "description": "Animated water surface with depth-graded colour and a sun glint. Anchored to the ocean as a thing, so a walk can compose over it — a boat ON an ocean is a relation between two nodes, which it cannot be if the water is only a property of the canvas.",
    "parentType": "pp:ProceduralField"
  },
  "pp:OpenPath": {
    "anchor": null,
    "description": "Open path (trajectory/stroke) — has start and end points, does not enclose area. Defined by curveType: the mathematical function governing its segments.",
    "parentType": "pp:Path",
    "mcpTool": "pinepaper_create_item"
  },
  "pp:OutroScene": {
    "anchor": "schema:VisualArtwork",
    "description": "Motion scene configured for call-to-action, summaries, and closing presentation frames.",
    "parentType": "pp:MotionScene"
  },
  "pp:ParallelCoordinates": {
    "description": "Parallel axes for multivariate comparison For multivariate data where relationships BETWEEN axes matter; axis ORDER changes which relationships are visible, so it is part of the analysis.",
    "parentType": "pp:CoordinateSystem"
  },
  "pp:Path": {
    "anchor": null,
    "description": "Vector path — semantically incomplete without open/closed distinction. Defined by its curveType (mathematical function family). Refined to OpenPath or ClosedPath during graph extraction.",
    "parentType": "pp:CanvasShape",
    "mcpTool": "pinepaper_create_item"
  },
  "pp:PathSkinning": {
    "anchor": null,
    "description": "Per-vertex bone-weight binding of a Path or CompoundPath to a skeleton — linear blend skinning in 2D. Each path segment carries a list of (boneId, weight) influences, computed once at skin time from vertex-to-bone distances. Use for cloth, capes, and any deformable surface that should flex with the underlying rig.",
    "parentType": "pp:Concept"
  },
  "pp:Pattern": {
    "anchor": null,
    "description": "Repeating decorative field (scanlines, stripes, grid, dots) materialized as ONE item — a single CompoundPath tiling an area. The scale-safe form of what would otherwise be hundreds of individual primitives.",
    "parentType": "pp:CanvasShape",
    "mcpTool": "pinepaper_create_item"
  },
  "pp:PhysicsBody": {
    "anchor": null,
    "description": "Box2D rigid body attached to a canvas item. Subtype determines simulation behavior: static (immobile), dynamic (full sim), kinematic (animation-driven, can push dynamics).",
    "parentType": "pp:Concept",
    "mcpTool": "pinepaper_physics",
    "mcpAction": "add_body"
  },
  "pp:PhysicsGround": {
    "anchor": null,
    "description": "Convenience static body at the bottom of the canvas — provides a floor for dynamic bodies to land on.",
    "parentType": "pp:StaticBody",
    "mcpTool": "pinepaper_physics",
    "mcpAction": "create_ground"
  },
  "pp:PhysicsJoint": {
    "anchor": null,
    "description": "Constraint between two physics bodies. Subtype determines the degrees of freedom allowed.",
    "parentType": "pp:Concept",
    "mcpTool": "pinepaper_physics",
    "mcpAction": "create_joint"
  },
  "pp:PieChart": {
    "description": "Pie chart — arc marks in polar coordinates showing part-to-whole",
    "parentType": "pp:DataVisualization",
    "mcpTool": "pinepaper_create_chart",
    "mcpAction": "create"
  },
  "pp:PlasmaField": {
    "anchor": "wd:Q661134",
    "description": "Domain-warped fractal noise through a cosine palette — the demoscene plasma, which is what the anchor names: a DEMO EFFECT, not the physical state of matter (that is a different Wikidata concept and anchoring to it would be a category error a model would then repeat).",
    "parentType": "pp:ProceduralField"
  },
  "pp:PointMark": {
    "description": "Discrete position mark (scatter, bubble, dot) Position is read accurately, so scatter is the right mark for correlation; it degrades fastest under overplotting.",
    "parentType": "pp:MarkType"
  },
  "pp:PolarCoordinates": {
    "anchor": "wd:Q62494",
    "description": "Polar angle/radius coordinates (pie, radar, rose charts) Makes cyclical structure obvious and magnitudes hard, since radius encodes area rather than length.",
    "parentType": "pp:CoordinateSystem"
  },
  "pp:Polygon": {
    "anchor": null,
    "description": "A regular N-sided shape defined by `sides` (3 or more) and `radius` — every side and interior angle equal. Choose pp:Path when the outline is irregular; a polygon cannot express one, and forcing it produces a shape that silently ignores the vertices you meant.",
    "parentType": "pp:CanvasShape",
    "mcpTool": "pinepaper_create_item"
  },
  "pp:Pose": {
    "anchor": null,
    "description": "Named bone-angle map saved on a skeleton, addressable by id. Multiple poses per skeleton form a pose library.",
    "parentType": "pp:Concept",
    "mcpTool": "pinepaper_rigging",
    "mcpAction": "save_pose"
  },
  "pp:PoseOverlap": {
    "anchor": null,
    "description": "Per-bone timing offsets on a pose keyframe { boneId: lag∈[0,0.95) } — lagged bones trail during the transition so the tip drags the root: overlapping action / follow-through / drag (e.g. a \"delay foot\" on a kick).",
    "parentType": "pp:Concept",
    "mcpTool": "pinepaper_rigging",
    "mcpAction": "add_pose_keyframe"
  },
  "pp:PositionEncoding": {
    "description": "Position on x/y axes — highest-bandwidth encoding Use it for the most important variable — nothing else is read as precisely.",
    "parentType": "pp:EncodingChannel"
  },
  "pp:Precomp": {
    "anchor": null,
    "description": "A nested composition with its OWN timeline, so its contents can loop independently of the scene clock. That local clock is the whole difference from pp:Group, which shares the scene's time and cannot.",
    "parentType": "pp:CanvasContainer",
    "mcpTool": "pinepaper_precomp",
    "mcpAction": "create"
  },
  "pp:PreparationShape": {
    "anchor": null,
    "description": "A hexagon: initialisation or setup performed before the main flow — declaring a variable, opening a connection. Separating it keeps the main path readable.",
    "parentType": "pp:FlowchartShape",
    "mcpTool": "pinepaper_create_diagram_shape"
  },
  "pp:ProceduralField": {
    "anchor": "wd:Q3519388",
    "description": "A full-canvas surface whose pixels are COMPUTED rather than drawn — a generator's output, materialized as one raster the registry holds under its own id. It is a PLACE, not a decoration, and that distinction is the reason it is a node at all: a tunnel is a thing you can put something inside, so a rigged figure can run through one and a boat can sit on an ocean. A pp:ShaderEffectRelation, by contrast, is applied TO an item and dies with it. NOISE PROVENANCE: these programs call the SHARED pp:ShaderNode primitives from js/gpu/AuraNoiseGLSL.js, so a walk can descend from a field to the maths that draws it. Each used to inline its own hash and value noise — a third family beside the original auras' inline set and the shared one — which meant no usesShaderNode edge could be declared for any of them; that was corrected 2026-09-11 by porting them onto the shared module. pp:OceanField and pp:TunnelField declare no edge and that is not an omission: one is a sum of sine waves and the other a rotation, and neither hashes anything.",
    "parentType": "pp:CanvasElement"
  },
  "pp:ProcessShape": {
    "anchor": null,
    "description": "A rectangle: an action or step that DOES something. The default flowchart node — reach for another shape only when the step is not a plain action.",
    "parentType": "pp:FlowchartShape",
    "mcpTool": "pinepaper_create_diagram_shape"
  },
  "pp:RectCollider": {
    "anchor": null,
    "description": "Axis-aligned rectangular obstacle. Bones pushed out to the nearest edge. Use for boxes, walls, platforms.",
    "parentType": "pp:BoneCollider"
  },
  "pp:Rectangle": {
    "anchor": null,
    "description": "A closed four-sided shape defined by `width` and `height`, with optional `cornerRadius` for rounded corners. The default container for panels, cards, bars and backdrops. Choose pp:DiagramShape instead when the rectangle is a NODE that connectors should attach to — a plain rectangle has no ports, so a connector aimed at it will not track it.",
    "parentType": "pp:CanvasShape",
    "mcpTool": "pinepaper_create_item"
  },
  "pp:RelationshipTask": {
    "description": "Show correlation between variables (how do they relate?) Favours scatter plots. Beware of implying causation from a visible correlation — the chart cannot distinguish them.",
    "parentType": "pp:AnalyticalTask"
  },
  "pp:RevoluteJoint": {
    "anchor": null,
    "description": "Hinge joint — bodies pivot around a shared anchor point with optional motor and angle limits.",
    "parentType": "pp:PhysicsJoint",
    "mcpTool": "pinepaper_physics",
    "mcpAction": "create_joint"
  },
  "pp:RiggedCharacter": {
    "anchor": "wd:Q1813564",
    "description": "A character whose parts are bound to a skeleton, so a pose or a walk cycle drives the artwork. Anchored on skeletal animation — the technique that defines it.",
    "parentType": "pp:CharacterAsset"
  },
  "pp:ScatterPlot": {
    "description": "Scatter plot — point marks encoding two quantitative variables as position",
    "parentType": "pp:DataVisualization",
    "mcpTool": "pinepaper_create_chart",
    "mcpAction": "create"
  },
  "pp:ScatteringNode": {
    "anchor": null,
    "description": "A light-response term: how much light leaves a surface or a volume in the view direction. These are the nodes that make a shaded thing read as a MATERIAL rather than as a coloured blur.",
    "parentType": "pp:ShaderNode"
  },
  "pp:SceneAction": {
    "anchor": null,
    "description": "Single scheduled action inside a pp:SceneScript. Concrete subtypes are the composable character verbs (move/jump/crouch/idle/custom). All actions accept a duration (seconds) at the SceneScript level controlling how long they remain active.",
    "parentType": "pp:Concept"
  },
  "pp:SceneScript": {
    "anchor": null,
    "description": "Time-orchestrated container of character actions on a timeline. Loops, plays at variable speed, seekable.",
    "parentType": "pp:Concept",
    "mcpTool": "pinepaper_create_scene"
  },
  "pp:SequenceConnector": {
    "anchor": null,
    "description": "A connector carrying CONTROL flow — what happens next. The default flowchart edge; a solid arrow means the process continues along it.",
    "parentType": "pp:Connector",
    "mcpTool": "pinepaper_connect"
  },
  "pp:ServerShape": {
    "anchor": null,
    "description": "A host that runs something. The concrete counterpart to pp:CloudShape: this is infrastructure you own and can reason about.",
    "parentType": "pp:NetworkShape",
    "mcpTool": "pinepaper_create_diagram_shape"
  },
  "pp:ShaderMesh": {
    "anchor": "wd:Q1154597",
    "description": "Geometry in a 3D world drawn by an author-supplied vertex and fragment program. Unlike pp:WorldObject, which is a box with a colour, its SHAPE and its SHADING are both the author's: vertices and triangles supplied as data, transformed by a vertex program that may displace them per frame. A registry citizen under its own id, so relations can target it — anchor a label to a procedural surface, or drive its uniforms from an event.",
    "parentType": "pp:WorldObject"
  },
  "pp:ShaderNode": {
    "anchor": null,
    "description": "A named, reusable GPU shading function — the level BELOW an effect. An effect (pp:effectCaustics) is a whole program with a look; a shader node is one term inside it, with a signature and a formula, that several programs share. Naming this level is what lets the graph answer “what is caustics MADE of” rather than only “this item has caustics”, and what lets a walk recombine terms into a program nobody wrote. Abstract: every instance is one of the role subtypes below.",
    "parentType": "pp:Concept"
  },
  "pp:ShapeEncoding": {
    "description": "Point shape or dash pattern — encodes category Robust in print and greyscale where colour is not, but slow to read; best for a small number of categories.",
    "parentType": "pp:EncodingChannel"
  },
  "pp:ShapeKey": {
    "anchor": null,
    "description": "Per-item visual delta (segments, opacity, color, size) saved on a skeleton with a rest baseline. Weighted blends drive facial-style animation.",
    "parentType": "pp:Concept",
    "mcpTool": "pinepaper_rigging",
    "mcpAction": "save_shape_key"
  },
  "pp:SingleSeries": {
    "description": "One data series displayed alone The clearest option; add a second series only when the comparison is the point.",
    "parentType": "pp:CompositionMode"
  },
  "pp:SizeEncoding": {
    "description": "Width, height, or radius — encodes magnitude Area is systematically UNDER-estimated by readers, so size exaggerates differences unless the scale corrects for it.",
    "parentType": "pp:EncodingChannel"
  },
  "pp:Skeleton": {
    "anchor": null,
    "description": "A hierarchy of bones that drives artwork bound to it. Poses, walk cycles and expression presets are all defined against a skeleton's bone NAMES, so the naming is what makes stock animation work without per-character wiring.",
    "parentType": "pp:CanvasContainer",
    "mcpTool": "pinepaper_rigging",
    "mcpAction": "create_skeleton"
  },
  "pp:Sound": {
    "anchor": "schema:AudioObject",
    "description": "A synthesized audio source in the graph — a named voice whose value is a continuous waveform signal (ExpressionIR) over a [t0,t1] window, rendered by the Web Audio renderer. The synthesis counterpart to the sample-based pp:AudioClip; can hold a single tone, a chord, or an arbitrary partial set.",
    "parentType": "pp:CanvasElement"
  },
  "pp:SpatialTask": {
    "description": "Show geographic distribution (where?) Favours a map, but only when LOCATION is the variable; when it is merely an attribute, a bar chart usually reads better than a map.",
    "parentType": "pp:AnalyticalTask"
  },
  "pp:SpriteAnimation": {
    "anchor": null,
    "description": "Named playback cycle in a pp:SpriteSheet — ordered list of frame names, playback FPS, loop flag, and direction (forward / reverse / pingpong). Game engines and PinePaper's built-in player consume this for character animation.",
    "parentType": "pp:Concept"
  },
  "pp:SpriteFrame": {
    "anchor": null,
    "description": "Single frame inside a pp:SpriteSheet — a captured raster of the rigged character at one pose. Has a name, source rect in the atlas, trim metadata, and the original capture bounds.",
    "parentType": "pp:Concept"
  },
  "pp:SpritePlayer": {
    "anchor": null,
    "description": "Runtime playback session for a pp:SpriteAnimation on the canvas. Owns the per-frame delta-time accumulator, the current frame index, and the Raster item displaying the active frame. Use to play a generated atlas back on the canvas without re-rigging.",
    "parentType": "pp:Concept",
    "mcpTool": "pinepaper_sprite_sheet",
    "mcpAction": "play"
  },
  "pp:SpriteSheet": {
    "anchor": "schema:ImageObject",
    "description": "Atlas+metadata package generated by rendering a rigged character across multiple poses or an animation timeline. Contains the packed image (TexturePacker JSON Hash format), per-frame uv data, and named animation cycles (e.g., walk / run / idle). Use to ship character animation as a single image for game engines or pre-rendered playback.",
    "parentType": "pp:CanvasElement",
    "mcpTool": "pinepaper_sprite_sheet",
    "mcpAction": "generate"
  },
  "pp:StackedBarChart": {
    "description": "Stacked bar chart — bars subdivided by category showing composition",
    "parentType": "pp:BarChart",
    "mcpTool": "pinepaper_create_chart",
    "mcpAction": "create"
  },
  "pp:StackedSeries": {
    "description": "Series stacked vertically (cumulative) Makes the TOTAL easy to read and every series except the bottom one hard, because only the first shares a baseline.",
    "parentType": "pp:CompositionMode"
  },
  "pp:Star": {
    "anchor": null,
    "description": "Star shape (geometrically: concave polygon with alternating radii)",
    "parentType": "pp:CanvasShape",
    "mcpTool": "pinepaper_create_item"
  },
  "pp:StarfieldField": {
    "anchor": null,
    "description": "Multi-layer parallax starfield with hash-distributed, twinkling stars. Anchored to NOTHING on purpose: 'star field' as a rendered motif has no clean Wikidata concept — the searches return albums and video games — and a plausible-looking wrong anchor is worse than none, because the graph is training data and a wrong anchor is believed.",
    "parentType": "pp:ProceduralField"
  },
  "pp:StaticBody": {
    "anchor": null,
    "description": "Immobile rigid body — collides with dynamics but never moves under force. Used for walls and obstacles.",
    "parentType": "pp:PhysicsBody",
    "mcpTool": "pinepaper_physics",
    "mcpAction": "add_body"
  },
  "pp:Stitchcraft": {
    "anchor": "schema:VisualArtwork",
    "description": "Procedural embroidery, thread painting, seam lines, satin fills, and cross-stitch artwork applied onto canvas vector items.",
    "parentType": "pp:CanvasElement"
  },
  "pp:Store": {
    "anchor": null,
    "description": "Abstract: persistent state a scene can read and write, surviving a page reload. Addressable and non-visual — it exists so a relation has somewhere to put a value, which is what keeps saving a score an assertion rather than a script.",
    "parentType": "pp:CanvasElement"
  },
  "pp:Template": {
    "anchor": "schema:VisualArtwork",
    "description": "A complete authored scene, loadable as a starting point and parameterisable. Templates are the engine's worked examples — they exercise the same public API a caller has, so anything a template does is reproducible."
  },
  "pp:TerminalShape": {
    "anchor": null,
    "description": "A stadium/rounded form: where a process STARTS or ENDS. Conventionally exactly one start; multiple ends are normal and often clearer than funnelling every path together.",
    "parentType": "pp:FlowchartShape",
    "mcpTool": "pinepaper_create_diagram_shape"
  },
  "pp:Text": {
    "anchor": "schema:CreativeWork",
    "description": "A run of characters rendered as vector glyphs, sized by `fontSize` and set in `fontFamily`. The only type whose content is language, so it carries the scene's meaning and is what a screen reader announces. `contentType` makes it LIVE — clock, timer, countdown, stopwatch — updating itself without any animation attached. Becomes pp:LetterCollage when a Text Style is applied and pp:TextEffect when split per character; both REPLACE the text item, so reach for them last.",
    "parentType": "pp:CanvasText",
    "mcpTool": "pinepaper_create_item"
  },
  "pp:TextEffect": {
    "anchor": "wd:Q638636",
    "description": "A character-level text animation: one text item decomposed into per-character glyphs that arrive under a named effect (scattered, matrix, decrypt…). The composition is addressed through its ROOT glyph, which carries the content, font and origin it was built from — so the effect can be changed without retyping the text.",
    "parentType": "pp:CanvasText"
  },
  "pp:TextEffectGlyph": {
    "anchor": null,
    "description": "One character of a pp:TextEffect. An ordinary text item with its own keyframes; it points back at the composition root through pp:glyphOf, which is what lets the whole effect be re-targeted or removed as a unit.",
    "parentType": "pp:CanvasText"
  },
  "pp:TextEncoding": {
    "description": "Label content — encodes identity or value States a value exactly instead of encoding it, so it does not scale: a label per datum stops being readable long before the chart does.",
    "parentType": "pp:EncodingChannel"
  },
  "pp:TextMark": {
    "description": "Data-positioned text mark (word cloud, label) The only mark that states its value exactly rather than encoding it — use it where precision beats comparison, and sparingly, because text does not scan.",
    "parentType": "pp:MarkType"
  },
  "pp:TimingCurve": {
    "anchor": null,
    "description": "A per-segment cubic-bezier ease { o:{x,y}, i:{x,y} } from [0,0]→[1,1] with y UNCLAMPED, so overshoot/anticipation are representable — a Disney timing/spacing chart as data. Schema-aligned with the LLM timing-deformation-graph spec (Lottie o/i tangents). Overrides the named ease on a pose keyframe.",
    "parentType": "pp:Concept",
    "mcpTool": "pinepaper_rigging",
    "mcpAction": "add_pose_keyframe"
  },
  "pp:Tone": {
    "anchor": null,
    "description": "A single synthesized voice: a pitch (note or base frequency), a timbre (waveform → additive harmonic partials), an ADSR envelope, gain, and pan. The atomic building block of a pp:Sound.",
    "parentType": "pp:Sound"
  },
  "pp:TransitionScene": {
    "anchor": "schema:VisualArtwork",
    "description": "Motion scene configured as a dynamic transition layer or section break.",
    "parentType": "pp:MotionScene"
  },
  "pp:TrendTask": {
    "description": "Show change over time (how does it evolve?) Favours a continuous horizontal axis with lines; the aspect ratio materially changes how steep a trend appears, so it is a real choice.",
    "parentType": "pp:AnalyticalTask"
  },
  "pp:Triangle": {
    "anchor": null,
    "description": "A closed three-sided shape. Beyond `width`/`height` it accepts `kind` — right, equilateral, isosceles, obtuse, acute, scalene — or an explicit `angles` array, so the shape can be specified by its geometry rather than by computing vertices. Angles that nearly sum to 180 are normalised rather than refused.",
    "parentType": "pp:CanvasShape",
    "mcpTool": "pinepaper_create_item"
  },
  "pp:TunnelField": {
    "anchor": "wd:Q44377",
    "description": "An infinite perspective tunnel. The clearest case for fields being nodes: 'a figure running inside the tunnel' is a relation between a rigged skeleton and this, and there is no way to say it if the tunnel is a property rather than a thing.",
    "parentType": "pp:ProceduralField"
  },
  "pp:UMLActorShape": {
    "anchor": null,
    "description": "A stick figure: a role OUTSIDE the system that interacts with it — a person, or another system. It marks the boundary of what is being designed.",
    "parentType": "pp:UMLShape",
    "mcpTool": "pinepaper_create_diagram_shape"
  },
  "pp:UMLClassShape": {
    "anchor": null,
    "description": "A three-compartment box — name, attributes, operations. The compartments are the notation: collapsing them loses the distinction between what a class HAS and what it DOES.",
    "parentType": "pp:UMLShape",
    "mcpTool": "pinepaper_create_diagram_shape"
  },
  "pp:UMLShape": {
    "anchor": null,
    "description": "Abstract: shapes in UML notation, where both the shape AND the connector style are formally defined. Unlike a flowchart, UML meanings are standardised, so a wrong arrowhead states something specific and false.",
    "parentType": "pp:DiagramShape"
  },
  "pp:UMLUseCaseShape": {
    "anchor": null,
    "description": "An ellipse: a goal the system fulfils for an actor, named as a verb phrase from the actor's point of view. It describes an outcome, not an implementation step.",
    "parentType": "pp:UMLShape",
    "mcpTool": "pinepaper_create_diagram_shape"
  },
  "pp:Unclassified": {
    "anchor": null,
    "description": "Item type not expressible in current vocabulary. Enables vocabulary gap discovery — count and inspect unclassified items to identify missing types.",
    "parentType": "pp:CanvasElement"
  },
  "pp:VideoClip": {
    "anchor": "schema:VideoObject",
    "description": "Video media item — frame-sampled raster source with playhead, in/out trim, and optional per-frame GPU filters. Referenced by pp:MediaRef handle.",
    "parentType": "pp:CanvasElement",
    "mcpTool": "pinepaper_media",
    "mcpAction": "upload_video"
  },
  "pp:VoronoiField": {
    "anchor": "wd:Q757267",
    "description": "Cellular partition of the plane by nearest feature point. The anchor is the Voronoi diagram itself, the mathematics the image IS rather than a lookalike.",
    "parentType": "pp:ProceduralField"
  },
  "pp:WeldJoint": {
    "anchor": null,
    "description": "Rigidly fuses two bodies — eliminates relative motion. Used for compound objects.",
    "parentType": "pp:PhysicsJoint",
    "mcpTool": "pinepaper_physics",
    "mcpAction": "create_joint"
  },
  "pp:World3D": {
    "anchor": "wd:Q107307154",
    "description": "A BOUNDED procedural volume rendered under the canvas: a square heightfield of `terrain.size` across with sky above it — a cuboid extent, not an open or shared world. Seeded terrain, scattered props and lighting, addressed as a parameter set rather than as geometry. Anchored on virtual place (any digitally created environment); NOT wd:Q444835 virtual world, whose sense is a multi-user simulated environment and which this is not.",
    "parentType": "pp:CanvasContainer",
    "mcpTool": "pinepaper_world3d",
    "mcpAction": "create"
  },
  "pp:WorldCharacter": {
    "anchor": "wd:Q1062345",
    "description": "A controllable body in a 3D world — walks, jumps and collides with the terrain. Drivable by keyboard, timeline, relations or an agent.",
    "parentType": "pp:CanvasElement",
    "mcpTool": "pinepaper_world3d",
    "mcpAction": "add_actor"
  },
  "pp:WorldLight": {
    "anchor": "wd:Q1146001",
    "description": "A point light placed in a 3D world: a position, a colour, an intensity and a RANGE at which its contribution reaches exactly zero. A light as an OBJECT rather than a constant — addressable, so a relation can move it and a lamp that follows a character is an edge rather than a special case in the renderer. Casts no shadow: each shadow-casting light doubles the geometry passes, and the sun remains the single directional caster.",
    "parentType": "pp:CanvasElement"
  },
  "pp:WorldMaterial": {
    "anchor": null,
    "description": "A named, SHARED surface description referenced by many world objects: one node, many users, so a single edit restyles all of them. That sharing is the whole point — a per-object colour already existed, and a material that styled one thing would be a rename rather than a capability. Carries colour and emissive, and — since js/world3d/PBR.js landed a real Cook-Torrance GGX BRDF — metalness and roughness, in Three.js's names and with Three.js's defaults, so a material authored against Three, Blender or Substance means the same thing here. WHERE THEY ACTUALLY RENDER is the part an agent must not guess: metalness and roughness reach the shader ONLY on the mesh path (addWorldMesh, and imported OBJ/glTF, which ride them through the uniforms bag into DEFAULT_MESH_FRAG). A plain pp:WorldObject — a box or a scattered prop — is drawn by PART_FRAG/PROP_FRAG, which shade with the older lambert term and declare no such uniform, so a material's metalness on a box is stored, listed and ignored. emissiveIntensity IS read: World3D scales the material's emissive by it before the frame is built, so it reaches every path that draws emissive. aoMapIntensity, normalScale and envMapIntensity have been REMOVED — each one scales a MAP, and there is no aoMap, no normalMap and no envMap; a knob that scales nothing is the claim-about-nothing defect wearing a Three.js name, and being Three's spelling does not make it real. They come back with the maps they scale, together, and not before. (This sentence previously said all four were accepted-but-inert. That was true when written and false from the moment emissiveIntensity was wired and the other three deleted; it is corrected here rather than quietly dropped, because a drifted claim is worse than a missing one.) clearcoat, clearcoatRoughness, sheenColor and sheenRoughness are REAL on the mesh path and carry Three's names and Three's defaults, which are inert: clearcoat 0 and a black sheenColor mean a material authored before they existed lights identically. Clearcoat is a second, always-DIELECTRIC specular lobe with its own roughness — a clearcoated metal shows a white highlight over a coloured one, which is what separates a coat from extra gloss — and it ATTENUATES the base beneath it, because light the coat reflects never reaches the base. Sheen is the Charlie retroreflective lobe that peaks at GRAZING angles, where GGX cannot reach at any roughness; it is what makes cloth read as cloth. Both are additive over the same Cook-Torrance evaluation and, like metalness and roughness, reach the shader ONLY on the mesh path. transmission, ior, thickness and opacity are ABSENT, and for one shared reason rather than as an oversight: each needs depth-sorted transparency, which this renderer does not have. They are named here so an agent learns the GATE rather than guessing the knob was forgotten. setMaterial patches colour, emissive, metalness, roughness, emissiveIntensity, clearcoat, clearcoatRoughness, sheenColor and sheenRoughness. Anchored to nothing: a plausible-looking Wikidata concept would be worse than none.",
    "parentType": "pp:CanvasElement"
  },
  "pp:WorldObject": {
    "anchor": null,
    "description": "An object placed at chosen coordinates in a 3D world, as opposed to procedurally scattered.",
    "parentType": "pp:CanvasElement",
    "mcpTool": "pinepaper_world3d",
    "mcpAction": "add_object"
  },
  "pp:WorldTerrain": {
    "anchor": "wd:Q271669",
    "description": "The heightfield a world is built on — seed, size, amplitude and relief. One height function serves both the mesh and collision.",
    "parentType": "pp:CanvasElement"
  },
  "pp:actionCrouch": {
    "anchor": null,
    "description": "Crouched pose hold for the action duration. No parameters — the pose is fixed; duration is set on the SceneAction wrapper.",
    "parentType": "pp:SceneAction"
  },
  "pp:actionIdle": {
    "anchor": null,
    "description": "Idle / rest pose hold for the action duration. No parameters — clears velocity and returns to the idle pose.",
    "parentType": "pp:SceneAction"
  },
  "pp:actionJump": {
    "anchor": null,
    "description": "Parabolic-arc jump with anticipation and landing squash. Height/duration parametrize the arc; gravity is derived to make the character return to ground after `duration` seconds.",
    "parentType": "pp:SceneAction"
  },
  "pp:actionMoveLeft": {
    "anchor": null,
    "description": "Walk-cycle action toward negative-X. Per-tick displacement = speed*delta. Defaults: speed=120 px/s, so 2 px/frame at 60 Hz.",
    "parentType": "pp:SceneAction"
  },
  "pp:actionMoveRight": {
    "anchor": null,
    "description": "Walk-cycle action toward positive-X. Per-tick displacement = speed*delta. Defaults: speed=120 px/s, so 2 px/frame at 60 Hz.",
    "parentType": "pp:SceneAction"
  },
  "pp:ppFbm2": {
    "anchor": "wd:Q1143293",
    "description": "Fractional Brownian motion over value noise — the standard octave sum. The loop is bounded at 8 with an early break rather than running to `octaves`, because a GLSL loop bound must be a constant.",
    "parentType": "pp:FractalNode"
  },
  "pp:ppHash11": {
    "anchor": null,
    "description": "One float in, one pseudo-random float in [0,1) out. The cheapest seed in the set — used per-column or per-step to vary a value that must stay fixed for that column across every frame.",
    "parentType": "pp:HashNode"
  },
  "pp:ppHash12": {
    "anchor": null,
    "description": "A 2D coordinate to one pseudo-random float. The lattice seed value noise interpolates between.",
    "parentType": "pp:HashNode"
  },
  "pp:ppHash13": {
    "anchor": null,
    "description": "A 3D coordinate to one pseudo-random float — the 2D hash with time or depth as the third axis.",
    "parentType": "pp:HashNode"
  },
  "pp:ppHash22": {
    "anchor": null,
    "description": "A 2D coordinate to a pseudo-random 2D POINT. Vector-valued because a cellular pattern needs a scattered position inside each cell, not a scalar.",
    "parentType": "pp:HashNode"
  },
  "pp:ppHash33": {
    "anchor": null,
    "description": "A 3D coordinate to a pseudo-random 3D vector — the raw material for a Perlin gradient.",
    "parentType": "pp:HashNode"
  },
  "pp:ppHenyeyGreenstein": {
    "anchor": null,
    "description": "The Henyey-Greenstein phase function: how much light a participating medium scatters toward the viewer at angle theta. g in (-1,1) — positive is forward-scattering. This is the term that makes a lit volume read as a VOLUME rather than as a flat tint, and it is why the vortex aura has depth. Anchored to nothing: Wikidata has no item for the phase function (verified live), and the astronomers it is named for are not it.",
    "parentType": "pp:ScatteringNode"
  },
  "pp:ppIgn": {
    "anchor": null,
    "description": "Interleaved gradient noise (Jimenez 2014): one dot, two fracts, no texture and no lookup table. Breaks the 8-bit banding a smooth radial falloff shows. Anchored to nothing — Wikidata has no item for this technique, and buying an anchor with a loose subClassOf is the mistake pp:Marker stands as the lesson against.",
    "parentType": "pp:DitherNode"
  },
  "pp:ppPerlin3Tiled": {
    "anchor": "wd:Q1404167",
    "description": "Tileable 3D Perlin noise. Perlin, not value: the value at a lattice point is zero and the RANDOMNESS is in the gradient, which is why it has no blocky bias. The quintic fade has zero first AND second derivative at the ends, so octaves stack without visible creases.",
    "parentType": "pp:NoiseNode"
  },
  "pp:ppPerlinFbm3": {
    "anchor": "wd:Q1143293",
    "description": "fBm over tileable Perlin. The period DOUBLES with the frequency, which is what keeps every octave seamless — an fBm that doubles frequency and holds the period fixed tiles only in its first octave.",
    "parentType": "pp:FractalNode"
  },
  "pp:ppSchlick": {
    "anchor": "wd:Q7431712",
    "description": "Schlick's approximation to the Fresnel term: reflectance rises toward 1 at grazing incidence. The rim brightening this produces is what stops a water or glass effect looking like a coloured blur. The same approximation the Cook-Torrance BRDF in js/world3d/PBR.js uses, so the two agree by construction.",
    "parentType": "pp:ScatteringNode"
  },
  "pp:ppTileHash33": {
    "anchor": null,
    "description": "A unit gradient vector hashed from the WRAPPED lattice cell. The mod is the whole trick: wrapping the cell index before hashing is what makes the field seamless at `period`, so a scrolling aura shows no seam when it repeats.",
    "parentType": "pp:HashNode"
  },
  "pp:ppVNoise2": {
    "anchor": null,
    "description": "Value noise in 2D: hash the four surrounding lattice points and interpolate with a smoothstep. Cheaper than Perlin and blockier — correct when the result is blurred or thresholded anyway.",
    "parentType": "pp:NoiseNode"
  },
  "pp:ppWorley2": {
    "anchor": "wd:Q2593908",
    "description": "Worley (cellular) noise: distance to the nearest scattered feature point. The 3x3 neighbourhood is required, not an optimisation — the nearest point to a pixel near a cell edge lives in the adjacent cell. The cell index is wrapped by `cells`, so the pattern tiles.",
    "parentType": "pp:CellularNode"
  },
  "pp:ppWorleyFbm2": {
    "anchor": "wd:Q1143293",
    "description": "Three octaves of Worley at fixed weights. Unrolled rather than looped because the weights are not a clean halving series — they sum to 1 so the result stays in [0,1] without a rescale.",
    "parentType": "pp:FractalNode"
  }
});
