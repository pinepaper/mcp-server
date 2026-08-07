# Serveur MCP PinePaper

> Créez des graphiques vectoriels animés avec l'IA via le Model Context Protocol

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · **Français** · [Deutsch](README.de.md) · [हिन्दी](README.hi.md)

<p align="center">
  <img src="assets/hero.svg" alt="PinePaper MCP — graphiques animés créés par appels d'outils" width="840">
</p>

*La bannière ci-dessus est un SVG animé, exporté directement depuis des appels d'outils PinePaper — pas de vidéo, pas de GIF. Ouvrez cette page sur GitHub et regardez-la bouger.*

## Aperçu

Le serveur MCP PinePaper permet aux assistants IA de créer et d'animer des graphiques dans [PinePaper Studio](https://pinepaper.studio) via le Model Context Protocol. Compatible avec toute IA gérant les appels d'outils MCP (Claude, GPT, Gemini, modèles locaux, etc.).

Il expose **129 outils** : dessin, animation, diagrammes, cartes, typographie, physique, retouche d'image, visualisation de données et export :

- Créer du texte, des formes, de la géométrie et des graphiques complexes
- Animer avec des **relations** déclaratives plutôt que des images clés
- Fonds procéduraux et trajectoires par équations
- Diagrammes, cartes, graphiques et collages de lettres
- Retouche d'image : recadrage, incrustation chroma (fond vert), filtres GPU, découpe au lasso, détection d'objets
- Export SVG animé, images vidéo, widgets embarquables et données d'entraînement LLM

## Démarrage rapide

```bash
npm install -g @pinepaper.studio/mcp-server
```

**Claude Desktop** (`claude_desktop_config.json`) :

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

Essayez de demander à votre IA :

> « Crée un texte HELLO rouge avec une animation de pulsation »

> « Crée un soleil et une terre, et fais orbiter la terre autour du soleil »

> « Ajoute un fond de rayons de soleil bleu et violet »

<p align="center">
  <img src="assets/poster-sunburst.svg" width="220" alt="Affiche au soleil tournant">
  <img src="assets/easing-splashes.svg" width="300" alt="Formes rebondissant en cascade">
  <img src="assets/live-badge.svg" width="180" alt="Badge LIVE clignotant">
</p>

## Nouveautés de la 1.6.0

- **Outils de retouche d'image** : `pinepaper_crop_image` (recadrage en une étape, conserve l'id et les relations) et `pinepaper_chroma_key` (chroma avec seuil auto-estimé)
- **`pinepaper_media` gagne `set_clip`** — re-découpe un clip déjà téléversé
- **Auras shader** dans `pinepaper_apply_effect` : `heatmap`, `liquid_metal`, `gem_smoke`
- **`pinepaper_image_filter` corrigé et enrichi** — branché sur le vrai moteur de filtres GPU avec les 15 filtres (famille demi-teinte, postérisation, vignettage, HSL, tramage…)
- **Le README devient une ressource MCP** — les clients peuvent lire `pinepaper://docs/readme` (avec variantes par langue) sans quitter le protocole

## Aller plus loin

La référence complète des outils, les toolkits et le budget de jetons, et la liste des relations sont dans le [README anglais](README.md). Le flux de travail canonique pour agents est dans la ressource `pinepaper://docs/agent-guide`.

Licence MIT · [pinepaper.studio](https://pinepaper.studio)
