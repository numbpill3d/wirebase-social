/**
 * Tests for ScrapyardItem.find sorting by voteScore
 */

jest.mock('../../../server/utils/database', () => {
  const mockData = [
    { id: '1', votes: { upvotes: ['u1', 'u2', 'u3'], downvotes: [] } },           // +3
    { id: '2', votes: { upvotes: ['u1'], downvotes: ['d1'] } },                   // 0
    { id: '3', votes: { upvotes: ['u1', 'u2'], downvotes: ['d1', 'd2', 'd3'] } }   // -1
  ];

  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    range: jest.fn(() => builder),
    then: function(resolve) {
      return Promise.resolve(resolve({ data: mockData, error: null }));
    }
  };

  const supabase = {
    from: jest.fn(() => builder)
  };

  return { supabase, supabaseAdmin: {} };
});

const { supabase } = require('../../../server/utils/database');
const ScrapyardItem = require('../../../server/models/ScrapyardItem');

describe('ScrapyardItem.find', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort items by voteScore descending', async () => {
    const items = await ScrapyardItem.find({}, { sort: { voteScore: -1 } });
    const ids = items.map(i => i.id);
    expect(ids).toEqual(['1', '2', '3']); // +3, 0, -1
  });
});
