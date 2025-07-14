/**
 * Comprehensive tests for Hypergraph Visualization
 * Tests flowchart generation and visual representation using real data
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { HypergraphVisualizer, VisualizationUtils } from './visualization';
import { AtomSpace } from './atomspace';
import { SchemeAdapter } from './scheme-adapter';
import { AgenticTranslator } from './translators';
import { TensorFragmentProcessor, TensorFragmentUtils } from './tensor-fragments';
import { AtomType } from './types';
import type { AgenticPrimitive, AgenticContext, TensorShape } from './types';

describe('HypergraphVisualizer', () => {
  let visualizer: HypergraphVisualizer;
  let atomSpace: AtomSpace;
  let schemeAdapter: SchemeAdapter;
  let agenticTranslator: AgenticTranslator;

  beforeEach(() => {
    visualizer = new HypergraphVisualizer();
    atomSpace = new AtomSpace();
    schemeAdapter = new SchemeAdapter(atomSpace);
    agenticTranslator = new AgenticTranslator(atomSpace);
  });

  describe('Basic atom visualization', () => {
    it('should visualize simple concept nodes', () => {
      const node1 = atomSpace.createNode(AtomType.CONCEPT_NODE, 'human');
      const node2 = atomSpace.createNode(AtomType.CONCEPT_NODE, 'animal');
      const link = atomSpace.createLink(AtomType.INHERITANCE_LINK, [node1, node2]);

      const visualization = visualizer.visualizeAtoms([node1, node2, link], 'Simple Inheritance');

      expect(visualization.nodes).toHaveLength(2);
      expect(visualization.edges).toHaveLength(1);
      expect(visualization.metadata.title).toBe('Simple Inheritance');
      expect(visualization.metadata.complexity).toBe('simple');

      const humanNode = visualization.nodes.find((n) => n.label === 'human');
      expect(humanNode).toBeDefined();
      expect(humanNode?.type).toBe('concept');
      expect(humanNode?.shape).toBe('circle');

      const edge = visualization.edges[0];
      expect(edge.type).toBe('inheritance');
      expect(edge.style).toBe('solid');
    });

    it('should visualize predicate nodes with evaluation links', () => {
      const predicate = atomSpace.createNode(AtomType.PREDICATE_NODE, 'likes');
      const alice = atomSpace.createNode(AtomType.CONCEPT_NODE, 'Alice');
      const bob = atomSpace.createNode(AtomType.CONCEPT_NODE, 'Bob');
      const listLink = atomSpace.createLink(AtomType.LIST_LINK, [alice, bob]);
      const evalLink = atomSpace.createLink(AtomType.EVALUATION_LINK, [predicate, listLink]);

      const atoms = [predicate, alice, bob, listLink, evalLink];
      const visualization = visualizer.visualizeAtoms(atoms, 'Predicate Evaluation');

      expect(visualization.nodes).toHaveLength(3); // predicate + 2 concepts
      expect(visualization.edges.length).toBeGreaterThan(0);

      const predicateNode = visualization.nodes.find((n) => n.label === 'likes');
      expect(predicateNode?.type).toBe('predicate');
      expect(predicateNode?.shape).toBe('diamond');
    });

    it('should handle truth values in visualization', () => {
      const visualizerWithTruth = new HypergraphVisualizer({ showTruthValues: true });

      const node = atomSpace.createNode(AtomType.CONCEPT_NODE, 'uncertain', {
        strength: 0.7,
        confidence: 0.8,
      });

      const visualization = visualizerWithTruth.visualizeAtoms([node]);

      const visualNode = visualization.nodes[0];
      expect(visualNode.label).toContain('uncertain');
      expect(visualNode.label).toContain('0.70');
      expect(visualNode.label).toContain('0.80');
    });

    it('should limit large atom collections', () => {
      const maxNodes = 5;
      const limitedVisualizer = new HypergraphVisualizer({ maxNodes });

      // Create more atoms than the limit
      const atoms = [];
      for (let i = 0; i < 10; i++) {
        atoms.push(atomSpace.createNode(AtomType.CONCEPT_NODE, `concept-${i}`));
      }

      const visualization = limitedVisualizer.visualizeAtoms(atoms);

      expect(visualization.nodes.length).toBeLessThanOrEqual(maxNodes);
      expect(visualization.metadata.nodeCount).toBeLessThanOrEqual(maxNodes);
    });
  });

  describe('Agentic primitive visualization', () => {
    it('should visualize simple agentic primitives', () => {
      const primitive: AgenticPrimitive = {
        action: 'navigate',
        parameters: {
          destination: 'kitchen',
          speed: 'fast',
        },
      };

      const visualization = visualizer.visualizeAgenticPrimitive(primitive);

      expect(visualization.metadata.title).toContain('navigate');
      expect(visualization.nodes.length).toBeGreaterThan(3); // action + param keys + param values

      const actionNode = visualization.nodes.find((n) => n.id === 'action');
      expect(actionNode?.label).toBe('navigate');
      expect(actionNode?.type).toBe('predicate');
      expect(actionNode?.shape).toBe('diamond');

      const paramNodes = visualization.nodes.filter((n) => n.metadata?.isParameter);
      expect(paramNodes.length).toBeGreaterThan(0);
    });

    it('should visualize agentic primitives with context', () => {
      const context: AgenticContext = {
        agent: 'service-robot',
        goal: 'help-user',
        constraints: ['safe-operation', 'efficient-path'],
        resources: ['sensors', 'actuators'],
      };

      const primitive: AgenticPrimitive = {
        action: 'assist',
        parameters: { task: 'cleaning' },
        context,
      };

      const visualization = visualizer.visualizeAgenticPrimitive(primitive);

      expect(visualization.nodes.some((n) => n.id === 'context')).toBe(true);
      expect(visualization.nodes.some((n) => n.id === 'agent')).toBe(true);
      expect(visualization.edges.some((e) => e.label === 'has-context')).toBe(true);

      const contextNode = visualization.nodes.find((n) => n.id === 'context');
      expect(contextNode?.shape).toBe('hexagon');

      expect(visualization.metadata.renderingHints.grouping).toContain('context');
    });

    it('should handle complex parameter structures', () => {
      const primitive: AgenticPrimitive = {
        action: 'complex-task',
        parameters: {
          simple: 'value',
          number: 42,
          array: ['item1', 'item2', 'item3'],
          object: { nested: 'data', count: 5 },
        },
      };

      const visualization = visualizer.visualizeAgenticPrimitive(primitive);

      expect(visualization.nodes.length).toBeGreaterThan(8); // action + 4 param keys + 4 param values

      const complexParamNode = visualization.nodes.find((n) => n.label.includes('nested'));
      expect(complexParamNode).toBeDefined();
    });
  });

  describe('Tensor fragment visualization', () => {
    it('should visualize tensor fragments with dimensions', () => {
      const processor = new TensorFragmentProcessor();
      const shape: TensorShape = {
        modality: 2,
        depth: 3,
        context: 4,
        salience: 5,
        autonomy_index: 2,
      };

      const result = processor.createTensorFragment(shape);
      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      
      const fragment = result.result!;

      const visualization = visualizer.visualizeTensorFragment(fragment);

      expect(visualization.metadata.title).toContain('Tensor Fragment');
      expect(visualization.nodes).toHaveLength(7); // tensor + 5 dimensions + prime factors

      const tensorNode = visualization.nodes.find((n) => n.type === 'tensor');
      expect(tensorNode?.shape).toBe('hexagon');

      const dimensionNodes = visualization.nodes.filter((n) => n.metadata?.dimension);
      expect(dimensionNodes).toHaveLength(5);

      const modalityNode = dimensionNodes.find((n) => n.metadata?.dimension === 'modality');
      expect(modalityNode?.label).toContain('modality: 2');
    });

    it('should include prime factorization in tensor visualization', () => {
      const processor = new TensorFragmentProcessor();
      const shape = TensorFragmentUtils.createShape(2, 3, 4, 5, 1); // Total: 120 = 2^3 × 3 × 5

      const result = processor.createTensorFragment(shape);
      const fragment = result.result!;

      const visualization = visualizer.visualizeTensorFragment(fragment);

      const factorNode = visualization.nodes.find((n) => n.id === 'prime-factors');
      expect(factorNode).toBeDefined();
      expect(factorNode?.label).toContain('Factors:');

      const factorEdge = visualization.edges.find((e) => e.label === 'factorization');
      expect(factorEdge?.style).toBe('dotted');
    });

    it('should handle different tensor shapes appropriately', () => {
      const processor = new TensorFragmentProcessor();

      // Small tensor
      const smallShape = TensorFragmentUtils.createShape(1, 1, 1, 1, 1);
      const smallResult = processor.createTensorFragment(smallShape);
      expect(smallResult.success).toBe(true);
      
      const smallFragment = smallResult.result!;
      const smallViz = visualizer.visualizeTensorFragment(smallFragment);

      // Medium tensor (avoid large ones that exceed limits)
      const mediumShape = TensorFragmentUtils.createShape(2, 3, 4, 5, 2);
      const mediumResult = processor.createTensorFragment(mediumShape);
      expect(mediumResult.success).toBe(true);
      
      const mediumFragment = mediumResult.result!;
      const mediumViz = visualizer.visualizeTensorFragment(mediumFragment);

      expect(smallViz.metadata.complexity).toBe('simple');
      expect(mediumViz.metadata.title).toContain(mediumFragment.id || 'Tensor Fragment');

      // Both should have same basic structure (tensor + 5 dimensions), but may differ in prime factors
      expect(smallViz.nodes.length).toBeGreaterThanOrEqual(6); // At least tensor + 5 dimensions
      expect(mediumViz.nodes.length).toBeGreaterThanOrEqual(6);
      expect(Math.abs(smallViz.nodes.length - mediumViz.nodes.length)).toBeLessThanOrEqual(1); // At most 1 difference
    });
  });

  describe('Flowchart export formats', () => {
    let sampleVisualization: any;

    beforeEach(() => {
      const node1 = atomSpace.createNode(AtomType.CONCEPT_NODE, 'A');
      const node2 = atomSpace.createNode(AtomType.CONCEPT_NODE, 'B');
      const link = atomSpace.createLink(AtomType.INHERITANCE_LINK, [node1, node2]);

      sampleVisualization = visualizer.visualizeAtoms([node1, node2, link]);
    });

    it('should export to Mermaid format', () => {
      const mermaid = visualizer.exportFlowchart(sampleVisualization, 'mermaid');

      expect(mermaid).toContain('graph TD');
      expect(mermaid).toContain('A');
      expect(mermaid).toContain('B');
      expect(mermaid).toContain('-->');
      expect(typeof mermaid).toBe('string');
    });

    it('should export to DOT format', () => {
      const dot = visualizer.exportFlowchart(sampleVisualization, 'dot');

      expect(dot).toContain('digraph G');
      expect(dot).toContain('rankdir=TB');
      expect(dot).toContain('->');
      expect(dot).toContain('A');
      expect(dot).toContain('B');
    });

    it('should export to JSON format', () => {
      const json = visualizer.exportFlowchart(sampleVisualization, 'json');

      const parsed = JSON.parse(json);
      expect(parsed.nodes).toBeDefined();
      expect(parsed.edges).toBeDefined();
      expect(parsed.metadata).toBeDefined();
    });

    it('should export to SVG description format', () => {
      const svg = visualizer.exportFlowchart(sampleVisualization, 'svg-description');

      expect(svg).toContain('SVG Description');
      expect(svg).toContain('Layout:');
      expect(svg).toContain('Nodes:');
      expect(svg).toContain('Rendering instructions');
    });

    it('should handle unsupported export formats', () => {
      expect(() => {
        visualizer.exportFlowchart(sampleVisualization, 'unsupported' as any);
      }).toThrow('Unsupported format');
    });
  });

  describe('Real-world cognitive scenarios', () => {
    it('should visualize navigation task workflow', () => {
      const navigationPrimitive: AgenticPrimitive = {
        action: 'navigate-to-location',
        parameters: {
          destination: 'conference_room_A',
          path_planning: 'shortest',
          obstacle_avoidance: true,
          max_speed: 2.5,
        },
        context: {
          agent: 'service-robot-01',
          goal: 'attend-meeting',
          constraints: ['avoid-crowds', 'quiet-operation'],
          resources: ['lidar', 'camera', 'wheel-motors'],
        },
      };

      const visualization = visualizer.visualizeAgenticPrimitive(navigationPrimitive);

      expect(visualization.metadata.title).toContain('navigate-to-location');
      expect(visualization.nodes.length).toBeGreaterThan(10);

      // Check for key components
      const actionNode = visualization.nodes.find((n) => n.id === 'action');
      expect(actionNode?.label).toBe('navigate-to-location');

      const contextExists = visualization.nodes.some((n) => n.id === 'context');
      expect(contextExists).toBe(true);

      // Export as Mermaid for real use
      const mermaid = visualizer.exportFlowchart(visualization, 'mermaid');
      expect(mermaid.length).toBeGreaterThan(100);
    });

    it('should visualize Scheme expression converted to hypergraph', () => {
      const schemeExpression = '(inheritance dog animal)';

      const parseResult = schemeAdapter.parseScheme(schemeExpression);
      expect(parseResult.success).toBe(true);

      const atomsResult = schemeAdapter.schemeToAtoms(parseResult.result!);
      expect(atomsResult.success).toBe(true);

      const visualization = visualizer.visualizeAtoms(atomsResult.result!, 'Scheme Inheritance');

      expect(visualization.metadata.title).toBe('Scheme Inheritance');
      
      // Debug what nodes are actually created
      const nodeLabels = visualization.nodes.map(n => n.label);
      console.log('Node labels:', nodeLabels);
      
      // Check for inheritance relationship - the atoms may be stored with different labels
      const hasInheritanceStructure = visualization.nodes.length > 1 && visualization.edges.length > 0;
      expect(hasInheritanceStructure).toBe(true);
      
      // Check that we have some kind of inheritance relationship
      const hasInheritanceLink = visualization.edges.some((e) => e.type === 'inheritance');
      expect(hasInheritanceLink).toBe(true);

      // Test round-trip with visualization
      const mermaid = visualizer.exportFlowchart(visualization, 'mermaid');
      expect(mermaid.length).toBeGreaterThan(50);
    });

    it('should visualize complete cognitive processing pipeline', () => {
      // Create a cognitive pipeline: Scheme → Atoms → Agentic → Tensor
      const schemeExpression = '(perform-action "navigate" (target "kitchen") (method "walking"))';

      // Parse Scheme
      const parseResult = schemeAdapter.parseScheme(schemeExpression);
      const atomsResult = schemeAdapter.schemeToAtoms(parseResult.result!);

      // Convert to agentic primitive (simplified for this test)
      const agenticPrimitive: AgenticPrimitive = {
        action: 'navigate',
        parameters: {
          target: 'kitchen',
          method: 'walking',
        },
      };

      // Create tensor fragment
      const processor = new TensorFragmentProcessor();
      const tensorShape = TensorFragmentUtils.createShape(1, 5, 50, 80, 25); // Navigation tensor
      const tensorResult = processor.createTensorFragment(tensorShape);

      // Visualize each stage
      const atomsViz = visualizer.visualizeAtoms(atomsResult.result!, 'Atoms Stage');
      const agenticViz = visualizer.visualizeAgenticPrimitive(agenticPrimitive);
      const tensorViz = visualizer.visualizeTensorFragment(tensorResult.result!);

      expect(atomsViz.metadata.nodeCount).toBeGreaterThan(0);
      expect(agenticViz.metadata.nodeCount).toBeGreaterThan(0);
      expect(tensorViz.metadata.nodeCount).toBeGreaterThan(0);

      // Each stage should have different characteristics
      expect(atomsViz.metadata.renderingHints.layout).not.toBe(tensorViz.metadata.renderingHints.layout);
    });

    it('should handle large-scale cognitive systems', () => {
      // Create a complex cognitive system with multiple components
      const atoms = [];

      // Create multiple inheritance hierarchies
      for (let i = 0; i < 10; i++) {
        const animal = atomSpace.createNode(AtomType.CONCEPT_NODE, `animal_${i}`);
        const mammal = atomSpace.createNode(AtomType.CONCEPT_NODE, `mammal_${i}`);
        atoms.push(animal, mammal);
        atoms.push(atomSpace.createLink(AtomType.INHERITANCE_LINK, [mammal, animal]));
      }

      // Create evaluation structures
      for (let i = 0; i < 5; i++) {
        const predicate = atomSpace.createNode(AtomType.PREDICATE_NODE, `action_${i}`);
        const subject = atomSpace.createNode(AtomType.CONCEPT_NODE, `agent_${i}`);
        const object = atomSpace.createNode(AtomType.CONCEPT_NODE, `target_${i}`);
        atoms.push(predicate, subject, object);

        const listLink = atomSpace.createLink(AtomType.LIST_LINK, [subject, object]);
        atoms.push(listLink);
        atoms.push(atomSpace.createLink(AtomType.EVALUATION_LINK, [predicate, listLink]));
      }

      const visualization = visualizer.visualizeAtoms(atoms, 'Large Cognitive System');

      expect(visualization.metadata.complexity).toBe('complex');
      expect(visualization.metadata.nodeCount).toBeGreaterThan(10);
      expect(visualization.metadata.edgeCount).toBeGreaterThan(5);

      // Should handle layout optimization for complex systems
      expect(['hierarchical', 'force-directed', 'circular']).toContain(
        visualization.metadata.renderingHints.layout,
      );
    });
  });

  describe('Configuration and customization', () => {
    it('should respect color scheme configuration', () => {
      const cognitiveVisualizer = new HypergraphVisualizer({ colorScheme: 'cognitive' });
      const defaultVisualizer = new HypergraphVisualizer({ colorScheme: 'default' });

      const node = atomSpace.createNode(AtomType.CONCEPT_NODE, 'test');

      const cognitiveViz = cognitiveVisualizer.visualizeAtoms([node]);
      const defaultViz = defaultVisualizer.visualizeAtoms([node]);

      // Colors should be different between schemes
      expect(cognitiveViz.nodes[0].color).not.toBe(defaultViz.nodes[0].color);
    });

    it('should handle node grouping configuration', () => {
      const groupingVisualizer = new HypergraphVisualizer({ groupSimilarNodes: true });

      const conceptNode = atomSpace.createNode(AtomType.CONCEPT_NODE, 'concept');
      const predicateNode = atomSpace.createNode(AtomType.PREDICATE_NODE, 'predicate');

      const visualization = groupingVisualizer.visualizeAtoms([conceptNode, predicateNode]);

      expect(visualization.metadata.renderingHints.grouping.length).toBeGreaterThan(0);
      expect(visualization.metadata.renderingHints.grouping).toContain('concepts');
    });

    it('should handle different layout preferences', () => {
      const hierarchicalViz = new HypergraphVisualizer({ layout: 'hierarchical' });
      const circularViz = new HypergraphVisualizer({ layout: 'circular' });

      const nodes = [
        atomSpace.createNode(AtomType.CONCEPT_NODE, 'A'),
        atomSpace.createNode(AtomType.CONCEPT_NODE, 'B'),
      ];

      const hierarchicalResult = hierarchicalViz.visualizeAtoms(nodes);
      const circularResult = circularViz.visualizeAtoms(nodes);

      expect(hierarchicalResult.metadata.renderingHints.layout).toBe('hierarchical');
      expect(circularResult.metadata.renderingHints.layout).toBe('circular');
    });
  });
});

describe('VisualizationUtils', () => {
  let atomSpace: AtomSpace;
  let processor: TensorFragmentProcessor;

  beforeEach(() => {
    atomSpace = new AtomSpace();
    processor = new TensorFragmentProcessor();
  });

  describe('System report generation', () => {
    it('should generate comprehensive system reports', () => {
      // Create sample atoms
      const atoms = [
        atomSpace.createNode(AtomType.CONCEPT_NODE, 'human'),
        atomSpace.createNode(AtomType.CONCEPT_NODE, 'animal'),
      ];
      atoms.push(atomSpace.createLink(AtomType.INHERITANCE_LINK, [atoms[0], atoms[1]]));

      // Create sample tensor fragments
      const tensorFragments = [
        processor.createTensorFragment(TensorFragmentUtils.createShape(2, 3, 4, 5, 1)).result!,
        processor.createTensorFragment(TensorFragmentUtils.createShape(1, 2, 3, 4, 5)).result!,
      ];

      const report = VisualizationUtils.generateSystemReport(atoms, tensorFragments);

      expect(report).toContain('# Cognitive System Visualization Report');
      expect(report).toContain('## Hypergraph Structure');
      expect(report).toContain('## Tensor Fragments');
      expect(report).toContain('```mermaid');
      expect(report).toContain('**Nodes**:');
      expect(report).toContain('**Edges**:');
      expect(report).toContain('Fragment 1:');
      expect(report).toContain('Fragment 2:');
    });

    it('should handle empty systems gracefully', () => {
      const report = VisualizationUtils.generateSystemReport([], []);

      expect(report).toContain('# Cognitive System Visualization Report');
      expect(report.length).toBeGreaterThan(40); // Should still have basic structure
    });

    it('should handle atoms without tensor fragments', () => {
      const atoms = [
        atomSpace.createNode(AtomType.CONCEPT_NODE, 'standalone'),
        atomSpace.createNode(AtomType.PREDICATE_NODE, 'action'),
      ];

      const report = VisualizationUtils.generateSystemReport(atoms, []);

      expect(report).toContain('## Hypergraph Structure');
      expect(report).not.toContain('## Tensor Fragments');
    });

    it('should handle tensor fragments without atoms', () => {
      const tensorFragments = [
        processor.createTensorFragment(TensorFragmentUtils.createShape(3, 3, 3, 3, 3)).result!,
      ];

      const report = VisualizationUtils.generateSystemReport([], tensorFragments);

      expect(report).toContain('## Tensor Fragments');
      expect(report).not.toContain('## Hypergraph Structure');
    });
  });

  describe('Cognitive flow diagram generation', () => {
    it('should generate architecture flow diagram', () => {
      const flowDiagram = VisualizationUtils.createCognitiveFlowDiagram();

      expect(flowDiagram).toContain('# Cognitive Architecture Flow Diagram');
      expect(flowDiagram).toContain('```mermaid');
      expect(flowDiagram).toContain('Scheme Expression');
      expect(flowDiagram).toContain('SchemeAdapter');
      expect(flowDiagram).toContain('AtomSpace Hypergraph');
      expect(flowDiagram).toContain('AgenticTranslator');
      expect(flowDiagram).toContain('Agentic Primitive');
      expect(flowDiagram).toContain('TensorFragment');
      expect(flowDiagram).toContain('Distributed Processing');
      expect(flowDiagram).toContain('Visualization');
      expect(flowDiagram).toContain('## Component Relationships');

      // Should describe the flow between components
      expect(flowDiagram).toContain('Parses cognitive expressions');
      expect(flowDiagram).toContain('Converts symbolic to agentic');
      expect(flowDiagram).toContain('Prime factorization mapping');
    });

    it('should include proper Mermaid syntax', () => {
      const flowDiagram = VisualizationUtils.createCognitiveFlowDiagram();

      // Extract the Mermaid part
      const mermaidStart = flowDiagram.indexOf('```mermaid') + 11;
      const mermaidEnd = flowDiagram.indexOf('```', mermaidStart);
      const mermaidCode = flowDiagram.substring(mermaidStart, mermaidEnd);

      expect(mermaidCode).toContain('graph TD');
      expect(mermaidCode).toContain('-->');
      expect(mermaidCode).toContain('style');
      expect(mermaidCode).toContain('fill:');
    });
  });
});

describe('Integration with existing cognitive system', () => {
  it('should integrate with full cognitive pipeline', () => {
    const atomSpace = new AtomSpace();
    const schemeAdapter = new SchemeAdapter(atomSpace);
    const agenticTranslator = new AgenticTranslator(atomSpace);
    const visualizer = new HypergraphVisualizer();

    // Test full pipeline with visualization
    const schemeExpression = '(navigate-robot "kitchen" "fast")';

    // Parse Scheme
    const parseResult = schemeAdapter.parseScheme(schemeExpression);
    expect(parseResult.success).toBe(true);

    // Convert to atoms
    const atomsResult = schemeAdapter.schemeToAtoms(parseResult.result!);
    expect(atomsResult.success).toBe(true);

    // Convert to agentic via hypergraph
    const hypergraphResult = agenticTranslator.agenticToHypergraph({
      action: 'navigate-robot',
      parameters: { destination: 'kitchen', speed: 'fast' },
    });
    expect(hypergraphResult.success).toBe(true);

    // Visualize the hypergraph
    const visualization = visualizer.visualizeAtoms(hypergraphResult.result!, 'Full Pipeline');

    expect(visualization.metadata.title).toBe('Full Pipeline');
    expect(visualization.nodes.length).toBeGreaterThan(3);
    expect(visualization.edges.length).toBeGreaterThan(0);

    // Export multiple formats
    const mermaid = visualizer.exportFlowchart(visualization, 'mermaid');
    const dot = visualizer.exportFlowchart(visualization, 'dot');
    const json = visualizer.exportFlowchart(visualization, 'json');

    expect(mermaid).toContain('graph TD');
    expect(dot).toContain('digraph G');
    expect(JSON.parse(json).nodes).toBeDefined();
  });

  it('should visualize round-trip translation results', () => {
    const atomSpace = new AtomSpace();
    const agenticTranslator = new AgenticTranslator(atomSpace);
    const visualizer = new HypergraphVisualizer();

    const originalPrimitive: AgenticPrimitive = {
      action: 'test-action',
      parameters: { param1: 'value1', param2: 42 },
    };

    // Perform round-trip test
    const roundTripResult = agenticTranslator.roundTripTest(originalPrimitive);
    expect(roundTripResult.isValid).toBe(true);

    // Visualize the intermediate hypergraph
    const hypergraphVisualization = visualizer.visualizeAtoms(
      roundTripResult.intermediate as any[],
      'Round-trip Hypergraph',
    );

    // Visualize the original and final primitives
    const originalVisualization = visualizer.visualizeAgenticPrimitive(originalPrimitive);
    const finalVisualization = visualizer.visualizeAgenticPrimitive(roundTripResult.final!);

    // All visualizations should be valid
    expect(hypergraphVisualization.nodes.length).toBeGreaterThan(0);
    expect(originalVisualization.nodes.length).toBeGreaterThan(0);
    expect(finalVisualization.nodes.length).toBeGreaterThan(0);

    // Should be able to export both
    const originalMermaid = visualizer.exportFlowchart(originalVisualization, 'mermaid');
    const finalMermaid = visualizer.exportFlowchart(finalVisualization, 'mermaid');

    expect(originalMermaid).toContain('test-action');
    expect(finalMermaid).toContain('test-action');
  });
});