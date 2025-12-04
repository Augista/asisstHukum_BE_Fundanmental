/**
 * Consultation API Tests
 * Tests for consultation workflow (create, assign, manage)
 * Uses Jest with Supertest
 */

const request = require('supertest');
const createApp = require('../src/app');
const TestHelpers = require('./testHelpers');

const app = createApp();

describe('Consultation API - Basic Tests', () => {
    // Tokens for different roles
    let ownerToken, adminToken, lawyerToken;
    // Test data IDs
    let businessId, consultationId, lawyerId;

    /**
     * Setup: Create users for all roles and test business
     */
    beforeAll(async () => {
        await TestHelpers.cleanup();

        // Create business owner
        const owner = await TestHelpers.createUserWithToken({
            email: 'cons@test.com',
            name: 'Consultation Owner',
            role: 'OWNER'
        });
        ownerToken = owner.token;

        // Create admin
        const admin = await TestHelpers.createUserWithToken({
            email: 'consadmin@test.com',
            name: 'Consultation Admin',
            role: 'ADMIN'
        });
        adminToken = admin.token;

        // Create lawyer
        const lawyer = await TestHelpers.createUserWithToken({
            email: 'lawyer@test.com',
            name: 'Test Lawyer',
            role: 'LAWYER'
        });
        lawyerId = lawyer.user.id;
        lawyerToken = lawyer.token;

        // Create test business
        const business = await TestHelpers.createBusiness({
            name: 'Consultation Test Business',
            ownerId: owner.user.id
        });
        businessId = business.id;
    });

    /**
     * Cleanup: Remove all test data
     */
    afterAll(async () => {
        await TestHelpers.cleanup();
        await TestHelpers.disconnect();
    });

    /**
     * Test: Create Consultation
     * Owner should be able to create consultation for their business
     */
    it('should create consultation', async () => {
        const response = await request(app)
            .post('/api/consultations')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                note: 'I need help with business registration process',
                businessId: businessId
            });

        // Verify consultation creation
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);

        // Save consultation ID for next tests
        consultationId = response.body.data.id;
    });

    /**
     * Test: Assign Lawyer to Consultation
     * Admin should be able to assign lawyer
     */
    it('should assign lawyer', async () => {
        const response = await request(app)
            .patch(`/api/consultations/${consultationId}/assign`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ lawyerId: lawyerId });

        // Verify lawyer assignment
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    /**
     * Test: Get Lawyer's Consultations
     * Lawyer should see their assigned consultations
     */
    it('should get lawyer consultations', async () => {
        const response = await request(app)
            .get('/api/consultations/lawyer')
            .set('Authorization', `Bearer ${lawyerToken}`);

        // Verify consultation list
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
