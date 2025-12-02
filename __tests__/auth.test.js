const request = require('supertest');
const createApp = require('../src/app');
const prisma = require('../src/utils/prismaClient');
const app = createApp();


describe('Auth API', () => {
const user = { email: 'test@example.com', password: 'password123', name: 'Test User' };


afterAll(async () => {
await prisma.user.deleteMany({});
await prisma.$disconnect();
});


it('POST /api/auth/register should register user', async () => {
const res = await request(app).post('/api/auth/register').send(user);
expect(res.status).toBe(201);
expect(res.body.token).toBeDefined();
});


it('POST /api/auth/login should login user', async () => {
const res = await request(app)
.post('/api/auth/login')
.send({ email: user.email, password: user.password });


expect(res.status).toBe(200);
expect(res.body.token).toBeDefined();
});
});