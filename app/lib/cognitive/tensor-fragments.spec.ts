/**
 * Comprehensive tests for Tensor Fragment Architecture
 * Tests tensor shape validation, serialization, and prime factorization mapping
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { TensorFragmentProcessor, TensorFragmentUtils } from './tensor-fragments';
import { AtomSpace } from './atomspace';
import type { TensorShape, TensorFragment } from './types';

describe('TensorFragmentProcessor', () => {
  let processor: TensorFragmentProcessor;
  let atomSpace: AtomSpace;

  beforeEach(() => {
    processor = new TensorFragmentProcessor();
    atomSpace = new AtomSpace();
  });

  describe('Tensor shape validation', () => {
    it('should validate correct tensor shapes', () => {
      const validShape: TensorShape = {
        modality: 10,
        depth: 5,
        context: 100,
        salience: 50,
        autonomy_index: 8,
      };

      const result = processor.validateTensorShape(validShape);
      expect(result.success).toBe(true);
      expect(result.result).toBe(true);
    });

    it('should reject negative dimensions', () => {
      const invalidShape: TensorShape = {
        modality: -1,
        depth: 5,
        context: 100,
        salience: 50,
        autonomy_index: 8,
      };

      const result = processor.validateTensorShape(invalidShape);
      expect(result.success).toBe(false);
      expect(result.validationErrors).toContain('Modality dimension must be a positive integer');
    });

    it('should reject zero dimensions', () => {
      const invalidShape: TensorShape = {
        modality: 0,
        depth: 5,
        context: 100,
        salience: 50,
        autonomy_index: 8,
      };

      const result = processor.validateTensorShape(invalidShape);
      expect(result.success).toBe(false);
      expect(result.validationErrors).toContain('Modality dimension must be a positive integer');
    });

    it('should reject non-integer dimensions', () => {
      const invalidShape: TensorShape = {
        modality: 1.5,
        depth: 5,
        context: 100,
        salience: 50,
        autonomy_index: 8,
      };

      const result = processor.validateTensorShape(invalidShape);
      expect(result.success).toBe(false);
      expect(result.validationErrors).toContain('Modality dimension must be a positive integer');
    });

    it('should reject dimensions exceeding bounds', () => {
      const invalidShape: TensorShape = {
        modality: 2000, // Exceeds max 1000
        depth: 5,
        context: 100,
        salience: 50,
        autonomy_index: 8,
      };

      const result = processor.validateTensorShape(invalidShape);
      expect(result.success).toBe(false);
      expect(result.validationErrors).toContain('Modality dimension exceeds reasonable bounds (max 1000)');
    });
  });

  describe('Tensor fragment creation', () => {
    it('should create tensor fragment with valid shape', () => {
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
      expect(fragment.shape).toEqual(shape);
      expect(fragment.data).toBeInstanceOf(Float32Array);
      expect(fragment.data.length).toBe(2 * 3 * 4 * 5 * 2); // 240
      expect(fragment.primeFactors).toBeDefined();
      expect(fragment.metadata).toBeDefined();
      expect(fragment.id).toMatch(/^tensor_/);
    });

    it('should handle custom tensor data', () => {
      const shape: TensorShape = {
        modality: 2,
        depth: 2,
        context: 2,
        salience: 2,
        autonomy_index: 2,
      };

      const customData = new Float32Array([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
        31, 32,
      ]);

      const result = processor.createTensorFragment(shape, customData);
      expect(result.success).toBe(true);
      expect(result.result!.data).toBe(customData);
    });

    it('should reject oversized tensors', () => {
      const processor = new TensorFragmentProcessor({ maxTensorSize: 100 });
      const shape: TensorShape = {
        modality: 10,
        depth: 10,
        context: 10,
        salience: 10,
        autonomy_index: 10,
      }; // Total size: 100,000 > 100

      const result = processor.createTensorFragment(shape);
      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should include performance metrics', () => {
      const shape: TensorShape = {
        modality: 5,
        depth: 4,
        context: 3,
        salience: 2,
        autonomy_index: 1,
      };

      const result = processor.createTensorFragment(shape);
      expect(result.success).toBe(true);
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics!.operationTime).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics!.memoryUsed).toBeGreaterThan(0);
    });
  });

  describe('Serialization and deserialization', () => {
    it('should serialize and deserialize tensor fragments', () => {
      const shape: TensorShape = {
        modality: 2,
        depth: 3,
        context: 4,
        salience: 2,
        autonomy_index: 1,
      };

      const createResult = processor.createTensorFragment(shape);
      expect(createResult.success).toBe(true);

      const original = createResult.result!;

      // Create a copy with custom data for testing
      const testData = new Float32Array(original.data.length);

      for (let i = 0; i < testData.length; i++) {
        testData[i] = i * 0.1;
      }

      // Create a new tensor fragment with the test data
      const testResult = processor.createTensorFragment(shape, testData);
      expect(testResult.success).toBe(true);

      const testFragment = testResult.result!;

      const serializeResult = processor.serializeTensorFragment(testFragment);
      expect(serializeResult.success).toBe(true);
      expect(typeof serializeResult.result).toBe('string');

      const deserializeResult = processor.deserializeTensorFragment(serializeResult.result!);

      if (!deserializeResult.success) {
        console.log('Deserialization error:', deserializeResult.error);
      }

      expect(deserializeResult.success).toBe(true);

      const restored = deserializeResult.result!;
      expect(restored.shape).toEqual(testFragment.shape);
      expect(restored.data.length).toBe(testFragment.data.length);
      expect(restored.primeFactors).toEqual(testFragment.primeFactors);

      // Check data integrity
      for (let i = 0; i < testFragment.data.length; i++) {
        expect(restored.data[i]).toBeCloseTo(testFragment.data[i], 5);
      }
    });

    it('should handle serialization of large tensors', () => {
      const shape: TensorShape = {
        modality: 10,
        depth: 10,
        context: 5,
        salience: 4,
        autonomy_index: 2,
      };

      const createResult = processor.createTensorFragment(shape);
      expect(createResult.success).toBe(true);

      const serializeResult = processor.serializeTensorFragment(createResult.result!);
      expect(serializeResult.success).toBe(true);
      expect(serializeResult.performanceMetrics?.compressionRatio).toBeDefined();
    });

    it('should validate checksums during deserialization', () => {
      const shape: TensorShape = {
        modality: 2,
        depth: 2,
        context: 2,
        salience: 2,
        autonomy_index: 2,
      };

      const createResult = processor.createTensorFragment(shape);
      const serializeResult = processor.serializeTensorFragment(createResult.result!);

      // Parse and corrupt the checksum field specifically
      const parsed = JSON.parse(serializeResult.result!);
      parsed.metadata.checksum = 'corrupted_checksum';

      const corruptedData = JSON.stringify(parsed);

      const deserializeResult = processor.deserializeTensorFragment(corruptedData);
      expect(deserializeResult.success).toBe(false);
      expect(deserializeResult.error).toContain('Checksum validation failed');
    });

    it('should handle version compatibility', () => {
      const shape: TensorShape = {
        modality: 2,
        depth: 2,
        context: 2,
        salience: 2,
        autonomy_index: 2,
      };

      const createResult = processor.createTensorFragment(shape);
      const serializeResult = processor.serializeTensorFragment(createResult.result!);

      // Change version to incompatible
      let incompatibleData = serializeResult.result!;
      incompatibleData = incompatibleData.replace('"version":"1.2.0"', '"version":"2.0.0"');

      const deserializeResult = processor.deserializeTensorFragment(incompatibleData);
      expect(deserializeResult.success).toBe(false);
      expect(deserializeResult.error).toContain('Incompatible version');
    });
  });

  describe('Prime factorization mapping', () => {
    it('should generate prime factorization for simple numbers', () => {
      const mapping = processor.generatePrimeFactorizationMapping(12);
      expect(mapping.originalSize).toBe(12);
      expect(mapping.factors).toEqual([2, 2, 3]); // 12 = 2 * 2 * 3
      expect(mapping.partitions).toHaveLength(3);
    });

    it('should handle prime numbers', () => {
      const mapping = processor.generatePrimeFactorizationMapping(7);
      expect(mapping.originalSize).toBe(7);
      expect(mapping.factors).toEqual([7]);
      expect(mapping.partitions).toHaveLength(1);
    });

    it('should handle large composite numbers', () => {
      const mapping = processor.generatePrimeFactorizationMapping(1000);
      expect(mapping.originalSize).toBe(1000);
      expect(mapping.factors).toEqual([2, 2, 2, 5, 5, 5]); // 1000 = 2^3 * 5^3
      expect(mapping.partitions).toHaveLength(6);
    });

    it('should support different distribution strategies', () => {
      const mapping1 = processor.generatePrimeFactorizationMapping(24, 'row-wise');
      const mapping2 = processor.generatePrimeFactorizationMapping(24, 'column-wise');
      const mapping3 = processor.generatePrimeFactorizationMapping(24, 'block-wise');

      expect(mapping1.distributionStrategy).toBe('row-wise');
      expect(mapping2.distributionStrategy).toBe('column-wise');
      expect(mapping3.distributionStrategy).toBe('block-wise');

      // All should have same factors but potentially different partition strategies
      expect(mapping1.factors).toEqual(mapping2.factors);
      expect(mapping2.factors).toEqual(mapping3.factors);
    });
  });
});

describe('TensorFragmentUtils', () => {
  describe('Shape creation and comparison', () => {
    it('should create tensor shapes', () => {
      const shape = TensorFragmentUtils.createShape(2, 3, 4, 5, 6);
      expect(shape).toEqual({
        modality: 2,
        depth: 3,
        context: 4,
        salience: 5,
        autonomy_index: 6,
      });
    });

    it('should compare shapes for equality', () => {
      const shape1 = TensorFragmentUtils.createShape(2, 3, 4, 5, 6);
      const shape2 = TensorFragmentUtils.createShape(2, 3, 4, 5, 6);
      const shape3 = TensorFragmentUtils.createShape(2, 3, 4, 5, 7);

      expect(TensorFragmentUtils.shapesEqual(shape1, shape2)).toBe(true);
      expect(TensorFragmentUtils.shapesEqual(shape1, shape3)).toBe(false);
    });

    it('should calculate memory footprint', () => {
      const shape = TensorFragmentUtils.createShape(2, 3, 4, 5, 6);

      const float32Memory = TensorFragmentUtils.calculateMemoryFootprint(shape, 'float32');
      const int16Memory = TensorFragmentUtils.calculateMemoryFootprint(shape, 'int16');
      const int8Memory = TensorFragmentUtils.calculateMemoryFootprint(shape, 'int8');

      expect(float32Memory).toBe(2 * 3 * 4 * 5 * 6 * 4); // 2880 bytes
      expect(int16Memory).toBe(2 * 3 * 4 * 5 * 6 * 2); // 1440 bytes
      expect(int8Memory).toBe(2 * 3 * 4 * 5 * 6 * 1); // 720 bytes
    });

    it('should generate shape descriptions', () => {
      const shape = TensorFragmentUtils.createShape(2, 3, 4, 5, 6);
      const description = TensorFragmentUtils.describeShape(shape);

      expect(description).toBe('TensorShape[modality=2, depth=3, context=4, salience=5, autonomy_index=6]');
    });
  });
});

describe('AtomSpace tensor fragment integration', () => {
  let atomSpace: AtomSpace;

  beforeEach(() => {
    atomSpace = new AtomSpace();
  });

  it('should create and store tensor fragments', () => {
    const shape = TensorFragmentUtils.createShape(2, 2, 2, 2, 2);
    const fragment = atomSpace.createTensorFragment(shape);

    expect(fragment).toBeDefined();
    expect(fragment!.shape).toEqual(shape);

    const retrieved = atomSpace.getTensorFragment(fragment!.id);
    expect(retrieved).toBe(fragment);
  });

  it('should find tensor fragments by shape pattern', () => {
    const shape1 = TensorFragmentUtils.createShape(2, 3, 4, 5, 6);
    const shape2 = TensorFragmentUtils.createShape(2, 3, 4, 7, 8);
    const shape3 = TensorFragmentUtils.createShape(3, 3, 4, 5, 6);

    atomSpace.createTensorFragment(shape1);
    atomSpace.createTensorFragment(shape2);
    atomSpace.createTensorFragment(shape3);

    // Find fragments with modality=2, depth=3, context=4
    const matches = atomSpace.findTensorFragmentsByShape({
      modality: 2,
      depth: 3,
      context: 4,
    });

    expect(matches).toHaveLength(2);
    expect(matches.some((f) => f.shape.salience === 5)).toBe(true);
    expect(matches.some((f) => f.shape.salience === 7)).toBe(true);
  });

  it('should serialize and deserialize tensor fragments', () => {
    const shape = TensorFragmentUtils.createShape(3, 4, 5, 2, 1);
    const fragment = atomSpace.createTensorFragment(shape);

    expect(fragment).toBeDefined();

    const serialized = atomSpace.serializeTensorFragment(fragment!.id);
    expect(serialized).toBeDefined();
    expect(typeof serialized).toBe('string');

    // Remove original
    expect(atomSpace.removeTensorFragment(fragment!.id)).toBe(true);
    expect(atomSpace.getTensorFragment(fragment!.id)).toBeUndefined();

    // Restore from serialization
    const restored = atomSpace.deserializeTensorFragment(serialized!);
    expect(restored).toBeDefined();
    expect(restored!.shape).toEqual(shape);
  });

  it('should include tensor fragments in statistics', () => {
    const shape1 = TensorFragmentUtils.createShape(2, 2, 2, 2, 2);
    const shape2 = TensorFragmentUtils.createShape(3, 3, 3, 3, 3);

    atomSpace.createTensorFragment(shape1);
    atomSpace.createTensorFragment(shape2);

    const stats = atomSpace.getStats();
    expect(stats.tensorFragments.count).toBe(2);
    expect(stats.tensorFragments.memoryUsage).toBeGreaterThan(0);
    expect(stats.tensorFragments.shapeDistribution).toBeDefined();
    expect(stats.tensorFragments.shapeDistribution['2x2x2x2x2']).toBe(1);
    expect(stats.tensorFragments.shapeDistribution['3x3x3x3x3']).toBe(1);
  });

  it('should handle realistic cognitive architecture scenarios', () => {
    // Vision modality with depth processing (smaller, more realistic)
    const visualShape = TensorFragmentUtils.createShape(
      3, // RGB modality
      5, // Moderate visual processing depth
      50, // Moderate visual context
      80, // High salience for vision
      15, // Moderate autonomy
    );

    // Audio modality with temporal processing
    const audioShape = TensorFragmentUtils.createShape(
      1, // Mono audio
      8, // Temporal depth
      50, // Audio context
      60, // Medium salience
      10, // Lower autonomy for audio processing
    );

    // Language modality with semantic processing (smaller)
    const languageShape = TensorFragmentUtils.createShape(
      1, // Text modality
      10, // Moderate semantic processing depth
      50, // Moderate linguistic context
      90, // Very high salience for language
      20, // High autonomy for language understanding
    );

    const visualFragment = atomSpace.createTensorFragment(visualShape);
    const audioFragment = atomSpace.createTensorFragment(audioShape);
    const languageFragment = atomSpace.createTensorFragment(languageShape);

    expect(visualFragment).toBeDefined();
    expect(audioFragment).toBeDefined();
    expect(languageFragment).toBeDefined();

    // Test finding fragments by cognitive characteristics
    const highSalienceFragments = atomSpace.findTensorFragmentsByShape({
      salience: 90,
    });

    expect(highSalienceFragments).toHaveLength(1);
    expect(highSalienceFragments[0].shape).toEqual(languageShape);

    const deepProcessingFragments = atomSpace.findTensorFragmentsByShape({
      depth: 10,
    });
    expect(deepProcessingFragments).toHaveLength(1);
    expect(deepProcessingFragments[0].shape).toEqual(languageShape);

    // Verify memory usage is reasonable
    const stats = atomSpace.getStats();
    expect(stats.tensorFragments.count).toBe(3);
    expect(stats.tensorFragments.memoryUsage).toBeGreaterThan(0);
  });
});
