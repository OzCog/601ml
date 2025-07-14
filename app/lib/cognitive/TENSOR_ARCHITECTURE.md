# Tensor Fragment Architecture Documentation

## Overview

Phase 1.2 introduces the **Tensor Fragment Architecture** for encoding agent/state information as hypergraph nodes/links. This architecture provides a foundation for distributed cognitive processing using tensor representations with prime factorization mapping.

## Tensor Shape Specification

### 5-Dimensional Tensor Shape

All tensor fragments use a standardized 5-dimensional shape:

```typescript
TensorShape: [modality, depth, context, salience, autonomy_index]
```

#### Dimension Semantics

1. **Modality** (1-1000): Input/output processing modality
   - `1`: Text/Language processing
   - `2`: Audio/Speech processing  
   - `3`: Visual/Image processing
   - `4-10`: Multimodal combinations
   - `11-100`: Sensor-specific modalities
   - `101-1000`: Custom application modalities

2. **Depth** (1-100): Cognitive processing depth/recursion level
   - `1-5`: Surface-level processing (reactive)
   - `6-15`: Shallow reasoning (pattern recognition)
   - `16-35`: Deep reasoning (causal inference)
   - `36-70`: Meta-cognitive processing (reflection)
   - `71-100`: Recursive meta-meta-cognition

3. **Context** (1-10000): Environmental/situational context dimension
   - `1-10`: Minimal context (isolated processing)
   - `11-100`: Local context (immediate environment)
   - `101-1000`: Extended context (historical/spatial)
   - `1001-5000`: Rich context (multi-domain integration)
   - `5001-10000`: Global context (world knowledge)

4. **Salience** (1-1000): Attention weight/importance dimension
   - `1-10`: Background processing (very low priority)
   - `11-50`: Routine processing (normal priority)
   - `51-200`: Focused attention (high priority)
   - `201-500`: Critical attention (very high priority)
   - `501-1000`: Emergency attention (maximum priority)

5. **Autonomy Index** (1-100): Autonomous decision-making capability level
   - `1-10`: Fully supervised (human/system controlled)
   - `11-25`: Semi-supervised (human oversight required)
   - `26-50`: Guided autonomy (policy-constrained)
   - `51-75`: Adaptive autonomy (self-modifying within bounds)
   - `76-100`: Full autonomy (unconstrained decision-making)

## Tensor Signatures

### Signature Format

Each tensor fragment has a unique signature based on its shape and content:

```
TENSOR_SIG_[modality]x[depth]x[context]x[salience]x[autonomy_index]_[checksum]
```

#### Example Signatures

```typescript
// Vision processing with deep reasoning
"TENSOR_SIG_3x25x500x300x45_a1b2c3d4"

// Language understanding with high autonomy  
"TENSOR_SIG_1x30x800x600x75_e5f6g7h8"

// Audio processing with minimal context
"TENSOR_SIG_2x8x25x150x20_i9j0k1l2"
```

### Signature Properties

- **Deterministic**: Same shape + data = same signature
- **Collision Resistant**: Different tensors have different signatures
- **Version Aware**: Signature includes format version
- **Efficient**: Fast computation and comparison

## Prime Factorization Mapping

### Purpose

Prime factorization enables efficient distributed processing by decomposing tensor operations across multiple processing nodes based on mathematical properties.

### Factorization Algorithm

For a tensor of total size `N = modality × depth × context × salience × autonomy_index`:

1. **Compute Prime Factors**: `N = p₁^a₁ × p₂^a₂ × ... × pₖ^aₖ`
2. **Generate Partitions**: Create processing partitions based on factors
3. **Distribute Processing**: Assign partitions to processing nodes
4. **Coordinate Results**: Aggregate results maintaining tensor structure

### Distribution Strategies

