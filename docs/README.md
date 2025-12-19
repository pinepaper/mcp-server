# PinePaper Studio Documentation

> A professional client-side web application for creating animated text and graphics

## What is PinePaper Studio?

PinePaper Studio is a powerful canvas-based design tool built with Paper.js that enables you to create stunning animated graphics, text compositions, and visual effects—all in your browser.

## Key Features

- **Text & Shape Creation** - Add text, circles, stars, polygons, and more
- **Rich Animations** - Pulse, rotate, bounce, fade, wobble, slide, typewriter effects
- **Keyframe Timeline** - Frame-by-frame animation control with easing functions
- **Background Generators** - Procedural patterns like sunburst, waves, grids, circuits
- **Relations** - Behavior rules (orbits, follows, attached_to)
- **Effects System** - Sparkle trails, blast particles, custom visual effects
- **Export Options** - SVG (animated), WebM video, PNG screenshots
- **Web Worker Support** - Heavy computations run off the main thread

## Quick Example

```javascript
// Create a text element
const title = app.create('text', {
  content: 'Hello World',
  x: 400,
  y: 300,
  fontSize: 72,
  color: '#6366f1'
});

// Add animation
app.animate(title, {
  animationType: 'pulse',
  animationSpeed: 1
});

// Export as animated SVG
const svg = app.exportAnimatedSVG();
```

## Architecture Overview

PinePaper uses a **3-tier registry system** for managing canvas elements:

| Registry | Purpose | Contains |
|----------|---------|----------|
| **ItemRegistry** | Interactive elements | Text, shapes, SVGs |
| **RelationRegistry** | Behavior rules | orbits, follows, attached_to |
| **DecorativeRegistry** | Background elements | Patterns, generators |

## Getting Started

1. **[Quick Start](getting-started/quick-start.md)** - Create your first animation in 5 minutes
2. **[Core Methods](api/core-methods.md)** - Essential API reference
3. **[Animation Guide](api/animation.md)** - Add movement to your designs

## MCP Server for AI Assistants

Use PinePaper with Claude Desktop via the official MCP server:

```bash
npm install -g @pinepaper.studio/mcp-server
```

[![npm version](https://badge.fury.io/js/%40pinepaper.studio%2Fmcp-server.svg)](https://www.npmjs.com/package/@pinepaper.studio/mcp-server)

**Try in Claude Desktop:**
- *"Create a red pulsing text that says HELLO"*
- *"Make earth orbit the sun"*
- *"Add a sunburst background"*

**Documentation:**
- [MCP Server Installation](mcp/installation.md) - Quick setup guide
- [MCP Tools Specification](mcp/tools-spec.md) - All available tools
- [MCP Integration Guide](guides/mcp-integration.md) - Advanced integration

## For Developers & AI Agents

PinePaper exposes a global `window.PinePaper` API designed for programmatic access. AI agents can:

- Create and manipulate canvas items
- Define complex animations via keyframes
- Generate procedural backgrounds
- Establish relationships between items
- Export training data for LLM fine-tuning

**Documentation:**
- [AI Agents Guide](guides/ai-agents.md) - Programmatic API usage
- [Core Methods](api/core-methods.md) - Complete API reference

## Version

Current: **v0.2** (Scene-based architecture with keyframe animations)

## Feedback & Contact

We'd love to hear from you!

- **Feedback & Feature Requests**: [pinepaper.userjot.com](https://pinepaper.userjot.com/)
- **Roadmap**: [pinepaper.userjot.com](https://pinepaper.userjot.com/)
- **Contact**: [info@pinepaper.studio](mailto:info@pinepaper.studio)

## Links

- [PinePaper Studio](/) - Launch the application
- [Feedback & Roadmap](https://pinepaper.userjot.com/) - Share ideas, vote on features
