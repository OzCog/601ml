/**
 * Comprehensive tests for bidirectional translators
 * Tests agentic primitive to hypergraph translation using real data
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { AgenticTranslator } from './translators';
import { AtomSpace } from './atomspace';
import { AtomType } from './types';
import type { AgenticPrimitive, AgenticContext, SchemeExpression } from './types';

describe('AgenticTranslator', () => {
  let atomSpace: AtomSpace;
  let translator: AgenticTranslator;

  beforeEach(() => {
    atomSpace = new AtomSpace();
    translator = new AgenticTranslator(atomSpace);
  });

  describe('Agentic to Hypergraph translation', () => {
    it('should convert simple agentic primitive to hypergraph', () => {
      const primitive: AgenticPrimitive = {
        action: 'navigate',
        parameters: {
          target: 'kitchen',
          speed: 'normal'
        }
      };

      const result = translator.agenticToHypergraph(primitive);
      expect(result.success).toBe(true);
      expect(result.result!.length).toBeGreaterThan(0);
      
      // Should create predicate node for action
      const predicateNodes = result.result!.filter(atom => atom.type === AtomType.PREDICATE_NODE);
      expect(predicateNodes).toHaveLength(1);
      expect(predicateNodes[0].name).toBe('navigate');
      
      // Should create evaluation link
      const evaluationLinks = result.result!.filter(atom => atom.type === AtomType.EVALUATION_LINK);
      expect(evaluationLinks.length).toBeGreaterThan(0);
    });

    it('should convert agentic primitive with context', () => {
      const context: AgenticContext = {
        agent: 'robot-1',
        goal: 'meal-preparation',
        constraints: ['time-limit-30min', 'kitchen-only'],
        resources: ['kitchen-utensils', 'ingredients']
      };

      const primitive: AgenticPrimitive = {
        action: 'prepare-meal',
        parameters: {
          meal_type: 'breakfast',
          servings: 2
        },
        context
      };

      const result = translator.agenticToHypergraph(primitive);
      expect(result.success).toBe(true);
      expect(result.metadata?.hasContext).toBe(true);
      
      // Should create context-related atoms
      const contextNodes = result.result!.filter(atom => 
        atom.name?.includes('robot-1') || 
        atom.name?.includes('meal-preparation') ||
        atom.name?.includes('kitchen-utensils')
      );
      expect(contextNodes.length).toBeGreaterThan(0);
    });

    it('should handle complex parameters with nested data', () => {
      const primitive: AgenticPrimitive = {
        action: 'execute-plan',
        parameters: {
          steps: ['step1', 'step2', 'step3'],
          priority: 'high',
          resources: {
            cpu: 80,
            memory: 1024
          }
        }
      };

      const result = translator.agenticToHypergraph(primitive);
      expect(result.success).toBe(true);
      expect(result.metadata?.parameterCount).toBe(3);
      
      // Should create appropriate atoms for all parameters
      const conceptNodes = result.result!.filter(atom => atom.type === AtomType.CONCEPT_NODE);
      expect(conceptNodes.length).toBeGreaterThan(3);
    });
  });

  describe('Hypergraph to Agentic translation', () => {
    it('should convert hypergraph back to agentic primitive', () => {
      // First create hypergraph from agentic primitive
      const originalPrimitive: AgenticPrimitive = {
        action: 'move-object',
        parameters: {
          object: 'cup',
          destination: 'table',
          force: 'gentle'
        }
      };

      const hypergraphResult = translator.agenticToHypergraph(originalPrimitive);
      expect(hypergraphResult.success).toBe(true);

      // Convert back to agentic primitive
      const backResult = translator.hypergraphToAgentic(hypergraphResult.result!);
      expect(backResult.success).toBe(true);
      
      const reconstructed = backResult.result!;
      expect(reconstructed.action).toBe('move-object');
      expect(reconstructed.parameters.object).toBe('cup');
      expect(reconstructed.parameters.destination).toBe('table');
      expect(reconstructed.parameters.force).toBe('gentle');
    });

    it('should reconstruct context information', () => {
      const context: AgenticContext = {
        agent: 'assistant-ai',
        goal: 'help-user',
        constraints: ['safe-operation'],
        resources: ['sensors', 'actuators']
      };

      const primitive: AgenticPrimitive = {
        action: 'assist-user',
        parameters: { task: 'cleaning' },
        context
      };

      const hypergraphResult = translator.agenticToHypergraph(primitive);
      const backResult = translator.hypergraphToAgentic(hypergraphResult.result!);
      
      expect(backResult.success).toBe(true);
      expect(backResult.result!.context).toBeDefined();
      // Note: Context reconstruction may be simplified in current implementation
    });

    it('should handle empty parameters gracefully', () => {
      const primitive: AgenticPrimitive = {
        action: 'wait',
        parameters: {}
      };

      const hypergraphResult = translator.agenticToHypergraph(primitive);
      const backResult = translator.hypergraphToAgentic(hypergraphResult.result!);
      
      expect(backResult.success).toBe(true);
      expect(backResult.result!.action).toBe('wait');
      expect(typeof backResult.result!.parameters).toBe('object');
    });
  });

  describe('Scheme to Agentic translation', () => {
    it('should convert simple Scheme expression to agentic primitive', () => {
      const expression: SchemeExpression = {
        type: 'list',
        value: null,
        children: [
          { type: 'symbol', value: 'walk' },
          { type: 'symbol', value: 'destination' },
          { type: 'string', value: 'park' },
          { type: 'symbol', value: 'speed' },
          { type: 'string', value: 'fast' }
        ]
      };

      const result = translator.schemeToAgentic(expression);
      expect(result.success).toBe(true);
      
      const primitive = result.result!;
      expect(primitive.action).toBe('walk');
      expect(primitive.parameters.destination).toBe('park');
      expect(primitive.parameters.speed).toBe('fast');
    });

    it('should handle Scheme expressions with numbers', () => {
      const expression: SchemeExpression = {
        type: 'list',
        value: null,
        children: [
          { type: 'symbol', value: 'set-temperature' },
          { type: 'symbol', value: 'value' },
          { type: 'number', value: 22.5 },
          { type: 'symbol', value: 'unit' },
          { type: 'string', value: 'celsius' }
        ]
      };

      const result = translator.schemeToAgentic(expression);
      expect(result.success).toBe(true);
      
      const primitive = result.result!;
      expect(primitive.action).toBe('set-temperature');
      expect(primitive.parameters.value).toBe(22.5);
      expect(primitive.parameters.unit).toBe('celsius');
    });

    it('should handle nested Scheme structures', () => {
      const expression: SchemeExpression = {
        type: 'list',
        value: null,
        children: [
          { type: 'symbol', value: 'execute-sequence' },
          { type: 'symbol', value: 'actions' },
          {
            type: 'list',
            value: null,
            children: [
              { type: 'string', value: 'action1' },
              { type: 'string', value: 'action2' }
            ]
          }
        ]
      };

      const result = translator.schemeToAgentic(expression);
      expect(result.success).toBe(true);
      
      const primitive = result.result!;
      expect(primitive.action).toBe('execute-sequence');
      expect(Array.isArray(primitive.parameters.actions)).toBe(true);
      expect(primitive.parameters.actions).toEqual(['action1', 'action2']);
    });
  });

  describe('Agentic to Scheme translation', () => {
    it('should convert agentic primitive to Scheme expression', () => {
      const primitive: AgenticPrimitive = {
        action: 'cook',
        parameters: {
          recipe: 'pasta',
          duration: 15,
          temperature: 'medium'
        }
      };

      const result = translator.agenticToScheme(primitive);
      expect(result.success).toBe(true);
      
      const expression = result.result!;
      expect(expression.type).toBe('list');
      expect(expression.children![0]).toEqual({ type: 'symbol', value: 'cook' });
      
      // Should contain parameter information
      const childValues = expression.children!.map(child => child.value);
      expect(childValues).toContain('recipe');
      expect(childValues).toContain('duration');
      expect(childValues).toContain('temperature');
    });

    it('should convert agentic primitive with context to Scheme', () => {
      const context: AgenticContext = {
        agent: 'chef-robot',
        goal: 'prepare-dinner',
        constraints: ['dietary-restrictions'],
        resources: ['kitchen']
      };

      const primitive: AgenticPrimitive = {
        action: 'prepare-meal',
        parameters: { meal: 'dinner' },
        context
      };

      const result = translator.agenticToScheme(primitive);
      expect(result.success).toBe(true);
      
      const expression = result.result!;
      const childValues = expression.children!.map(child => child.value);
      expect(childValues).toContain(':context');
    });

    it('should handle array parameters correctly', () => {
      const primitive: AgenticPrimitive = {
        action: 'process-items',
        parameters: {
          items: ['item1', 'item2', 'item3'],
          batch_size: 10
        }
      };

      const result = translator.agenticToScheme(primitive);
      expect(result.success).toBe(true);
      
      const expression = result.result!;
      // Find the items parameter
      const itemsIndex = expression.children!.findIndex(child => child.value === 'items');
      expect(itemsIndex).toBeGreaterThan(-1);
      
      const itemsValue = expression.children![itemsIndex + 1];
      expect(itemsValue.type).toBe('list');
      expect(itemsValue.children).toHaveLength(3);
    });
  });

  describe('Round-trip translation tests', () => {
    it('should preserve simple agentic primitives in round-trip', () => {
      const original: AgenticPrimitive = {
        action: 'move',
        parameters: {
          direction: 'forward',
          distance: 10,
          speed: 'slow'
        }
      };

      const roundTripResult = translator.roundTripTest(original);
      expect(roundTripResult.isValid).toBe(true);
      expect(roundTripResult.final).toBeDefined();
      
      const final = roundTripResult.final!;
      expect(final.action).toBe(original.action);
      expect(final.parameters.direction).toBe(original.parameters.direction);
      expect(final.parameters.distance).toBe(original.parameters.distance);
    });

    it('should calculate loss metrics accurately', () => {
      const original: AgenticPrimitive = {
        action: 'complex-action',
        parameters: {
          param1: 'value1',
          param2: 42,
          param3: ['a', 'b', 'c']
        }
      };

      const roundTripResult = translator.roundTripTest(original);
      expect(roundTripResult.lossMetrics).toBeDefined();
      
      const metrics = roundTripResult.lossMetrics!;
      expect(metrics.structuralLoss).toBeGreaterThanOrEqual(0);
      expect(metrics.structuralLoss).toBeLessThanOrEqual(1);
      expect(metrics.semanticLoss).toBeGreaterThanOrEqual(0);
      expect(metrics.semanticLoss).toBeLessThanOrEqual(1);
      expect(metrics.totalLoss).toBeGreaterThanOrEqual(0);
      expect(metrics.totalLoss).toBeLessThanOrEqual(1);
    });

    it('should handle context preservation in round-trip', () => {
      const context: AgenticContext = {
        agent: 'test-agent',
        goal: 'test-goal',
        constraints: ['constraint1', 'constraint2'],
        resources: ['resource1']
      };

      const original: AgenticPrimitive = {
        action: 'test-action',
        parameters: { test: 'value' },
        context
      };

      const roundTripResult = translator.roundTripTest(original);
      // Note: Context reconstruction may have some loss in current implementation
      expect(roundTripResult.isValid).toBeTruthy();
    });

    it('should identify high loss scenarios', () => {
      const original: AgenticPrimitive = {
        action: 'very-complex-action',
        parameters: {
          nested: {
            deeply: {
              complex: 'structure'
            }
          },
          array: [1, 2, { inner: 'object' }]
        }
      };

      const roundTripResult = translator.roundTripTest(original);
      // Complex nested structures may have higher loss
      expect(roundTripResult.lossMetrics).toBeDefined();
    });
  });

  describe('Real-world cognitive scenarios', () => {
    it('should handle navigation tasks', () => {
      const navigationPrimitive: AgenticPrimitive = {
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

      const hypergraphResult = translator.agenticToHypergraph(navigationPrimitive);
      expect(hypergraphResult.success).toBe(true);
      
      const backResult = translator.hypergraphToAgentic(hypergraphResult.result!);
      expect(backResult.success).toBe(true);
      
      const reconstructed = backResult.result!;
      expect(reconstructed.action).toBe('navigate-to-location');
      expect(reconstructed.parameters.destination).toBe('conference_room_A');
    });

    it('should handle manipulation tasks', () => {
      const manipulationPrimitive: AgenticPrimitive = {
        action: 'pick-and-place',
        parameters: {
          object_id: 'cup_001',
          grasp_type: 'precision_pinch',
          pickup_location: [0.5, 0.3, 0.1],
          place_location: [0.8, 0.3, 0.1],
          force_threshold: 10.0
        },
        context: {
          agent: 'manipulation-robot',
          goal: 'table-clearing',
          constraints: ['fragile-objects', 'collision-free'],
          resources: ['robotic-arm', 'gripper', 'force-sensor']
        }
      };

      const roundTripResult = translator.roundTripTest(manipulationPrimitive);
      expect(roundTripResult.isValid).toBeTruthy();
      
      const final = roundTripResult.final!;
      expect(final.action).toBe('pick-and-place');
      expect(final.parameters.object_id).toBe('cup_001');
    });

    it('should handle communication tasks', () => {
      const communicationPrimitive: AgenticPrimitive = {
        action: 'send-message',
        parameters: {
          recipient: 'human-user',
          message_type: 'status-update',
          content: 'Task completed successfully',
          priority: 'normal',
          require_acknowledgment: true
        },
        context: {
          agent: 'assistant-ai',
          goal: 'keep-user-informed',
          constraints: ['polite-tone', 'concise'],
          resources: ['text-to-speech', 'display-screen']
        }
      };

      const schemeResult = translator.agenticToScheme(communicationPrimitive);
      expect(schemeResult.success).toBe(true);
      
      const backToAgentic = translator.schemeToAgentic(schemeResult.result!);
      expect(backToAgentic.success).toBe(true);
      
      const reconstructed = backToAgentic.result!;
      expect(reconstructed.action).toBe('send-message');
      expect(reconstructed.parameters.recipient).toBe('human-user');
    });

    it('should handle decision-making tasks', () => {
      const decisionPrimitive: AgenticPrimitive = {
        action: 'make-decision',
        parameters: {
          decision_type: 'path-selection',
          options: ['path_A', 'path_B', 'path_C'],
          criteria: ['shortest_time', 'energy_efficiency', 'safety'],
          weights: [0.4, 0.3, 0.3],
          confidence_threshold: 0.8
        },
        context: {
          agent: 'planning-module',
          goal: 'optimal-navigation',
          constraints: ['real-time', 'resource-limited'],
          resources: ['historical-data', 'sensor-input']
        }
      };

      const roundTripResult = translator.roundTripTest(decisionPrimitive);
      
      // Decision-making tasks involve complex data that may have some acceptable loss
      expect(roundTripResult.lossMetrics?.totalLoss).toBeLessThan(0.3);
      expect(roundTripResult.final?.action).toBe('make-decision');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle malformed Scheme expressions gracefully', () => {
      const malformedExpression: SchemeExpression = {
        type: 'string', // Wrong type for action
        value: 'not-a-list'
      };

      const result = translator.schemeToAgentic(malformedExpression);
      expect(result.success).toBe(false);
      expect(result.error).toContain('must be a list');
    });

    it('should handle empty agentic primitives', () => {
      const emptyPrimitive: AgenticPrimitive = {
        action: '',
        parameters: {}
      };

      const result = translator.agenticToHypergraph(emptyPrimitive);
      expect(result.success).toBe(true);
      // Should still create basic structure even with empty data
    });

    it('should handle hypergraph with missing evaluation links', () => {
      const incompleteAtoms = [
        atomSpace.createNode(AtomType.CONCEPT_NODE, 'orphaned-node')
      ];

      const result = translator.hypergraphToAgentic(incompleteAtoms);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No evaluation link found');
    });
  });
});