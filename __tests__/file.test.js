const request = require('supertest');
const path = require('path');
const createApp = require('../src/app');
const TestHelpers = require('./testHelpers');

const app = createApp();

describe('File API', () => {
    let ownerToken, adminToken, lawyerToken;
    let ownerUser, adminUser, lawyerUser;
    let businessId, fileId;

    beforeAll(async () => {
        await TestHelpers.cleanup();

        // Create test users
        const owner = await TestHelpers.createUserWithToken({
            email: 'owner@example.com',
            name: 'Test Owner',
            role: 'OWNER'
        });
        ownerUser = owner.user;
        ownerToken = owner.token;

        const admin = await TestHelpers.createUserWithToken({
            email: 'admin@example.com',
            name: 'Test Admin',
            role: 'ADMIN'
        });
        adminUser = admin.user;
        adminToken = admin.token;

        const lawyer = await TestHelpers.createUserWithToken({
            email: 'lawyer@example.com',
            name: 'Test Lawyer',
            role: 'LAWYER'
        });
        lawyerUser = lawyer.user;
        lawyerToken = lawyer.token;

        // Create a test business
        const business = await TestHelpers.createBusiness({
            name: 'File Test Business',
            ownerId: ownerUser.id
        });
        businessId = business.id;
    });

    afterAll(async () => {
        await TestHelpers.cleanup();
        await TestHelpers.disconnect();
    });

    describe('POST /api/business/:businessId/files', () => {
        it('should upload file to business as owner', async () => {
            const testFilePath = path.join(__dirname, '..', 'package.json');

            const res = await request(app)
                .post(`/api/business/${businessId}/files`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .attach('file', testFilePath);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.filename).toBeDefined();
            expect(res.body.data.businessId).toBe(businessId);
            fileId = res.body.data.id;
        });

        it('should upload file to business as admin', async () => {
            const testFilePath = path.join(__dirname, '..', 'package.json');

            const res = await request(app)
                .post(`/api/business/${businessId}/files`)
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', testFilePath);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('should fail without file', async () => {
            const res = await request(app)
                .post(`/api/business/${businessId}/files`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(400);
        });

        it('should fail without authentication', async () => {
            const testFilePath = path.join(__dirname, '..', 'package.json');

            const res = await request(app)
                .post(`/api/business/${businessId}/files`)
                .attach('file', testFilePath);

            expect(res.status).toBe(401);
        });

        it('should fail for lawyer role', async () => {
            const testFilePath = path.join(__dirname, '..', 'package.json');

            const res = await request(app)
                .post(`/api/business/${businessId}/files`)
                .set('Authorization', `Bearer ${lawyerToken}`)
                .attach('file', testFilePath);

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/business/:businessId/files', () => {
        it('should get business files as owner', async () => {
            const res = await request(app)
                .get(`/api/business/${businessId}/files`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should get business files as admin', async () => {
            const res = await request(app)
                .get(`/api/business/${businessId}/files`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should get business files as lawyer', async () => {
            const res = await request(app)
                .get(`/api/business/${businessId}/files`)
                .set('Authorization', `Bearer ${lawyerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .get(`/api/business/${businessId}/files`);

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/files/:id/download', () => {
        it('should download file as authenticated user', async () => {
            const res = await request(app)
                .get(`/api/files/${fileId}/download`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(200);
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .get(`/api/files/${fileId}/download`);

            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /api/files/:id', () => {
        it('should delete file as owner', async () => {
            // Create a new file to delete
            const testFilePath = path.join(__dirname, '..', 'package.json');
            const uploadRes = await request(app)
                .post(`/api/business/${businessId}/files`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .attach('file', testFilePath);

            const deleteFileId = uploadRes.body.data.id;

            const res = await request(app)
                .delete(`/api/files/${deleteFileId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should delete file as admin', async () => {
            // Create a new file to delete
            const testFilePath = path.join(__dirname, '..', 'package.json');
            const uploadRes = await request(app)
                .post(`/api/business/${businessId}/files`)
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', testFilePath);

            const deleteFileId = uploadRes.body.data.id;

            const res = await request(app)
                .delete(`/api/files/${deleteFileId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .delete(`/api/files/${fileId}`);

            expect(res.status).toBe(401);
        });

        it('should fail for lawyer role', async () => {
            const res = await request(app)
                .delete(`/api/files/${fileId}`)
                .set('Authorization', `Bearer ${lawyerToken}`);

            expect(res.status).toBe(403);
        });
    });
});
