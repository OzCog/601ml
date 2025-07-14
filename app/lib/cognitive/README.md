# Scheme Cognitive Grammar Microservices API

This document describes the API interfaces and usage patterns for the Scheme Cognitive Grammar Microservices implementation, part of Phase 1.1 of the Distributed Agentic Cognitive Grammar Network.

## Overview

The Scheme Cognitive Grammar Microservices provide a modular adapter layer that enables bidirectional translation between:
- Scheme expressions and AtomSpace hypergraph patterns
- Agentic primitives and hypergraph representations
- Round-trip translations with loss metrics

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Scheme          │◄──►│ SchemeAdapter    │◄──►│ AtomSpace       │
│ Expressions     │    │                  │    │ Hypergraph      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ AgenticTranslator│
                       │                  │
                       └──────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Agentic         │
                       │ Primitives      │
                       └─────────────────┘
```

## Core Components

### AtomSpace

The foundational hypergraph data structure for storing cognitive primitives.

```typescript
import { AtomSpace, AtomType } from './app/lib/cognitive';

// Create an AtomSpace instance
const atomSpace = new AtomSpace({
  maxAtoms: 1000000,
  enableGarbageCollection: true,
  truthValueThreshold: 0.1
});

// Create nodes and links
const conceptNode = atomSpace.createNode(AtomType.CONCEPT_NODE, 'human');
const inheritanceLink = atomSpace.createLink(
  AtomType.INHERITANCE_LINK, 
  [dogNode, animalNode],
  { strength: 0.9, confidence: 0.8 }
);

// Query atoms
const humanConcepts = atomSpace.getAtomsByName('human');
const allInheritance = atomSpace.getAtomsByType(AtomType.INHERITANCE_LINK);
```

### SchemeAdapter

Handles parsing and conversion between Scheme expressions and AtomSpace atoms.

```typescript
import { SchemeAdapter, AtomSpace } from './app/lib/cognitive';

const atomSpace = new AtomSpace();
const adapter = new SchemeAdapter(atomSpace, {
  enableTruthValues: true,
  defaultConfidence: 0.8,
  validationLevel: 'permissive'
});

// Parse Scheme expression
const parseResult = adapter.parseScheme('(+ 1 2)');
if (parseResult.success) {
  console.log(parseResult.result); // SchemeExpression object
}

// Convert to atoms
const atomsResult = adapter.schemeToAtoms(parseResult.result!);
if (atomsResult.success) {
  console.log(`Created ${atomsResult.result!.length} atoms`);
}

// Convert back to Scheme
const backResult = adapter.atomsToScheme(atomsResult.result!);
const schemeString = adapter.expressionToString(backResult.result!);
```

### AgenticTranslator

Provides bidirectional translation between agentic primitives and hypergraph patterns.

```typescript
import { AgenticTranslator, AtomSpace, AgenticPrimitive } from './app/lib/cognitive';

const atomSpace = new AtomSpace();
const translator = new AgenticTranslator(atomSpace);

// Define an agentic primitive
const primitive: AgenticPrimitive = {
  action: 'navigate',
  parameters: {
    destination: 'kitchen',
    speed: 'normal',
    avoid_obstacles: true
  },
  context: {
    agent: 'service-robot',
    goal: 'deliver-item',
    constraints: ['safe-operation'],
    resources: ['sensors', 'motors']
  }
};

// Convert to hypergraph
const hypergraphResult = translator.agenticToHypergraph(primitive);
if (hypergraphResult.success) {
  console.log(`Created ${hypergraphResult.result!.length} atoms`);
}

// Convert back to agentic primitive
const backResult = translator.hypergraphToAgentic(hypergraphResult.result!);
if (backResult.success) {
  console.log('Reconstructed primitive:', backResult.result);
}

// Perform round-trip test
const roundTripResult = translator.roundTripTest(primitive);
console.log('Round-trip valid:', roundTripResult.isValid);
console.log('Total loss:', roundTripResult.lossMetrics?.totalLoss);
```

## Data Types

### Core AtomSpace Types

```typescript
// Basic atom interface
interface Atom {
  id: string;
  type: AtomType;
  name?: string;
  truthValue?: TruthValue;
  confidence?: number;
}

// Node (leaf atom)
interface Node extends Atom {
  value?: any;
}

// Link (composite atom)
interface Link extends Atom {
  outgoing: Atom[];
}

// Truth value for uncertain reasoning
interface TruthValue {
  strength: number; // [0, 1]
  confidence: number; // [0, 1]
}

// Available atom types
enum AtomType {
  CONCEPT_NODE = 'ConceptNode',
  PREDICATE_NODE = 'PredicateNode',
  VARIABLE_NODE = 'VariableNode',
  INHERITANCE_LINK = 'InheritanceLink',
  EVALUATION_LINK = 'EvaluationLink',
  LIST_LINK = 'ListLink',
  LAMBDA_LINK = 'LambdaLink',
  APPLICATION_LINK = 'ApplicationLink'
}
```

### Scheme Expression Types

```typescript
// Parsed Scheme expression
interface SchemeExpression {
  type: 'atom' | 'list' | 'number' | 'string' | 'symbol';
  value: any;
  children?: SchemeExpression[];
}
```

### Agentic Primitive Types

```typescript
// Core agentic primitive structure
interface AgenticPrimitive {
  action: string;
  parameters: Record<string, any>;
  context?: AgenticContext;
  metadata?: Record<string, any>;
}

