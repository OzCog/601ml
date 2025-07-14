// Core components
export { AtomSpace } from './atomspace';
export { SchemeAdapter } from './scheme-adapter';
export { AgenticTranslator } from './translators';
export { TensorFragmentProcessor, TensorFragmentUtils } from './tensor-fragments';
export { HypergraphVisualizer, VisualizationUtils } from './visualization';

// Type definitions
export type {
  Atom,
  Link,
  Node,
  TruthValue,
  SchemeExpression,
  AgenticPrimitive,
  AgenticContext,
  TranslationResult,
  RoundTripTest,
  LossMetrics,
  SchemeAdapterConfig,
  AtomSpaceConfig,
  TensorShape,
  TensorFragment,
  TensorFragmentConfig,
  TensorFragmentResult,
  TensorMetadata,
  SerializedTensorFragment,
  PrimeFactorizationMapping,
  PrimePartition,
  TensorPerformanceMetrics,
} from './types';

// Visualization types
export type {
  VisualNode,
  VisualEdge,
  HypergraphVisualization,
  FlowchartFormat,
  VisualizationConfig,
} from './visualization';

// Enum exports
export { AtomType } from './types';

// Utility functions
import { AtomSpace } from './atomspace';
import { SchemeAdapter } from './scheme-adapter';
import { AgenticTranslator } from './translators';
import { TensorFragmentProcessor } from './tensor-fragments';
import { HypergraphVisualizer } from './visualization';

export const createCognitiveSystem = () => {
  const atomSpace = new AtomSpace();
  const schemeAdapter = new SchemeAdapter(atomSpace);
  const agenticTranslator = new AgenticTranslator(atomSpace);
  const tensorProcessor = new TensorFragmentProcessor();
  const visualizer = new HypergraphVisualizer();

  return {
    atomSpace,
    schemeAdapter,
    agenticTranslator,
    tensorProcessor,
    visualizer,
  };
};

// Version information
export const COGNITIVE_VERSION = '1.2.0';
export const PHASE = '1.2';
