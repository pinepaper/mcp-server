# PinePaper MCP Server - Testing Guide

This guide covers how to test the MCP server with Claude Desktop.

## Prerequisites

1. Node.js 18+ installed
2. Claude Desktop installed
3. PinePaper Studio open in browser (for code execution)

## Setup Steps

### 1. Build the Server

```bash
cd pinepaper-mcp
npm install
npm run build
```

### 2. Configure Claude Desktop

Find your Claude Desktop config file:

**macOS:**
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
code %APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
code ~/.config/Claude/claude_desktop_config.json
```

### 3. Add Server Configuration

```json
{
  "mcpServers": {
    "pinepaper": {
      "command": "node",
      "args": ["/full/path/to/pinepaper-mcp/dist/cli.js"]
    }
  }
}
```

**Important:** Use the full absolute path to the CLI file.

### 4. Restart Claude Desktop

Completely quit and restart Claude Desktop for the config to take effect.

### 5. Verify Connection

In Claude Desktop, you should see "pinepaper" in the available tools. Try:

> "What PinePaper tools do you have available?"

## Test Cases

### Test 1: Create Item

**Prompt:**
```
Create a red circle at position 300, 200 with radius 50
```

**Expected Output:**
Generated code that creates a circle with:
- `app.create('circle', { x: 300, y: 200, radius: 50, color: '#ef4444' })`

### Test 2: Create Text with Animation

**Prompt:**
```
Create a pulsing text that says "HELLO WORLD" in the center of the canvas
```

**Expected:**
1. Code to create text item
2. Code to apply pulse animation

### Test 3: Relations (Key Test)

**Prompt:**
```
Create two circles - a yellow sun and a blue earth. Make earth orbit the sun at radius 150.
```

**Expected:**
1. Creates yellow circle (sun) → item_1
2. Creates blue circle (earth) → item_2
3. Adds orbit relation: `app.addRelation('item_2', 'item_1', 'orbits', { radius: 150 })`

### Test 4: Background Generator

**Prompt:**
```
Add a sunburst background with red and orange colors
```

**Expected:**
```javascript
await app.executeGenerator('drawSunburst', {
  colors: ['#ef4444', '#f97316'],
  // ...
});
```

### Test 5: Keyframe Animation

**Prompt:**
```
Create text "FADE IN" and make it fade in over 3 seconds
```

**Expected:**
Keyframe animation with:
- time: 0, opacity: 0
- time: 3, opacity: 1

### Test 6: Complex Scene

**Prompt:**
```
Create a solar system:
1. Yellow sun in the center
2. Blue Earth orbiting at radius 150
3. Gray Moon orbiting Earth at radius 40
4. Add a dark blue background
```

**Expected:**
- Creates sun, earth, moon items
- Adds orbit relations
- Sets background color

### Test 7: Training Data Export

**Prompt:**
```
After creating some items with relations, export the training data
```

**Expected:**
JSON or JSONL output with instruction/code pairs.

## Code Execution

The MCP server generates code, but doesn't execute it directly. To test execution:

### Option A: Copy-Paste to Console

1. Open PinePaper Studio in browser
2. Open browser DevTools (F12)
3. Go to Console
4. Paste generated code
5. Verify it runs without errors

### Option B: Use PinePaper API Panel (if available)

PinePaper Studio may have a code execution panel built-in.

## Debugging

### Server Logs

Check Claude Desktop logs for MCP server output:

**macOS:**
```bash
tail -f ~/Library/Logs/Claude/mcp-pinepaper.log
```

### Common Issues

#### 1. Server Not Starting

Check:
- Correct absolute path in config
- `npm run build` completed successfully
- Node.js 18+ is installed

#### 2. Tools Not Appearing

Try:
1. Restart Claude Desktop completely
2. Check config JSON syntax
3. Verify path to dist/cli.js

#### 3. Code Generation Errors

The server should handle errors gracefully and return error objects.

## Test Matrix

| Category | Test | Status |
|----------|------|--------|
| **Items** | Create text | ⬜ |
| | Create circle | ⬜ |
| | Create star | ⬜ |
| | Create rectangle | ⬜ |
| | Modify item | ⬜ |
| | Delete item | ⬜ |
| **Relations** | Add orbits | ⬜ |
| | Add follows | ⬜ |
| | Add attached_to | ⬜ |
| | Query relations | ⬜ |
| | Remove relation | ⬜ |
| **Animation** | Simple pulse | ⬜ |
| | Simple rotate | ⬜ |
| | Keyframe fade | ⬜ |
| | Keyframe position | ⬜ |
| **Generators** | Sunburst | ⬜ |
| | Grid | ⬜ |
| | Waves | ⬜ |
| **Effects** | Sparkle | ⬜ |
| | Blast | ⬜ |
| **Canvas** | Background color | ⬜ |
| | Canvas size | ⬜ |
| **Export** | SVG | ⬜ |
| | Training data | ⬜ |

## Performance Benchmarks

Measure time for:
- Tool listing: < 100ms
- Simple tool call: < 200ms
- Complex code generation: < 500ms

## Success Criteria

✅ All tools appear in Claude Desktop
✅ Tool calls return valid JavaScript code
✅ Generated code runs in PinePaper console
✅ Relations create working animations
✅ Error handling returns helpful messages

## Next Steps After Testing

1. Fix any bugs found
2. Update tool descriptions if Claude misinterprets
3. Add more examples to tool descriptions
4. Publish to npm
5. Submit to MCP registry
