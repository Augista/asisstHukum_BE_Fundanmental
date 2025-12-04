/**
 * Business API Tests
 * Tests for business CRUD operations
 * Uses Jest with Supertest for HTTP endpoint testing
 */

const request = require('supertest');
const createApp = require('../src/app');
const TestHelpers = require('./testHelpers');

const app = createApp();

describe('Business API - Basic Tests', () => {
    // Test data stored across tests
    let authToken, ownerId, businessId;

    /**
     * Setup: Create test user before running tests
     */
    beforeAll(async () => {
        await TestHelpers.cleanup();

        // Create owner user with authentication token
        const { user, token } = await TestHelpers.createUserWithToken({
            email: 'biz@test.com',
            name: 'Business Owner',
            role: 'OWNER'
        });

        ownerId = user.id;
        authToken = token;
    });

    /**
     * Cleanup: Remove test data after all tests
     */
    afterAll(async () => {
        await TestHelpers.cleanup();
        await TestHelpers.disconnect();
    });

    /**
     * Test: Create Business
     * Should successfully create a new business
     */
    it('should create business', async () => {
        const response = await request(app)
            .post('/api/business')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'My Business' });

        // Verify business creation
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);

        // Save business ID for next tests
        businessId = response.body.data.id;
    });

    /**
     * Test: Get Business by ID
     * Should retrieve business details
     */
    it('should get business', async () => {
        const response = await request(app)
            .get(`/api/business/${businessId}`)
            .set('Authorization', `Bearer ${authToken}`);

        // Verify business retrieval
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    /**
     * Test: Get My Businesses
     * Should list all businesses owned by current user
     */
    it('should get my businesses', async () => {
        const response = await request(app)
            .get('/api/business/my')
            .set('Authorization', `Bearer ${authToken}`);

        // Verify business list
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
