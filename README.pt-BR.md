# Servidor MCP do PinePaper

> Crie gráficos vetoriais animados com IA usando o Model Context Protocol

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · **Português (BR)** · [Français](README.fr.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md)

<p align="center">
  <img src="assets/hero.svg" alt="PinePaper MCP — gráficos animados feitos por chamadas de ferramenta" width="840">
</p>

*O banner acima é um SVG animado, exportado direto de chamadas de ferramenta do PinePaper — sem vídeo, sem GIF. Abra no GitHub e veja o movimento.*

## Visão geral

O servidor MCP do PinePaper permite que assistentes de IA criem e animem gráficos no [PinePaper Studio](https://pinepaper.studio) via Model Context Protocol. Funciona com qualquer IA que suporte chamadas de ferramenta MCP (Claude, GPT, Gemini, modelos locais etc.).

São **144 ferramentas**: desenho, animação, diagramas, mapas, tipografia, física, edição de imagens, visualização de dados e exportação:

- Criar texto, formas, geometria e gráficos complexos
- Animar com **relações** declarativas em vez de keyframes
- Fundos procedurais e trajetórias por equações
- Diagramas, mapas, gráficos e colagens de letras
- Edição de imagens: recorte, chroma key (remover fundo verde), filtros GPU, recorte com laço, detecção de objetos
- Exportar SVG animado, quadros de vídeo, widgets embutíveis e dados de treinamento para LLM

## Início rápido

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

Experimente pedir à sua IA:

> "Crie um texto HELLO vermelho com animação de pulso"

> "Crie um sol e uma terra, e faça a terra orbitar o sol"

> "Adicione um fundo de raios de sol em azul e roxo"

<p align="center">
  <img src="assets/poster-sunburst.svg" width="220" alt="Pôster de sol girando">
  <img src="assets/easing-splashes.svg" width="300" alt="Formas quicando em cascata">
  <img src="assets/live-badge.svg" width="180" alt="Selo LIVE piscando">
</p>

## Novidades da 1.6.0

- **Ferramentas de edição de imagem**: `pinepaper_crop_image` (recorte em um passo, mantém id e relações) e `pinepaper_chroma_key` (chroma key com limiar autoestimado)
- **`pinepaper_media` ganha `set_clip`** — reajusta o corte de um clipe já enviado
- **Auras de shader** em `pinepaper_apply_effect`: `heatmap`, `liquid_metal`, `gem_smoke`
- **`pinepaper_image_filter` corrigido e ampliado** — ligado ao motor real de filtros GPU com os 15 filtros (família de meio-tom, posterizar, vinheta, HSL, dither…)
- **README como recurso MCP** — clientes podem ler `pinepaper://docs/readme` (com variantes por idioma) sem sair do protocolo

## Local ou hospedado

**Local é gratuito e completo.** Todas as ferramentas funcionam se você mesmo
executar este servidor. Não existe uma versão reduzida.

Requisitos: Node 18 ou mais recente, cerca de **320 MB** de disco (o Puppeteer
baixa o Chrome) e aproximadamente 1 GB de memória enquanto um trabalho roda. Em
um notebook isso é tranquilo; em um VPS pequeno ou uma máquina de trabalho
restrita, nem tanto.

**O [cloud.pinepaper.studio](https://cloud.pinepaper.studio) executa o mesmo
servidor para você** — mesmas ferramentas, mesma versão, por HTTP, sem
instalação e sem navegador na sua máquina.

Hospedagem custa dinheiro, então é paga e funciona por créditos. Os preços
atuais estão em [cloud.pinepaper.studio](https://cloud.pinepaper.studio). Se você consegue rodar localmente, rode localmente —
você não perde nada.

## Mais

A referência completa de ferramentas, toolkits e orçamento de tokens, e a lista de relações estão no [README em inglês](README.md). O fluxo canônico para agentes está no recurso `pinepaper://docs/agent-guide`.

Licença MIT · [pinepaper.studio](https://pinepaper.studio)
