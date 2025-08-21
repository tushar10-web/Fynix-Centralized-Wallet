const request = require('supertest');
const chai = require('chai');
const app = require('../app');
const expect = chai.expect;

describe('Fynix Wallet API', () => {
  let token, userId, walletId;
  const timestamp = Date.now();
  const testEmail = `testuser${timestamp}@example.com`; // unique email each run

  it('should sign up a user', async () => {
    const res = await request(app)
      .post('/signup')
      .send({ email: testEmail, password: 'Test@123' });
    try {
      expect(res.status).to.equal(201);
      userId = res.body.user_id;
      console.log('Signed up userId:', userId);
    } catch (err) {
      console.error('Signup test failed:', res.body);
      throw err;
    }
  });

  it('should log in and get token', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: testEmail, password: 'Test@123' });
    try {
      expect(res.status).to.equal(200);
      expect(res.body.token).to.exist;
      token = res.body.token;
      console.log('Received JWT token:', token);
    } catch (err) {
      console.error('Login test failed:', res.body);
      throw err;
    }
  });

  it('should create a new wallet', async () => {
    const res = await request(app)
      .post('/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ user_id: userId });
    try {
      expect(res.status).to.equal(201);
      walletId = res.body.wallet_id;
      console.log('Created walletId:', walletId);
    } catch (err) {
      console.error('Wallet creation test failed:', res.body);
      throw err;
    }
  });

  it('should get wallet balance', async () => {
    const res = await request(app)
      .get(`/wallets/${walletId}/balance`)
      .set('Authorization', `Bearer ${token}`);
    try {
      expect(res.status).to.equal(200);
      expect(res.body.wallet_id).to.equal(walletId);
    } catch (err) {
      console.error('Get wallet balance test failed:', res.body);
      throw err;
    }
  });
});
