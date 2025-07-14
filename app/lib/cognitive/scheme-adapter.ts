/**
 * Scheme Adapter for parsing and converting Scheme expressions to AtomSpace atoms
 * Provides the core translation layer between Scheme syntax and hypergraph patterns
 */

import type { Atom, Link, Node, SchemeExpression, SchemeAdapterConfig, TranslationResult } from './types';
import { AtomType } from './types';
import { AtomSpace } from './atomspace';

export class SchemeAdapter {
  private atomSpace: AtomSpace;
  private config: SchemeAdapterConfig;

  constructor(atomSpace: AtomSpace, config: Partial<SchemeAdapterConfig> = {}) {
    this.atomSpace = atomSpace;
    this.config = {
      enableTruthValues: true,
      defaultConfidence: 0.8,
      validationLevel: 'permissive',
      ...config,
    };
  }

  /**
   * Parse a Scheme expression string into a structured representation
   */
  parseScheme(expression: string): TranslationResult<SchemeExpression> {
    try {
      const tokens = this.tokenize(expression);
      const parsed = this.parseTokens(tokens);

      return {
        success: true,
        result: parsed,
        metadata: { tokenCount: tokens.length },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
      };
    }
  }

  /**
   * Convert a Scheme expression to AtomSpace atoms
   */
  schemeToAtoms(expression: SchemeExpression): TranslationResult<Atom[]> {
    try {
      const atoms = this.convertExpressionToAtoms(expression);

      return {
        success: true,
        result: atoms,
        metadata: { atomCount: atoms.length },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error',
      };
    }
  }

  /**
   * Convert AtomSpace atoms back to Scheme expressions
   */
  atomsToScheme(atoms: Atom[]): TranslationResult<SchemeExpression> {
    try {
      // Find the root atom (typically a list or expression)
      const rootAtom = this.findRootAtom(atoms);
      const expression = this.convertAtomToExpression(rootAtom, atoms);

      return {
        success: true,
        result: expression,
        metadata: { sourceAtomCount: atoms.length },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error',
      };
    }
  }

  /**
   * Convert Scheme expression to a formatted string
   */
  expressionToString(expression: SchemeExpression): string {
    switch (expression.type) {
      case 'atom':
      case 'symbol':
        return String(expression.value);

      case 'string':
        return `"${expression.value}"`;

      case 'number':
        return String(expression.value);

      case 'list':
        if (!expression.children) {
          return '()';
        }

        const childStrings = expression.children.map((child) => this.expressionToString(child));
        return `(${childStrings.join(' ')})`;

      default:
        return String(expression.value);
    }
  }

  /**
   * Parse and convert a Scheme string directly to atoms
   */
  parseAndConvert(schemeString: string): TranslationResult<Atom[]> {
    const parseResult = this.parseScheme(schemeString);

    if (!parseResult.success || !parseResult.result) {
      return {
        success: false,
        error: parseResult.error || 'Parse failed',
      };
    }

    return this.schemeToAtoms(parseResult.result);
  }

  private tokenize(expression: string): string[] {
    // Simple tokenizer for Scheme expressions
    const tokens: string[] = [];
    let current = '';
    let inString = false;

    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];

