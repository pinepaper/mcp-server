/**
 * Portuguese Translations
 */

import { createBaseTranslation } from './base.js';

export const pt = createBaseTranslation({
  tools: {
    pinepaper_create_item: { name: 'Criar elemento', description: '' },
    pinepaper_modify_item: { name: 'Modificar elemento', description: '' },
    pinepaper_delete_item: { name: 'Eliminar elemento', description: '' },
    pinepaper_add_relation: { name: 'Adicionar relação', description: '' },
    pinepaper_remove_relation: { name: 'Remover relação', description: '' },
    pinepaper_query_relations: { name: 'Consultar relações', description: '' },
    pinepaper_animate: { name: 'Animar', description: '' },
    pinepaper_keyframe_animate: { name: 'Animação por keyframes', description: '' },
    pinepaper_play_timeline: { name: 'Reproduzir timeline', description: '' },
    pinepaper_execute_generator: { name: 'Executar gerador', description: '' },
    pinepaper_list_generators: { name: 'Listar geradores', description: '' },
    pinepaper_apply_effect: { name: 'Aplicar efeito', description: '' },
    pinepaper_get_items: { name: 'Obter elementos', description: '' },
    pinepaper_get_relation_stats: { name: 'Estatísticas de relações', description: '' },
    pinepaper_set_background_color: { name: 'Definir cor de fundo', description: '' },
    pinepaper_set_canvas_size: { name: 'Definir tamanho da tela', description: '' },
    pinepaper_export_svg: { name: 'Exportar SVG', description: '' },
    pinepaper_export_training_data: { name: 'Exportar dados de treino', description: '' },

    // Diagram Tools
    pinepaper_create_diagram_shape: { name: 'Criar forma de diagrama', description: '' },
    pinepaper_connect: { name: 'Conectar itens', description: '' },
    pinepaper_connect_ports: { name: 'Conectar portas', description: '' },
    pinepaper_add_ports: { name: 'Adicionar portas', description: '' },
    pinepaper_auto_layout: { name: 'Layout automático', description: '' },
    pinepaper_get_diagram_shapes: { name: 'Obter formas de diagrama', description: '' },
    pinepaper_update_connector: { name: 'Atualizar conector', description: '' },
    pinepaper_remove_connector: { name: 'Remover conector', description: '' },
    pinepaper_diagram_mode: { name: 'Modo diagrama', description: '' },
  },

  errors: {
    itemNotFound: 'Elemento não encontrado: {{itemId}}',
    invalidRelation: 'Relação inválida: {{relationType}}',
    invalidParams: 'Parâmetros inválidos: {{details}}',
    generatorNotFound: 'Gerador não encontrado: {{generatorName}}',
    exportFailed: 'Falha na exportação: {{reason}}',
    executionError: 'Erro de execução: {{message}}',
    validationError: 'Erro de validação: {{message}}',
    unknownTool: 'Ferramenta desconhecida: {{toolName}}',
    apiKeyRequired: 'Chave API necessária',
    apiKeyInvalid: 'Chave API inválida',
    apiKeyExpired: 'Chave API expirada',
    rateLimitExceeded: 'Limite de pedidos excedido. Tente novamente em {{seconds}} segundos.',
  },

  success: {
    itemCreated: '{{itemType}} criado na posição ({{x}}, {{y}})',
    itemModified: 'Elemento {{itemId}} modificado',
    itemDeleted: 'Elemento {{itemId}} eliminado',
    relationAdded: 'Relação {{relationType}} adicionada: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Relação removida entre {{sourceId}} e {{targetId}}',
    animationApplied: 'Animação {{animationType}} aplicada a {{itemId}}',
    generatorExecuted: 'Gerador {{generatorName}} executado',
    effectApplied: 'Efeito {{effectType}} aplicado a {{itemId}}',
    backgroundSet: 'Cor de fundo definida para {{color}}',
    canvasSizeSet: 'Tamanho da tela definido para {{width}}×{{height}}',
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
    rotate: 'Rodar',
    bounce: 'Saltar',
    fade: 'Desvanecer',
    wobble: 'Oscilar',
    slide: 'Deslizar',
    typewriter: 'Máquina de escrever',
  },

  generators: {
    drawSunburst: 'Raios de sol',
    drawSunsetScene: 'Cena de pôr do sol',
    drawGrid: 'Grelha',
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

export default pt;
