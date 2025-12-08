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
];