#### Row-wise Distribution
```typescript
PrimeFactorizationMapping {
  distributionStrategy: 'row-wise',
  partitions: [
    { factor: 2, startIndex: 0, endIndex: 199 },
    { factor: 2, startIndex: 200, endIndex: 399 },
    { factor: 5, startIndex: 400, endIndex: 599 }
  ]
}
```

#### Column-wise Distribution
```typescript
PrimeFactorizationMapping {
  distributionStrategy: 'column-wise',
  partitions: [
    { factor: 2, startIndex: 0, endIndex: 99, processingNode: 'node_1' },
    { factor: 3, startIndex: 100, endIndex: 299, processingNode: 'node_2' },
    { factor: 5, startIndex: 300, endIndex: 799, processingNode: 'node_3' }
  ]
}
```

#### Block-wise Distribution
```typescript
PrimeFactorizationMapping {
  distributionStrategy: 'block-wise',
  partitions: [
    { factor: 4, startIndex: 0, endIndex: 249 },    // 2×2 blocks
    { factor: 9, startIndex: 250, endIndex: 999 }   // 3×3 blocks
  ]
}
```

### Processing Node Assignment

Processing nodes are assigned based on:
- **Load Balancing**: Distribute work evenly across available nodes
- **Locality**: Keep related computations on same/nearby nodes
- **Fault Tolerance**: Maintain redundancy for critical computations
- **Network Topology**: Minimize communication overhead

## Memory Layout and Performance

### Efficient Memory Layout

Tensor data is stored in **row-major order** for optimal cache performance:

```
Index = autonomy_index + 
        autonomy_index_max * (salience + 
        salience_max * (context + 
        context_max * (depth + 
        depth_max * modality)))
```

### Memory Alignment

- **Default Alignment**: 32-byte boundaries for SIMD optimization
- **Configurable**: Supports 16, 32, 64, 128-byte alignment
- **Platform Aware**: Automatically detects optimal alignment

### Compression

Optional compression for storage/transmission:
- **Algorithm**: LZ4 for speed, gzip for ratio
- **Threshold**: Compress tensors > 1KB
- **Selective**: Skip compression for frequently accessed tensors

## Serialization Format

### Binary Format (Efficient)

```
Header (64 bytes):
  - Magic Number (4 bytes): 0x54465241 ("TFRA")
  - Version (4 bytes): 0x00010200 (1.2.0)
  - Shape (20 bytes): 5 × 4-byte integers
  - Data Size (4 bytes): Number of elements
  - Prime Factor Count (4 bytes)
  - Metadata Size (4 bytes)
  - Checksum (4 bytes)
  - Reserved (20 bytes)

Prime Factors (variable):
  - Factor values (4 bytes each)

Metadata (variable):
  - JSON-encoded metadata

Tensor Data (variable):
  - Raw float32 values or compressed data
```

### JSON Format (Interoperable)

```json
{
  "version": "1.2.0",
  "shape": {
    "modality": 3,
    "depth": 10,
    "context": 100,
    "salience": 50,
    "autonomy_index": 8
  },
  "data": "base64-encoded-tensor-data",
  "primeFactors": [2, 2, 2, 3, 5, 5],
  "metadata": {
    "created": 1672531200000,
    "lastModified": 1672531200000,
    "encoding": "float32",
    "checksum": "a1b2c3d4"
  }
}
```

## API Usage Examples

### Basic Tensor Fragment Creation

```typescript
import { TensorFragmentProcessor, TensorFragmentUtils } from './tensor-fragments';

const processor = new TensorFragmentProcessor();

// Create tensor for visual processing
const visualShape = TensorFragmentUtils.createShape(
  3,   // RGB vision
  15,  // Deep visual processing  
  200, // Rich visual context
  400, // High visual salience
  30   // Moderate autonomy
);

const result = processor.createTensorFragment(visualShape);
if (result.success) {
  console.log('Created tensor:', result.result.id);
  console.log('Memory usage:', result.performanceMetrics.memoryUsed);
}
```

