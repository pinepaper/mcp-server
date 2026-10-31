/**
 * THE AGENT LANE (PINEPAPER_TOOLKIT=lane): seven tools that build, animate, pattern, export and check a scene, give it
 * timed or clicked events, and start it over, with
 * the lessons an agent otherwise learns by failing folded into the descriptions of the tools they belong to.
 *
 * Why it exists (owner, 2026-10-26): an agent given the default surface loads ~170 tool schemas and still needed a
 * separate lessons file to build a simple titled animation — the keyframe shape, the words of a text going in
 * properties, a position being the item's centre. The lane makes the contract small enough to read whole (≤ 10k
 * tokens, tools + instructions), and correct enough that nothing outside it is needed.
 *
 * Every lane tool is an EXISTING tool with its existing handler. The lane changes only what the agent is shown: a
 * description written for this surface, and an input schema that is a strict subset of the tool's full one (so any
 * call the lane teaches is a call the full server accepts; lane.test.ts holds that). Nothing here is a second
 * implementation, and a lane call is billed, validated and reported exactly as the same call on the full surface.
 */

/**
 * The lane's tools. The first five are the lane as it shipped, in the order an agent uses them; O10 (mcp-server#29)
 * added the two after them, appended so nothing a lane client had moves: events (timed and clicked; their reactions
 * ride in the batch as relation ops) and clearing (start over, so a replay gets the same ids).
 */
export const LANE_TOOL_NAMES = [
  'pinepaper_agent_batch_execute', // create / batch, with names
  'pinepaper_keyframe_animate',    // animate / keyframe
  'pinepaper_pattern',             // pattern (relations ride in the batch)
  'pinepaper_agent_export',        // render / export, with the file receipt
  'pinepaper_lint_scene',          // inspect / lint
  'pinepaper_event',               // events: timed (at) or fired by a click / key (O10)
  'pinepaper_clear_canvas',        // start over (O10)
] as const;

/** The one keyframe shape, said once and used by both tools that take keyframes. */
const KEYFRAME_RULE = `A keyframe is {"time": seconds, "properties": {…}, "easing"?: name}. The values go INSIDE properties, never beside time: {"time":1,"properties":{"opacity":1}}, not {"time":1,"opacity":1} (refused). easing shapes the move ARRIVING at that key: linear (default), easeIn, easeOut, easeInOut, easeOutBack, easeInOutCubic, easeOutBounce, spring, hold. Before its first key an item holds the first key's values; after its last, the last key's. Keyable: x, y (the centre), opacity, scale, scaleX, scaleY, rotation (degrees), fillColor, strokeColor, strokeWidth, width, height, radius, fontSize, trimEnd (0→1 draws a path on).`;

/** Read by the model before any tool: what the lane is, the order of work, and what it cannot do. */
export const LANE_INSTRUCTIONS = `PinePaper Studio, agent lane: seven tools that build an animated scene on a live canvas and export it to a file.

ORDER OF WORK:
1. pinepaper_agent_batch_execute: ONE call with the canvas size, the background, every item, their keyframes and any relations.
2. pinepaper_lint_scene: check the scene before exporting (text running off the frame, unrelated items).
3. pinepaper_agent_export: format, duration and fps for a video. It returns the file path and the file's sha256 (a small SVG comes back inline).
Use pinepaper_keyframe_animate to re-key one item afterwards, and pinepaper_pattern to move many named items with one declaration.
Something that happens AT a time or ON a click (show, hide, recolour): make the event with pinepaper_event first, then bind it in the batch with relation ops.
To start over, call pinepaper_clear_canvas: it empties the canvas and ids start again at item_1, so the same batch gives the same ids.

UNITS: pixels, top-left origin, y down; time in seconds; angles in degrees; colours as "#rrggbb".
Every call acts on the live canvas at once: re-sending a batch ADDS its items again (clear first to replay it). A failed atomic batch removes the items it made, so fix it and send it again (edits it made to items that already existed stay: the result says so).
Report a tool error as it is; do not write HTML or other code instead of these tools.
This lane is for scenes built from shapes, text, keyframes and relations. For characters, styled scenes, maps, diagrams or sound, the full surface is PINEPAPER_TOOLKIT=agent.`;

interface LaneTool {
  description: string;
  inputSchema: Record<string, unknown>;
}

const POSITION = {
  type: 'object',
  properties: { x: { type: 'number' }, y: { type: 'number' } },
  description: "create: where the item goes, at the op's top level. It is the item's CENTRE unless properties.anchor names a corner.",
};

