const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const multer = require('multer');

jest.mock('../../../server/models/User', () => ({
  findByIdAndUpdate: jest.fn()
}));

const fromMock = jest.fn();
jest.mock('../../../server/utils/database', () => ({
  supabase: { from: fromMock },
  supabaseAdmin: {}
}));

const User = require('../../../server/models/User');

let app;

beforeEach(() => {
  jest.clearAllMocks();
  app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.use((req, _res, next) => {
    req.isAuthenticated = () => true;
    req.user = { id: 'user1' };
    next();
  });

  const storage = multer.diskStorage({
    destination: (req, _file, cb) => {
      const dir = path.join(os.tmpdir(), 'wirebase-tests');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => cb(null, file.originalname)
  });
  const upload = multer({ storage });
  app.locals.upload = upload;

  const apiRouter = require('../../../server/routes/api');
  app.use('/api', apiRouter);
});

test('uploads avatar and updates user', async () => {
  const tmpDir = path.join(os.tmpdir(), 'wirebase-tests');
  fs.mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, 'avatar.png');
  fs.writeFileSync(filePath, 'test');

  User.findByIdAndUpdate.mockResolvedValue({ id: 'user1', avatar: '/uploads/user1/avatar.png' });

  const res = await request(app)
    .post('/api/user/avatar')
    .attach('avatar', filePath);

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user1', expect.objectContaining({ avatar: expect.stringContaining('/uploads/user1/') }));

  fs.unlinkSync(filePath);
});
