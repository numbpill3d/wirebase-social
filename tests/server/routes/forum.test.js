/**
 * Tests for forum routes: thread creation and viewing
 */
const request = require('supertest');
const express = require('express');

// Mock Thread model
jest.mock('../../../server/models/Thread', () => ({
  create: jest.fn(),
  getById: jest.fn(),
  incrementViews: jest.fn()
}));

// Mock Reply model just in case (not used directly in tests)
jest.mock('../../../server/models/Reply', () => ({
  create: jest.fn()
}));

// Mock Supabase
const fromMock = jest.fn();
jest.mock('../../../server/utils/database', () => ({
  supabase: { from: fromMock },
  supabaseAdmin: {}
}));

const Thread = require('../../../server/models/Thread');

let app;

beforeEach(() => {
  jest.clearAllMocks();

  app = express();
  app.set('view engine', 'handlebars');
  app.set('views', './server/views');
  app.use(express.urlencoded({ extended: false }));

  // Middleware to mock auth and flash/render
  app.use((req, res, next) => {
    req.isAuthenticated = () => true;
    req.user = { id: 'user1' };
    req.flash = jest.fn();
    res.render = jest.fn().mockImplementation((view, options) => {
      res.send({ view, options });
    });
    next();
  });

  const forumRouter = require('../../../server/routes/forum');
  app.use('/forum', forumRouter);
});

describe('Forum Routes', () => {
  describe('GET /forum/thread/:id', () => {
    it('renders the thread when found', async () => {
      Thread.getById.mockResolvedValue({ id: '1', title: 'Test Thread' });
      Thread.incrementViews.mockResolvedValue(true);

      const response = await request(app).get('/forum/thread/1');

      expect(response.status).toBe(200);
      expect(response.body.view).toBe('forum/thread');
      expect(response.body.options.thread.id).toBe('1');
      expect(Thread.incrementViews).toHaveBeenCalledWith('1');
    });

    it('renders 404 when thread is missing', async () => {
      Thread.getById.mockResolvedValue(null);

      const response = await request(app).get('/forum/thread/999');

      expect(response.status).toBe(404);
      expect(response.body.view).toBe('error');
      expect(response.body.options.errorCode).toBe(404);
      expect(Thread.incrementViews).not.toHaveBeenCalled();
    });
  });

  describe('POST /forum/new', () => {
    it('creates a thread with valid data', async () => {
      fromMock.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { name: 'general' }, error: null })
          })
        })
      }));

      Thread.create.mockResolvedValue({ success: true, threadId: '123' });

      const response = await request(app)
        .post('/forum/new')
        .send('title=New+Thread&category=general&content=Hello&tags=tag1,tag2');

      expect(Thread.create).toHaveBeenCalledWith({
        title: 'New Thread',
        content: 'Hello',
        category: 'general',
        creatorId: 'user1',
        tags: ['tag1', 'tag2']
      });
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/forum/thread/123');
    });

    it('shows errors when required fields are missing', async () => {
      // Validation call for category
      fromMock.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { name: 'general' }, error: null })
          })
        })
      }));
      // Call to fetch categories when errors exist
      fromMock.mockImplementationOnce(() => ({
        select: () => ({
          order: () => Promise.resolve({ data: [{ name: 'general' }], error: null })
        })
      }));

      const response = await request(app)
        .post('/forum/new')
        .send('title=&category=general&content=Hello');

      expect(response.status).toBe(200);
      expect(response.body.view).toBe('forum/new-thread');
      expect(response.body.options.errors.length).toBeGreaterThan(0);
    });
  });
});
