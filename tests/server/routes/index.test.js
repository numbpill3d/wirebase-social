/**
 * Tests for the index routes
 */
const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../../server/models/User', () => ({
  findRecent: jest.fn().mockResolvedValue([
    { username: 'testuser1', displayName: 'Test User 1' },
    { username: 'testuser2', displayName: 'Test User 2' }
  ]),
  countDocuments: jest.fn().mockResolvedValue(2),
  find: jest.fn().mockResolvedValue([
    { username: 'testuser1', lastActive: new Date() }
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
  countDocuments: jest.fn().mockResolvedValue(2)
}));

// Mock express-handlebars
jest.mock('express-handlebars', () => ({
  engine: () => jest.fn()
}));

// Create a mock Express app
const app = express();
app.set('view engine', 'handlebars');
app.set('views', './server/views');

// Mock render function
app.use((req, res, next) => {
  res.render = jest.fn().mockImplementation((view, options) => {
    res.send({ view, options });
  });
  next();
});

// Import the router
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
    });
  });
});
