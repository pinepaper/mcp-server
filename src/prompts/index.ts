/**
 * MCP Prompts — Template Recipes
 *
 * Each prompt replicates a specific PinePaper template pattern.
 * The assistant message is kept ultra-concise to prevent:
 * - Token waste from verbose planning
 * - Pipeline restarts from step-by-step tool lists
 * - Duplicate items from re-execution
 *
 * Rules:
 * - User message: frames the request with the user's description
 * - Assistant message: short commitment to single-pass batch execution
 * - NEVER list individual tools — use pinepaper_agent_batch_execute
 * - NEVER restart the pipeline — one start_job, one batch, one end_job
 */

// -----------------------------------------------------------------------------
// Types (matching MCP SDK Prompt / PromptMessage shapes)
// -----------------------------------------------------------------------------

export interface PromptArgument {
  name: string;
  description: string;
  required?: boolean;
}

export interface PromptMetadata {
  name: string;
  description: string;
  arguments?: PromptArgument[];
}

export interface PromptMessage {
  role: 'user' | 'assistant';
  content: { type: 'text'; text: string };
}

// -----------------------------------------------------------------------------
// Shared rules injected into every assistant message
// -----------------------------------------------------------------------------

const SINGLE_PASS_RULES = `RULES — follow exactly:
- start_job → batch_execute (ALL operations in ONE call) → end_job (screenshot) → show user → iterate
- batch_execute supports: set_canvas_size, set_background, execute_generator, create, modify, delete, animate, keyframe_animate, relation, apply_mask, apply_effect, play_timeline
- Use execute_generator for rich backgrounds (drawBokeh, drawGradientMesh, drawWaves, etc.) — much better than solid colors
- NEVER restart the pipeline — if user wants changes, modify items or start a new job
- After end_job, SHOW the screenshot and ask user if the design looks good`;

// -----------------------------------------------------------------------------
// Prompt definitions — each has a single declarative description argument
// -----------------------------------------------------------------------------

const MOTIVATIONAL_QUOTE_PROMPT: PromptMetadata = {
  name: 'motivational-quote',
  description:
    'Animated motivational quote poster with stylized lettering and background generator.',
  arguments: [
    {
      name: 'description',
      description: 'Your quote and desired mood, e.g. "Stay hungry, stay foolish — warm sunset vibes"',
      required: true,
    },
  ],
};

const TEXT_REVEAL_UP_PROMPT: PromptMetadata = {
  name: 'text-reveal-up',
  description:
    'Words appear one by one with smooth wipeUp mask reveal effects.',
  arguments: [
    {
      name: 'description',
      description: 'The text and style, e.g. "Hello Beautiful World — elegant purple gradient feel"',
      required: true,
    },
  ],
};

const SIMPLE_DECISION_FLOW_PROMPT: PromptMetadata = {
  name: 'simple-decision-flow',
  description:
    'Decision flowchart with shapes, connectors, and auto-layout.',
  arguments: [
    {
      name: 'description',
      description: 'The flow, e.g. "User login: enter credentials → validate → success or retry"',
      required: true,
    },
  ],
};

const SOLAR_SYSTEM_PROMPT: PromptMetadata = {
  name: 'solar-system-education',
  description:
    'Animated planets with orbital relations, surface details, and a comet.',
  arguments: [
    {
      name: 'description',
      description: 'What to include, e.g. "Show inner planets with realistic colors and a bright comet"',
      required: false,
    },
  ],
};

const CINEMA_TITLES_PROMPT: PromptMetadata = {
  name: 'cinema-titles',
  description:
    'Cinematic title sequence with dramatic keyframe animations and letterbox mask effects.',
  arguments: [
    {
      name: 'description',
      description: 'The title sequence, e.g. "ARRIVAL — sci-fi mood, slow fade, minimal"',
      required: true,
    },
  ],
};

// -----------------------------------------------------------------------------
// PROMPTS array — exported for ListPrompts handler
// -----------------------------------------------------------------------------

export const PROMPTS: PromptMetadata[] = [
  MOTIVATIONAL_QUOTE_PROMPT,
  TEXT_REVEAL_UP_PROMPT,
  SIMPLE_DECISION_FLOW_PROMPT,
  SOLAR_SYSTEM_PROMPT,
  CINEMA_TITLES_PROMPT,
];