// Context for agentic actions
interface AgenticContext {
  agent: string;
  goal: string;
  constraints: string[];
  resources: string[];
}
```

### Translation Result Types

```typescript
// Generic translation result
interface TranslationResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  metadata?: Record<string, any>;
}

// Round-trip test results
interface RoundTripTest {
  original: any;
  intermediate: any;
  final: any;
  isValid: boolean;
  lossMetrics?: LossMetrics;
}

// Loss metrics for translation quality
interface LossMetrics {
  structuralLoss: number; // [0, 1]
  semanticLoss: number;   // [0, 1]
  totalLoss: number;      // [0, 1]
}
```

## Usage Patterns

### Basic Scheme Processing

```typescript
// Parse and process a Scheme expression
const processSchemeExpression = (schemeString: string) => {
  const atomSpace = new AtomSpace();
  const adapter = new SchemeAdapter(atomSpace);
  
  // Parse the expression
  const parseResult = adapter.parseScheme(schemeString);
  if (!parseResult.success) {
    throw new Error(`Parse error: ${parseResult.error}`);
  }
  
  // Convert to atoms
  const atomsResult = adapter.schemeToAtoms(parseResult.result!);
  if (!atomsResult.success) {
    throw new Error(`Conversion error: ${atomsResult.error}`);
  }
  
  return atomsResult.result!;
};

// Example usage
const atoms = processSchemeExpression('(inheritance dog animal)');
```

### Agentic Primitive Processing

```typescript
// Process an agentic primitive through hypergraph
const processAgenticPrimitive = (primitive: AgenticPrimitive) => {
  const atomSpace = new AtomSpace();
  const translator = new AgenticTranslator(atomSpace);
  
  // Convert to hypergraph
  const hypergraphResult = translator.agenticToHypergraph(primitive);
  if (!hypergraphResult.success) {
    throw new Error(`Hypergraph conversion failed: ${hypergraphResult.error}`);
  }
  
  // Process in hypergraph space (add your logic here)
  const processedAtoms = hypergraphResult.result!;
  
  // Convert back if needed
  const backResult = translator.hypergraphToAgentic(processedAtoms);
  return backResult.result!;
};
```

### Round-Trip Validation

```typescript
// Validate translation quality
const validateTranslation = (primitive: AgenticPrimitive) => {
  const translator = new AgenticTranslator(new AtomSpace());
  const roundTripResult = translator.roundTripTest(primitive);
  
  if (!roundTripResult.isValid) {
    console.warn('Translation quality is poor');
    console.log('Loss metrics:', roundTripResult.lossMetrics);
  }
  
  return {
    isValid: roundTripResult.isValid,
    qualityScore: 1 - (roundTripResult.lossMetrics?.totalLoss || 1)
  };
};
```

### Complex Cognitive Scenarios

```typescript
// Navigation task example
const navigationTask: AgenticPrimitive = {
  action: 'navigate-to-location',
  parameters: {
    destination: 'conference_room_A',
    path_planning: 'shortest',
    obstacle_avoidance: true,
    max_speed: 2.5
  },
  context: {
    agent: 'service-robot-01',
    goal: 'attend-meeting',
    constraints: ['avoid-crowds', 'quiet-operation'],
    resources: ['lidar', 'camera', 'wheel-motors']
  }
};

// Process through the cognitive pipeline
const atomSpace = new AtomSpace();
const translator = new AgenticTranslator(atomSpace);

// Convert to hypergraph for processing
const hypergraphResult = translator.agenticToHypergraph(navigationTask);

// Perform cognitive processing (planning, reasoning, etc.)
// ... your cognitive algorithms here ...

// Convert back to executable primitive
const backResult = translator.hypergraphToAgentic(hypergraphResult.result!);
```

## Error Handling

All translation methods return `TranslationResult<T>` objects with consistent error handling:

```typescript
const handleTranslationResult = <T>(result: TranslationResult<T>) => {
  if (result.success && result.result) {
    return result.result;
  } else {
    throw new Error(result.error || 'Unknown translation error');
  }
};

// Usage
try {
  const atoms = handleTranslationResult(adapter.parseScheme(schemeString));
  // Process atoms...
} catch (error) {
  console.error('Translation failed:', error.message);
}
```

## Performance Considerations

### AtomSpace Configuration

```typescript
// For high-performance scenarios
const highPerformanceAtomSpace = new AtomSpace({
  maxAtoms: 10000000,           // Large capacity
  enableGarbageCollection: true, // Automatic cleanup
  truthValueThreshold: 0.05     // Aggressive cleanup threshold
});

