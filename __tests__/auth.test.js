const request = require('supertest');
const createApp = require('../src/app');
const TestHelpers = require('./testHelpers');

const app = createApp();

describe('Auth API', () => {
    beforeEach(async () => {
        await TestHelpers.cleanup();
    });

    afterAll(async () => {
        await TestHelpers.cleanup();
        await TestHelpers.disconnect();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user).toBeDefined();
            expect(res.body.data.user.email).toBe(userData.email);
            expect(res.body.data.user.name).toBe(userData.name);
            expect(res.body.data.user.password).toBeUndefined(); // Password should not be returned
        });

        it('should fail with duplicate email', async () => {
            const userData = {
                email: 'duplicate@example.com',
                password: 'password123',
                name: 'First User'
            };

            // Create first user
            await request(app)
                .post('/api/auth/register')
                .send(userData);

            // Try to create duplicate
            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should fail with missing required fields', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com' }); // Missing password and name

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should fail with invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'password123',
                    name: 'Test User'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        const userCredentials = {
            email: 'login@example.com',
            password: 'password123'
        };

        beforeEach(async () => {
            // Create user before each login test
            await request(app)
                .post('/api/auth/register')
                .send({
                    ...userCredentials,
                    name: 'Login Test User'
                });
        });

        it('should login successfully with correct credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send(userCredentials);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
            expect(res.body.data.user).toBeDefined();
            expect(res.body.data.user.email).toBe(userCredentials.email);
        });

        it('should fail with incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userCredentials.email,
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should fail with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should fail with missing credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: userCredentials.email }); // Missing password

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
});