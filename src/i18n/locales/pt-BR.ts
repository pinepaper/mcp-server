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
