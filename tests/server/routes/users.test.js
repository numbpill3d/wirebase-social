const request = require('supertest');
const express = require('express');

// Mock dependencies
jest.mock('../../../server/models/User', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({ id: '1' })
}));

// Mock express-handlebars
jest.mock('express-handlebars', () => ({
  engine: () => jest.fn()
}));

const usersRouter = require('../../../server/routes/users');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'handlebars');
app.set('views', './server/views');

app.use((req, res, next) => {
  res.render = jest.fn().mockImplementation((view, options) => {
    res.send({ view, options });
  });
  req.flash = jest.fn();
  next();
});

app.use('/users', usersRouter);

describe('User Routes', () => {
  describe('POST /users/register', () => {
    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/users/register')
        .type('form')
        .send({
          username: 'testuser',
          email: 'invalid_email',
          password: 'password',
          password2: 'password'
        });

      expect(response.status).toBe(200);
      expect(response.body.view).toBe('users/register');
      expect(response.body.options.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ msg: 'Please enter a valid email address' })
        ])
      );
    });
  });
});
