/**
 * File API Tests
 * Tests for file listing operations
 * Uses Jest with Supertest
 */

const request = require('supertest');
const createApp = require('../src/app');
const TestHelpers = require('./testHelpers');

const app = createApp();

describe('File API - Basic Tests', () => {
    let authToken, businessId;

    /**
     * Setup: Create owner user and business
     */
    beforeAll(async () => {
        await TestHelpers.cleanup();

        // Create owner with token
        const owner = await TestHelpers.createUserWithToken({
            email: 'file@test.com',
            name: 'File Test User',
            role: 'OWNER'
        });
        authToken = owner.token;

        // Create test business
        const business = await TestHelpers.createBusiness({
            name: 'File Test Business',
            ownerId: owner.user.id
        });
        businessId = business.id;
    });

    /**
     * Cleanup: Remove test data
     */
    afterAll(async () => {
        await TestHelpers.cleanup();
        await TestHelpers.disconnect();
    });

    /**
     * Test: Get Business Files
     * Should retrieve list of files for a business
     */
    it('should get business files', async () => {
        const response = await request(app)
            .get(`/api/business/${businessId}/files`)
            .set('Authorization', `Bearer ${authToken}`);

        // Verify file list retrieval
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
