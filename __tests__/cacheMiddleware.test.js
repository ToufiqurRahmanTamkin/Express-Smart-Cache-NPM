const express = require('express');
const request = require('supertest');
const CacheMiddleware = require('../index.js');


let app;

beforeAll(() => {
  app = express();
  const cache = new CacheMiddleware({ redis: false, ttl: 5, logging: true });

  app.get('/test', cache.middleware(), (req, res) => {
    res.json({ success: true, timestamp: Date.now() });
  });
});

test('CacheMiddleware should return cached response', async () => {
  const firstResponse = await request(app).get('/test');
  const secondResponse = await request(app).get('/test');

  expect(firstResponse.body.timestamp).toBe(secondResponse.body.timestamp); // Cache works
});

test('CacheMiddleware should expire cache after TTL', async () => {
  const firstResponse = await request(app).get('/test');

  await new Promise((resolve) => setTimeout(resolve, 6000)); // Wait for TTL expiration

  const secondResponse = await request(app).get('/test');

  expect(firstResponse.body.timestamp).not.toBe(secondResponse.body.timestamp); // Cache expired
});
