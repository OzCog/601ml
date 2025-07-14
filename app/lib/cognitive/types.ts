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
  APPLICATION_LINK = 'ApplicationLink',
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
  semanticLoss: number; // [0, 1] - how much meaning was lost
  totalLoss: number; // [0, 1] - overall loss metric
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

// Tensor Fragment Architecture Types (Phase 1.2)

/**
 * 5-dimensional tensor shape for encoding agent/state as hypergraph nodes/links
 * Shape: [modality, depth, context, salience, autonomy_index]
 */
export interface TensorShape {
  modality: number; // Input/output modality dimension (visual, auditory, textual, etc.)
  depth: number; // Cognitive processing depth/recursion level
  context: number; // Environmental/situational context dimension
  salience: number; // Attention weight/importance dimension
  autonomy_index: number; // Autonomous decision-making capability level
}

/**
 * Tensor fragment representing agent/state encoding in hypergraph
 */
export interface TensorFragment {
  id: string;
  shape: TensorShape;
  data: Float32Array; // Tensor data in row-major order
  primeFactors: number[]; // Prime factorization for distributed processing
  metadata: TensorMetadata;
}

/**
 * Metadata associated with tensor fragments
 */
export interface TensorMetadata {
  created: number; // Timestamp
  lastModified: number; // Last modification timestamp
  version: string; // Version for compatibility
  encoding: 'float32' | 'int8' | 'int16'; // Data encoding type
  compression?: string; // Optional compression algorithm
  checksum?: string; // Data integrity checksum
}

/**
 * Configuration for tensor fragment operations
 */
export interface TensorFragmentConfig {
  maxTensorSize: number; // Maximum tensor size in elements
  enableCompression: boolean; // Enable data compression
  enableValidation: boolean; // Enable shape validation
  defaultPrecision: 'float32' | 'int8' | 'int16';
  memoryAlignment: number; // Memory alignment for performance
}

/**
 * Result of tensor fragment operations
 */
export interface TensorFragmentResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  validationErrors?: string[];
  performanceMetrics?: TensorPerformanceMetrics;
}

/**
 * Performance metrics for tensor operations
 */
export interface TensorPerformanceMetrics {
  operationTime: number; // Operation time in milliseconds
  memoryUsed: number; // Memory used in bytes
  compressionRatio?: number; // Compression ratio if applicable
}

/**
 * Tensor fragment serialization format
 */
export interface SerializedTensorFragment {
  version: string;
  shape: TensorShape;
  data: string; // Base64-encoded tensor data
  primeFactors: number[];
  metadata: TensorMetadata;
}

/**
 * Prime factorization mapping for distributed processing
 */
export interface PrimeFactorizationMapping {
  originalSize: number;
  factors: number[];
  distributionStrategy: 'row-wise' | 'column-wise' | 'block-wise';
  partitions: PrimePartition[];
}

/**
 * Individual partition in prime factorization
 */
export interface PrimePartition {
  factor: number;
  startIndex: number;
  endIndex: number;
  processingNode?: string; // Optional node assignment for distributed processing
}
