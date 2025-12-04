const request = require('supertest');
const path = require('path');
const createApp = require('../src/app');
const TestHelpers = require('./testHelpers');

const app = createApp();

describe('Business API', () => {
    let ownerToken, adminToken, lawyerToken;
    let ownerUser, adminUser, lawyerUser;
    let businessId;

    beforeAll(async () => {
        await TestHelpers.cleanup();

        // Create test users
        const owner = await TestHelpers.createUserWithToken({
            email: 'owner@example.com',
            name: 'Test Owner',
            role: 'owner'
        });
        ownerUser = owner.user;
        ownerToken = owner.token;

        const admin = await TestHelpers.createUserWithToken({
            email: 'admin@example.com',
            name: 'Test Admin',
            role: 'admin'
        });
        adminUser = admin.user;
        adminToken = admin.token;

        const lawyer = await TestHelpers.createUserWithToken({
            email: 'lawyer@example.com',
            name: 'Test Lawyer',
            role: 'lawyer'
        });
        lawyerUser = lawyer.user;
        lawyerToken = lawyer.token;
    });

    afterAll(async () => {
        await TestHelpers.cleanup();
        await TestHelpers.disconnect();
    });

    describe('POST /api/business', () => {
        it('should create a business as owner', async () => {
            const businessData = {
                name: 'Test Business'
            };

            const res = await request(app)
                .post('/api/business')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send(businessData);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe(businessData.name);
            expect(res.body.data.ownerId).toBe(ownerUser.id);
            businessId = res.body.data.id;
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .post('/api/business')
                .send({ name: 'Unauthorized Business' });

            expect(res.status).toBe(401);
        });

        it('should fail with missing required fields', async () => {
            const res = await request(app)
                .post('/api/business')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({}); // Missing name

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/business/:id', () => {
        beforeAll(async () => {
            if (!businessId) {
                const business = await TestHelpers.createBusiness({
                    name: 'Get Test Business',
                    ownerId: ownerUser.id
                });
                businessId = business.id;
            }
        });

        it('should get business by id as owner', async () => {
            const res = await request(app)
                .get(`/api/business/${businessId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(businessId);
        });

        it('should get business by id as admin', async () => {
            const res = await request(app)
                .get(`/api/business/${businessId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .get(`/api/business/${businessId}`);

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/business/my', () => {
        it('should get owner\'s businesses', async () => {
            const res = await request(app)
                .get('/api/business/my')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should fail for non-owner role', async () => {
            const res = await request(app)
                .get('/api/business/my')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/business/all', () => {
        it('should get all businesses as admin', async () => {
            const res = await request(app)
                .get('/api/business/all')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should fail for non-admin role', async () => {
            const res = await request(app)
                .get('/api/business/all')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('PUT /api/business/:id', () => {
        it('should update own business as owner', async () => {
            const updateData = {
                name: 'Updated Business Name'
            };

            const res = await request(app)
                .put(`/api/business/${businessId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send(updateData);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe(updateData.name);
        });

        it('should fail to update without authentication', async () => {
            const res = await request(app)
                .put(`/api/business/${businessId}`)
                .send({ name: 'Unauthorized Update' });

            expect(res.status).toBe(401);
        });
    });

    describe('PATCH /api/business/:id/assign', () => {
        it('should assign business to lawyer as admin', async () => {
            const res = await request(app)
                .patch(`/api/business/${businessId}/assign`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ lawyerId: lawyerUser.id });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.lawyerId).toBe(lawyerUser.id);
        });

        it('should fail for non-admin role', async () => {
            const res = await request(app)
                .patch(`/api/business/${businessId}/assign`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ lawyerId: lawyerUser.id });

            expect(res.status).toBe(403);
        });
    });

    describe('POST /api/business/:id/permit', () => {
        it('should upload permit file as owner', async () => {
            const testFilePath = path.join(__dirname, '..', 'package.json');

            const res = await request(app)
                .post(`/api/business/${businessId}/permit`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .attach('file', testFilePath);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.filename).toBeDefined();
        });

        it('should fail without file', async () => {
            const res = await request(app)
                .post(`/api/business/${businessId}/permit`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(400);
        });
    });

    describe('DELETE /api/business/:id', () => {
        it('should delete business as admin', async () => {
            // Create a new business to delete
            const business = await TestHelpers.createBusiness({
                name: 'Business to Delete',
                ownerId: ownerUser.id
            });

            const res = await request(app)
                .delete(`/api/business/${business.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should fail for non-admin role', async () => {
            const res = await request(app)
                .delete(`/api/business/${businessId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(403);
        });
    });
});
