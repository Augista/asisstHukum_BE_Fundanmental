const request = require('supertest');
const path = require('path');
const createApp = require('../src/app');
const TestHelpers = require('./testHelpers');

const app = createApp();

describe('Consultation API', () => {
    let ownerToken, adminToken, lawyerToken;
    let ownerUser, adminUser, lawyerUser;
    let businessId, consultationId;

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

        // Create a test business
        const business = await TestHelpers.createBusiness({
            name: 'Consultation Test Business',
            ownerId: ownerUser.id
        });
        businessId = business.id;
    });

    afterAll(async () => {
        await TestHelpers.cleanup();
        await TestHelpers.disconnect();
    });

    describe('POST /api/consultations', () => {
        it('should create consultation as owner', async () => {
            const consultationData = {
                note: 'I have a legal question about my business operations',
                businessId: businessId
            };

            const res = await request(app)
                .post('/api/consultations')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send(consultationData);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.businessId).toBe(businessId);
            consultationId = res.body.data.id;
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .post('/api/consultations')
                .send({
                    note: 'Test note',
                    businessId: businessId
                });

            expect(res.status).toBe(401);
        });

        it('should fail with missing required fields', async () => {
            const res = await request(app)
                .post('/api/consultations')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ businessId: businessId }); // Missing note

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/consultations/my', () => {
        it('should get owner\'s consultations', async () => {
            const res = await request(app)
                .get('/api/consultations/my')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should fail for non-owner role', async () => {
            const res = await request(app)
                .get('/api/consultations/my')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/consultations/admin', () => {
        it('should get all consultations as admin', async () => {
            const res = await request(app)
                .get('/api/consultations/admin')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should fail for non-admin role', async () => {
            const res = await request(app)
                .get('/api/consultations/admin')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('PATCH /api/consultations/:id/assign', () => {
        it('should assign lawyer to consultation as admin', async () => {
            const res = await request(app)
                .patch(`/api/consultations/${consultationId}/assign`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ lawyerId: lawyerUser.id });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.lawyerId).toBe(lawyerUser.id);
        });

        it('should fail for non-admin role', async () => {
            const res = await request(app)
                .patch(`/api/consultations/${consultationId}/assign`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ lawyerId: lawyerUser.id });

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/consultations/lawyer', () => {
        it('should get lawyer\'s consultations', async () => {
            const res = await request(app)
                .get('/api/consultations/lawyer')
                .set('Authorization', `Bearer ${lawyerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should fail for non-lawyer role', async () => {
            const res = await request(app)
                .get('/api/consultations/lawyer')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('PATCH /api/consultations/:id/status', () => {
        it('should update consultation status as lawyer', async () => {
            const res = await request(app)
                .patch(`/api/consultations/${consultationId}/status`)
                .set('Authorization', `Bearer ${lawyerToken}`)
                .send({ status: 'APPROVED' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should update consultation status as admin', async () => {
            const res = await request(app)
                .patch(`/api/consultations/${consultationId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'REJECTED' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should fail for non-authorized role', async () => {
            const res = await request(app)
                .patch(`/api/consultations/${consultationId}/status`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ status: 'APPROVED' });

            expect(res.status).toBe(403);
        });
    });

    describe('PATCH /api/consultations/:id/result', () => {
        it('should submit consultation result as lawyer', async () => {
            const resultData = {
                notes: 'Here is my legal advice for your consultation.'
            };

            const res = await request(app)
                .patch(`/api/consultations/${consultationId}/result`)
                .set('Authorization', `Bearer ${lawyerToken}`)
                .send(resultData);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should fail for non-lawyer role', async () => {
            const res = await request(app)
                .patch(`/api/consultations/${consultationId}/result`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ notes: 'Unauthorized result' });

            expect(res.status).toBe(403);
        });
    });

    describe('POST /api/consultations/:id/result-file', () => {
        it('should upload result file as lawyer', async () => {
            const testFilePath = path.join(__dirname, '..', 'package.json');

            const res = await request(app)
                .post(`/api/consultations/${consultationId}/result-file`)
                .set('Authorization', `Bearer ${lawyerToken}`)
                .attach('file', testFilePath);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('should fail without file', async () => {
            const res = await request(app)
                .post(`/api/consultations/${consultationId}/result-file`)
                .set('Authorization', `Bearer ${lawyerToken}`);

            expect(res.status).toBe(400);
        });

        it('should fail for non-lawyer role', async () => {
            const testFilePath = path.join(__dirname, '..', 'package.json');

            const res = await request(app)
                .post(`/api/consultations/${consultationId}/result-file`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .attach('file', testFilePath);

            expect(res.status).toBe(403);
        });
    });
});