### AtomSpace Integration

```typescript
import { AtomSpace } from './atomspace';

const atomSpace = new AtomSpace();

// Create multiple cognitive modalities
const shapes = [
  TensorFragmentUtils.createShape(1, 20, 300, 500, 50),  // Language
  TensorFragmentUtils.createShape(2, 12, 150, 300, 25),  // Audio
  TensorFragmentUtils.createShape(3, 18, 400, 450, 40)   // Vision
];

const fragments = shapes.map(shape => 
  atomSpace.createTensorFragment(shape)
);

// Query by cognitive characteristics
const highSalienceFragments = atomSpace.findTensorFragmentsByShape({
  salience: 500
});

console.log('High salience fragments:', highSalienceFragments.length);
```

### Distributed Processing Setup

```typescript
import { TensorFragmentProcessor } from './tensor-fragments';

const processor = new TensorFragmentProcessor();

// Create large tensor for distributed processing
const shape = TensorFragmentUtils.createShape(10, 50, 1000, 800, 60);
const fragment = processor.createTensorFragment(shape).result;

// Generate distribution mapping
const mapping = processor.generatePrimeFactorizationMapping(
  shape.modality * shape.depth * shape.context * shape.salience * shape.autonomy_index,
  'block-wise'
);

console.log('Distribution strategy:', mapping.distributionStrategy);
console.log('Processing partitions:', mapping.partitions.length);

// Assign partitions to processing nodes
mapping.partitions.forEach((partition, index) => {
  partition.processingNode = `cognitive-node-${index % 4}`;
});
```

### Serialization and Storage

```typescript
// Serialize for storage
const serialized = processor.serializeTensorFragment(fragment);
if (serialized.success) {
  // Store to database/file
  await storeToDatabase(fragment.id, serialized.result);
}

// Deserialize for processing
const restored = processor.deserializeTensorFragment(serialized.result);
if (restored.success) {
  console.log('Restored tensor shape:', restored.result.shape);
}
```

## Integration with Cognitive Architecture

### Hypergraph Representation

Tensor fragments integrate with the existing AtomSpace hypergraph:

- **Nodes**: Represent tensor fragments as specialized concept nodes
- **Links**: Connect tensor fragments through cognitive relationships
- **Truth Values**: Include tensor confidence/salience in truth calculations
- **Queries**: Pattern matching across both symbolic and tensor representations

### Cognitive Primitives

Tensor fragments enhance existing cognitive primitives:

```typescript
interface EnhancedAgenticPrimitive extends AgenticPrimitive {
  tensorFragment?: TensorFragment;
  cognitiveSignature?: string;
  processingRequirements?: {
    minAutonomy: number;
    requiredModalities: number[];
    contextDependencies: string[];
  };
}
```

### Performance Optimization

- **Lazy Loading**: Load tensor data only when needed
- **Caching**: Cache frequently accessed tensor fragments
- **Prefetching**: Predict and preload related tensors
- **Garbage Collection**: Automatically clean low-salience tensors

## Future Extensions

### Phase 2 Integration

- **ECAN Attention**: Use salience dimension for attention allocation
- **Dynamic Reshaping**: Adaptive tensor shapes based on context
- **Cross-Modal Transfer**: Tensor operations across modalities

### Phase 3 Neural-Symbolic

- **ggml Integration**: Hardware-accelerated tensor operations
- **Gradient Computation**: Backpropagation through tensor fragments
- **Neural Embedding**: Dense vector representations within tensors

### Phase 4 Distributed Mesh

- **Network Protocols**: Efficient tensor fragment transmission
- **Consensus Mechanisms**: Distributed tensor consistency
- **Load Balancing**: Dynamic redistribution of tensor processing

This documentation provides the foundation for implementing distributed cognitive systems using tensor fragment architecture while maintaining compatibility with existing hypergraph-based symbolic reasoning.