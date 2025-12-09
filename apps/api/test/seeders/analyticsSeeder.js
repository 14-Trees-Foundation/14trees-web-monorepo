const BaseSeeder = require('./baseSeeder');

class AnalyticsSeeder extends BaseSeeder {
  constructor() {
    super();
    this.testData = null;
  }

  async setup() {
    console.log('🌱 Setting up analytics test data...');
    
    // Create test data for analytics endpoints with unique identifiers
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 5);
    
    const users = await this.seedUsers([
      {
        name: 'Analytics User 1',
        email: `analytics1_${timestamp}_${randomSuffix}@test.com`,
        phone: '+1234567890'
      },
      {
        name: 'Analytics User 2', 
        email: `analytics2_${timestamp}_${randomSuffix}@test.com`,
        phone: '+1234567891'
      }
    ]);

    const plantTypes = await this.seedPlantTypes([
      {
        name: 'Analytics Tree Type 1',
        scientific_name: 'Analyticus testicus',
        image: '/images/analytics1.jpg',
        tree_type: 'deciduous'
      },
      {
        name: 'Analytics Tree Type 2',
        scientific_name: 'Analyticus secondus', 
        image: '/images/analytics2.jpg',
        tree_type: 'evergreen'
      }
    ]);

    const sites = await this.seedSites([
      {
        name: 'Analytics Site 1',
        district: 'Test District 1',
        taluka: 'Test Taluka 1',
        village: 'Test Village 1',
        land_type: 'forest'
      },
      {
        name: 'Analytics Site 2',
        district: 'Test District 2', 
        taluka: 'Test Taluka 2',
        village: 'Test Village 2',
        land_type: 'farmland'
      }
    ]);

    const plots = await this.seedPlots([
      {
        name: 'Analytics Plot 1',
        boundary: 'POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))',
        area: 100.50,
        site_id: sites[0].id
      },
      {
        name: 'Analytics Plot 2',
        boundary: 'POLYGON((2 0, 3 0, 3 1, 2 1, 2 0))',
        area: 200.75,
        site_id: sites[1].id
      }
    ]);

    const ponds = await this.seedPonds([
      {
        name: 'Analytics Pond 1',
        depth: 5.5,
        boundary: 'POLYGON((10 10, 11 10, 11 11, 10 11, 10 10))'
      },
      {
        name: 'Analytics Pond 2',
        depth: 8.2,
        boundary: 'POLYGON((12 12, 13 12, 13 13, 12 13, 12 12))'
      }
    ]);

    const trees = await this.seedTrees([
      {
        sapling_id: 'ANALYTICS_TREE_001',
        plant_type_id: plantTypes[0].id,
        user_id: users[0].id,
        plot_id: plots[0].id,
        planted_date: '2023-01-15',
        assigned_to: users[0].id,
        mapped_to_user: users[0].id
      },
      {
        sapling_id: 'ANALYTICS_TREE_002',
        plant_type_id: plantTypes[1].id,
        user_id: users[1].id,
        plot_id: plots[1].id,
        planted_date: '2023-02-20',
        assigned_to: users[1].id,
        mapped_to_user: null  // Assigned but not booked
      },
      {
        sapling_id: 'ANALYTICS_TREE_003',
        plant_type_id: plantTypes[0].id,
        user_id: users[0].id,
        plot_id: plots[0].id,
        planted_date: '2023-03-10',
        assigned_to: null,  // Not assigned
        mapped_to_user: users[1].id  // Booked but not assigned
      }
    ]);

    const onsiteStaffs = await this.seedOnsiteStaffs([
      {
        _id: `analytics_staff_001_${timestamp}_${randomSuffix}`,
        name: 'Analytics Staff 1',
        user_id: users[0].id,
        phone: '+1234567890',
        email: `staff1_${timestamp}_${randomSuffix}@14trees.com`,
        image: 'staff1.jpg',
        role: 'supervisor',
        permissions: { canEdit: true, canDelete: false },
        dob: '1990-05-15'
      },
      {
        _id: `analytics_staff_002_${timestamp}_${randomSuffix}`,
        name: 'Analytics Staff 2',
        user_id: users[1].id,
        phone: '+1234567891',
        email: `staff2_${timestamp}_${randomSuffix}@14trees.com`,
        image: 'staff2.jpg',
        role: 'coordinator',
        permissions: { canEdit: true, canDelete: true },
        dob: '1988-08-22'
      }
    ]);

    const giftCards = await this.seedGiftCards([
      {
        type: 'personal',
        status: 'active'
      },
      {
        type: 'corporate',
        status: 'active'
      },
      {
        type: 'personal',
        status: 'used'
      }
    ]);

    this.testData = {
      users,
      plantTypes,
      sites,
      plots,
      ponds,
      trees,
      onsiteStaffs,
      giftCards
    };

    console.log('✅ Analytics test data created:');
    return this.testData;
  }

  async teardown() {
    console.log('🧹 Cleaning up analytics test data...');
    await this.cleanup();
    this.testData = null;
    console.log('✅ Analytics test data cleanup completed');
  }

  getTestData() {
    return this.testData;
  }
}

module.exports = AnalyticsSeeder;