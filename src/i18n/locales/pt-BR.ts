/**
 * Brazilian Portuguese Translations
 */

import { createBaseTranslation } from './base.js';

export const ptBR = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Criar item', description: '' },
    pinepaper_modify_item: { name: 'Modificar item', description: '' },
    pinepaper_delete_item: { name: 'Excluir item', description: '' },
    pinepaper_add_relation: { name: 'Adicionar relação', description: '' },
    pinepaper_remove_relation: { name: 'Remover relação', description: '' },
    pinepaper_query_relations: { name: 'Consultar relações', description: '' },
    pinepaper_animate: { name: 'Animar', description: '' },
    pinepaper_keyframe_animate: { name: 'Animação por keyframes', description: '' },
    pinepaper_play_timeline: { name: 'Reproduzir linha do tempo', description: '' },
    pinepaper_execute_generator: { name: 'Executar gerador', description: '' },
    pinepaper_list_generators: { name: 'Listar geradores', description: '' },
    pinepaper_apply_effect: { name: 'Aplicar efeito', description: '' },
    pinepaper_get_items: { name: 'Obter itens', description: '' },
    pinepaper_get_relation_stats: { name: 'Estatísticas de relações', description: '' },
    pinepaper_set_background_color: { name: 'Definir cor de fundo', description: '' },
    pinepaper_set_canvas_size: { name: 'Definir tamanho do canvas', description: '' },
    pinepaper_export_svg: { name: 'Exportar SVG', description: '' },
    pinepaper_export_training_data: { name: 'Exportar dados de treinamento', description: '' },
    // Diagram Tools
    pinepaper_create_diagram_shape: {
      name: 'Criar forma de diagrama',
      description: `Cria uma forma de diagrama no canvas. Formas de diagrama são especializadas para fluxogramas, diagramas UML, diagramas de rede e desenhos técnicos similares.

USE QUANDO:
- Criar fluxogramas, diagramas de processo ou workflows
- Construir diagramas UML de classes, casos de uso ou sequência
- Desenhar diagramas de topologia de rede
- Fazer organogramas ou árvores de decisão

TIPOS DE FORMAS:
- Fluxograma: process, decision, terminal, data, document, database, preparation
- UML: uml-class, uml-usecase, uml-actor
- Rede: cloud, server
- Básicas: rectangle, circle, triangle, star`,
    },
    pinepaper_connect: {
      name: 'Conectar itens',
      description: `Conecta dois itens com um conector inteligente. Esta é a forma principal de desenhar linhas/setas entre formas de diagrama.

USE QUANDO:
- Desenhar setas entre etapas de fluxograma
- Conectar classes UML com associações
- Criar conexões de rede entre nós
- Qualquer diagrama que precise de linhas/setas entre elementos

TIPOS DE ROTEAMENTO:
- orthogonal: Apenas curvas em ângulo reto (padrão)
- direct: Linha reta entre pontos
- curved: Curva Bezier com curvatura ajustável`,
    },
    pinepaper_connect_ports: {
      name: 'Conectar portas',
      description: `Conecta duas portas específicas em itens. Use quando precisar de controle preciso sobre quais portas o conector se conecta.

USE QUANDO:
- Precisar que o conector se conecte a um lado específico da forma
- Criar diagramas complexos onde a seleção automática de portas não é ideal
- Construir diagramas tipo circuito com pontos de entrada/saída específicos`,
    },
    pinepaper_add_ports: {
      name: 'Adicionar portas',
      description: `Adiciona portas de conexão a um item existente. Portas são pontos de ancoragem onde conectores podem se anexar.

USE QUANDO:
- Adicionar posições de portas personalizadas às formas
- Habilitar conexões em itens que não têm portas
- Criar pontos de conexão especializados para diagramas complexos`,
    },
    pinepaper_auto_layout: {
      name: 'Layout automático',
      description: `Organiza automaticamente os itens do diagrama usando um algoritmo de layout. Isso reorganiza os itens para diagramas mais limpos e legíveis.

USE QUANDO:
- Os itens do diagrama estão bagunçados ou sobrepostos
- Quiser criar um layout de aparência profissional automaticamente
- Após adicionar muitos itens, precisar organizá-los

TIPOS DE LAYOUT:
- hierarchical: Melhor para fluxogramas, organogramas
- force-directed: Melhor para diagramas de rede
- tree: Melhor para hierarquias
- radial: Melhor para mapas mentais
- grid: Melhor para itens de importância igual`,
    },
    pinepaper_get_diagram_shapes: {
      name: 'Obter formas de diagrama',
      description: `Obtém uma lista de formas de diagrama disponíveis com suas propriedades.

USE QUANDO:
- Precisar ver quais formas de diagrama estão disponíveis
- Quiser saber os tamanhos e estilos padrão para formas
- Construir UI dinâmica que mostra opções de formas`,
    },
    pinepaper_update_connector: {
      name: 'Atualizar conector',
      description: `Atualiza o estilo ou rótulo de um conector existente.

USE QUANDO:
- Mudar a aparência do conector após criação
- Atualizar rótulos do conector
- Mudar estilos de seta ou cores`,
    },
    pinepaper_remove_connector: {
      name: 'Remover conector',
      description: `Remove um conector do canvas.

USE QUANDO:
- Excluir uma conexão entre itens
- Remover links incorretos
- Reestruturar conexões do diagrama`,
    },
    pinepaper_diagram_mode: {
      name: 'Modo diagrama',
      description: `Controla o modo diagrama para edição interativa.

USE QUANDO:
- Alternar entre modos de desenho e seleção
- Habilitar/desabilitar UI específica de diagrama
- Configurar o canvas para criação de diagrama

AÇÕES:
- activate: Habilitar modo diagrama
- deactivate: Retornar ao modo canvas normal
- toggle: Alternar entre modos
- setMode: Definir modo de ferramenta específico`,
    },
  },

  errors: {
    itemNotFound: 'Item não encontrado: {{itemId}}',
    invalidRelation: 'Relação inválida: {{relationType}}',
    invalidParams: 'Parâmetros inválidos: {{details}}',
    generatorNotFound: 'Gerador não encontrado: {{generatorName}}',
    exportFailed: 'Falha na exportação: {{reason}}',
    executionError: 'Erro de execução: {{message}}',
    validationError: 'Erro de validação: {{message}}',
    unknownTool: 'Ferramenta desconhecida: {{toolName}}',
    apiKeyRequired: 'Chave de API necessária',
    apiKeyInvalid: 'Chave de API inválida',
    apiKeyExpired: 'Chave de API expirada',
    rateLimitExceeded: 'Limite de requisições excedido. Tente novamente em {{seconds}} segundos.',
  },

  success: {
    itemCreated: '{{itemType}} criado na posição ({{x}}, {{y}})',
    itemModified: 'Item {{itemId}} modificado',
    itemDeleted: 'Item {{itemId}} excluído',
    relationAdded: 'Relação {{relationType}} adicionada: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Relação removida entre {{sourceId}} e {{targetId}}',
    animationApplied: 'Animação {{animationType}} aplicada em {{itemId}}',
    generatorExecuted: 'Gerador {{generatorName}} executado',
    effectApplied: 'Efeito {{effectType}} aplicado em {{itemId}}',
    backgroundSet: 'Cor de fundo definida como {{color}}',
    canvasSizeSet: 'Tamanho do canvas definido como {{width}}×{{height}}',
    exported: '{{format}} exportado com sucesso',
  },

  itemTypes: {
    text: 'Texto',
    circle: 'Círculo',
    star: 'Estrela',
    rectangle: 'Retângulo',
    triangle: 'Triângulo',
    polygon: 'Polígono',
    ellipse: 'Elipse',
    path: 'Caminho',
    line: 'Linha',
    arc: 'Arco',
  },

  relationTypes: {
    orbits: 'Orbita',
    follows: 'Segue',
    attached_to: 'Anexado a',
    maintains_distance: 'Mantém distância',
    points_at: 'Aponta para',
    mirrors: 'Espelha',
    parallax: 'Paralaxe',
    bounds_to: 'Limitado a',
  },

  animationTypes: {
    pulse: 'Pulsar',
    rotate: 'Girar',
    bounce: 'Quicar',
    fade: 'Desvanecer',
    wobble: 'Balançar',
    slide: 'Deslizar',
    typewriter: 'Máquina de escrever',
  },

  generators: {
    drawSunburst: 'Raios de sol',
    drawSunsetScene: 'Cena de pôr do sol',
    drawGrid: 'Grade',
    drawStackedCircles: 'Círculos empilhados',
    drawCircuit: 'Circuito',
    drawWaves: 'Ondas',
    drawPattern: 'Padrão',
  },

  common: {
    at: 'em',
    with: 'com',
    to: 'para',
    from: 'de',
    position: 'posição',
    radius: 'raio',
    color: 'cor',
    speed: 'velocidade',
    duration: 'duração',
  },
});

export default ptBR;