// -----------------------------------------------------------------------------
// Message builders — ultra-concise, batch-first, no tool lists
// -----------------------------------------------------------------------------

function buildMotivationalQuote(args: Record<string, string> = {}): PromptMessage[] {
  const description = args.description || 'Dream big — bold and energetic';

  return [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Create an animated motivational quote poster: ${description}`,
      },
    },
    {
      role: 'assistant',
      content: {
        type: 'text',
        text: `I'll create this. All operations in one batch_execute call, then show you the result for feedback.

${SINGLE_PASS_RULES}

Batch: execute_generator (rich background) → create text items → animate → keyframe_animate (timed reveals) → apply_mask → play_timeline.

Starting now.`,
      },
    },
  ];
}

function buildTextRevealUp(args: Record<string, string> = {}): PromptMessage[] {
  const description = args.description || 'Create Beautiful Graphics — colorful and modern';

  return [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Create a text reveal animation: ${description}`,
      },
    },
    {
      role: 'assistant',
      content: {
        type: 'text',
        text: `I'll create this. All operations in one batch_execute call, then show you the result.

${SINGLE_PASS_RULES}

Batch: execute_generator (background) → create text items (one per word) → keyframe_animate (staggered fade-in) → apply_mask (wipeUp per item) → play_timeline.

Starting now.`,
      },
    },
  ];
}

function buildSimpleDecisionFlow(args: Record<string, string> = {}): PromptMessage[] {
  const description = args.description || 'Start → Check Input → Valid? → Process Data or Show Error → End';

  return [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Create a decision flowchart: ${description}`,
      },
    },
    {
      role: 'assistant',
      content: {
        type: 'text',
        text: `I'll create this. All operations in one batch_execute call, then show you the result.

${SINGLE_PASS_RULES}

Batch: set_background → create (diagram shapes: terminal, process, decision, data) → relation (connectors) → play_timeline.

Starting now.`,
      },
    },
  ];
}

function buildSolarSystem(args: Record<string, string> = {}): PromptMessage[] {
  const description = args.description || 'Inner planets with realistic colors, visible orbits, asteroid belt, and a comet with tail';

  return [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Create an animated solar system: ${description}`,
      },
    },
    {
      role: 'assistant',
      content: {
        type: 'text',
        text: `I'll create this. All operations in one batch_execute call, then show you the result.

${SINGLE_PASS_RULES}

Batch: set_background (#0a0a2e) → execute_generator (drawBokeh for starfield) → create (sun, orbit paths, planets) → animate (sun: pulse) → relation (planets: orbits sun) → keyframe_animate (comet trail) → play_timeline.

Starting now.`,
      },
    },
  ];
}

function buildCinemaTitles(args: Record<string, string> = {}): PromptMessage[] {
  const description = args.description || 'INCEPTION — A film by Christopher Nolan — dark, dramatic, slow fade';

  return [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Create a cinematic title sequence: ${description}`,
      },
    },
    {
      role: 'assistant',
      content: {
        type: 'text',
        text: `I'll create this. All operations in one batch_execute call, then show you the result.

${SINGLE_PASS_RULES}

Batch: set_background (#000000) → create text (title + subtitle, opacity:0) → keyframe_animate (fade in + scale, staggered) → apply_mask (cinematic letterbox) → play_timeline.

Starting now.`,
      },
    },
  ];
}

// -----------------------------------------------------------------------------
// Prompt message builder map
// -----------------------------------------------------------------------------

const PROMPT_BUILDERS: Record<string, (args: Record<string, string>) => PromptMessage[]> = {
  'motivational-quote': buildMotivationalQuote,
  'text-reveal-up': buildTextRevealUp,
  'simple-decision-flow': buildSimpleDecisionFlow,
  'solar-system-education': buildSolarSystem,
  'cinema-titles': buildCinemaTitles,
};

// -----------------------------------------------------------------------------
// getPromptMessages — exported for GetPrompt handler
// -----------------------------------------------------------------------------

export function getPromptMessages(
  name: string,
  args?: Record<string, string>,
): { description?: string; messages: PromptMessage[] } {
  const builder = PROMPT_BUILDERS[name];
  if (!builder) {
    throw new Error(`Unknown prompt: ${name}`);
  }
  const meta = PROMPTS.find(p => p.name === name)!;
  return {
    description: meta.description,
    messages: builder(args ?? {}),
  };
}
