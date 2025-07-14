// Core components
export { AtomSpace } from './atomspace';
export { SchemeAdapter } from './scheme-adapter';
export { AgenticTranslator } from './translators';
export { TensorFragmentProcessor, TensorFragmentUtils } from './tensor-fragments';

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

// Enum exports
export { AtomType } from './types';

// Utility functions
import { AtomSpace } from './atomspace';
import { SchemeAdapter } from './scheme-adapter';
import { AgenticTranslator } from './translators';
import { TensorFragmentProcessor } from './tensor-fragments';

export const createCognitiveSystem = () => {
  const atomSpace = new AtomSpace();
  const schemeAdapter = new SchemeAdapter(atomSpace);
  const agenticTranslator = new AgenticTranslator(atomSpace);
  const tensorProcessor = new TensorFragmentProcessor();

  return {
    atomSpace,
    schemeAdapter,
    agenticTranslator,
    tensorProcessor,
  };
};

// Version information
export const COGNITIVE_VERSION = '1.2.0';
export const PHASE = '1.2';
