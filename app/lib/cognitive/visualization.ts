/**
 * Hypergraph Visualization for Cognitive Primitives
 * Generates flowcharts and visual representations of hypergraph fragments
 */

import type { Atom, Link, Node, TensorFragment, AgenticPrimitive } from './types';
import { AtomType } from './types';

/**
 * Visual representation of a hypergraph node for flowcharts
 */
export interface VisualNode {
  id: string;
  label: string;
  type: 'concept' | 'predicate' | 'variable' | 'tensor';
  shape: 'circle' | 'square' | 'diamond' | 'hexagon';
  color: string;
  metadata?: Record<string, any>;
}

/**
 * Visual representation of a hypergraph edge for flowcharts
 */
export interface VisualEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: 'inheritance' | 'evaluation' | 'list' | 'lambda' | 'application' | 'tensor-link';
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
  weight?: number;
}

/**
 * Complete visual representation of a hypergraph fragment
 */
export interface HypergraphVisualization {
  nodes: VisualNode[];
  edges: VisualEdge[];
  metadata: {
    title: string;
    description: string;
    nodeCount: number;
    edgeCount: number;
    complexity: 'simple' | 'moderate' | 'complex';
    renderingHints: {
      layout: 'hierarchical' | 'circular' | 'force-directed';
      grouping: string[];
    };
  };
}

/**
 * Flowchart formats supported for export
 */
export type FlowchartFormat = 'mermaid' | 'dot' | 'json' | 'svg-description';

/**
 * Configuration for visualization generation
 */
export interface VisualizationConfig {
  maxNodes: number;
  maxEdges: number;
  showTruthValues: boolean;
  showTensorDetails: boolean;
  colorScheme: 'default' | 'cognitive' | 'tensor' | 'high-contrast';
  layout: 'auto' | 'hierarchical' | 'circular' | 'force-directed';
  groupSimilarNodes: boolean;
}

/**
 * Core class for generating hypergraph visualizations
 */
export class HypergraphVisualizer {
  private config: VisualizationConfig;
  private colorMap: Map<AtomType, string>;

  constructor(config: Partial<VisualizationConfig> = {}) {
    this.config = {
      maxNodes: 50,
      maxEdges: 100,
      showTruthValues: true,
      showTensorDetails: false,
      colorScheme: 'cognitive',
      layout: 'auto',
      groupSimilarNodes: true,
      ...config,
    };

    this.colorMap = this.initializeColorMap();
  }

  /**
   * Generate visualization from a collection of atoms
   */
  visualizeAtoms(atoms: Atom[], title?: string): HypergraphVisualization {
    // Filter and limit atoms if necessary
    const limitedAtoms = this.limitAndFilterAtoms(atoms);

    const nodes = this.generateVisualNodes(limitedAtoms);
    const edges = this.generateVisualEdges(limitedAtoms, nodes);

    const complexity = this.calculateComplexity(nodes.length, edges.length);
    const layout = this.determineOptimalLayout(nodes, edges);

    return {
      nodes,
      edges,
      metadata: {
        title: title || 'Hypergraph Fragment',
        description: `Visualization of ${atoms.length} atoms (${nodes.length} nodes, ${edges.length} edges)`,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        complexity,
        renderingHints: {
          layout,
          grouping: this.identifyNodeGroups(nodes),
        },
      },
    };
  }

