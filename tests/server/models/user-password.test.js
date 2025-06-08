const bcrypt = require('bcrypt');

jest.mock('../../../server/utils/database', () => {
  const chain = {
    from: jest.fn(() => chain),
    update: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    select: jest.fn(() => chain),
    single: jest.fn(() => Promise.resolve({ data: { id: 'user1', password: 'hashed' }, error: null }))
  };
  return { supabase: chain, supabaseAdmin: chain };
});

const User = require('../../../server/models/User');

describe('User password hashing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hashes password on findByIdAndUpdate', async () => {
    jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt');
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_pw');
    await User.findByIdAndUpdate('user1', { password: 'plain' });
    expect(bcrypt.hash).toHaveBeenCalledWith('plain', 'salt');
    const { supabaseAdmin } = require('../../../server/utils/database');
    expect(supabaseAdmin.update).toHaveBeenCalledWith({ password: 'hashed_pw' });
  });

  it('hashes password on save', async () => {
    jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt2');
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_pw2');
    const user = new User();
    user.id = 'user2';
    user.username = '';
    user.email = '';
    user.password = 'plain2';
    await user.save();
    expect(bcrypt.hash).toHaveBeenCalledWith('plain2', 'salt2');
    const { supabaseAdmin } = require('../../../server/utils/database');
    expect(supabaseAdmin.update).toHaveBeenCalledWith(expect.objectContaining({ password: 'hashed_pw2' }));
  });
});
