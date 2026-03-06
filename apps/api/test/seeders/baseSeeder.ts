/**
 * Base Seeder Class
 * Abstract base class for all test data seeders
 */

export abstract class BaseSeeder {
  protected name: string = 'BaseSeeder';

  /**
   * Setup test data
   * Override in subclasses
   */
  async setup(): Promise<any> {
    throw new Error('setup() must be implemented in subclass');
  }

  /**
   * Cleanup test data
   * Override in subclasses
   */
  async teardown(): Promise<void> {
    throw new Error('teardown() must be implemented in subclass');
  }

  /**
   * Close database connections if needed
   * Override in subclasses
   */
  async close(): Promise<void> {
    // Default: no-op
  }

  /**
   * Reset all data
   */
  abstract reset(): Promise<void>;
}
