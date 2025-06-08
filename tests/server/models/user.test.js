// Mock bcrypt functions
jest.mock('bcrypt', () => ({
  genSalt: jest.fn(() => Promise.resolve('salt')),
  hash: jest.fn(() => Promise.resolve('hashedPassword'))
}));

const bcrypt = require('bcrypt');

// Mock database utilities
const updateMock = jest.fn(() => ({
  eq: jest.fn(() => ({
    select: jest.fn(() => ({
      single: jest.fn().mockResolvedValue({ data: { id: '1', password: 'hashedPassword' }, error: null })
    }))
  }))
}));

const fromMock = jest.fn(() => ({ update: updateMock }));

jest.mock('../../../server/utils/database', () => ({
  supabase: { from: fromMock },
  supabaseAdmin: { from: fromMock }
}));

const User = require('../../../server/models/User');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('User.findByIdAndUpdate', () => {
  it('hashes password when provided', async () => {
    await User.findByIdAndUpdate('1', { password: 'secret' });

    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith('secret', 'salt');
    expect(updateMock).toHaveBeenCalled();
    const arg = updateMock.mock.calls[0][0];
    expect(arg.password).toBe('hashedPassword');
  });

  it('does not hash when password not provided', async () => {
    await User.findByIdAndUpdate('1', { displayName: 'Test' });

    expect(bcrypt.hash).not.toHaveBeenCalled();
    const arg = updateMock.mock.calls[0][0];
    expect(arg.display_name).toBe('Test');
  });
});
