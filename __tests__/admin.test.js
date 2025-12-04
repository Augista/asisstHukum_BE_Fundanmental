const request = require('supertest');
const createApp = require('../src/app');
const TestHelpers = require('./testHelpers');

const app = createApp();

describe('Admin API', () => {
    let adminToken, ownerToken, lawyerToken;
    let adminUser, ownerUser, lawyerUser;

    beforeAll(async () => {
        await TestHelpers.cleanup();

        // Create test users
        const admin = await TestHelpers.createUserWithToken({
            email: 'admin@example.com',
            name: 'Test Admin',
            role: 'ADMIN'
        });
        adminUser = admin.user;
        adminToken = admin.token;

        const owner = await TestHelpers.createUserWithToken({
            email: 'owner@example.com',
            name: 'Test Owner',
            role: 'OWNER'
        });
        ownerUser = owner.user;
        ownerToken = owner.token;

        const lawyer = await TestHelpers.createUserWithToken({
            email: 'lawyer@example.com',
            name: 'Test Lawyer',
            role: 'LAWYER'
        });
        lawyerUser = lawyer.user;
        lawyerToken = lawyer.token;
    });

    afterAll(async () => {
        await TestHelpers.cleanup();
        await TestHelpers.disconnect();
    });

    describe('PATCH /api/admin/user/:userId/set-lawyer', () => {
        it('should assign lawyer to user as admin', async () => {
            const res = await request(app)
                .patch(`/api/admin/user/${ownerUser.id}/set-lawyer`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ lawyerId: lawyerUser.id });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .patch(`/api/admin/user/${ownerUser.id}/set-lawyer`)
                .send({ lawyerId: lawyerUser.id });

            expect(res.status).toBe(401);
        });

        it('should fail for non-admin role', async () => {
            const res = await request(app)
                .patch(`/api/admin/user/${ownerUser.id}/set-lawyer`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ lawyerId: lawyerUser.id });

            expect(res.status).toBe(403);
        });
    });
});