  /**
   * Generate visualization from an agentic primitive
   */
  visualizeAgenticPrimitive(primitive: AgenticPrimitive): HypergraphVisualization {
    // Create a simplified representation focused on the agentic structure
    const nodes: VisualNode[] = [];
    const edges: VisualEdge[] = [];

    // Action node
    const actionNode: VisualNode = {
      id: 'action',
      label: primitive.action,
      type: 'predicate',
      shape: 'diamond',
      color: this.getColorForType('predicate'),
      metadata: { isAction: true },
    };
    nodes.push(actionNode);

    // Parameter nodes
    Object.entries(primitive.parameters).forEach(([key, value], index) => {
      const paramKeyNode: VisualNode = {
        id: `param-key-${index}`,
        label: key,
        type: 'concept',
        shape: 'circle',
        color: this.getColorForType('concept'),
      };

      const paramValueNode: VisualNode = {
        id: `param-value-${index}`,
        label: this.formatValue(value),
        type: 'concept',
        shape: 'circle',
        color: this.getColorForType('concept'),
        metadata: { value, isParameter: true },
      };

      nodes.push(paramKeyNode, paramValueNode);

      // Create edges
      edges.push({
        id: `param-key-edge-${index}`,
        source: 'action',
        target: `param-key-${index}`,
        label: 'has-parameter',
        type: 'evaluation',
        style: 'solid',
        color: '#666666',
      });

      edges.push({
        id: `param-value-edge-${index}`,
        source: `param-key-${index}`,
        target: `param-value-${index}`,
        label: 'value',
        type: 'evaluation',
        style: 'solid',
        color: '#666666',
      });
    });

    // Context nodes if present
    if (primitive.context) {
      const contextNode: VisualNode = {
        id: 'context',
        label: 'Context',
        type: 'concept',
        shape: 'hexagon',
        color: this.getColorForType('context'),
      };
      nodes.push(contextNode);

      // Agent
      const agentNode: VisualNode = {
        id: 'agent',
        label: primitive.context.agent,
        type: 'concept',
        shape: 'circle',
        color: this.getColorForType('concept'),
      };
      nodes.push(agentNode);

      edges.push({
        id: 'context-edge',
        source: 'action',
        target: 'context',
        label: 'has-context',
        type: 'evaluation',
        style: 'dashed',
        color: '#888888',
      });

      edges.push({
        id: 'agent-edge',
        source: 'context',
        target: 'agent',
        label: 'agent',
        type: 'evaluation',
        style: 'solid',
        color: '#666666',
      });
    }

    return {
      nodes,
      edges,
      metadata: {
        title: `Agentic Primitive: ${primitive.action}`,
        description: `Visualization of agentic primitive with ${Object.keys(primitive.parameters).length} parameters`,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        complexity: this.calculateComplexity(nodes.length, edges.length),
        renderingHints: {
          layout: 'hierarchical',
          grouping: ['action', 'parameters', 'context'],
        },
      },
    };
  }

  /**
   * Generate visualization from tensor fragments
   */
  visualizeTensorFragment(fragment: TensorFragment): HypergraphVisualization {
    const nodes: VisualNode[] = [];
    const edges: VisualEdge[] = [];

    // Main tensor node
    const tensorNode: VisualNode = {
      id: 'tensor',
      label: `Tensor ${fragment.id ? fragment.id.substring(0, 8) : 'unknown'}...`,
      type: 'tensor',
      shape: 'hexagon',
      color: this.getColorForType('tensor'),
      metadata: {
        shape: fragment.shape,
        size: fragment.data.length,
        primeFactors: fragment.primeFactors,
      },
    };
    nodes.push(tensorNode);

    // Dimension nodes
    const dimensions = [
      { name: 'modality', value: fragment.shape.modality },
      { name: 'depth', value: fragment.shape.depth },
      { name: 'context', value: fragment.shape.context },
      { name: 'salience', value: fragment.shape.salience },
      { name: 'autonomy_index', value: fragment.shape.autonomy_index },
    ];

    dimensions.forEach((dim, index) => {
      const dimNode: VisualNode = {
        id: `dim-${dim.name}`,
        label: `${dim.name}: ${dim.value}`,
        type: 'concept',
        shape: 'square',
        color: this.getColorForType('concept'),
        metadata: { dimension: dim.name, value: dim.value },
      };
      nodes.push(dimNode);

      edges.push({
        id: `dim-edge-${index}`,
        source: 'tensor',
        target: `dim-${dim.name}`,
        label: 'has-dimension',
        type: 'tensor-link',
        style: 'solid',
        color: this.getColorForType('tensor'),
      });
    });

    // Prime factorization visualization
    if (fragment.primeFactors.length > 0) {
      const factorNode: VisualNode = {
        id: 'prime-factors',
        label: `Factors: ${fragment.primeFactors.join(' × ')}`,
        type: 'concept',
        shape: 'circle',
        color: this.getColorForType('concept'),
        metadata: { primeFactors: fragment.primeFactors },
      };
      nodes.push(factorNode);

      edges.push({
        id: 'factor-edge',
        source: 'tensor',
        target: 'prime-factors',
        label: 'factorization',
        type: 'tensor-link',
        style: 'dotted',
        color: this.getColorForType('tensor'),
      });
    }

    return {
      nodes,
      edges,
      metadata: {
        title: `Tensor Fragment: ${fragment.id || 'unknown'}`,
        description: `5D tensor with shape [${Object.values(fragment.shape).join(', ')}]`,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        complexity: 'simple',
        renderingHints: {
          layout: 'hierarchical',
          grouping: ['tensor', 'dimensions', 'metadata'],
        },
      },
    };
  }