      if (char === '"' && (i === 0 || expression[i - 1] !== '\\')) {
        inString = !inString;
        current += char;
      } else if (inString) {
        current += char;
      } else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else if (char === '(' || char === ')') {
        if (current) {
          tokens.push(current);
          current = '';
        }

        tokens.push(char);
      } else {
        current += char;
      }
    }

    if (current) {
      tokens.push(current);
    }

    return tokens;
  }

  private parseTokens(tokens: string[]): SchemeExpression {
    let index = 0;

    const parseNext = (): SchemeExpression => {
      if (index >= tokens.length) {
        throw new Error('Unexpected end of tokens');
      }

      const token = tokens[index++];

      if (token === '(') {
        // Parse list
        const children: SchemeExpression[] = [];

        while (index < tokens.length && tokens[index] !== ')') {
          children.push(parseNext());
        }

        if (index >= tokens.length) {
          throw new Error('Missing closing parenthesis');
        }

        index++; // Skip ')'

        return {
          type: 'list',
          value: null,
          children,
        };
      } else if (token === ')') {
        throw new Error('Unexpected closing parenthesis');
      } else if (token.startsWith('"') && token.endsWith('"')) {
        // String literal
        return {
          type: 'string',
          value: token.slice(1, -1),
        };
      } else if (!isNaN(Number(token))) {
        // Number
        return {
          type: 'number',
          value: Number(token),
        };
      } else {
        // Symbol or atom
        return {
          type: 'symbol',
          value: token,
        };
      }
    };

    // Check for unexpected closing parenthesis at start
    if (tokens.length > 0 && tokens.some((t) => t === ')') && !tokens.some((t) => t === '(')) {
      throw new Error('Unexpected closing parenthesis');
    }

    return parseNext();
  }

  private convertExpressionToAtoms(expression: SchemeExpression): Atom[] {
    const atoms: Atom[] = [];

    const convertToAtom = (expr: SchemeExpression): Atom => {
      switch (expr.type) {
        case 'symbol':
          return this.atomSpace.createNode(
            AtomType.CONCEPT_NODE,
            String(expr.value),
            this.config.enableTruthValues
              ? {
                  strength: 1.0,
                  confidence: this.config.defaultConfidence,
                }
              : undefined,
          );

        case 'string':
          return this.atomSpace.createNode(
            AtomType.CONCEPT_NODE,
            String(expr.value),
            this.config.enableTruthValues
              ? {
                  strength: 1.0,
                  confidence: this.config.defaultConfidence,
                }
              : undefined,
          );

        case 'number':
          const numberNode = this.atomSpace.createNode(AtomType.CONCEPT_NODE, String(expr.value));
          (numberNode as Node).value = expr.value;
          return numberNode;

        case 'list':
          if (!expr.children || expr.children.length === 0) {
            return this.atomSpace.createLink(AtomType.LIST_LINK, []);
          }

          // Convert all children to atoms first
          const childAtoms = expr.children.map((child) => convertToAtom(child));
          atoms.push(...childAtoms);

          // Create appropriate link type based on first element
          const firstChild = expr.children[0];
          let linkType = AtomType.LIST_LINK;

          if (firstChild.type === 'symbol') {
            switch (firstChild.value) {
              case 'lambda':
                linkType = AtomType.LAMBDA_LINK;
                break;
              case 'apply':
                linkType = AtomType.APPLICATION_LINK;
                break;
              case 'inheritance':
                linkType = AtomType.INHERITANCE_LINK;
                break;
              case 'evaluation':
                linkType = AtomType.EVALUATION_LINK;
                break;
            }
          }

          return this.atomSpace.createLink(linkType, childAtoms);

        default:
          return this.atomSpace.createNode(AtomType.CONCEPT_NODE, String(expr.value));
      }
    };

    const rootAtom = convertToAtom(expression);
    atoms.push(rootAtom);

    return atoms;
  }

  private findRootAtom(atoms: Atom[]): Atom {
    // Find the atom that is not referenced by any other atom
    const referencedIds = new Set<string>();

    for (const atom of atoms) {
      if ('outgoing' in atom) {
        const link = atom as Link;
        link.outgoing.forEach((outgoingAtom) => {
          referencedIds.add(outgoingAtom.id);
        });
      }
    }

    const rootAtoms = atoms.filter((atom) => !referencedIds.has(atom.id));

    if (rootAtoms.length === 0) {
      throw new Error('No root atom found - circular reference detected');
    }

    if (rootAtoms.length > 1) {
      // Return the first link if multiple roots exist
      const linkRoots = rootAtoms.filter((atom) => 'outgoing' in atom);

      if (linkRoots.length > 0) {
        return linkRoots[0];
      }
    }

    return rootAtoms[0];
  }

  private convertAtomToExpression(atom: Atom, allAtoms: Atom[]): SchemeExpression {
    if ('outgoing' in atom) {
      // This is a link
      const link = atom as Link;
      const children = link.outgoing.map((outgoingAtom) => this.convertAtomToExpression(outgoingAtom, allAtoms));

      // Add type information for special link types
      if (link.type === AtomType.LAMBDA_LINK) {
        children.unshift({ type: 'symbol', value: 'lambda' });
      } else if (link.type === AtomType.APPLICATION_LINK) {
        children.unshift({ type: 'symbol', value: 'apply' });
      } else if (link.type === AtomType.INHERITANCE_LINK) {
        children.unshift({ type: 'symbol', value: 'inheritance' });
      } else if (link.type === AtomType.EVALUATION_LINK) {
        children.unshift({ type: 'symbol', value: 'evaluation' });
      }

      return {
        type: 'list',
        value: null,
        children,
      };
    } else {
      // This is a node
      const node = atom as Node;

      if (node.value !== undefined && typeof node.value === 'number') {
        return {
          type: 'number',
          value: node.value,
        };
      }

      return {
        type: 'symbol',
        value: node.name || node.id,
      };
    }
  }
}
