/**
 * Mock Relations for Testing
 */

export const mockOrbitsRelation = {
  sourceId: 'item_2',
  targetId: 'item_1',
  relationType: 'orbits' as const,
  params: {
    radius: 150,
    speed: 0.5,
    direction: 'counterclockwise' as const,
    phase: 0,
  },
};

export const mockFollowsRelation = {
  sourceId: 'item_3',
  targetId: 'item_1',
  relationType: 'follows' as const,
  params: {
    offset: [0, -50] as [number, number],
    smoothing: 0.1,
    delay: 0.2,
  },
};

export const mockAttachedToRelation = {
  sourceId: 'label_1',
  targetId: 'item_1',
  relationType: 'attached_to' as const,
  params: {
    offset: [0, -70] as [number, number],
    inherit_rotation: false,
  },
};

export const mockMaintainsDistanceRelation = {
  sourceId: 'item_4',
  targetId: 'item_1',
  relationType: 'maintains_distance' as const,
  params: {
    distance: 200,
    strength: 0.8,
  },
};

export const mockPointsAtRelation = {
  sourceId: 'arrow_1',
  targetId: 'target_1',
  relationType: 'points_at' as const,
  params: {
    offset_angle: 0,
    smoothing: 0.2,
  },
};

export const mockMirrorsRelation = {
  sourceId: 'reflection_1',
  targetId: 'original_1',
  relationType: 'mirrors' as const,
  params: {
    axis: 'vertical' as const,
    center: [400, 300] as [number, number],
  },
};

export const mockParallaxRelation = {
  sourceId: 'bg_element',
  targetId: 'camera',
  relationType: 'parallax' as const,
  params: {
    depth: 0.5,
    origin: [400, 300] as [number, number],
  },
};

export const mockBoundsToRelation = {
  sourceId: 'player',
  targetId: 'arena',
  relationType: 'bounds_to' as const,
  params: {
    padding: 20,
    bounce: true,
  },
};

// Procedural / deterministic property binding (Expression IR — S10 G1).
// driven_by drives the source's fillColor from the target's x via the pure
// signal interpreter (signal:true → replay-stable).
export const mockDrivenByRelation = {
  sourceId: 'dot_1',
  targetId: 'planet_1',
  relationType: 'driven_by' as const,
  params: {
    sourceProperty: 'fillColor',
    targetProperty: 'x',
    multiplier: 0.002,
    offset: 0,
    colorFrom: '#0055ff',
    colorTo: '#ff3300',
    signal: true,
  },
};

// time_expression: self-relation (targetId=null); bob the y with sin(t).
export const mockTimeExpressionRelation = {
  sourceId: 'floater_1',
  targetId: null,
  relationType: 'time_expression' as const,
  params: {
    property: 'y',
    expression: 'sin(t * 2) * 50 + v',
    baseValue: 300,
    signal: true,
  },
};

// Collection of all mock relations
export const allMockRelations = [
  mockOrbitsRelation,
  mockFollowsRelation,
  mockAttachedToRelation,
  mockMaintainsDistanceRelation,
  mockPointsAtRelation,
  mockMirrorsRelation,
  mockParallaxRelation,
  mockBoundsToRelation,
  mockDrivenByRelation,
  mockTimeExpressionRelation,
];
