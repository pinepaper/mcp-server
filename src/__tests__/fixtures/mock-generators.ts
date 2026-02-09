/**
 * Mock Generators for Testing
 */

export const mockSunburstGenerator = {
  generatorName: 'drawSunburst' as const,
  params: {
    rayCount: 16,
    colors: ['#FF6B6B', '#4ECDC4'],
    bgColor: '#1a1a2e',
    animated: true,
  },
};

export const mockSunsetGenerator = {
  generatorName: 'drawSunsetScene' as const,
  params: {
    sunColor: '#fbbf24',
    skyColors: ['#f97316', '#ec4899', '#8b5cf6'],
    cloudCount: 5,
  },
};

export const mockGridGenerator = {
  generatorName: 'drawGrid' as const,
  params: {
    gridType: 'lines' as const,
    spacing: 40,
    lineColor: '#374151',
    bgColor: '#1f2937',
    lineWidth: 1,
  },
};

export const mockDotsGridGenerator = {
  generatorName: 'drawGrid' as const,
  params: {
    gridType: 'dots' as const,
    spacing: 30,
    lineColor: '#60a5fa',
    bgColor: '#0f172a',
  },
};

export const mockWavesGenerator = {
  generatorName: 'drawWaves' as const,
  params: {
    waveCount: 5,
    colors: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'],
    amplitude: 50,
    frequency: 2,
    bgColor: '#0f172a',
    animated: true,
  },
};

export const mockCircuitGenerator = {
  generatorName: 'drawCircuit' as const,
  params: {
    lineColor: '#60a5fa',
    nodeColor: '#3b82f6',
    bgColor: '#0f172a',
    density: 0.6,
    animated: true,
    boltColor: '#fbbf24',
  },
};

export const mockStackedCirclesGenerator = {
  generatorName: 'drawStackedCircles' as const,
  params: {
    count: 8,
    colors: ['#ef4444', '#f97316', '#fbbf24', '#22c55e', '#3b82f6', '#8b5cf6'],
    distribution: 'random' as const,
  },
};

export const mockPatternGenerator = {
  generatorName: 'drawPattern' as const,
  params: {
    patternType: 'hexagon' as const,
    size: 30,
    color: '#60a5fa',
    bgColor: '#1e293b',
  },
};

// Phase 2: New generators

export const mockBokehGenerator = {
  generatorName: 'drawBokeh' as const,
  params: {
    count: 30,
    colors: ['#f472b6', '#818cf8', '#34d399', '#fbbf24'],
    bgColor: '#0f172a',
    minRadius: 10,
    maxRadius: 60,
    shadowBlur: 20,
    distribution: 'poisson' as const,
    driftAnimation: true,
  },
};

export const mockGradientMeshGenerator = {
  generatorName: 'drawGradientMesh' as const,
  params: {
    colors: ['#ec4899', '#8b5cf6', '#06b6d4'],
    bgColor: '#0f0f23',
    blobCount: 5,
    blendMode: 'screen',
    drift: true,
  },
};

export const mockGeometricAbstractGenerator = {
  generatorName: 'drawGeometricAbstract' as const,
  params: {
    colors: ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b'],
    bgColor: '#1e1b4b',
    shapeCount: 12,
    blendMode: 'multiply',
    rotation: true,
  },
};

export const mockWindFieldGenerator = {
  generatorName: 'drawWindField' as const,
  params: {
    particleCount: 200,
    colors: ['#e0f2fe', '#bae6fd', '#7dd3fc'],
    bgColor: '#0c4a6e',
    direction: 45,
    turbulence: 0.5,
    trailLength: 30,
    speed: 1.5,
  },
};

export const mockFluidFlowGenerator = {
  generatorName: 'drawFluidFlow' as const,
  params: {
    streamCount: 8,
    colors: ['#67e8f9', '#a78bfa', '#f9a8d4'],
    bgColor: '#0f172a',
    depthLayers: 3,
    speed: 0.8,
  },
};

export const mockOrganicFlowGenerator = {
  generatorName: 'drawOrganicFlow' as const,
  params: {
    layerCount: 4,
    colors: ['#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
    bgColor: '#064e3b',
    blendMode: 'screen',
    fillToBottom: true,
    animated: true,
  },
};

export const mockNoiseTextureGenerator = {
  generatorName: 'drawNoiseTexture' as const,
  params: {
    noiseType: 'perlin' as const,
    colors: ['#94a3b8', '#64748b'],
    bgColor: '#1e293b',
    scale: 0.01,
    density: 0.7,
    animated: true,
  },
};

// Collection of all mock generators
export const allMockGenerators = [
  mockSunburstGenerator,
  mockSunsetGenerator,
  mockGridGenerator,
  mockDotsGridGenerator,
  mockWavesGenerator,
  mockCircuitGenerator,
  mockStackedCirclesGenerator,
  mockPatternGenerator,
  mockBokehGenerator,
  mockGradientMeshGenerator,
  mockGeometricAbstractGenerator,
  mockWindFieldGenerator,
  mockFluidFlowGenerator,
  mockOrganicFlowGenerator,
  mockNoiseTextureGenerator,
];
