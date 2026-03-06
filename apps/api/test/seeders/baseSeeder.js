const { Pool } = require('pg');
require('dotenv').config({ path: '.env.test' });

class BaseSeeder {
  constructor() {
    this.pool = new Pool({
      user: process.env.POSTGRES_USER || 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB || '14trees_test',
      password: process.env.POSTGRES_PASSWORD || '',
      port: process.env.POSTGRES_PORT || 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    this.createdIds = {
      users: [],
      plantTypes: [],
      plots: [],
      ponds: [],
      trees: [],
      onsiteStaffs: [],
      sites: [],
      giftCards: []
    };
  }

  async executeQuery(query, values = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(query, values);
      return result;
    } finally {
      client.release();
    }
  }

  async seedUsers(users) {
    const createdUsers = [];
    for (const user of users) {
      const query = `
        INSERT INTO users (name, email, phone, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id
      `;
      const result = await this.executeQuery(query, [user.name, user.email, user.phone]);
      const userId = result.rows[0].id;
      this.createdIds.users.push(userId);
      createdUsers.push({ ...user, id: userId });
    }
    return createdUsers;
  }

  async seedPlantTypes(plantTypes) {
    const createdPlantTypes = [];
    for (const plantType of plantTypes) {
      const query = `
        INSERT INTO plant_types (name, scientific_name, image, tree_type, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id
      `;
      const result = await this.executeQuery(query, [
        plantType.name, 
        plantType.scientific_name, 
        plantType.image, 
        plantType.tree_type
      ]);
      const plantTypeId = result.rows[0].id;
      this.createdIds.plantTypes.push(plantTypeId);
      createdPlantTypes.push({ ...plantType, id: plantTypeId });
    }
    return createdPlantTypes;
  }

  async seedPlots(plots) {
    const createdPlots = [];
    for (const plot of plots) {
      const query = `
        INSERT INTO plots (name, boundary, area, site_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id
      `;
      const result = await this.executeQuery(query, [
        plot.name,
        plot.boundary,
        plot.area,
        plot.site_id || null
      ]);
      const plotId = result.rows[0].id;
      this.createdIds.plots.push(plotId);
      createdPlots.push({ ...plot, id: plotId });
    }
    return createdPlots;
  }

  async seedPonds(ponds) {
    const createdPonds = [];
    for (const pond of ponds) {
      const query = `
        INSERT INTO ponds (name, depth, boundary, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id
      `;
      const result = await this.executeQuery(query, [pond.name, pond.depth, pond.boundary]);
      const pondId = result.rows[0].id;
      this.createdIds.ponds.push(pondId);
      createdPonds.push({ ...pond, id: pondId });
    }
    return createdPonds;
  }

  async seedTrees(trees) {
    const createdTrees = [];
    for (const tree of trees) {
      const query = `
        INSERT INTO trees (sapling_id, plant_type_id, plot_id, assigned_to, mapped_to_user, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id
      `;
      const result = await this.executeQuery(query, [
        tree.sapling_id,
        tree.plant_type_id,
        tree.plot_id,
        tree.assigned_to || null,
        tree.mapped_to_user || tree.user_id || null
      ]);
      const treeId = result.rows[0].id;
      this.createdIds.trees.push(treeId);
      createdTrees.push({ ...tree, id: treeId });
    }
    return createdTrees;
  }

  async seedSites(sites) {
    const createdSites = [];
    for (const site of sites) {
      const query = `
        INSERT INTO sites (name, district, taluka, village, land_type, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id
      `;
      const result = await this.executeQuery(query, [
        site.name,
        site.district,
        site.taluka,
        site.village,
        site.land_type
      ]);
      const siteId = result.rows[0].id;
      this.createdIds.sites.push(siteId);
      createdSites.push({ ...site, id: siteId });
    }
    return createdSites;
  }

  async seedGiftCards(giftCards) {
    const createdGiftCards = [];
    for (const giftCard of giftCards) {
      const query = `
        INSERT INTO gift_cards (type, status, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING id
      `;
      const result = await this.executeQuery(query, [
        giftCard.type,
        giftCard.status
      ]);
      const giftCardId = result.rows[0].id;
      this.createdIds.giftCards.push(giftCardId);
      createdGiftCards.push({ ...giftCard, id: giftCardId });
    }
    return createdGiftCards;
  }

  async seedOnsiteStaffs(staffs) {
    const createdStaffs = [];
    for (const staff of staffs) {
      const query = `
        INSERT INTO onsitestaffs (_id, id, name, user_id, phone, email, image, role, permissions, date_added, dob, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, NOW(), NOW())
        RETURNING _id
      `;
      const result = await this.executeQuery(query, [
        staff._id || 'staff_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        staff.id || staff._id,
        staff.name,
        staff.user_id,
        staff.phone,
        staff.email,
        staff.image,
        staff.role,
        staff.permissions ? JSON.stringify(staff.permissions) : null,
        staff.dob
      ]);
      const staffId = result.rows[0]._id;
      this.createdIds.onsiteStaffs.push(staffId);
      createdStaffs.push({ ...staff, _id: staffId });
    }
    return createdStaffs;
  }

  async cleanup() {
    console.log('🧹 Cleaning up seeded data...');
    
    // Clean in reverse order of dependencies
    if (this.createdIds.trees && this.createdIds.trees.length > 0) {
      await this.executeQuery(
        `DELETE FROM trees WHERE id = ANY($1)`,
        [this.createdIds.trees]
      );
    }

    if (this.createdIds.onsiteStaffs && this.createdIds.onsiteStaffs.length > 0) {
      await this.executeQuery(
        `DELETE FROM onsitestaffs WHERE _id = ANY($1)`,
        [this.createdIds.onsiteStaffs]
      );
    }

    if (this.createdIds.giftCards && this.createdIds.giftCards.length > 0) {
      await this.executeQuery(
        `DELETE FROM gift_cards WHERE id = ANY($1)`,
        [this.createdIds.giftCards]
      );
    }

    if (this.createdIds.ponds && this.createdIds.ponds.length > 0) {
      await this.executeQuery(
        `DELETE FROM ponds WHERE id = ANY($1)`,
        [this.createdIds.ponds]
      );
    }

    if (this.createdIds.plots && this.createdIds.plots.length > 0) {
      await this.executeQuery(
        `DELETE FROM plots WHERE id = ANY($1)`,
        [this.createdIds.plots]
      );
    }

    if (this.createdIds.users && this.createdIds.users.length > 0) {
      await this.executeQuery(
        `DELETE FROM users WHERE id = ANY($1)`,
        [this.createdIds.users]
      );
    }

    if (this.createdIds.plantTypes && this.createdIds.plantTypes.length > 0) {
      await this.executeQuery(
        `DELETE FROM plant_types WHERE id = ANY($1)`,
        [this.createdIds.plantTypes]
      );
    }

    if (this.createdIds.sites && this.createdIds.sites.length > 0) {
      await this.executeQuery(
        `DELETE FROM sites WHERE id = ANY($1)`,
        [this.createdIds.sites]
      );
    }

    // Reset tracking
    this.createdIds = {
      users: [],
      plantTypes: [],
      plots: [],
      ponds: [],
      trees: [],
      onsiteStaffs: [],
      sites: [],
      giftCards: []
    };
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = BaseSeeder;