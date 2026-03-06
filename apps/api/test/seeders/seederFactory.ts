/**
 * Seeder Factory
 * Factory pattern for instantiating and managing seeders
 */

import { BaseSeeder } from './baseSeeder';

export interface SeederFactory {
  create(seederName: string): BaseSeeder;
  list(): string[];
}

/**
 * Default seeder factory implementation
 * Register new seeders here
 */
export class DefaultSeederFactory implements SeederFactory {
  private seeders: Map<string, new () => BaseSeeder> = new Map();

  constructor() {
    // Register seeders here as they are implemented
    // this.seeders.set('user', UserSeeder);
    // this.seeders.set('tree', TreeSeeder);
    // this.seeders.set('pageVisits', PageVisitsSeeder);
  }

  create(seederName: string): BaseSeeder {
    const SeederClass = this.seeders.get(seederName);
    if (!SeederClass) {
      throw new Error(`Seeder "${seederName}" not found. Available: ${this.list().join(', ')}`);
    }
    return new SeederClass();
  }

  list(): string[] {
    return Array.from(this.seeders.keys());
  }

  register(name: string, SeederClass: new () => BaseSeeder): void {
    this.seeders.set(name, SeederClass);
  }
}

// Export singleton instance
export const seederFactory = new DefaultSeederFactory();
