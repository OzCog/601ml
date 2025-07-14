/**
 * AtomSpace implementation for hypergraph pattern storage and manipulation
 * Provides the foundational data structure for cognitive primitives
 */

import type { 
  Atom, 
  Link, 
  Node, 
  TruthValue, 
  AtomSpaceConfig 
} from './types';
import { AtomType } from './types';

export class AtomSpace {
  private atoms: Map<string, Atom> = new Map();
  private typeIndex: Map<AtomType, Set<string>> = new Map();
  private nameIndex: Map<string, Set<string>> = new Map();
  private config: AtomSpaceConfig;

  constructor(config: Partial<AtomSpaceConfig> = {}) {
    this.config = {
      maxAtoms: 1000000,
      enableGarbageCollection: true,
      truthValueThreshold: 0.1,
      ...config
    };
  }

  /**
   * Add an atom to the AtomSpace
   */
  addAtom(atom: Atom): string {
    if (this.atoms.size >= this.config.maxAtoms) {
      if (this.config.enableGarbageCollection) {
        this.garbageCollect();
      } else {
        throw new Error('AtomSpace is full');
      }
    }

    this.atoms.set(atom.id, atom);
    
    // Update type index
    if (!this.typeIndex.has(atom.type)) {
      this.typeIndex.set(atom.type, new Set());
    }
    this.typeIndex.get(atom.type)!.add(atom.id);

    // Update name index
    if (atom.name) {
      if (!this.nameIndex.has(atom.name)) {
        this.nameIndex.set(atom.name, new Set());
      }
      this.nameIndex.get(atom.name)!.add(atom.id);
    }

    return atom.id;
  }

  /**
   * Create a new node
   */
  createNode(type: AtomType, name?: string, truthValue?: TruthValue): Node {
    const node: Node = {
      id: this.generateId(),
      type,
      name,
      truthValue,
      confidence: truthValue?.confidence || 1.0
    };

    this.addAtom(node);
    return node;
  }

  /**
   * Create a new link
   */
  createLink(type: AtomType, outgoing: Atom[], truthValue?: TruthValue): Link {
    const link: Link = {
      id: this.generateId(),
      type,
      outgoing: [...outgoing],
      truthValue,
      confidence: truthValue?.confidence || 1.0
    };

    this.addAtom(link);
    return link;
  }

  /**
   * Get atom by ID
   */
  getAtom(id: string): Atom | undefined {
    return this.atoms.get(id);
  }

  /**
   * Get atoms by type
   */
  getAtomsByType(type: AtomType): Atom[] {
    const ids = this.typeIndex.get(type) || new Set();
    return Array.from(ids).map(id => this.atoms.get(id)!).filter(Boolean);
  }

  /**
   * Get atoms by name
   */
  getAtomsByName(name: string): Atom[] {
    const ids = this.nameIndex.get(name) || new Set();
    return Array.from(ids).map(id => this.atoms.get(id)!).filter(Boolean);
  }

  /**
   * Remove atom from AtomSpace
   */
  removeAtom(id: string): boolean {
    const atom = this.atoms.get(id);
    if (!atom) return false;

    // Remove from indices
    this.typeIndex.get(atom.type)?.delete(id);
    if (atom.name) {
      this.nameIndex.get(atom.name)?.delete(id);
    }

    // Remove incoming links
    this.removeIncomingLinks(id);

    this.atoms.delete(id);
    return true;
  }

  /**
   * Find atoms matching a pattern
   */
  findAtoms(pattern: Partial<Atom>): Atom[] {
    let candidates = Array.from(this.atoms.values());

    if (pattern.type) {
      candidates = this.getAtomsByType(pattern.type);
    }

    return candidates.filter(atom => this.matchesPattern(atom, pattern));
  }

  /**
   * Get all atoms in the AtomSpace
   */
  getAllAtoms(): Atom[] {
    return Array.from(this.atoms.values());
  }

  /**
   * Get AtomSpace statistics
   */
  getStats() {
    const typeStats = new Map<AtomType, number>();
    for (const [type, ids] of this.typeIndex) {
      typeStats.set(type, ids.size);
    }

    return {
      totalAtoms: this.atoms.size,
      typeDistribution: Object.fromEntries(typeStats),
      memoryUsage: this.estimateMemoryUsage(),
      indexSize: {
        types: this.typeIndex.size,
        names: this.nameIndex.size
      }
    };
  }

  /**
   * Clear all atoms
   */
  clear(): void {
    this.atoms.clear();
    this.typeIndex.clear();
    this.nameIndex.clear();
  }

  private generateId(): string {
    return `atom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private matchesPattern(atom: Atom, pattern: Partial<Atom>): boolean {
    if (pattern.type && atom.type !== pattern.type) return false;
    if (pattern.name && atom.name !== pattern.name) return false;
    
    if (pattern.truthValue) {
      if (!atom.truthValue) return false;
      if (Math.abs(atom.truthValue.strength - pattern.truthValue.strength) > 0.01) return false;
      if (Math.abs(atom.truthValue.confidence - pattern.truthValue.confidence) > 0.01) return false;
    }

    return true;
  }

  private removeIncomingLinks(targetId: string): void {
    const linksToRemove: string[] = [];
    
    for (const atom of this.atoms.values()) {
      if ('outgoing' in atom) {
        const link = atom as Link;
        if (link.outgoing.some(outgoingAtom => outgoingAtom.id === targetId)) {
          linksToRemove.push(link.id);
        }
      }
    }

    linksToRemove.forEach(id => this.removeAtom(id));
  }

  private garbageCollect(): void {
    // Simple garbage collection: remove atoms with low truth values
    const atomsToRemove: string[] = [];
    
    for (const atom of this.atoms.values()) {
      if (atom.truthValue && 
          atom.truthValue.strength < this.config.truthValueThreshold) {
        atomsToRemove.push(atom.id);
      }
    }

    atomsToRemove.forEach(id => this.removeAtom(id));
  }

  private estimateMemoryUsage(): number {
    // Rough estimate of memory usage in bytes
    let totalSize = 0;
    
    for (const atom of this.atoms.values()) {
      totalSize += JSON.stringify(atom).length * 2; // UTF-16 characters
    }
    
    return totalSize;
  }
}