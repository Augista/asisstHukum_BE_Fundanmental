/**
 * Auth API Tests
 * Tests for user registration and login endpoints
 * Uses Jest testing framework with Supertest for HTTP testing
 */

const request = require('supertest');
const createApp = require('../src/app');
const TestHelpers = require('./testHelpers');

const app = createApp();

describe('Auth API - Basic Tests', () => {
    // Clean up database after all tests complete
    afterAll(async () => {
        await TestHelpers.cleanup();
        await TestHelpers.disconnect();
    });

    /**
     * Test: User Registration
     * Should successfully register a new user with valid data
     */
    it('should register new user', async () => {
        // Clean database before test
        await TestHelpers.cleanup();

        // Make registration request
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'user@test.com',
                password: 'password123',
                name: 'Test User'
            });

        // Verify successful registration
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
    });

    /**
     * Test: User Login (Success)
     * Should successfully login with correct credentials
     */
    it('should login user', async () => {
        // Attempt login with previously registered user
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'user@test.com',
                password: 'password123'
            });

        // Verify successful login and token generation
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.token).toBeDefined();
    });

    /**
     * Test: User Login (Failed)
     * Should fail login with incorrect password
     */
    it('should fail login with wrong password', async () => {
        // Attempt login with wrong password
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'user@test.com',
                password: 'wrongpassword'
            });

        // Verify login failure
        expect(response.status).toBe(401);
    });
});