const request = require('supertest');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcrypt');

// Mock User model methods used in the routes and passport strategy
jest.mock('../../../server/models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findOneWithPassword: jest.fn(),
  findById: jest.fn()
}));

const User = require('../../../server/models/User');

// Import passport config after mocking User
const configurePassport = require('../../../server/utils/passport-config');

// Helper to create an app with session and passport
function createTestApp() {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use((req, res, next) => { req.flash = jest.fn(); next(); });
  app.use(
    session({
      secret: 'test',
      resave: false,
      saveUninitialized: false,
      name: 'wirebase.sid'
    })
  );
  configurePassport(passport);
  app.use(passport.initialize());
  app.use(passport.session());
  // mount routes
  const usersRouter = require('../../../server/routes/users');
  app.use('/users', usersRouter);
  // protected route to verify session
  app.get('/protected', (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ id: req.user.id, username: req.user.username });
    } else {
      res.status(401).send('Unauthorized');
    }
  });
  return app;
}

describe('User registration and login', () => {
  const app = createTestApp();
  const agent = request.agent(app);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new user', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ id: '1', username: 'testuser', email: 'test@example.com' });

    const res = await agent
      .post('/users/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'secret',
        password2: 'secret'
      });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/users/login');
    expect(User.create).toHaveBeenCalled();
  });

  it('logs in an existing user and creates session', async () => {
    const hashed = bcrypt.hashSync('secret', 10);
    const user = { id: '1', username: 'testuser', email: 'test@example.com', password: hashed };
    User.findOneWithPassword.mockResolvedValue(user);
    User.findById.mockResolvedValue({ id: '1', username: 'testuser', email: 'test@example.com' });

    const res = await agent
      .post('/users/login')
      .send({ email: 'test@example.com', password: 'secret' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/dashboard');
    // session cookie should be set
    expect(res.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringContaining('wirebase.sid')]));

    const followUp = await agent.get('/protected');
    expect(followUp.status).toBe(200);
    expect(followUp.body.username).toBe('testuser');
  });
});
