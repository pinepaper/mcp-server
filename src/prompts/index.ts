/**
 * MCP Prompts — Template Recipes
 *
 * Each prompt frames a user request as a single user message.
 * No assistant pre-fill — let the model respond naturally.
 * Workflow rules are handled by start_job guidance and tool descriptions.
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
// Prompt definitions
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
// Message builders — user message only, no assistant pre-fill
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
