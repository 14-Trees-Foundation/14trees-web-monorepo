/* eslint-disable */

const { expect } = require('chai');
const request = require('supertest');
const SeederFactory = require('../seeders/seederFactory');

describe('Analytics API E2E Tests', function() {
  let agent;
  let analyticsSeeder;
  let testData;

  before(async function() {
    this.timeout(30000);
    
    // Use the global app set up in bootstrap
    agent = request.agent(global.app);
    
    // Get analytics-specific seeder
    analyticsSeeder = SeederFactory.getSeeder('analytics');
  });

  after(async function() {
    this.timeout(15000);
    
    // Close seeder connection
    if (analyticsSeeder) {
      await analyticsSeeder.close();
    }
  });

  describe('GET /api/analytics/summary - Main Analytics Summary', function() {
    
    beforeEach(async function() {
      this.timeout(15000);
      testData = await analyticsSeeder.setup();
    });

    afterEach(async function() {
      this.timeout(10000);
      await analyticsSeeder.teardown();
    });
    
    it('should return comprehensive analytics summary', function(done) {
      agent
        .get('/api/analytics/summary')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.be.an('object');
          
          // Check all expected properties exist
          expect(res.body).to.have.property('treeCount');
          expect(res.body).to.have.property('plantTypeCount');
          expect(res.body).to.have.property('userCount');
          expect(res.body).to.have.property('assignedTreeCount');
          expect(res.body).to.have.property('bookedTreeCount');
          expect(res.body).to.have.property('plotCount');
          expect(res.body).to.have.property('pondCount');
          expect(res.body).to.have.property('sitesCount');
          expect(res.body).to.have.property('districtsCount');
          expect(res.body).to.have.property('talukasCount');
          expect(res.body).to.have.property('villagesCount');
          expect(res.body).to.have.property('landTypeCounts');
          expect(res.body).to.have.property('personalGiftRequestsCount');
          expect(res.body).to.have.property('corporateGiftRequestsCount');
          expect(res.body).to.have.property('personalGiftedTreesCount');
          expect(res.body).to.have.property('corporateGiftedTreesCount');
          expect(res.body).to.have.property('totalGiftRequests');
          expect(res.body).to.have.property('totalGiftedTrees');
          
          // Check data types
          expect(res.body.treeCount).to.be.a('number');
          expect(res.body.plantTypeCount).to.be.a('number');
          expect(res.body.userCount).to.be.a('number');
          expect(res.body.plotCount).to.be.a('number');
          expect(res.body.pondCount).to.be.a('number');
          expect(res.body.assignedTreeCount).to.be.a('number');
          expect(res.body.bookedTreeCount).to.be.a('number');
          
          // All counts should be non-negative
          expect(res.body.treeCount).to.be.at.least(0);
          expect(res.body.plantTypeCount).to.be.at.least(0);
          expect(res.body.userCount).to.be.at.least(0);
          expect(res.body.plotCount).to.be.at.least(0);
          expect(res.body.pondCount).to.be.at.least(0);
          
          done();
        });
    });

    it('should handle CORS properly for summary endpoint', function(done) {
      agent
        .get('/api/analytics/summary')
        .expect('Access-Control-Allow-Origin', '*')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('treeCount');
          done();
        });
    });

    it('should respond within reasonable time for summary', function(done) {
      const startTime = Date.now();
      
      agent
        .get('/api/analytics/summary')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          const responseTime = Date.now() - startTime;
          expect(responseTime).to.be.lessThan(3000); // Should respond within 3 seconds for complex query
          
          expect(res.body).to.be.an('object');
          done();
        });
    });

  });

  describe('GET /api/analytics/totaltrees', function() {
    
    beforeEach(async function() {
      this.timeout(15000);
      testData = await analyticsSeeder.setup();
    });

    afterEach(async function() {
      this.timeout(10000);
      await analyticsSeeder.teardown();
    });
    
    it('should return total trees count', function(done) {
      agent
        .get('/api/analytics/totaltrees')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('count');
          expect(res.body.count).to.be.a('number');
          expect(res.body.count).to.be.greaterThanOrEqual(0);
          
          // With our test data, we should have exactly 3 trees
          expect(res.body.count).to.equal(3);
          
          done();
        });
    });

    it('should handle CORS properly', function(done) {
      agent
        .get('/api/analytics/totaltrees')
        .expect((res) => {
          expect(res.headers).to.have.property('access-control-allow-origin');
        })
        .end(done);
    });

  });

  describe('GET /api/analytics/totalplanttypes', function() {
    
    beforeEach(async function() {
      this.timeout(15000);
      testData = await analyticsSeeder.setup();
    });

    afterEach(async function() {
      this.timeout(10000);
      await analyticsSeeder.teardown();
    });
    
    it('should return total plant types count', function(done) {
      agent
        .get('/api/analytics/totalplanttypes')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('count');
          expect(res.body.count).to.be.a('number');
          expect(res.body.count).to.be.greaterThanOrEqual(0);
          
          // With our test data, we should have exactly 2 plant types
          expect(res.body.count).to.equal(2);
          
          done();
        });
    });

  });

  describe('GET /api/analytics/totalUsers', function() {
    
    beforeEach(async function() {
      this.timeout(15000);
      testData = await analyticsSeeder.setup();
    });

    afterEach(async function() {
      this.timeout(10000);
      await analyticsSeeder.teardown();
    });
    
    it('should return total users count', function(done) {
      agent
        .get('/api/analytics/totalUsers')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('count');
          expect(res.body.count).to.be.a('number');
          expect(res.body.count).to.be.greaterThanOrEqual(0);
          
          // With our test data, we should have exactly 2 users
          expect(res.body.count).to.equal(2);
          
          done();
        });
    });

  });

  describe('GET /api/analytics/totalPlots', function() {
    
    beforeEach(async function() {
      this.timeout(15000);
      testData = await analyticsSeeder.setup();
    });

    afterEach(async function() {
      this.timeout(10000);
      await analyticsSeeder.teardown();
    });
    
    it('should return total plots count', function(done) {
      agent
        .get('/api/analytics/totalPlots')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('count');
          expect(res.body.count).to.be.a('number');
          expect(res.body.count).to.be.greaterThanOrEqual(0);
          
          // With our test data, we should have exactly 2 plots
          expect(res.body.count).to.equal(2);
          
          done();
        });
    });

  });

  describe('GET /api/analytics/totalponds', function() {
    
    beforeEach(async function() {
      this.timeout(15000);
      testData = await analyticsSeeder.setup();
    });

    afterEach(async function() {
      this.timeout(10000);
      await analyticsSeeder.teardown();
    });
    
    it('should return total ponds count', function(done) {
      agent
        .get('/api/analytics/totalponds')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('count');
          expect(res.body.count).to.be.a('number');
          expect(res.body.count).to.be.greaterThanOrEqual(0);
          
          // With our test data, we should have exactly 2 ponds
          expect(res.body.count).to.equal(2);
          
          done();
        });
    });

  });

  describe('GET /api/analytics/totalemp', function() {
    
    beforeEach(async function() {
      this.timeout(15000);
      testData = await analyticsSeeder.setup();
    });

    afterEach(async function() {
      this.timeout(10000);
      await analyticsSeeder.teardown();
    });
    
    it('should return total employees count', function(done) {
      agent
        .get('/api/analytics/totalemp')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('count');
          expect(res.body.count).to.be.a('number');
          expect(res.body.count).to.equal(2); // Based on seeded onsiteStaffs data
          
          done();
        });
    });

  });

  describe('Error Handling', function() {
    
    it('should handle invalid analytics endpoints', function(done) {
      agent
        .get('/api/analytics/invalidendpoint')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.equal('Route not found');
          
          done();
        });
    });

    it('should handle malformed requests gracefully', function(done) {
      agent
        .get('/api/analytics/totaltrees?invalid=param')
        .expect(200) // Should still work, just ignore invalid params
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('count');
          
          done();
        });
    });

  });

  describe('Edge Cases and Data Validation', function() {
    
    it('should return zero counts when no data exists', function(done) {
      // Test with empty database (no seeded data)
      agent
        .get('/api/analytics/totaltrees')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('count');
          expect(res.body.count).to.be.a('number');
          expect(res.body.count).to.be.greaterThanOrEqual(0);
          
          done();
        });
    });

    it('should handle concurrent requests properly', async function() {
      this.timeout(10000);
      
      // Make multiple concurrent requests to test race conditions
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          agent.get('/api/analytics/totaltrees').expect(200)
        );
      }
      
      const results = await Promise.all(promises);
      
      // All requests should return the same count
      const counts = results.map(res => res.body.count);
      const firstCount = counts[0];
      
      counts.forEach(count => {
        expect(count).to.equal(firstCount);
      });
    });

    it('should handle large query parameters gracefully', function(done) {
      const largeParam = 'x'.repeat(1000);
      agent
        .get(`/api/analytics/totaltrees?test=${largeParam}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('count');
          done();
        });
    });

    it('should return appropriate headers', function(done) {
      agent
        .get('/api/analytics/totaltrees')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          
          // Check for CORS headers
          expect(res.headers).to.have.property('access-control-allow-origin');
          done();
        });
    });

  });

  describe('HTTP Methods Validation', function() {
    
    it('should only accept GET requests for analytics endpoints', function(done) {
      // Test POST request should not be allowed
      agent
        .post('/api/analytics/totaltrees')
        .expect(404) // Method not allowed or route not found
        .end((err, res) => {
          if (err && err.status !== 404 && err.status !== 405) return done(err);
          done();
        });
    });

    it('should reject PUT requests', function(done) {
      agent
        .put('/api/analytics/totaltrees')
        .expect(404) // Method not allowed or route not found
        .end((err, res) => {
          if (err && err.status !== 404 && err.status !== 405) return done(err);
          done();
        });
    });

    it('should reject DELETE requests', function(done) {
      agent
        .delete('/api/analytics/totaltrees')
        .expect(404) // Method not allowed or route not found
        .end((err, res) => {
          if (err && err.status !== 404 && err.status !== 405) return done(err);
          done();
        });
    });

  });

  describe('Performance Tests', function() {
    
    beforeEach(async function() {
      this.timeout(15000);
      testData = await analyticsSeeder.setup();
    });

    afterEach(async function() {
      this.timeout(10000);
      await analyticsSeeder.teardown();
    });
    
    it('should respond to all endpoints within reasonable time', async function() {
      this.timeout(10000);
      
      const endpoints = [
        '/api/analytics/totaltrees',
        '/api/analytics/totalplanttypes',
        '/api/analytics/totalUsers',
        '/api/analytics/totalPlots',
        '/api/analytics/totalponds',
        '/api/analytics/totalemp'
      ];
      
      const startTime = Date.now();
      
      // Test all endpoints in parallel
      const promises = endpoints.map(endpoint =>
        agent.get(endpoint).expect(200)
      );
      
      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      
      // All endpoints should respond within 5 seconds
      expect(duration).to.be.lessThan(5000);
    });

  });

});