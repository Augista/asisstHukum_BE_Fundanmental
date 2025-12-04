/**
 * Admin API Tests
 * Tests for admin-only operations
 * Uses Jest with Supertest
 */

const request = require('supertest');
const createApp = require('../src/app');
const TestHelpers = require('./testHelpers');

const app = createApp();

describe('Admin API - Basic Tests', () => {
    let adminToken, userToPromoteId;

    /**
     * Setup: Create admin and regular user
     */
    beforeAll(async () => {
        await TestHelpers.cleanup();

        // Create admin user
        const admin = await TestHelpers.createUserWithToken({
            email: 'admin@test.com',
            name: 'Admin User',
            role: 'ADMIN'
        });
        adminToken = admin.token;

        // Create regular user to be promoted
        const regularUser = await TestHelpers.createUser({
            email: 'promote@test.com',
            name: 'User To Promote',
            role: 'OWNER'
        });
        userToPromoteId = regularUser.id;
    });

    /**
     * Cleanup: Remove test data
     */
    afterAll(async () => {
        await TestHelpers.cleanup();
        await TestHelpers.disconnect();
    });

    /**
     * Test: Promote User to Lawyer
     * Admin should be able to change user role to LAWYER
     */
    it('should promote user to lawyer', async () => {
        const response = await request(app)
            .patch(`/api/admin/user/${userToPromoteId}/set-lawyer`)
            .set('Authorization', `Bearer ${adminToken}`);

        // Verify successful promotion
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