// For memory-constrained scenarios
const lightweightAtomSpace = new AtomSpace({
  maxAtoms: 100000,             // Smaller capacity
  enableGarbageCollection: true,
  truthValueThreshold: 0.3      // Conservative threshold
});
```

### Batch Processing

```typescript
// Process multiple primitives efficiently
const batchProcessPrimitives = (primitives: AgenticPrimitive[]) => {
  const atomSpace = new AtomSpace();
  const translator = new AgenticTranslator(atomSpace);
  
  const results = primitives.map(primitive => {
    const result = translator.agenticToHypergraph(primitive);
    return result.success ? result.result! : [];
  });
  
  // Batch operations on accumulated atoms
  const allAtoms = results.flat();
  const stats = atomSpace.getStats();
  
  return { allAtoms, stats };
};
```

## Testing

The implementation includes comprehensive test suites that use real data rather than mocks:

```typescript
// Example test pattern
import { describe, expect, it } from 'vitest';

describe('Real data translation tests', () => {
  it('should handle complex navigation scenarios', () => {
    const realNavigationPrimitive = createRealNavigationTask();
    const translator = new AgenticTranslator(new AtomSpace());
    
    const roundTripResult = translator.roundTripTest(realNavigationPrimitive);
    
    expect(roundTripResult.isValid).toBe(true);
    expect(roundTripResult.lossMetrics?.totalLoss).toBeLessThan(0.1);
  });
});
```

## Integration with Cognitive Network

This implementation serves as the foundation for Phase 1 of the Distributed Agentic Cognitive Grammar Network. The modular design allows for:

1. **Recursive Modularity**: Each component is self-similar and can be composed
2. **Real Implementation**: All operations use actual data, no simulations
3. **Bidirectional Translation**: Preserves information across transformations
4. **Quality Metrics**: Provides measurable translation quality indicators

## Next Steps

This Phase 1.1 implementation provides the foundation for:
- Phase 2: ECAN Attention Allocation integration
- Phase 3: Neural-Symbolic Synthesis via ggml kernels
- Phase 4: Distributed Cognitive Mesh API
- Phase 5: Recursive Meta-Cognition
- Phase 6: Complete system testing and unification

## API Reference Summary

| Component | Purpose | Key Methods |
|-----------|---------|-------------|
| `AtomSpace` | Hypergraph storage | `createNode()`, `createLink()`, `getAtom()`, `findAtoms()` |
| `SchemeAdapter` | Scheme ↔ AtomSpace | `parseScheme()`, `schemeToAtoms()`, `atomsToScheme()` |
| `AgenticTranslator` | Agentic ↔ Hypergraph | `agenticToHypergraph()`, `hypergraphToAgentic()`, `roundTripTest()` |
| `HypergraphVisualizer` | Visualization | `visualizeAtoms()`, `visualizeAgenticPrimitive()`, `exportFlowchart()` |

## Hypergraph Visualization (Phase 1.2 Complete)

The visualization system provides comprehensive flowchart generation for cognitive primitives:

### Basic Visualization

```typescript
import { HypergraphVisualizer } from './app/lib/cognitive';

const visualizer = new HypergraphVisualizer();

// Visualize atoms
const visualization = visualizer.visualizeAtoms(atoms, 'My Cognitive System');

// Export as Mermaid flowchart
const mermaid = visualizer.exportFlowchart(visualization, 'mermaid');
console.log(mermaid);

// Export as DOT for Graphviz
const dot = visualizer.exportFlowchart(visualization, 'dot');
```

### Agentic Primitive Visualization

```typescript
const primitive: AgenticPrimitive = {
  action: 'navigate',
  parameters: { destination: 'kitchen', speed: 'fast' },
  context: {
    agent: 'robot-1',
    goal: 'help-user',
    constraints: ['safe-operation'],
    resources: ['sensors', 'actuators']
  }
};

const agenticViz = visualizer.visualizeAgenticPrimitive(primitive);
const flowchart = visualizer.exportFlowchart(agenticViz, 'mermaid');
```

### Tensor Fragment Visualization

```typescript
import { TensorFragmentUtils } from './app/lib/cognitive';

const shape = TensorFragmentUtils.createShape(3, 5, 100, 80, 15);
const tensorFragment = atomSpace.createTensorFragment(shape);
const tensorViz = visualizer.visualizeTensorFragment(tensorFragment!);

// Visualize tensor dimensions and prime factorization
const diagram = visualizer.exportFlowchart(tensorViz, 'mermaid');
```

### System Reports

```typescript
import { VisualizationUtils } from './app/lib/cognitive';

// Generate comprehensive system report
const report = VisualizationUtils.generateSystemReport(atoms, tensorFragments);
console.log(report); // Markdown report with embedded Mermaid diagrams

// Generate cognitive architecture overview
const flowDiagram = VisualizationUtils.createCognitiveFlowDiagram();
```

### Export Formats

- **Mermaid**: For documentation and GitHub README files
- **DOT**: For Graphviz rendering  
- **JSON**: For programmatic processing
- **SVG Description**: For custom SVG generation

See [VISUALIZATION_EXAMPLES.md](./VISUALIZATION_EXAMPLES.md) for comprehensive examples and use cases.

For detailed method signatures and options, refer to the TypeScript type definitions in the source code.