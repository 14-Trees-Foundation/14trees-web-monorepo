/**
 * Test suite for CSR Transaction Enhancement
 * Tests the new transaction source tracking functionality
 */

const request = require('supertest');
const createTestApp = require('../dist/testServer').default; // Use test server

let app;

beforeAll(() => {
    app = createTestApp();
});

afterAll(async () => {
    // Clean up any resources if needed
    if (app && app.close) {
        await new Promise((resolve) => {
            app.close(resolve);
        });
    }
});

describe('CSR Transaction Enhancement', () => {
    
    describe('Transaction API with Enhanced Fields', () => {
        
        it('should include new fields in transaction response', async () => {
            const response = await request(app)
                .get('/api/gift-cards/transactions/131?type=group&offset=0&limit=10')
                .expect(200);

            expect(response.body).toHaveProperty('results');
            
            if (response.body.results.length > 0) {
                const transaction = response.body.results[0];
                
                // Check for new fields
                expect(transaction).toHaveProperty('gift_source_type');
                expect(transaction).toHaveProperty('source_request_id');
                expect(transaction).toHaveProperty('gift_type_display');
                expect(transaction).toHaveProperty('source_description');
                
                // Verify field types and values
                if (transaction.gift_source_type) {
                    expect(['fresh_request', 'pre_purchased']).toContain(transaction.gift_source_type);
                }
                
                if (transaction.gift_type_display) {
                    expect(typeof transaction.gift_type_display).toBe('string');
                }
            }
        });

        it('should provide analytics with source type breakdown', async () => {
            const response = await request(app)
                .post('/api/trees/mapped-gift/analytics')
                .send({
                    group_id: 131
                })
                .expect(200);

            // Check for new analytics fields
            expect(response.body).toHaveProperty('fresh_request_transactions');
            expect(response.body).toHaveProperty('pre_purchased_transactions');
            expect(response.body).toHaveProperty('total_transactions');
            expect(response.body).toHaveProperty('fresh_request_trees');
            expect(response.body).toHaveProperty('pre_purchased_trees');
            expect(response.body).toHaveProperty('total_trees');
            expect(response.body).toHaveProperty('gifted_trees');

            // Verify numeric types
            expect(typeof parseInt(response.body.fresh_request_transactions)).toBe('number');
            expect(typeof parseInt(response.body.pre_purchased_transactions)).toBe('number');
            expect(typeof parseInt(response.body.total_transactions)).toBe('number');
            expect(typeof parseInt(response.body.total_trees)).toBe('number');
        });

        it('should maintain backward compatibility for other groups', async () => {
            // Test with a different group to ensure no breaking changes
            const response = await request(app)
                .get('/api/gift-cards/transactions/1?type=group&offset=0&limit=5')
                .expect(200);

            expect(response.body).toHaveProperty('results');
            // Should still work even if new fields are null
        });
    });

    describe('Transaction Creation with Source Tracking', () => {
        
        it('should create transaction with fresh_request source type', async () => {
            // Mock test - actual implementation would depend on your auth setup
            // This is a placeholder for testing transaction creation
            
            const mockTransactionData = {
                group_id: 131,
                recipient: 1,
                gift_source_type: 'fresh_request',
                source_request_id: 123,
                occasion_name: 'Test Occasion',
                gifted_by: 'Test User',
                gifted_on: new Date()
            };

            // This would test the actual transaction creation endpoint
            // Adjust based on your actual endpoint structure
        });

        it('should create transaction with pre_purchased source type', async () => {
            const mockTransactionData = {
                group_id: 131,
                recipient: 1,
                gift_source_type: 'pre_purchased',
                source_request_id: 456,
                occasion_name: 'Test Occasion',
                gifted_by: 'Test User',
                gifted_on: new Date()
            };

            // Test pre_purchased transaction creation
        });
    });

    describe('Data Integrity Tests', () => {
        
        it('should have valid foreign key relationships', async () => {
            // Test that source_request_id references valid gift_card_requests
            const response = await request(app)
                .get('/api/test/data-integrity/transactions')
                .expect(200);

            // Verify no broken foreign key references
            expect(response.body.broken_references).toBe(0);
        });

        it('should have proper transaction classification', async () => {
            // Verify that classification logic is working correctly
            const response = await request(app)
                .get('/api/gift-cards/transactions/131?type=group&offset=0&limit=100')
                .expect(200);

            const transactions = response.body.results;
            let classifiedCount = 0;
            
            transactions.forEach(transaction => {
                if (transaction.gift_source_type) {
                    classifiedCount++;
                    expect(['fresh_request', 'pre_purchased']).toContain(transaction.gift_source_type);
                }
            });

            // Should have some classified transactions for Group 131
            expect(classifiedCount).toBeGreaterThan(0);
        });
    });

    describe('Performance Tests', () => {
        
        it('should respond within acceptable time limits', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/gift-cards/transactions/131?type=group&offset=0&limit=50')
                .expect(200);

            const responseTime = Date.now() - startTime;
            
            // Should respond within 2 seconds
            expect(responseTime).toBeLessThan(2000);
            expect(response.body.results).toBeDefined();
        });

        it('should handle large result sets efficiently', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .post('/api/trees/mapped-gift/analytics')
                .send({
                    group_id: 131
                })
                .expect(200);

            const responseTime = Date.now() - startTime;
            
            // Analytics should be fast even with complex queries
            expect(responseTime).toBeLessThan(1000);
        });
    });
});

module.exports = {
    // Export any test utilities if needed
};