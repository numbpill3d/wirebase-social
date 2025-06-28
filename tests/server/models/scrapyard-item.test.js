/**
 * Tests for ScrapyardItem.find sorting by voteScore
 */

jest.mock('../../../server/utils/database', () => {
  const supabase = { from: jest.fn() };
  return { supabase, supabaseAdmin: {} };
});

const { supabase } = require('../../../server/utils/database');
const ScrapyardItem = require('../../../server/models/ScrapyardItem');

describe('ScrapyardItem.find', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort items by voteScore when option provided', async () => {
    const items = [
      {
        id: '1',
        title: 'Item 1',
        votes: {
          upvotes: ['a', 'b', 'c'],
          downvotes: []
        }
      },
      {
        id: '2',
        title: 'Item 2',
        votes: {
          upvotes: ['a'],
          downvotes: ['x', 'y']
        }
      },
      {
        id: '3',
        title: 'Item 3',
        votes: {
          upvotes: [],
          downvotes: []
        }
      }
    ];

    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      then: function(resolve) {
        return Promise.resolve(resolve({ data: items, error: null }));
      }
    };

    supabase.from.mockReturnValue(queryBuilder);

    const result = await ScrapyardItem.find({}, { sort: { voteScore: -1 } });

    expect(supabase.from).toHaveBeenCalledWith('scrapyard_items');
    expect(result.map(r => r.id)).toEqual(['1', '3', '2']);
  });
});
