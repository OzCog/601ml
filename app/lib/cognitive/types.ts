/**
 * Type definitions for Scheme Cognitive Grammar Microservices
 * Defines the core data structures for agentic primitives and hypergraph patterns
 */

// Core AtomSpace types
export interface Atom {
  id: string;
  type: AtomType;
  name?: string;
  truthValue?: TruthValue;
  confidence?: number;
}

export interface Link extends Atom {
  outgoing: Atom[];
}

export interface Node extends Atom {
  value?: any;
}

export enum AtomType {
  // Basic node types
  CONCEPT_NODE = 'ConceptNode',
  PREDICATE_NODE = 'PredicateNode',
  VARIABLE_NODE = 'VariableNode',
  
  // Basic link types
  INHERITANCE_LINK = 'InheritanceLink',
  EVALUATION_LINK = 'EvaluationLink',
  LIST_LINK = 'ListLink',
  
  // Scheme-specific types
  SCHEME_EXPRESSION = 'SchemeExpression',
  LAMBDA_LINK = 'LambdaLink',
  APPLICATION_LINK = 'ApplicationLink'
}

export interface TruthValue {
  strength: number; // [0, 1]
  confidence: number; // [0, 1]
}

// Scheme expression types
export interface SchemeExpression {
  type: 'atom' | 'list' | 'number' | 'string' | 'symbol';
  value: any;
  children?: SchemeExpression[];
}

// Agentic primitive types
export interface AgenticPrimitive {
  action: string;
  parameters: Record<string, any>;
  context?: AgenticContext;
  metadata?: Record<string, any>;
}

export interface AgenticContext {
  agent: string;
  goal: string;
  constraints: string[];
  resources: string[];
}

// Translation interfaces
export interface TranslationResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface RoundTripTest {
  original: any;
  intermediate: any;
  final: any;
  isValid: boolean;
  lossMetrics?: LossMetrics;
}

export interface LossMetrics {
  structuralLoss: number; // [0, 1] - how much structure was lost
  semanticLoss: number;   // [0, 1] - how much meaning was lost
  totalLoss: number;      // [0, 1] - overall loss metric
}

// API interfaces
export interface SchemeAdapterConfig {
  enableTruthValues: boolean;
  defaultConfidence: number;
  atomIdGenerator?: () => string;
  validationLevel: 'strict' | 'permissive' | 'none';
}

export interface AtomSpaceConfig {
  maxAtoms: number;
  enableGarbageCollection: boolean;
  truthValueThreshold: number;
}