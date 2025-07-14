// Core components
export { AtomSpace } from './atomspace';
export { SchemeAdapter } from './scheme-adapter';
export { AgenticTranslator } from './translators';

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
  AtomSpaceConfig
} from './types';

// Enum exports
export { AtomType } from './types';

// Utility functions
import { AtomSpace } from './atomspace';
import { SchemeAdapter } from './scheme-adapter';
import { AgenticTranslator } from './translators';

export const createCognitiveSystem = () => {
  const atomSpace = new AtomSpace();
  const schemeAdapter = new SchemeAdapter(atomSpace);
  const agenticTranslator = new AgenticTranslator(atomSpace);
  
  return {
    atomSpace,
    schemeAdapter,
    agenticTranslator
  };
};

// Version information
export const COGNITIVE_VERSION = '1.0.0';
export const PHASE = '1.1';