/**
 * Comprehensive tests for Scheme Adapter
 * Tests parsing, conversion, and round-trip translation using real data
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { SchemeAdapter } from './scheme-adapter';
import { AtomSpace } from './atomspace';
import { AtomType } from './types';
import type { SchemeExpression } from './types';

describe('SchemeAdapter', () => {
  let atomSpace: AtomSpace;
  let adapter: SchemeAdapter;

  beforeEach(() => {
    atomSpace = new AtomSpace();
    adapter = new SchemeAdapter(atomSpace);
  });

  describe('Scheme parsing', () => {
    it('should parse simple symbols', () => {
      const result = adapter.parseScheme('hello');
      expect(result.success).toBe(true);
      expect(result.result).toEqual({
        type: 'symbol',
        value: 'hello',
      });
    });

    it('should parse numbers', () => {
      const result = adapter.parseScheme('42');
      expect(result.success).toBe(true);
      expect(result.result).toEqual({
        type: 'number',
        value: 42,
      });
    });

    it('should parse strings', () => {
      const result = adapter.parseScheme('"hello world"');
      expect(result.success).toBe(true);
      expect(result.result).toEqual({
        type: 'string',
        value: 'hello world',
      });
    });

    it('should parse simple lists', () => {
      const result = adapter.parseScheme('(+ 1 2)');
      expect(result.success).toBe(true);
      expect(result.result).toEqual({
        type: 'list',
        value: null,
        children: [
          { type: 'symbol', value: '+' },
          { type: 'number', value: 1 },
          { type: 'number', value: 2 },
        ],
      });
    });

    it('should parse nested lists', () => {
      const result = adapter.parseScheme('(if (> x 0) "positive" "non-positive")');
      expect(result.success).toBe(true);
      expect(result.result?.type).toBe('list');
      expect(result.result?.children).toHaveLength(4);
      expect(result.result?.children?.[0]).toEqual({ type: 'symbol', value: 'if' });
      expect(result.result?.children?.[1]?.type).toBe('list');
    });

    it('should handle empty lists', () => {
      const result = adapter.parseScheme('()');
      expect(result.success).toBe(true);
      expect(result.result).toEqual({
        type: 'list',
        value: null,
        children: [],
      });
    });

    it('should handle complex nested structures', () => {
      const complexScheme = `
        (lambda (x y)
          (if (> x y)
            (+ x y)
            (- x y)))
      `;
      const result = adapter.parseScheme(complexScheme);
      expect(result.success).toBe(true);
      expect(result.result?.type).toBe('list');
      expect(result.result?.children?.[0]).toEqual({ type: 'symbol', value: 'lambda' });
    });
  });

  describe('Scheme to Atoms conversion', () => {
    it('should convert simple symbols to concept nodes', () => {
      const expression: SchemeExpression = {
        type: 'symbol',
        value: 'human',
      };

      const result = adapter.schemeToAtoms(expression);
      expect(result.success).toBe(true);
      expect(result.result).toHaveLength(1);

      const atom = result.result![0];
      expect(atom.type).toBe(AtomType.CONCEPT_NODE);
      expect(atom.name).toBe('human');
    });

    it('should convert numbers with preserved values', () => {
      const expression: SchemeExpression = {
        type: 'number',
        value: 42,
      };

      const result = adapter.schemeToAtoms(expression);
      expect(result.success).toBe(true);
      expect(result.result).toHaveLength(1);

      const atom = result.result![0];
      expect(atom.type).toBe(AtomType.CONCEPT_NODE);
      expect((atom as any).value).toBe(42);
    });

    it('should convert simple lists to list links', () => {
      const expression: SchemeExpression = {
        type: 'list',
        value: null,
        children: [
          { type: 'symbol', value: 'animal' },
          { type: 'symbol', value: 'dog' },
        ],
      };

      const result = adapter.schemeToAtoms(expression);
      expect(result.success).toBe(true);
      expect(result.result!.length).toBeGreaterThan(2); // Multiple atoms created

      // Should create nodes for symbols and a link
      const linkAtoms = result.result!.filter((atom) => 'outgoing' in atom);
      expect(linkAtoms).toHaveLength(1);
      expect(linkAtoms[0].type).toBe(AtomType.LIST_LINK);
    });

    it('should convert lambda expressions to lambda links', () => {
      const expression: SchemeExpression = {
        type: 'list',
        value: null,
        children: [
          { type: 'symbol', value: 'lambda' },
          {
            type: 'list',
            value: null,
            children: [{ type: 'symbol', value: 'x' }],
          },
          { type: 'symbol', value: 'x' },
        ],
      };

      const result = adapter.schemeToAtoms(expression);
      expect(result.success).toBe(true);

      const lambdaLinks = result.result!.filter((atom) => atom.type === AtomType.LAMBDA_LINK);
      expect(lambdaLinks).toHaveLength(1);
    });

    it('should convert inheritance expressions to inheritance links', () => {
      const expression: SchemeExpression = {
        type: 'list',
        value: null,
        children: [
          { type: 'symbol', value: 'inheritance' },
          { type: 'symbol', value: 'dog' },
          { type: 'symbol', value: 'animal' },
        ],
      };

      const result = adapter.schemeToAtoms(expression);
      expect(result.success).toBe(true);

      const inheritanceLinks = result.result!.filter((atom) => atom.type === AtomType.INHERITANCE_LINK);
      expect(inheritanceLinks).toHaveLength(1);
    });
  });

  describe('Atoms to Scheme conversion', () => {
    it('should convert concept nodes back to symbols', () => {
      const node = atomSpace.createNode(AtomType.CONCEPT_NODE, 'human');

      const result = adapter.atomsToScheme([node]);
      expect(result.success).toBe(true);
      expect(result.result).toEqual({
        type: 'symbol',
        value: 'human',
      });
    });

    it('should convert number nodes with preserved values', () => {
      const node = atomSpace.createNode(AtomType.CONCEPT_NODE, '42');
      (node as any).value = 42;

      const result = adapter.atomsToScheme([node]);
      expect(result.success).toBe(true);
      expect(result.result).toEqual({
        type: 'number',
        value: 42,
      });
    });

    it('should convert list links back to lists', () => {
      const node1 = atomSpace.createNode(AtomType.CONCEPT_NODE, 'animal');
      const node2 = atomSpace.createNode(AtomType.CONCEPT_NODE, 'dog');
      const link = atomSpace.createLink(AtomType.LIST_LINK, [node1, node2]);

      const result = adapter.atomsToScheme([node1, node2, link]);
      expect(result.success).toBe(true);
      expect(result.result?.type).toBe('list');
      expect(result.result?.children).toHaveLength(2);
    });

    it('should convert lambda links with type information', () => {
      const varNode = atomSpace.createNode(AtomType.VARIABLE_NODE, 'x');
      const bodyNode = atomSpace.createNode(AtomType.CONCEPT_NODE, 'x');
      const paramList = atomSpace.createLink(AtomType.LIST_LINK, [varNode]);
      const lambdaLink = atomSpace.createLink(AtomType.LAMBDA_LINK, [paramList, bodyNode]);

      const result = adapter.atomsToScheme([varNode, bodyNode, paramList, lambdaLink]);
      expect(result.success).toBe(true);
      expect(result.result?.type).toBe('list');
      expect(result.result?.children?.[0]).toEqual({ type: 'symbol', value: 'lambda' });
    });
  });

  describe('Round-trip translation', () => {
    it('should preserve simple expressions in round-trip', () => {
      const originalScheme = '(+ 1 2)';

      // Parse to expression
      const parseResult = adapter.parseScheme(originalScheme);
      expect(parseResult.success).toBe(true);

      // Convert to atoms
      const atomsResult = adapter.schemeToAtoms(parseResult.result!);
      expect(atomsResult.success).toBe(true);

      // Convert back to expression
      const backResult = adapter.atomsToScheme(atomsResult.result!);
      expect(backResult.success).toBe(true);

      // Convert back to string and compare semantics
      const finalString = adapter.expressionToString(backResult.result!);
      expect(finalString).toContain('+');
      expect(finalString).toContain('1');
      expect(finalString).toContain('2');
    });

    it('should preserve lambda expressions in round-trip', () => {
      const originalScheme = '(lambda (x) (+ x 1))';

      const parseResult = adapter.parseScheme(originalScheme);
      expect(parseResult.success).toBe(true);

      const atomsResult = adapter.schemeToAtoms(parseResult.result!);
      expect(atomsResult.success).toBe(true);

      const backResult = adapter.atomsToScheme(atomsResult.result!);
      expect(backResult.success).toBe(true);

      const finalString = adapter.expressionToString(backResult.result!);
      expect(finalString).toContain('lambda');
    });

    it('should preserve nested structures in round-trip', () => {
      const originalScheme = '(if (> x 0) "positive" "negative")';

      const parseResult = adapter.parseScheme(originalScheme);
      expect(parseResult.success).toBe(true);

      const atomsResult = adapter.schemeToAtoms(parseResult.result!);
      expect(atomsResult.success).toBe(true);

      const backResult = adapter.atomsToScheme(atomsResult.result!);
      expect(backResult.success).toBe(true);

      // Verify structure is preserved
      expect(backResult.result?.type).toBe('list');
      expect(backResult.result?.children).toHaveLength(4);
    });
  });

  describe('Expression to string conversion', () => {
    it('should format symbols correctly', () => {
      const expr: SchemeExpression = { type: 'symbol', value: 'hello' };
      expect(adapter.expressionToString(expr)).toBe('hello');
    });

    it('should format strings with quotes', () => {
      const expr: SchemeExpression = { type: 'string', value: 'hello world' };
      expect(adapter.expressionToString(expr)).toBe('"hello world"');
    });

    it('should format numbers correctly', () => {
      const expr: SchemeExpression = { type: 'number', value: 42 };
      expect(adapter.expressionToString(expr)).toBe('42');
    });

    it('should format lists with parentheses', () => {
      const expr: SchemeExpression = {
        type: 'list',
        value: null,
        children: [
          { type: 'symbol', value: '+' },
          { type: 'number', value: 1 },
          { type: 'number', value: 2 },
        ],
      };
      expect(adapter.expressionToString(expr)).toBe('(+ 1 2)');
    });

    it('should format empty lists', () => {
      const expr: SchemeExpression = {
        type: 'list',
        value: null,
        children: [],
      };
      expect(adapter.expressionToString(expr)).toBe('()');
    });
  });

  describe('Parse and convert integration', () => {
    it('should parse and convert in single operation', () => {
      const schemeString = '(inheritance dog animal)';

      const result = adapter.parseAndConvert(schemeString);
      expect(result.success).toBe(true);
      expect(result.result!.length).toBeGreaterThan(0);

      const inheritanceLinks = result.result!.filter((atom) => atom.type === AtomType.INHERITANCE_LINK);
      expect(inheritanceLinks).toHaveLength(1);
    });

    it('should handle complex expressions in single operation', () => {
      const schemeString = '(evaluation (predicate "likes") (list (concept "Alice") (concept "Bob")))';

      const result = adapter.parseAndConvert(schemeString);
      expect(result.success).toBe(true);

      const evaluationLinks = result.result!.filter((atom) => atom.type === AtomType.EVALUATION_LINK);
      expect(evaluationLinks).toHaveLength(1);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed expressions gracefully', () => {
      const result = adapter.parseScheme('(unclosed list');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing closing parenthesis');
    });

    it('should handle empty input', () => {
      const result = adapter.parseScheme('');
      expect(result.success).toBe(false);
    });

    it('should handle unexpected closing parenthesis', () => {
      const result = adapter.parseScheme('unexpected )');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected closing parenthesis');
    });
  });

  describe('Real data tests with cognitive grammar', () => {
    it('should handle cognitive action expressions', () => {
      const cognitiveScheme = '(perform-action "navigate" (target "kitchen") (method "walking"))';

      const parseResult = adapter.parseScheme(cognitiveScheme);
      expect(parseResult.success).toBe(true);

      const atomsResult = adapter.schemeToAtoms(parseResult.result!);
      expect(atomsResult.success).toBe(true);

      // Verify proper atom creation for cognitive actions
      const conceptNodes = atomsResult.result!.filter((atom) => atom.type === AtomType.CONCEPT_NODE);
      expect(conceptNodes.length).toBeGreaterThan(0);

      const listLinks = atomsResult.result!.filter((atom) => atom.type === AtomType.LIST_LINK);
      expect(listLinks.length).toBeGreaterThan(0);
    });

    it('should handle goal-oriented expressions', () => {
      const goalScheme = '(achieve-goal "prepare-meal" (ingredients ("rice" "vegetables")) (time-limit 30))';

      const result = adapter.parseAndConvert(goalScheme);
      expect(result.success).toBe(true);

      // Verify round-trip preservation
      const backResult = adapter.atomsToScheme(result.result!);
      expect(backResult.success).toBe(true);
      expect(backResult.result?.type).toBe('list');
      expect(backResult.result?.children?.[0]).toEqual({ type: 'symbol', value: 'achieve-goal' });
    });

    it('should handle conditional cognitive expressions', () => {
      const conditionalScheme = `
        (if (sensor-reading "temperature" > 25)
          (action "turn-on-fan")
          (action "maintain-current-state"))
      `;

      const parseResult = adapter.parseScheme(conditionalScheme);
      expect(parseResult.success).toBe(true);

      const atomsResult = adapter.schemeToAtoms(parseResult.result!);
      expect(atomsResult.success).toBe(true);

      // Should create a complex structure with multiple nested elements
      expect(atomsResult.result!.length).toBeGreaterThan(5);
    });
  });
});
