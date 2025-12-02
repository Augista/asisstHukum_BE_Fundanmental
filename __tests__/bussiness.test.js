const requestB = require('supertest');
const appB = createApp();
let token;
let businessId;


describe('Business API', () => {
beforeAll(async () => {
const login = await requestB(appB)
.post('/api/auth/login')
.send({ email: 'test@example.com', password: 'password123' });
token = login.body.token;
});


it('POST /api/business create business', async () => {
const res = await requestB(appB)
.post('/api/business')
.set('Authorization', `Bearer ${token}`)
.send({ name: 'UMKM Test' });


expect(res.status).toBe(201);
businessId = res.body.id;
});


it('GET /api/business/:id should get business', async () => {
const res = await requestB(appB)
.get(`/api/business/${businessId}`)
.set('Authorization', `Bearer ${token}`);


expect(res.status).toBe(200);
expect(res.body.id).toBe(businessId);
});
});