  /**
   * Export visualization as flowchart in specified format
   */
  exportFlowchart(visualization: HypergraphVisualization, format: FlowchartFormat): string {
    switch (format) {
      case 'mermaid':
        return this.exportMermaid(visualization);
      case 'dot':
        return this.exportDot(visualization);
      case 'json':
        return JSON.stringify(visualization, null, 2);
      case 'svg-description':
        return this.exportSvgDescription(visualization);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private limitAndFilterAtoms(atoms: Atom[]): Atom[] {
    // Prioritize important atom types and limit to max nodes
    const sortedAtoms = atoms.sort((a, b) => {
      const priorityA = this.getAtomPriority(a);
      const priorityB = this.getAtomPriority(b);
      return priorityB - priorityA;
    });

    return sortedAtoms.slice(0, this.config.maxNodes);
  }

  private getAtomPriority(atom: Atom): number {
    const priorities = {
      [AtomType.PREDICATE_NODE]: 10,
      [AtomType.EVALUATION_LINK]: 9,
      [AtomType.INHERITANCE_LINK]: 8,
      [AtomType.LAMBDA_LINK]: 7,
      [AtomType.APPLICATION_LINK]: 6,
      [AtomType.LIST_LINK]: 5,
      [AtomType.CONCEPT_NODE]: 4,
      [AtomType.VARIABLE_NODE]: 3,
    };

    return priorities[atom.type] || 1;
  }

  private generateVisualNodes(atoms: Atom[]): VisualNode[] {
    return atoms
      .filter((atom) => !('outgoing' in atom)) // Only nodes, not links
      .map((atom) => this.atomToVisualNode(atom));
  }

  private atomToVisualNode(atom: Atom): VisualNode {
    const node = atom as Node;
    let shape: VisualNode['shape'] = 'circle';
    let type: VisualNode['type'] = 'concept';

    switch (atom.type) {
      case AtomType.PREDICATE_NODE:
        shape = 'diamond';
        type = 'predicate';
        break;
      case AtomType.VARIABLE_NODE:
        shape = 'square';
        type = 'variable';
        break;
      case AtomType.CONCEPT_NODE:
      default:
        shape = 'circle';
        type = 'concept';
        break;
    }

    return {
      id: atom.id,
      label: this.formatNodeLabel(atom),
      type,
      shape,
      color: this.colorMap.get(atom.type) || '#cccccc',
      metadata: {
        truthValue: atom.truthValue,
        confidence: atom.confidence,
        value: node.value,
      },
    };
  }

  private generateVisualEdges(atoms: Atom[], nodes: VisualNode[]): VisualEdge[] {
    const edges: VisualEdge[] = [];
    const nodeIds = new Set(nodes.map((n) => n.id));

    atoms
      .filter((atom) => 'outgoing' in atom) // Only links
      .forEach((atom) => {
        const link = atom as Link;
        const linkLabel = this.formatLinkLabel(link);
        const linkColor = this.colorMap.get(link.type) || '#666666';

        // Create edges based on link structure
        if (link.outgoing.length === 2) {
          // Binary link
          const [source, target] = link.outgoing;
          if (nodeIds.has(source.id) && nodeIds.has(target.id)) {
            edges.push({
              id: `edge-${link.id}`,
              source: source.id,
              target: target.id,
              label: linkLabel,
              type: this.getLinkType(link.type),
              style: this.getLinkStyle(link.type),
              color: linkColor,
              weight: link.truthValue?.strength,
            });
          }
        } else if (link.outgoing.length > 2) {
          // N-ary link - create hub node
          const hubNode: VisualNode = {
            id: `hub-${link.id}`,
            label: linkLabel,
            type: 'concept',
            shape: 'diamond',
            color: linkColor,
            metadata: { isHub: true, linkType: link.type },
          };
          nodes.push(hubNode);

          // Connect all outgoing atoms to hub
          link.outgoing.forEach((outgoingAtom, index) => {
            if (nodeIds.has(outgoingAtom.id)) {
              edges.push({
                id: `hub-edge-${link.id}-${index}`,
                source: `hub-${link.id}`,
                target: outgoingAtom.id,
                label: `arg${index}`,
                type: this.getLinkType(link.type),
                style: 'solid',
                color: linkColor,
              });
            }
          });
        }
      });

    return edges.slice(0, this.config.maxEdges);
  }

  private formatNodeLabel(atom: Atom): string {
    let label = atom.name || atom.id.substring(0, 8);

    if (this.config.showTruthValues && atom.truthValue) {
      label += `\n(${atom.truthValue.strength.toFixed(2)}, ${atom.truthValue.confidence.toFixed(2)})`;
    }

    return label;
  }

  private formatLinkLabel(link: Link): string {
    const typeLabel = link.type.replace('Link', '').replace('Node', '');
    return typeLabel.toLowerCase();
  }

  private getLinkType(atomType: AtomType): VisualEdge['type'] {
    switch (atomType) {
      case AtomType.INHERITANCE_LINK:
        return 'inheritance';
      case AtomType.EVALUATION_LINK:
        return 'evaluation';
      case AtomType.LIST_LINK:
        return 'list';
      case AtomType.LAMBDA_LINK:
        return 'lambda';
      case AtomType.APPLICATION_LINK:
        return 'application';
      default:
        return 'evaluation';
    }
  }

  private getLinkStyle(atomType: AtomType): VisualEdge['style'] {
    switch (atomType) {
      case AtomType.INHERITANCE_LINK:
        return 'solid';
      case AtomType.EVALUATION_LINK:
        return 'solid';
      case AtomType.LIST_LINK:
        return 'dashed';
      case AtomType.LAMBDA_LINK:
        return 'dotted';
      default:
        return 'solid';
    }
  }

  private formatValue(value: any): string {
    if (typeof value === 'object') {
      return JSON.stringify(value).substring(0, 20) + '...';
    }
    return String(value).substring(0, 15);
  }

  private getColorForType(type: string): string {
    const colorSchemes = {
      cognitive: {
        concept: '#4A90E2',
        predicate: '#F5A623',
        variable: '#7ED321',
        tensor: '#D0021B',
        context: '#9013FE',
      },
      default: {
        concept: '#87CEEB',
        predicate: '#FFB347',
        variable: '#98FB98',
        tensor: '#FF6B6B',
        context: '#DDA0DD',
      },
    };

    const scheme = colorSchemes[this.config.colorScheme as keyof typeof colorSchemes] || colorSchemes.default;
    return scheme[type as keyof typeof scheme] || '#cccccc';
  }

  private initializeColorMap(): Map<AtomType, string> {
    const map = new Map<AtomType, string>();
    map.set(AtomType.CONCEPT_NODE, this.getColorForType('concept'));
    map.set(AtomType.PREDICATE_NODE, this.getColorForType('predicate'));
    map.set(AtomType.VARIABLE_NODE, this.getColorForType('variable'));
    map.set(AtomType.INHERITANCE_LINK, '#FF8C00');
    map.set(AtomType.EVALUATION_LINK, '#32CD32');
    map.set(AtomType.LIST_LINK, '#9370DB');
    map.set(AtomType.LAMBDA_LINK, '#FF1493');
    map.set(AtomType.APPLICATION_LINK, '#00CED1');
    return map;
  }

  private calculateComplexity(nodeCount: number, edgeCount: number): 'simple' | 'moderate' | 'complex' {
    const total = nodeCount + edgeCount;
    if (total <= 10) return 'simple';
    if (total <= 30) return 'moderate';
    return 'complex';
  }

  private determineOptimalLayout(nodes: VisualNode[], edges: VisualEdge[]): string {
    if (this.config.layout !== 'auto') return this.config.layout;

    const density = edges.length / Math.max(nodes.length, 1);
    if (density > 2) return 'force-directed';
    if (this.hasHierarchicalStructure(nodes, edges)) return 'hierarchical';
    return 'circular';
  }

  private hasHierarchicalStructure(nodes: VisualNode[], edges: VisualEdge[]): boolean {
    // Simple heuristic: if there are predicate nodes and evaluation edges, likely hierarchical
    const predicateNodes = nodes.filter((n) => n.type === 'predicate').length;
    const evaluationEdges = edges.filter((e) => e.type === 'evaluation').length;
    return predicateNodes > 0 && evaluationEdges > 0;
  }

  private identifyNodeGroups(nodes: VisualNode[]): string[] {
    const groups: string[] = [];
    const nodeTypes = new Set(nodes.map((n) => n.type));

    if (nodeTypes.has('predicate')) groups.push('actions');
    if (nodeTypes.has('concept')) groups.push('concepts');
    if (nodeTypes.has('variable')) groups.push('variables');
    if (nodeTypes.has('tensor')) groups.push('tensors');

    return groups;
  }

  private exportMermaid(visualization: HypergraphVisualization): string {
    let mermaid = 'graph TD\n';

    // Add nodes
    visualization.nodes.forEach((node) => {
      const shape = this.getMermaidShape(node.shape);
      mermaid += `    ${node.id}${shape[0]}"${node.label}"${shape[1]}\n`;
    });

    // Add edges
    visualization.edges.forEach((edge) => {
      const connector = this.getMermaidConnector(edge.style);
      mermaid += `    ${edge.source} ${connector} ${edge.target}\n`;
    });

    return mermaid;
  }

  private getMermaidShape(shape: VisualNode['shape']): [string, string] {
    switch (shape) {
      case 'square':
        return ['[', ']'];
      case 'diamond':
        return ['{', '}'];
      case 'hexagon':
        return ['{{', '}}'];
      case 'circle':
      default:
        return ['(', ')'];
    }
  }

  private getMermaidConnector(style: VisualEdge['style']): string {
    switch (style) {
      case 'dashed':
        return '-..->';
      case 'dotted':
        return '-.->';
      case 'solid':
      default:
        return '-->';
    }
  }

  private exportDot(visualization: HypergraphVisualization): string {
    let dot = 'digraph G {\n';
    dot += '    rankdir=TB;\n';
    dot += '    node [shape=ellipse];\n';

    // Add nodes
    visualization.nodes.forEach((node) => {
      const shape = this.getDotShape(node.shape);
      dot += `    "${node.id}" [label="${node.label}", shape=${shape}, color="${node.color}"];\n`;
    });

    // Add edges
    visualization.edges.forEach((edge) => {
      const style = edge.style === 'solid' ? '' : `, style=${edge.style}`;
      dot += `    "${edge.source}" -> "${edge.target}" [label="${edge.label}"${style}];\n`;
    });

    dot += '}';
    return dot;
  }

  private getDotShape(shape: VisualNode['shape']): string {
    switch (shape) {
      case 'square':
        return 'box';
      case 'diamond':
        return 'diamond';
      case 'hexagon':
        return 'hexagon';
      case 'circle':
      default:
        return 'ellipse';
    }
  }

  private exportSvgDescription(visualization: HypergraphVisualization): string {
    return `SVG Description for ${visualization.metadata.title}:
- Layout: ${visualization.metadata.renderingHints.layout}
- Nodes: ${visualization.metadata.nodeCount} (${visualization.nodes.map((n) => n.type).join(', ')})
- Edges: ${visualization.metadata.edgeCount} (${visualization.edges.map((e) => e.type).join(', ')})
- Complexity: ${visualization.metadata.complexity}
- Groups: ${visualization.metadata.renderingHints.grouping.join(', ')}

Rendering instructions:
1. Create ${visualization.metadata.renderingHints.layout} layout
2. Position nodes by type: ${visualization.metadata.renderingHints.grouping.join(' -> ')}
3. Use color coding for different atom types
4. Show connection patterns for cognitive flow
`;
  }
}

/**
 * Utility functions for visualization
 */
export class VisualizationUtils {
  /**
   * Generate a complete visualization report for a cognitive system
   */
  static generateSystemReport(atoms: Atom[], tensorFragments: TensorFragment[]): string {
    const visualizer = new HypergraphVisualizer();

    let report = '# Cognitive System Visualization Report\n\n';

    // Atoms visualization
    if (atoms.length > 0) {
      const atomsViz = visualizer.visualizeAtoms(atoms, 'System Atoms');
      report += `## Hypergraph Structure\n`;
      report += `- **Nodes**: ${atomsViz.metadata.nodeCount}\n`;
      report += `- **Edges**: ${atomsViz.metadata.edgeCount}\n`;
      report += `- **Complexity**: ${atomsViz.metadata.complexity}\n`;
      report += `- **Layout**: ${atomsViz.metadata.renderingHints.layout}\n\n`;

      // Add Mermaid diagram
      report += '### Mermaid Flowchart\n';
      report += '```mermaid\n';
      report += visualizer.exportFlowchart(atomsViz, 'mermaid');
      report += '\n```\n\n';
    }

    // Tensor fragments visualization
    if (tensorFragments.length > 0) {
      report += `## Tensor Fragments\n`;
      tensorFragments.forEach((fragment, index) => {
        const tensorViz = visualizer.visualizeTensorFragment(fragment);
        report += `### Fragment ${index + 1}: ${fragment.id.substring(0, 8)}\n`;
        report += `- **Shape**: [${Object.values(fragment.shape).join(', ')}]\n`;
        report += `- **Size**: ${fragment.data.length} elements\n`;
        report += `- **Prime Factors**: ${fragment.primeFactors.join(' × ')}\n\n`;
      });
    }

    return report;
  }

  /**
   * Create a cognitive flow diagram showing the relationship between components
   */
  static createCognitiveFlowDiagram(): string {
    return `
# Cognitive Architecture Flow Diagram

\`\`\`mermaid
graph TD
    A[Scheme Expression] --> B[SchemeAdapter]
    B --> C[AtomSpace Hypergraph]
    C --> D[AgenticTranslator]
    D --> E[Agentic Primitive]
    E --> F[TensorFragment]
    F --> G[Distributed Processing]
    
    C --> H[Visualization]
    H --> I[Flowcharts]
    H --> J[Cognitive Maps]
    
    K[Context] --> E
    L[Truth Values] --> C
    M[Prime Factorization] --> F
    
    style A fill:#e1f5fe
    style E fill:#f3e5f5
    style F fill:#fff3e0
    style H fill:#e8f5e8
\`\`\`

## Component Relationships

1. **Scheme Expression** → **SchemeAdapter**: Parses cognitive expressions
2. **AtomSpace Hypergraph** → **AgenticTranslator**: Converts symbolic to agentic
3. **Agentic Primitive** → **TensorFragment**: Encodes as 5D tensors
4. **TensorFragment** → **Distributed Processing**: Prime factorization mapping
5. **AtomSpace** → **Visualization**: Generates flowcharts and diagrams
`;
  }
}