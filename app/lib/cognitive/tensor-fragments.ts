/**
 * Tensor Fragment Architecture Implementation
 * Phase 1.2: Encoding agent/state as hypergraph nodes/links with tensor shapes
 */

import type {
  TensorShape,
  TensorFragment,
  TensorFragmentConfig,
  TensorFragmentResult,
  TensorMetadata,
  SerializedTensorFragment,
  PrimeFactorizationMapping,
  PrimePartition,
  TensorPerformanceMetrics,
} from './types';

/**
 * Core class for tensor fragment operations
 * Provides validation, serialization, and prime factorization mapping
 */
export class TensorFragmentProcessor {
  private config: TensorFragmentConfig;
  private primeCache: Map<number, number[]> = new Map();

  constructor(config: Partial<TensorFragmentConfig> = {}) {
    this.config = {
      maxTensorSize: 1000000,
      enableCompression: true,
      enableValidation: true,
      defaultPrecision: 'float32',
      memoryAlignment: 32,
      ...config,
    };
  }

  /**
   * Create a new tensor fragment with the specified shape
   */
  createTensorFragment(shape: TensorShape, data?: Float32Array): TensorFragmentResult<TensorFragment> {
    const startTime = performance.now();

    try {
      // Validate tensor shape
      const validationResult = this.validateTensorShape(shape);

      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error,
          validationErrors: validationResult.validationErrors,
        };
      }

      // Calculate total size
      const totalSize = this.calculateTensorSize(shape);

      if (totalSize > this.config.maxTensorSize) {
        return {
          success: false,
          error: `Tensor size ${totalSize} exceeds maximum ${this.config.maxTensorSize}`,
        };
      }

      // Initialize data if not provided
      const tensorData = data || new Float32Array(totalSize);

      // Generate prime factorization
      const primeFactors = this.generatePrimeFactorization(totalSize);

      // Create metadata
      const metadata: TensorMetadata = {
        created: Date.now(),
        lastModified: Date.now(),
        version: '1.2.0',
        encoding: this.config.defaultPrecision,
        checksum: this.calculateChecksum(tensorData),
      };

      // Create tensor fragment
      const fragment: TensorFragment = {
        id: this.generateId(),
        shape,
        data: tensorData,
        primeFactors,
        metadata,
      };

      const endTime = performance.now();

