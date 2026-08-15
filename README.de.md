# PinePaper MCP-Server

> Animierte Vektorgrafiken mit KI erstellen — über das Model Context Protocol

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Français](README.fr.md) · **Deutsch** · [हिन्दी](README.hi.md)

<p align="center">
  <img src="assets/hero.svg" alt="PinePaper MCP — animierte Grafiken aus Tool-Aufrufen" width="840">
</p>

*Das Banner oben ist ein animiertes SVG, direkt aus PinePaper-Tool-Aufrufen exportiert — kein Video, kein GIF. Auf GitHub öffnen und zusehen, wie es sich bewegt.*

## Überblick

Der PinePaper MCP-Server lässt KI-Assistenten über das Model Context Protocol Grafiken in [PinePaper Studio](https://pinepaper.studio) erstellen und animieren. Funktioniert mit jeder KI, die MCP-Tool-Aufrufe unterstützt (Claude, GPT, Gemini, lokale Modelle usw.).

Der Server bietet **137 Tools**: Zeichnen, Animation, Diagramme, Karten, Typografie, Physik, Bildbearbeitung, Datenvisualisierung und Export:

- Text, Formen, Geometrie und komplexe Grafiken erstellen
- Mit deklarativen **Relationen** animieren statt mit Keyframes
- Prozedurale Hintergründe und gleichungsbasierte Pfade
- Diagramme, Karten, Charts und Buchstaben-Collagen
- Bildbearbeitung: Zuschneiden, Chroma-Key (Greenscreen entfernen), GPU-Filter, Lasso-Ausschnitte, Objekterkennung
- Export als animiertes SVG, Videoframes, einbettbare Widgets und LLM-Trainingsdaten

## Schnellstart

```bash
npm install -g @pinepaper.studio/mcp-server
```

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "pinepaper": {
      "command": "npx",
      "args": ["-y", "@pinepaper.studio/mcp-server"]
    }
  }
}
```

Bitten Sie Ihre KI zum Beispiel:

> „Erstelle einen roten, pulsierenden HELLO-Text"

> „Erstelle Sonne und Erde, und lass die Erde um die Sonne kreisen"

> „Füge einen Sunburst-Hintergrund in Blau und Violett hinzu"

<p align="center">
  <img src="assets/poster-sunburst.svg" width="220" alt="Rotierendes Sunburst-Poster">
  <img src="assets/easing-splashes.svg" width="300" alt="Gestaffelt hüpfende Splash-Formen">
  <img src="assets/live-badge.svg" width="180" alt="Blinkendes LIVE-Badge">
</p>

## Neu in 1.6.0

- **Bildbearbeitungs-Tools**: `pinepaper_crop_image` (Ein-Schritt-Zuschnitt, behält Id und Relationen) und `pinepaper_chroma_key` (Chroma-Key mit automatisch geschätztem Schwellwert)
- **`pinepaper_media` erhält `set_clip`** — bereits hochgeladene Clips neu trimmen
- **Shader-Auren** in `pinepaper_apply_effect`: `heatmap`, `liquid_metal`, `gem_smoke`
- **`pinepaper_image_filter` repariert und erweitert** — an die echte GPU-Filter-Engine angebunden, alle 15 Filter (Halbton-Familie, Posterisieren, Vignette, HSL, Dithering …)
- **README als MCP-Ressource** — Clients können `pinepaper://docs/readme` (mit Sprachvarianten) direkt im Protokoll lesen

## Mehr

Die vollständige Tool-Referenz, Toolkits und Token-Budget sowie die Relationsliste stehen im [englischen README](README.md). Der kanonische Agenten-Workflow liegt in der Ressource `pinepaper://docs/agent-guide`.

MIT-Lizenz · [pinepaper.studio](https://pinepaper.studio)
