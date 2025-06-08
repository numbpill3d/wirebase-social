const request = require('supertest');
const express = require('express');

// Mock User model methods used in the route
jest.mock('../../../server/models/User', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({ id: 1 })
}));

// Create mock app
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set('view engine', 'handlebars');
app.set('views', './server/views');
app.use((req, res, next) => {
  req.flash = jest.fn();
  next();
});
app.use((req, res, next) => {
  res.render = jest.fn().mockImplementation((view, options) => {
    res.status(200).send({ view, options });
  });
  next();
});

const usersRouter = require('../../../server/routes/users');
app.use('/users', usersRouter);

describe('Users Routes', () => {
  describe('POST /users/register', () => {
    it('should return an error for invalid email', async () => {
      const response = await request(app)
        .post('/users/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password',
          password2: 'password'
        });

      expect(response.status).toBe(200);
      expect(response.body.view).toBe('users/register');
      expect(response.body.options.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Invalid email address' })
        ])
      );
    });
  });
});