      return {
        success: true,
        result: fragment,
        performanceMetrics: {
          operationTime: endTime - startTime,
          memoryUsed: tensorData.byteLength,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating tensor fragment',
      };
    }
  }

  /**
   * Validate tensor shape according to architecture requirements
   */
  validateTensorShape(shape: TensorShape): TensorFragmentResult<boolean> {
    const errors: string[] = [];

    // Check all dimensions are positive integers
    if (!Number.isInteger(shape.modality) || shape.modality <= 0) {
      errors.push('Modality dimension must be a positive integer');
    }

    if (!Number.isInteger(shape.depth) || shape.depth <= 0) {
      errors.push('Depth dimension must be a positive integer');
    }

    if (!Number.isInteger(shape.context) || shape.context <= 0) {
      errors.push('Context dimension must be a positive integer');
    }

    if (!Number.isInteger(shape.salience) || shape.salience <= 0) {
      errors.push('Salience dimension must be a positive integer');
    }

    if (!Number.isInteger(shape.autonomy_index) || shape.autonomy_index <= 0) {
      errors.push('Autonomy index dimension must be a positive integer');
    }

    // Check reasonable bounds for cognitive architecture
    if (shape.modality > 1000) {
      errors.push('Modality dimension exceeds reasonable bounds (max 1000)');
    }

    if (shape.depth > 100) {
      errors.push('Depth dimension exceeds reasonable bounds (max 100)');
    }

    if (shape.context > 10000) {
      errors.push('Context dimension exceeds reasonable bounds (max 10000)');
    }

    if (shape.salience > 1000) {
      errors.push('Salience dimension exceeds reasonable bounds (max 1000)');
    }

    if (shape.autonomy_index > 100) {
      errors.push('Autonomy index exceeds reasonable bounds (max 100)');
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: 'Tensor shape validation failed',
        validationErrors: errors,
      };
    }

    return { success: true, result: true };
  }

  /**
   * Serialize tensor fragment for storage/transmission
   */
  serializeTensorFragment(fragment: TensorFragment): TensorFragmentResult<string> {
    try {
      const startTime = performance.now();

      // Convert tensor data to base64
      const dataBase64 = this.arrayToBase64(fragment.data);

      const serialized: SerializedTensorFragment = {
        version: fragment.metadata.version,
        shape: fragment.shape,
        data: dataBase64,
        primeFactors: fragment.primeFactors,
        metadata: fragment.metadata,
      };

      const serializedString = JSON.stringify(serialized);
      const endTime = performance.now();

      return {
        success: true,
        result: serializedString,
        performanceMetrics: {
          operationTime: endTime - startTime,
          memoryUsed: serializedString.length * 2, // UTF-16 characters
          compressionRatio: fragment.data.byteLength / serializedString.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Serialization failed',
      };
    }
  }

  /**
   * Deserialize tensor fragment from string
   */
  deserializeTensorFragment(serializedData: string): TensorFragmentResult<TensorFragment> {
    try {
      const startTime = performance.now();

      const parsed: SerializedTensorFragment = JSON.parse(serializedData);

      // Validate version compatibility
      if (!this.isVersionCompatible(parsed.version)) {
        return {
          success: false,
          error: `Incompatible version: ${parsed.version}`,
        };
      }

      // Convert base64 back to Float32Array
      const data = this.base64ToArray(parsed.data);

      // Validate checksum if present
      if (parsed.metadata.checksum) {
        const computedChecksum = this.calculateChecksum(data);

        if (computedChecksum !== parsed.metadata.checksum) {
          return {
            success: false,
            error: 'Checksum validation failed - data may be corrupted',
          };
        }
      }

      const fragment: TensorFragment = {
        id: this.generateId(), // Generate new ID for deserialized fragment
        shape: parsed.shape,
        data,
        primeFactors: parsed.primeFactors,
        metadata: {
          ...parsed.metadata,
          lastModified: Date.now(),
        },
      };

      const endTime = performance.now();

      return {
        success: true,
        result: fragment,
        performanceMetrics: {
          operationTime: endTime - startTime,
          memoryUsed: data.byteLength,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deserialization failed',
      };
    }
  }

  /**
   * Generate prime factorization mapping for distributed processing
   */
  generatePrimeFactorizationMapping(
    tensorSize: number,
    strategy: 'row-wise' | 'column-wise' | 'block-wise' = 'block-wise',
  ): PrimeFactorizationMapping {
    const factors = this.generatePrimeFactorization(tensorSize);
    const partitions: PrimePartition[] = [];

    let currentIndex = 0;

    for (const factor of factors) {
      const partitionSize = Math.floor(tensorSize / factor);
      partitions.push({
        factor,
        startIndex: currentIndex,
        endIndex: currentIndex + partitionSize - 1,
      });
      currentIndex += partitionSize;
    }

    return {
      originalSize: tensorSize,
      factors,
      distributionStrategy: strategy,
      partitions,
    };
  }

  /**
   * Calculate total tensor size from shape
   */
  private calculateTensorSize(shape: TensorShape): number {
    return shape.modality * shape.depth * shape.context * shape.salience * shape.autonomy_index;
  }

  /**
   * Generate prime factorization of a number
   */
  private generatePrimeFactorization(n: number): number[] {
    if (this.primeCache.has(n)) {
      return this.primeCache.get(n)!;
    }

    const factors: number[] = [];
    let remaining = n;

    // Handle factor 2
    while (remaining % 2 === 0) {
      factors.push(2);
      remaining = remaining / 2;
    }

    // Handle odd factors
    for (let i = 3; i * i <= remaining; i += 2) {
      while (remaining % i === 0) {
        factors.push(i);
        remaining = remaining / i;
      }
    }

    // If remaining is a prime greater than 2
    if (remaining > 2) {
      factors.push(remaining);
    }

    this.primeCache.set(n, factors);

    return factors;
  }

  /**
   * Generate unique identifier for tensor fragment
   */
  private generateId(): string {
    return `tensor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: Float32Array): string {
    let hash = 0;

    for (let i = 0; i < data.length; i++) {
      // Use a simple but consistent hash that handles float values properly
      const intValue = Math.floor(data[i] * 1000000); // Scale to handle small float values
      hash = (hash << 5) - hash + intValue;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Convert Float32Array to base64 string
   */
  private arrayToBase64(array: Float32Array): string {
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    let binary = '';
    const chunkSize = 0x8000; // 32KB chunks to avoid call stack overflow

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }

    return btoa(binary);
  }

  /**
   * Convert base64 string to Float32Array
   */
  private base64ToArray(base64: string): Float32Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Float32Array(bytes.buffer);
  }

  /**
   * Check version compatibility
   */
  private isVersionCompatible(version: string): boolean {
    const currentVersion = '1.2.0';
    return version === currentVersion || version.startsWith('1.2.');
  }
}

/**
 * Utility functions for tensor fragment operations
 */
export class TensorFragmentUtils {
  /**
   * Create a tensor shape from array dimensions
   */
  static createShape(
    modality: number,
    depth: number,
    context: number,
    salience: number,
    autonomy_index: number,
  ): TensorShape {
    return { modality, depth, context, salience, autonomy_index };
  }

  /**
   * Compare two tensor shapes for equality
   */
  static shapesEqual(shape1: TensorShape, shape2: TensorShape): boolean {
    return (
      shape1.modality === shape2.modality &&
      shape1.depth === shape2.depth &&
      shape1.context === shape2.context &&
      shape1.salience === shape2.salience &&
      shape1.autonomy_index === shape2.autonomy_index
    );
  }

  /**
   * Calculate memory footprint of tensor shape
   */
  static calculateMemoryFootprint(shape: TensorShape, precision: 'float32' | 'int8' | 'int16' = 'float32'): number {
    const totalElements = shape.modality * shape.depth * shape.context * shape.salience * shape.autonomy_index;
    const bytesPerElement = precision === 'float32' ? 4 : precision === 'int16' ? 2 : 1;

    return totalElements * bytesPerElement;
  }

  /**
   * Generate human-readable description of tensor shape
   */
  static describeShape(shape: TensorShape): string {
    return `TensorShape[modality=${shape.modality}, depth=${shape.depth}, context=${shape.context}, salience=${shape.salience}, autonomy_index=${shape.autonomy_index}]`;
  }
}
