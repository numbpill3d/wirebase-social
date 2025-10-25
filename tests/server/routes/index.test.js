/**
 * Tests for the index routes
 */
const request = require('supertest');
const express = require('express');

jest.mock('../../../server/models/User', () => ({
  findRecent: jest.fn().mockResolvedValue([
    { username: 'testuser1', displayName: 'Test User 1' },
    { username: 'testuser2', displayName: 'Test User 2' }
  ]),
  findAll: jest.fn().mockResolvedValue([
    { username: 'testuser1', displayName: 'Test User 1' },
    { username: 'testuser2', displayName: 'Test User 2' }
  ]),
  countDocuments: jest.fn().mockResolvedValue(2),
  find: jest.fn().mockResolvedValue([
    { username: 'testuser1', displayName: 'Test User 1', lastActive: new Date() },
    { username: 'testuser2', displayName: 'Test User 2', lastActive: new Date() }
  ])
}));

jest.mock('../../../server/models/Item', () => ({
  find: jest.fn().mockResolvedValue([
    { username: 'user1', displayName: 'User 1' },
    { username: 'user2', displayName: 'User 2' }
  ]),
  countDocuments: jest.fn().mockResolvedValue(2),
  findActive: jest.fn().mockResolvedValue([
    { lastActive: new Date().toISOString() }
  ])
}));

jest.mock('../../../server/models/ScrapyardItem', () => ({
  findRecent: jest.fn().mockResolvedValue([
    { id: 1, title: 'Test Item 1' },
    { id: 2, title: 'Test Item 2' }
  ]),
  findFeatured: jest.fn().mockResolvedValue([
    { id: 3, title: 'Featured Item 1' },
    { id: 4, title: 'Featured Item 2' }
  ]),
  countDocuments: jest.fn().mockResolvedValue(2),
  find: jest.fn().mockResolvedValue([
    { username: 'active1', lastActive: new Date() },
    { username: 'active2', lastActive: new Date() }
  ])
}));

jest.mock('../../../server/models/Visit', () => ({
  record: jest.fn().mockResolvedValue(),
  getHourlyCounts: jest.fn().mockResolvedValue(
    Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }))
  )
}));

jest.mock('../../../server/models/Thread', () => ({
  countDocuments: jest.fn().mockResolvedValue(5)
}));

jest.mock('../../../server/models/Reply', () => ({
  countDocuments: jest.fn().mockResolvedValue(10)
}));

const Visit = require('../../../server/models/Visit');

jest.mock('express-handlebars', () => ({
  engine: () => jest.fn()
}));

const app = express();
app.set('view engine', 'handlebars');
app.set('views', './server/views');

app.use((req, res, next) => {
  res.render = jest.fn().mockImplementation((view, options) => {
    res.send({ view, options });
  });
  next();
});

const indexRouter = require('../../../server/routes/index');
app.use('/', indexRouter);

describe('Index Routes', () => {
  describe('GET /', () => {
    it('should render the index page with correct data', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.view).toBe('index');
      expect(response.body.options).toHaveProperty('title');
      expect(response.body.options).toHaveProperty('recentUsers');
      expect(response.body.options).toHaveProperty('recentItems');
      expect(response.body.options).toHaveProperty('featuredItems');
      expect(Visit.record).toHaveBeenCalled();
      expect(Visit.getHourlyCounts).toHaveBeenCalled();
    });
  });
});