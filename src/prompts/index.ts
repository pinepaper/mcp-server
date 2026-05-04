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

const SOCIAL_GRAPHIC_PROMPT: PromptMetadata = {
  name: 'social-graphic',
  description:
    'Platform-sized social post with background generator, headline text, and call-to-action. Sets the right canvas preset and exports as the platform-recommended format.',
  arguments: [
    {
      name: 'platform',
      description: 'instagram | instagram-story | tiktok | youtube | youtube-thumbnail | twitter | linkedin (default: instagram)',
      required: false,
    },
    {
      name: 'description',
      description: 'Headline + vibe, e.g. "Sale: 50% off — neon, urgent" or "Welcome back — calm pastel"',
      required: true,
    },
  ],
};

const ANIMATED_INFOGRAPHIC_PROMPT: PromptMetadata = {
  name: 'animated-infographic',
  description:
    'Data visualization with chart + reveal animations. Uses pinepaper_create_chart to render bar/line/scatter/area charts; the reveal uses keyframe animations and apply_mask.',
  arguments: [
    {
      name: 'description',
      description: 'The data + framing, e.g. "Q3 revenue by region — bars revealing left-to-right with totals"',
      required: true,
    },
  ],
};

const MERMAID_DIAGRAM_PROMPT: PromptMetadata = {
  name: 'mermaid-diagram',
  description:
    'Render Mermaid source as a native PinePaper diagram via pinepaper_import_mermaid. Supports flowchart, sequenceDiagram, erDiagram, classDiagram, stateDiagram. Optional walkthrough animation.',
  arguments: [
    {
      name: 'mermaidText',
      description: 'The Mermaid source string. First non-blank line picks the diagram type.',
      required: true,
    },
    {
      name: 'walkthrough',
      description: 'Optional: "true" to add a camera_animates walkthrough that traverses each node.',
      required: false,
    },
  ],
};

const LOADING_SCREEN_PROMPT: PromptMetadata = {
  name: 'loading-screen',
  description:
    'Branded loading screen with rotating spinner and pulsing logo text. Loops indefinitely.',
  arguments: [
    {
      name: 'description',
      description: 'Brand and feel, e.g. "Acme Corp — minimal monochrome" or "GameZone — neon arcade"',
      required: true,
    },
  ],
};

const LETTER_COLLAGE_PROMPT: PromptMetadata = {
  name: 'letter-collage',
  description:
    'Decorative word display using pinepaper_create_letter_collage with a chosen palette + style (tile, magazine, paperCut, fold, gradient, image). Pairs with apply_animated_mask for elegant reveals.',
  arguments: [
    {
      name: 'word',
      description: 'The word or short phrase, e.g. "DREAM" or "HELLO"',
      required: true,
    },
    {
      name: 'description',
      description: 'Style + palette feel, e.g. "fold style, sunset palette, slow reveal"',
      required: false,
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
  SOCIAL_GRAPHIC_PROMPT,
  ANIMATED_INFOGRAPHIC_PROMPT,
  MERMAID_DIAGRAM_PROMPT,
  LOADING_SCREEN_PROMPT,
  LETTER_COLLAGE_PROMPT,
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

function buildSocialGraphic(args: Record<string, string> = {}): PromptMessage[] {
  const platform = args.platform || 'instagram';
  const description = args.description || 'Headline content — bold and modern';
  return [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Create a ${platform} social graphic: ${description}. Use the ${platform} canvas preset and export in the platform-recommended format.`,
      },
    },
  ];
}

function buildAnimatedInfographic(args: Record<string, string> = {}): PromptMessage[] {
  const description = args.description || 'Quarterly metrics dashboard — bars revealing left-to-right with totals';
  return [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Create an animated infographic: ${description}. Use pinepaper_create_chart for the data plot and pinepaper_keyframe_animate or pinepaper_apply_animated_mask for the reveal.`,
      },
    },
  ];
}

function buildMermaidDiagram(args: Record<string, string> = {}): PromptMessage[] {
  const mermaid = args.mermaidText || 'flowchart TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Action]\n  B -->|No| D[End]';
  const walkthrough = args.walkthrough === 'true';
  const walkthroughLine = walkthrough
    ? '\nThen add a camera_animates walkthrough that visits each node in sequence.'
    : '';
  return [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Render this Mermaid diagram on the canvas using pinepaper_import_mermaid:\n\n\`\`\`mermaid\n${mermaid}\n\`\`\`${walkthroughLine}`,
      },
    },
  ];
}

function buildLoadingScreen(args: Record<string, string> = {}): PromptMessage[] {
  const description = args.description || 'Acme Corp — minimal monochrome';
  return [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Create a looping branded loading screen: ${description}. Include a rotating spinner and pulsing logo/text. Loop the timeline.`,
      },
    },
  ];
}

function buildLetterCollage(args: Record<string, string> = {}): PromptMessage[] {
  const word = args.word || 'HELLO';
  const description = args.description || 'tile style, wordle palette';
  return [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Create a decorative letter collage of "${word}" using pinepaper_create_letter_collage. Style/palette: ${description}. Add a subtle reveal with apply_animated_mask.`,
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
  'social-graphic': buildSocialGraphic,
  'animated-infographic': buildAnimatedInfographic,
  'mermaid-diagram': buildMermaidDiagram,
  'loading-screen': buildLoadingScreen,
  'letter-collage': buildLetterCollage,
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
