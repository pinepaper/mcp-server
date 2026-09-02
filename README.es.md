# Servidor MCP de PinePaper

> Crea gráficos vectoriales animados con IA mediante el Model Context Protocol

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **Español** · [Português (BR)](README.pt-BR.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md)

<p align="center">
  <img src="assets/hero.svg" alt="PinePaper MCP — gráficos animados hechos con llamadas a herramientas" width="840">
</p>

*El banner de arriba es un SVG animado, exportado directamente desde llamadas a herramientas de PinePaper — sin vídeo, sin GIF. Ábrelo en GitHub y míralo moverse.*

## Descripción

El servidor MCP de PinePaper permite a los asistentes de IA crear y animar gráficos en [PinePaper Studio](https://pinepaper.studio) a través del Model Context Protocol. Funciona con cualquier IA que soporte llamadas a herramientas MCP (Claude, GPT, Gemini, modelos locales, etc.).

Expone **144 herramientas**: dibujo, animación, diagramas, mapas, tipografía, física, edición de imágenes, visualización de datos y exportación:

- Crear texto, formas, geometría y gráficos complejos
- Animar con **relaciones** declarativas en lugar de fotogramas clave
- Fondos procedurales y trayectorias definidas por ecuaciones
- Diagramas, mapas, gráficas y collages de letras
- Edición de imágenes: recorte, croma (quitar fondo verde), filtros GPU, recorte con lazo, detección de objetos
- Exportar SVG animado, fotogramas de vídeo, widgets embebibles y datos de entrenamiento para LLM

## Inicio rápido

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

Prueba a pedirle a tu IA:

> «Crea un texto HELLO rojo con animación de pulso»

> «Crea un sol y una tierra, y haz que la tierra orbite el sol»

> «Añade un fondo de rayos de sol en azul y morado»

<p align="center">
  <img src="assets/poster-sunburst.svg" width="220" alt="Cartel de sol giratorio">
  <img src="assets/easing-splashes.svg" width="300" alt="Formas que rebotan escalonadas">
  <img src="assets/live-badge.svg" width="180" alt="Insignia LIVE parpadeante">
</p>

## Novedades de la 1.6.0

- **Herramientas de edición de imagen**: `pinepaper_crop_image` (recorte en un paso, conserva el id y las relaciones) y `pinepaper_chroma_key` (croma con umbral autoestimado)
- **`pinepaper_media` añade `set_clip`** — reajusta el recorte de un clip ya subido
- **Auras de shader** en `pinepaper_apply_effect`: `heatmap`, `liquid_metal`, `gem_smoke`
- **`pinepaper_image_filter` corregido y ampliado** — conectado al motor real de filtros GPU con los 15 filtros (familia de semitonos, posterizar, viñeta, HSL, dither…)
- **El README como recurso MCP** — los clientes pueden leer `pinepaper://docs/readme` (con variantes por idioma) sin salir del protocolo

## Local o alojado

**Local es gratis y completo.** Todas las herramientas funcionan si ejecuta
este servidor usted mismo. No hay una versión reducida.

Necesita: Node 18 o superior, unos **320 MB** de disco (Puppeteer descarga
Chrome) y alrededor de 1 GB de memoria mientras se ejecuta un trabajo. En un
portátil no supone problema; en un VPS pequeño o un equipo de trabajo
restringido, sí.

**[cloud.pinepaper.studio](https://cloud.pinepaper.studio) ejecuta el mismo
servidor por usted** — mismas herramientas, misma versión, por HTTP, sin
instalación y sin navegador en su máquina.

El alojamiento cuesta dinero, así que es de pago — funciona con créditos.
Los precios actuales están en [cloud.pinepaper.studio](https://cloud.pinepaper.studio). Ejecútelo
en local si puede, pero no es idéntico: el servicio alojado usa un conjunto de
LLM probados y repara el código generado antes de que llegue al lienzo, algo
que un servidor local no puede hacer por sí mismo. En qué modelo confiar es
algo que puede comprobar usted mismo: hay un benchmark en beta — un prompt en
varios modelos, resultados en paralelo, y cualquier ejecución compartible.

## Más

La referencia completa de herramientas, los toolkits y el presupuesto de tokens, y la lista de relaciones están en el [README en inglés](README.md). El flujo de trabajo canónico para agentes está en el recurso `pinepaper://docs/agent-guide`.

Licencia MIT · [pinepaper.studio](https://pinepaper.studio)