const KEYFRAMES = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      time: { type: 'number', description: 'seconds' },
      properties: { type: 'object', description: 'the values at this time: {"opacity":1}, {"x":960}' },
      easing: { type: 'string', description: 'the move arriving at this key' },
    },
    required: ['time', 'properties'],
  },
};

export const LANE_TOOLS: Readonly<Record<(typeof LANE_TOOL_NAMES)[number], LaneTool>> = {
  pinepaper_agent_batch_execute: {
    description: `Build the scene in ONE call: canvas, background, items, keyframes, relations. Ops run in order. "$0", "$1", … are the items THIS call made, in op order (create and group ops are numbered; a group of "$0","$1" made next is "$2"). The result lists their ids in itemIds; use those ids in later calls.

Each line is a correct op:
{"type":"set_canvas_size","width":1920,"height":1080}
{"type":"set_background","backgroundColor":"#0b1026"}
{"type":"create","itemType":"text","position":{"x":200,"y":130},"properties":{"content":"SIGNAL / NOISE","fontSize":72,"color":"#ffffff","anchor":"top-left","name":"title"}}
{"type":"create","itemType":"circle","position":{"x":300,"y":600},"properties":{"radius":40,"color":"#22d3ee","name":"dot"}}
{"type":"create","itemType":"rectangle","position":{"x":260,"y":900},"properties":{"width":120,"height":280,"color":"#38bdf8","anchor":"bottom-left","name":"bar-1"}}
{"type":"keyframe_animate","itemId":"$0","keyframes":[{"time":0,"properties":{"opacity":0}},{"time":1,"properties":{"opacity":1}}]}
{"type":"keyframe_animate","itemId":"$1","keyframes":[{"time":1,"properties":{"x":300}},{"time":7,"properties":{"x":1620},"easing":"easeInOut"}]}
{"type":"relation","sourceId":"$1","targetId":"$2","relationType":"orbits","relationOptions":{"radius":260,"speed":0.1667}}
{"type":"modify","itemId":"item_3","properties":{"color":"#f472b6"}}
{"type":"timeline","defaults":{"ease":"power2.out"},"tweens":[{"to":"bar-*","from":{"scaleY":0},"vars":{"scaleY":1},"duration":0.8,"at":0.5,"stagger":0.15}]}
{"type":"relation","sourceId":"item_9","targetId":"$0","relationType":"on_event_set_visibility","relationOptions":{"visible":true}}
{"type":"relation","sourceId":"$1","targetId":"item_9","relationType":"on_click_fire"}

RULES (each one has cost a failed build):
- position {x,y} goes at the op's top level. Everything else about the item goes INSIDE properties: a text's words are properties.content, and so are fontSize, color, radius, width, height, opacity, name and anchor.
- position is the item's CENTRE. A text grows both ways from it, so a title whose centre sits near an edge runs off the frame and the video shows "IGNAL / NOISE". When a spec gives a corner ("top-left at (200, 130)"), pass properties.anchor: "top-left" (or top-right, bottom-left, bottom-right). A bar that grows up from a baseline: anchor "bottom-left" at the baseline, key height.
- ${KEYFRAME_RULE}
- Two keyframe_animate ops on one item in a batch are merged into one track.
- A timeline op is GSAP's timeline as JSON, compiled onto keyframe tracks: tweens [{to: a name, id, "$N", array or "bar-*"; vars: end values; from: start values; duration; at: seconds, "<", ">" or "+=0.2"; stagger; ease: "power2.out", "none", "back.out"…; repeat; yoyo}]. There x and y are OFFSETS from where the item was created, as in GSAP; scaleY on a bottom-anchored item holds its baseline; drawSVG "0%"→"100%" draws a path on. Every track lasts the whole timeline. What it cannot carry is refused by name; each tween gets a receipt. An item takes keys from a timeline or keyframe_animate ops, not both.
- Name every item (properties.name). pinepaper_pattern selects members by name, e.g. "bar-*".
- Relations: orbits {radius, speed (turns per second), direction, phaseDegrees}, follows {offset, smoothing}, attached_to {offset}, points_at, moves_along_path {path:[{x,y},…], speed}. sourceId moves; targetId is what it moves relative to.
- Events (item_9 above is an eventId from pinepaper_event): an event → item relation is a reaction, run each time it fires: on_event_set_visibility {visible: true|false}, on_event_set_color {color}, on_event_set_property {property, value}. An item → event relation fires it: on_click_fire, on_pointer_enter_fire, on_key_fire {key}. An item a reaction reveals starts hidden: properties.visible false.
- set_canvas_size comes first; a video exports at the canvas size.
- The call is LIVE: sending it twice makes every item twice. atomic (default) stops at the first failure and removes every item the call created, so the canvas holds no half batch: fix the op it names and send it again. Edits to items that already existed are not undone; the result says what was removed.

itemType: text, circle, rectangle, ellipse, star, triangle, polygon, line, arc, path, hexagon, diamond, arrow, heart.`,
    inputSchema: {
      type: 'object',
      properties: {
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['set_canvas_size', 'set_background', 'create', 'modify', 'delete', 'group', 'keyframe_animate', 'relation', 'timeline'] },
              width: { type: 'number', description: 'set_canvas_size' },
              height: { type: 'number', description: 'set_canvas_size' },
              backgroundColor: { type: 'string', description: 'set_background' },
              itemType: { type: 'string', description: 'create' },
              position: POSITION,
              properties: { type: 'object', description: 'create / modify: everything about the item except where it goes' },
              itemId: { type: 'string', description: 'modify / delete / keyframe_animate: an id from itemIds, or "$N"' },
              itemIds: { type: 'array', items: { type: 'string' }, description: 'group: the parts of one object' },
              groupName: { type: 'string', description: 'group' },
              keyframes: { ...KEYFRAMES, description: 'keyframe_animate' },
              append: { type: 'boolean', description: "keyframe_animate: add to the item's track instead of replacing it" },
              sourceId: { type: 'string', description: 'relation: the item that moves' },
              targetId: { type: 'string', description: 'relation: what it moves relative to' },
              relationType: { type: 'string', description: 'relation' },
              relationOptions: { type: 'object', description: 'relation: its parameters' },
              tweens: { type: 'array', items: { type: 'object' }, description: 'timeline: the tweens' },
              defaults: { type: 'object', description: 'timeline: {ease, duration}' },
              duration: { type: 'number', description: 'timeline: the clip length (default: the last tween\'s end)' },
            },
            required: ['type'],
          },
        },
        atomic: { type: 'boolean', description: 'default true: the first failure stops the call and removes the items it created (edits to existing items stay)' },
      },
      required: ['operations'],
    },
  },

  pinepaper_keyframe_animate: {
    description: `Give ONE existing item a timed track, after the batch: re-time a move, add a fade. itemId is an id from the batch result's itemIds (item_N). It REPLACES the item's track unless append: true.

${KEYFRAME_RULE}

EXAMPLE: {"itemId":"item_2","keyframes":[{"time":1,"properties":{"x":300}},{"time":7,"properties":{"x":1620},"easing":"easeInOut"}]}`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'item_N, from the batch result' },
        keyframes: KEYFRAMES,
        append: { type: 'boolean', description: "add these keys to the item's track instead of replacing it" },
      },
      required: ['itemId', 'keyframes'],
    },
  },

  pinepaper_pattern: {
    description: `Move many NAMED items with one stored declaration instead of a track on each. Change a parameter once and every member follows; remove it and they go back.

KINDS:
- phase_wave: members move on a sine, each a phase after the last. params: property ("y" default, "x", "rotation", "opacity"), amplitude (px, degrees or 0..1), period (seconds a cycle), wavelength (members a cycle). window {from, to} in seconds limits when it plays.
- stagger: each member's start is delayed by its place. params: step (seconds between neighbours), start, order (index, reverse, center, edges).
members: {"names": "bar-*"} ('*' matches any run), or an array of ids. A name that matches nothing is reported.
A relation between two items (orbits, follows) is a relation op in pinepaper_agent_batch_execute, not a pattern.

ACTIONS: create (id, kind, members, params) · modify (id + what changes) · remove (id) · list · get (id).
EXAMPLE: {"action":"create","id":"wave","kind":"phase_wave","members":{"names":"bar-*"},"params":{"amplitude":12,"period":1.2,"wavelength":5}}`,
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'modify', 'remove', 'list', 'get'] },
        id: { type: 'string', description: "the pattern's name; required except for list" },
        kind: { type: 'string', enum: ['phase_wave', 'stagger'] },
        members: {
          description: 'an array of ids, or {"names": "bar-*"}',
          oneOf: [
            { type: 'array', items: { type: 'string' } },
            { type: 'object', properties: { names: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] }, ids: { type: 'array', items: { type: 'string' } } } },
          ],
        },
        params: { type: 'object' },
        window: { type: 'object', properties: { from: { type: 'number' }, to: { type: 'number' } } },
      },
      required: ['action'],
    },
  },

  pinepaper_agent_export: {
    description: `Render the scene to a file and return where it is.

A video needs format, duration and fps: {"format":"mp4","duration":8,"fps":30}. duration defaults to 5 s, so an 8 s piece without it is cut at 5. The file is the canvas size; leave platform out. A still: {"format":"png","time":4}.
An 8 s 1080p video takes a few minutes to render: wait for this call, and do not send it again while it runs.

RETURNS "File: <path>", plus file {sha256, bytes}: the sha256 of the file on disk. MP4 and WebM add frameDigest and frames, a digest of every rendered frame (two renders of the same scene agree frame for frame when their frameDigest agrees); unreadFrames counts frames the digest could not read. A small SVG comes back inline, with no file. video.frames {fed, distinct} says whether anything moved. fidelity.warnings names what the format could not carry. A failed export is an error naming the reason; it never reports a file it did not write.`,
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['mp4', 'webm', 'gif', 'png', 'svg', 'pdf'] },
        duration: { type: 'number', description: 'video: seconds (default 5)' },
        fps: { type: 'number', description: 'video: frames per second' },
        time: { type: 'number', description: 'still: the moment to render, in seconds' },
        deterministic: { type: 'boolean', description: 'mp4 / webm: the same scene gives the same bytes' },
      },
      required: ['format'],
    },
  },

  pinepaper_event: {
    description: `Make an event: a named channel that reactions bound to it run on. It returns {eventId} (an item id); bind it in pinepaper_agent_batch_execute with relation ops (event → item reactions, item → event triggers such as on_click_fire).

A TIMED event fires itself at scene times, in the preview and in every video export: pass at (seconds, or a list). Without at, it fires when a trigger fires it, or when you pulse it.
{"action":"create","name":"reveal","at":2}
{"action":"create","name":"blink","at":[1,3,5]}
{"action":"create","name":"tap"}
{"action":"pulse","eventId":"item_9"}`,
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'pulse'] },
        name: { type: 'string', description: 'create: the event\'s name (required)' },
        at: { description: 'create: fire at these scene times (seconds)', oneOf: [{ type: 'number' }, { type: 'array', items: { type: 'number' } }] },
        eventId: { type: 'string', description: 'pulse: the eventId to fire now' },
      },
      required: ['action'],
    },
  },

  pinepaper_clear_canvas: {
    description: `Start over: remove every item (events included), relation, keyframe track and uploaded clip, and the background colour; the canvas size stays. Ids start again at item_1, so a batch sent after a clear returns the same ids as the first time it was sent. Takes no arguments.`,
    inputSchema: { type: 'object', properties: {} },
  },

  pinepaper_lint_scene: {
    description: `Check the live scene before exporting; read-only. Returns warnings (a text that runs past the frame edge, by item, side and pixels, where the studio reports it), density (how many items are tied together by relations) and suggestions (relations that would hold the layout together: {from, to, type, params}). Fix a clipped text by moving its centre in with a modify op in pinepaper_agent_batch_execute ({"type":"modify","itemId":"item_1","properties":{"x":474}}: the centre is the left edge plus half the width), or delete it and create it again with properties.anchor; a modify does not read anchor.`,
    inputSchema: {
      type: 'object',
      properties: {
        cap: { type: 'number', description: 'max suggestions (default 20)' },
      },
    },
  },
};

interface ToolLike {
  name: string;
  description?: string;
  inputSchema: unknown;
}

/** The lane: its tools, in lane order, each shown with its lane description and schema. */
export function applyLane<T extends ToolLike>(tools: T[]): T[] {
  const byName = new Map(tools.map((t) => [t.name, t]));
  const out: T[] = [];
  for (const name of LANE_TOOL_NAMES) {
    const tool = byName.get(name);
    if (!tool) continue;
    out.push({ ...tool, description: LANE_TOOLS[name].description, inputSchema: LANE_TOOLS[name].inputSchema } as T);
  }
  return out;
}

/** The contract an agent loads for the lane: the instructions plus the lane tools as tools/list sends them. */
export function laneContractText(tools: ToolLike[]): string {
  return LANE_INSTRUCTIONS + JSON.stringify(applyLane(tools));
}
