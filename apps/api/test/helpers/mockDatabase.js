// Mock PostgreSQL connection for tests
const sinon = require('sinon');
const path = require('path');

// Mock sequelize entirely to prevent any connection attempts
const mockSequelizeInstance = {
  authenticate: sinon.stub().resolves(),
  close: sinon.stub().resolves(),
  query: sinon.stub().resolves({ rows: [] }),
  transaction: sinon.stub().resolves({
    commit: sinon.stub().resolves(),
    rollback: sinon.stub().resolves()
  }),
  addModels: sinon.stub(),
  sync: sinon.stub().resolves(),
  define: sinon.stub().returns({
    findAll: sinon.stub().resolves([]),
    findOne: sinon.stub().resolves(null),
    create: sinon.stub().resolves({}),
    update: sinon.stub().resolves([1]),
    destroy: sinon.stub().resolves(1)
  })
};

// Mock Sequelize constructor to return our mock instance
const MockSequelize = function() {
  return mockSequelizeInstance;
};
MockSequelize.prototype = mockSequelizeInstance;

// Mock the database config to prevent connection attempts during tests
const mockDatabase = {
  authenticate: sinon.stub().resolves(),
  close: sinon.stub().resolves(),
  query: sinon.stub().resolves([]),
  transaction: sinon.stub().resolves({
    commit: sinon.stub().resolves(),
    rollback: sinon.stub().resolves()
  })
};

// Mock the sequelize connection before any imports
const mockSequelize = () => {
  try {
    // Clear require cache for sequelize modules
    const sequelizePath = require.resolve('sequelize');
    const sequelizeTypescriptPath = require.resolve('sequelize-typescript');
    delete require.cache[sequelizePath];
    delete require.cache[sequelizeTypescriptPath];
    
    // Mock sequelize-typescript
    require.cache[sequelizeTypescriptPath] = {
      exports: {
        Sequelize: MockSequelize,
        __esModule: true,
        default: MockSequelize
      }
    };
    
    // Mock regular sequelize
    require.cache[sequelizePath] = {
      exports: {
        Sequelize: MockSequelize,
        __esModule: true,
        default: MockSequelize
      }
    };
    
    console.log("🔧 Sequelize mocked to prevent database connections");
    
    // Also try to mock the actual database config if it exists
    try {
      const dbConfigPath = path.resolve(__dirname, '../../src/config/postgreDB');
      delete require.cache[dbConfigPath + '.ts'];
      delete require.cache[dbConfigPath + '.js'];
      
      // Mock the database module
      require.cache[dbConfigPath] = {
        exports: {
          sequelize: mockSequelizeInstance,
          __esModule: true,
          default: mockSequelizeInstance
        }
      };
    } catch (dbError) {
      console.log("ℹ️  Database config not found or already mocked");
    }
    
  } catch (error) {
    console.warn("⚠️  Could not mock Sequelize:", error.message);
  }
};

module.exports = { mockSequelize, mockDatabase, mockSequelizeInstance };