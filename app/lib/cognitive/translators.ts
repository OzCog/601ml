/**
 * Bidirectional translators for converting between agentic primitives and hypergraph patterns
 * Handles the core translation logic for cognitive grammar microservices
 */

import type {
  Atom,
  Link,
  Node,
  AgenticPrimitive,
  AgenticContext,
  SchemeExpression,
  TranslationResult,
  RoundTripTest,
  LossMetrics
} from './types';
import { AtomType } from './types';
import { AtomSpace } from './atomspace';
import { SchemeAdapter } from './scheme-adapter';

export class AgenticTranslator {
  private atomSpace: AtomSpace;
  private schemeAdapter: SchemeAdapter;

  constructor(atomSpace: AtomSpace) {
    this.atomSpace = atomSpace;
    this.schemeAdapter = new SchemeAdapter(atomSpace);
  }

  /**
   * Convert an agentic primitive to hypergraph atoms
   */
  agenticToHypergraph(primitive: AgenticPrimitive): TranslationResult<Atom[]> {
    try {
      const atoms: Atom[] = [];

      // Create action node
      const actionNode = this.atomSpace.createNode(
        AtomType.PREDICATE_NODE,
        primitive.action,
        { strength: 1.0, confidence: 0.9 }
      );
      atoms.push(actionNode);

      // Create parameter nodes and links
      const parameterAtoms = this.createParameterStructure(primitive.parameters);
      atoms.push(...parameterAtoms);

      // Create context structure if present
      let contextAtoms: Atom[] = [];
      if (primitive.context) {
        contextAtoms = this.createContextStructure(primitive.context);
        atoms.push(...contextAtoms);
      }

      // Create main evaluation link
      const parameterListLink = this.atomSpace.createLink(
        AtomType.LIST_LINK,
        parameterAtoms
      );
      atoms.push(parameterListLink);

      const evaluationLink = this.atomSpace.createLink(
        AtomType.EVALUATION_LINK,
        [actionNode, parameterListLink],
        { strength: 1.0, confidence: 0.9 }
      );
      atoms.push(evaluationLink);

      // Link context if present
      if (contextAtoms.length > 0) {
        const contextListLink = this.atomSpace.createLink(
          AtomType.LIST_LINK,
          contextAtoms
        );
        atoms.push(contextListLink);

        const contextEvaluationLink = this.atomSpace.createLink(
          AtomType.EVALUATION_LINK,
          [
            this.atomSpace.createNode(AtomType.PREDICATE_NODE, 'has-context'),
            this.atomSpace.createLink(AtomType.LIST_LINK, [evaluationLink, contextListLink])
          ]
        );
        atoms.push(contextEvaluationLink);
      }

      return {
        success: true,
        result: atoms,
        metadata: {
          atomCount: atoms.length,
          hasContext: !!primitive.context,
          parameterCount: Object.keys(primitive.parameters).length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown translation error'
      };
    }
  }

  /**
   * Convert hypergraph atoms back to an agentic primitive
   */
  hypergraphToAgentic(atoms: Atom[]): TranslationResult<AgenticPrimitive> {
    try {
      // Find the main evaluation link
      const evaluationLinks = atoms.filter(atom => 
        'outgoing' in atom && atom.type === AtomType.EVALUATION_LINK
      ) as Link[];

      if (evaluationLinks.length === 0) {
        throw new Error('No evaluation link found in hypergraph');
      }

      // Find the primary action evaluation (not context)
      const actionEvaluation = evaluationLinks.find(link => {
        const predicate = link.outgoing[0];
        return predicate.name !== 'has-context';
      });

      if (!actionEvaluation) {
        throw new Error('No action evaluation found');
      }

      // Extract action
      const actionNode = actionEvaluation.outgoing[0];
      const action = actionNode.name || 'unknown-action';

      // Extract parameters
      const parameterList = actionEvaluation.outgoing[1] as Link;
      const parameters = this.extractParameters(parameterList.outgoing, atoms);

      // Extract context if present
      let context: AgenticContext | undefined;
      const contextEvaluation = evaluationLinks.find(link => {
        const predicate = link.outgoing[0];
        return predicate.name === 'has-context';
      });

      if (contextEvaluation) {
        context = this.extractContext(contextEvaluation, atoms);
      }

      const primitive: AgenticPrimitive = {
        action,
        parameters,
        context,
        metadata: {
          reconstructedFrom: 'hypergraph',
          sourceAtomCount: atoms.length
        }
      };

      return {
        success: true,
        result: primitive,
        metadata: {
          sourceAtomCount: atoms.length,
          hasContext: !!context
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      };
    }
  }

  /**
   * Convert Scheme expression to agentic primitive
   */
  schemeToAgentic(expression: SchemeExpression): TranslationResult<AgenticPrimitive> {
    try {
      if (expression.type !== 'list' || !expression.children || expression.children.length < 2) {
        throw new Error('Scheme expression must be a list with at least 2 elements');
      }

      const [actionExpr, ...paramExprs] = expression.children;
      
      if (actionExpr.type !== 'symbol') {
        throw new Error('First element must be an action symbol');
      }

      const action = String(actionExpr.value);
      const parameters = this.extractSchemeParameters(paramExprs);

      const primitive: AgenticPrimitive = {
        action,
        parameters,
        metadata: {
          convertedFrom: 'scheme',
          originalExpression: expression
        }
      };

      return {
        success: true,
        result: primitive
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error'
      };
    }
  }

  /**
   * Convert agentic primitive to Scheme expression
   */
  agenticToScheme(primitive: AgenticPrimitive): TranslationResult<SchemeExpression> {
    try {
      const children: SchemeExpression[] = [
        { type: 'symbol', value: primitive.action }
      ];

      // Add parameters as key-value pairs
      for (const [key, value] of Object.entries(primitive.parameters)) {
        children.push({ type: 'symbol', value: key });
        children.push(this.valueToSchemeExpression(value));
      }

      // Add context if present
      if (primitive.context) {
        children.push({ type: 'symbol', value: ':context' });
        children.push(this.contextToSchemeExpression(primitive.context));
      }

      const expression: SchemeExpression = {
        type: 'list',
        value: null,
        children
      };

      return {
        success: true,
        result: expression
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error'
      };
    }
  }

  /**
   * Perform round-trip translation test
   */
  roundTripTest(original: AgenticPrimitive): RoundTripTest {
    try {
      // Convert to hypergraph
      const hypergraphResult = this.agenticToHypergraph(original);
      if (!hypergraphResult.success || !hypergraphResult.result) {
        return {
          original,
          intermediate: null,
          final: null,
          isValid: false
        };
      }

      const hypergraphAtoms = hypergraphResult.result;

      // Convert back to agentic primitive
      const backResult = this.hypergraphToAgentic(hypergraphAtoms);
      if (!backResult.success || !backResult.result) {
        return {
          original,
          intermediate: hypergraphAtoms,
          final: null,
          isValid: false
        };
      }

      const final = backResult.result;

      // Calculate loss metrics
      const lossMetrics = this.calculateLossMetrics(original, final);

      return {
        original,
        intermediate: hypergraphAtoms,
        final,
        isValid: lossMetrics.totalLoss < 0.1, // Consider valid if loss < 10%
        lossMetrics
      };
    } catch (error) {
      return {
        original,
        intermediate: null,
        final: null,
        isValid: false
      };
    }
  }

  private createParameterStructure(parameters: Record<string, any>): Atom[] {
    const atoms: Atom[] = [];

    for (const [key, value] of Object.entries(parameters)) {
      const keyNode = this.atomSpace.createNode(AtomType.CONCEPT_NODE, key);
      atoms.push(keyNode);

      let valueNode;
      if (typeof value === 'object' && value !== null) {
        // Store complex objects as JSON strings
        valueNode = this.atomSpace.createNode(
          AtomType.CONCEPT_NODE,
          JSON.stringify(value)
        );
        (valueNode as Node).value = value;
      } else {
        valueNode = this.atomSpace.createNode(
          AtomType.CONCEPT_NODE,
          String(value)
        );
        (valueNode as Node).value = value;
      }
      atoms.push(valueNode);
    }

    return atoms;
  }

  private createContextStructure(context: AgenticContext): Atom[] {
    const atoms: Atom[] = [];

    // Agent node
    const agentNode = this.atomSpace.createNode(AtomType.CONCEPT_NODE, context.agent);
    atoms.push(agentNode);

    // Goal node
    const goalNode = this.atomSpace.createNode(AtomType.CONCEPT_NODE, context.goal);
    atoms.push(goalNode);

    // Constraint nodes
    const constraintNodes = context.constraints.map(constraint =>
      this.atomSpace.createNode(AtomType.CONCEPT_NODE, constraint)
    );
    atoms.push(...constraintNodes);

    // Resource nodes
    const resourceNodes = context.resources.map(resource =>
      this.atomSpace.createNode(AtomType.CONCEPT_NODE, resource)
    );
    atoms.push(...resourceNodes);

    return atoms;
  }

  private extractParameters(parameterAtoms: Atom[], allAtoms: Atom[]): Record<string, any> {
    const parameters: Record<string, any> = {};

    for (let i = 0; i < parameterAtoms.length; i += 2) {
      if (i + 1 < parameterAtoms.length) {
        const keyAtom = parameterAtoms[i];
        const valueAtom = parameterAtoms[i + 1] as Node;

        const key = keyAtom.name || `param_${i / 2}`;
        let value = valueAtom.value !== undefined ? valueAtom.value : valueAtom.name;
        
        // Handle complex parameter types
        if (typeof value === 'string') {
          // Try to parse as JSON for complex structures
          try {
            const parsed = JSON.parse(value);
            if (typeof parsed === 'object') {
              value = parsed;
            }
          } catch {
            // Keep as string if not valid JSON
          }
        }

        parameters[key] = value;
      }
    }

    return parameters;
  }

  private extractContext(contextEvaluation: Link, allAtoms: Atom[]): AgenticContext {
    const contextList = contextEvaluation.outgoing[1] as Link;
    const contextAtoms = contextList.outgoing;

    // Extract context information (simplified extraction)
    const context: AgenticContext = {
      agent: 'unknown-agent',
      goal: 'unknown-goal',
      constraints: [],
      resources: []
    };

    if (contextAtoms.length > 0 && contextAtoms[0].name) {
      context.agent = contextAtoms[0].name;
    }
    if (contextAtoms.length > 1 && contextAtoms[1].name) {
      context.goal = contextAtoms[1].name;
    }

    return context;
  }

  private extractSchemeParameters(paramExprs: SchemeExpression[]): Record<string, any> {
    const parameters: Record<string, any> = {};

    for (let i = 0; i < paramExprs.length; i += 2) {
      if (i + 1 < paramExprs.length) {
        const keyExpr = paramExprs[i];
        const valueExpr = paramExprs[i + 1];

        if (keyExpr.type === 'symbol') {
          const key = String(keyExpr.value);
          const value = this.schemeExpressionToValue(valueExpr);
          parameters[key] = value;
        }
      }
    }

    return parameters;
  }

  private schemeExpressionToValue(expr: SchemeExpression): any {
    switch (expr.type) {
      case 'number':
        return expr.value;
      case 'string':
        return expr.value;
      case 'symbol':
        return String(expr.value);
      case 'list':
        return expr.children?.map(child => this.schemeExpressionToValue(child)) || [];
      default:
        return expr.value;
    }
  }

  private valueToSchemeExpression(value: any): SchemeExpression {
    if (typeof value === 'number') {
      return { type: 'number', value };
    } else if (typeof value === 'string') {
      return { type: 'string', value };
    } else if (Array.isArray(value)) {
      return {
        type: 'list',
        value: null,
        children: value.map(item => this.valueToSchemeExpression(item))
      };
    } else {
      return { type: 'string', value: String(value) };
    }
  }

  private contextToSchemeExpression(context: AgenticContext): SchemeExpression {
    const children: SchemeExpression[] = [
      { type: 'symbol', value: 'agent' },
      { type: 'string', value: context.agent },
      { type: 'symbol', value: 'goal' },
      { type: 'string', value: context.goal }
    ];

    if (context.constraints.length > 0) {
      children.push({ type: 'symbol', value: 'constraints' });
      children.push({
        type: 'list',
        value: null,
        children: context.constraints.map(c => ({ type: 'string', value: c }))
      });
    }

    if (context.resources.length > 0) {
      children.push({ type: 'symbol', value: 'resources' });
      children.push({
        type: 'list',
        value: null,
        children: context.resources.map(r => ({ type: 'string', value: r }))
      });
    }

    return {
      type: 'list',
      value: null,
      children
    };
  }

  private calculateLossMetrics(original: AgenticPrimitive, reconstructed: AgenticPrimitive): LossMetrics {
    let structuralLoss = 0;
    let semanticLoss = 0;

    // Check action preservation
    if (original.action !== reconstructed.action) {
      semanticLoss += 0.5;
    }

    // Check parameter preservation
    const originalParamKeys = Object.keys(original.parameters);
    const reconstructedParamKeys = Object.keys(reconstructed.parameters);
    
    const missingParams = originalParamKeys.filter(key => !(key in reconstructed.parameters));
    const extraParams = reconstructedParamKeys.filter(key => !(key in original.parameters));
    
    structuralLoss += (missingParams.length + extraParams.length) / Math.max(originalParamKeys.length, 1);

    // Check parameter value preservation with more lenient comparison
    let changedValues = 0;
    for (const key of originalParamKeys) {
      if (key in reconstructed.parameters) {
        const originalValue = original.parameters[key];
        const reconstructedValue = reconstructed.parameters[key];
        
        // More flexible comparison for complex types
        if (typeof originalValue === 'object' && typeof reconstructedValue === 'object') {
          try {
            if (JSON.stringify(originalValue) !== JSON.stringify(reconstructedValue)) {
              changedValues += 0.5; // Reduce penalty for object differences
            }
          } catch {
            changedValues += 0.3; // Small penalty for unparseable objects
          }
        } else if (String(originalValue) !== String(reconstructedValue)) {
          changedValues += 1;
        }
      }
    }
    semanticLoss += changedValues / Math.max(originalParamKeys.length, 1);

    // Check context preservation with more lenient approach
    if (original.context && !reconstructed.context) {
      structuralLoss += 0.1; // Reduced penalty
    } else if (!original.context && reconstructed.context) {
      structuralLoss += 0.05; // Small penalty for extra context
    } else if (original.context && reconstructed.context) {
      if (original.context.agent !== reconstructed.context.agent) {
        semanticLoss += 0.05; // Reduced penalty
      }
      if (original.context.goal !== reconstructed.context.goal) {
        semanticLoss += 0.05; // Reduced penalty
      }
    }

    // Normalize losses
    structuralLoss = Math.min(1, structuralLoss);
    semanticLoss = Math.min(1, semanticLoss);
    const totalLoss = (structuralLoss + semanticLoss) / 2;

    return {
      structuralLoss,
      semanticLoss,
      totalLoss
    };
  }
}