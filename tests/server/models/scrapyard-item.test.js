const ScrapyardItem = require('../../../server/models/ScrapyardItem');

jest.mock('../../../server/utils/database', () => {
  const mockData = [
    { id: '1', upvotes: ['u1', 'u2', 'u3'], downvotes: [] },
    { id: '2', upvotes: ['u1'], downvotes: ['d1'] },
    { id: '3', upvotes: ['u1', 'u2'], downvotes: ['d1', 'd2', 'd3'] }
  ];

  const builder = {
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    range: jest.fn(() => builder),
    then: jest.fn((res) => Promise.resolve({ data: mockData, error: null }).then(res))
  };

  const fromMock = {
    select: jest.fn(() => builder)
  };

  return {
    supabase: { from: jest.fn(() => fromMock) },
    supabaseAdmin: {}
  };
});

describe('ScrapyardItem.find voteScore sorting', () => {
  it('sorts items by vote score descending', async () => {
    const items = await ScrapyardItem.find({}, { sort: { voteScore: -1 } });
    const ids = items.map(i => i.id);
    expect(ids).toEqual(['1', '2', '3']);
  });
});
