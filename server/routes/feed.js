const express = require('express');
const router = express.Router();
const { Feed } = require('feed');
const User = require('../models/User');
const ScrapyardItem = require('../models/ScrapyardItem');
const { cache } = require('../utils/performance');

// Helper to get content type from format
const getContentType = format => {
  switch (format) {
    case 'atom':
      return 'application/atom+xml';
    case 'json':
      return 'application/json';
    default:
      return 'application/rss+xml';
  }
};

const buildFeedOutput = (feed, format) => {
  if (format === 'atom') return feed.atom1();
  if (format === 'json') return feed.json1();
  return feed.rss2();
};

// Global site feed
router.get('/', async (req, res) => {
  try {
    const format = req.query.format || 'rss';
    const cacheKey = `feed:global:${format}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('Content-Type', getContentType(format));
      res.set('X-Cache', 'HIT');
      return res.send(cached);
    }

    // Create main site feed
    const feed = new Feed({
      title: 'Wirebase - Medieval Dungeon Fantasy Social Platform',
      description: 'Latest updates from Wirebase users and Scrapyard submissions',
      id: 'https://wirebase.example.com/',
      link: 'https://wirebase.example.com/',
      language: 'en',
      image: 'https://wirebase.example.com/images/wirebase-logo.svg',
      favicon: 'https://wirebase.example.com/favicon.ico',
      copyright: `All rights reserved ${new Date().getFullYear()}, Wirebase`,
      updated: new Date(),
      author: {
        name: 'Wirebase',
        link: 'https://wirebase.example.com/'
      }
    });

    // Get recent updates - both users and items
    const [recentUsers, recentItems] = await Promise.all([
      User.find()
        .sort({ lastActive: -1 })
        .limit(20)
        .select('username displayName avatar customGlyph statusMessage lastActive'),
        
      ScrapyardItem.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('creator', 'username displayName avatar customGlyph')
        .select('title category description previewImage createdAt creator')
    ]);

    // Add recent user updates to feed
    recentUsers.forEach(user => {
      feed.addItem({
        title: `${user.displayName} updated their profile`,
        id: `https://wirebase.example.com/profile/${user.username}#${user.lastActive.getTime()}`,
        link: `https://wirebase.example.com/profile/${user.username}`,
        description: user.statusMessage || `${user.displayName} made changes to their profile`,
        content: `<p>${user.statusMessage || `${user.displayName} made changes to their profile`}</p>
                 <p>Visit their profile to see the latest updates and use the Streetpass widget to leave an impression.</p>`,
        author: [
          {
            name: user.displayName,
            link: `https://wirebase.example.com/profile/${user.username}`
          }
        ],
        date: user.lastActive,
        image: user.avatar
      });
    });

    // Add recent scrapyard items to feed
    recentItems.forEach(item => {
      feed.addItem({
        title: `New ${item.category} in the Scrapyard: ${item.title}`,
        id: `https://wirebase.example.com/scrapyard/item/${item._id}`,
        link: `https://wirebase.example.com/scrapyard/item/${item._id}`,
        description: item.description,
        content: `<p>${item.description}</p>
                 <p>Created by <a href="https://wirebase.example.com/profile/${item.creator.username}">${item.creator.displayName}</a>.</p>
                 <p>Visit the <a href="https://wirebase.example.com/scrapyard/item/${item._id}">Scrapyard</a> to view and use this item.</p>`,
        author: [
          {
            name: item.creator.displayName,
            link: `https://wirebase.example.com/profile/${item.creator.username}`
          }
        ],
        date: item.createdAt,
        image: item.previewImage
      });
    });

    const output = buildFeedOutput(feed, format);
    cache.set(cacheKey, output, 300);
    res.set('Content-Type', getContentType(format));
    res.set('X-Cache', 'MISS');
    res.send(output);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating feed');
  }
});

// User-specific feed
router.get('/user/:username', async (req, res) => {
  try {
    const format = req.query.format || 'rss';
    const cacheKey = `feed:user:${req.params.username}:${format}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('Content-Type', getContentType(format));
      res.set('X-Cache', 'HIT');
      return res.send(cached);
    }

    // Find user
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).send('User not found');
    }
    
    // Create user feed
    const feed = new Feed({
      title: `${user.displayName}'s Wirebase Profile`,
      description: user.statusMessage || `Updates from ${user.displayName} on Wirebase`,
      id: `https://wirebase.example.com/profile/${user.username}`,
      link: `https://wirebase.example.com/profile/${user.username}`,
      language: 'en',
      image: user.avatar,
      favicon: 'https://wirebase.example.com/favicon.ico',
      copyright: `All rights reserved ${new Date().getFullYear()}, ${user.displayName}`,
      updated: user.lastActive,
      author: {
        name: user.displayName,
        link: `https://wirebase.example.com/profile/${user.username}`
      }
    });
    
    // Get user's items in the Scrapyard
    const userItems = await ScrapyardItem.find({ creator: user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    // Add items to feed
    userItems.forEach(item => {
      feed.addItem({
        title: `New ${item.category} in the Scrapyard: ${item.title}`,
        id: `https://wirebase.example.com/scrapyard/item/${item._id}`,
        link: `https://wirebase.example.com/scrapyard/item/${item._id}`,
        description: item.description,
        content: item.description,
        author: [
          {
            name: user.displayName,
            link: `https://wirebase.example.com/profile/${user.username}`
          }
        ],
        date: item.createdAt,
        image: item.previewImage
      });
    });
    
    const output = buildFeedOutput(feed, format);
    cache.set(cacheKey, output, 300);
    res.set('Content-Type', getContentType(format));
    res.set('X-Cache', 'MISS');
    res.send(output);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating feed');
  }
});

// Category-specific feed for Scrapyard
router.get('/scrapyard/:category', async (req, res) => {
  try {
    const format = req.query.format || 'rss';
    const category = req.params.category;
    const cacheKey = `feed:scrapyard:${category}:${format}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('Content-Type', getContentType(format));
      res.set('X-Cache', 'HIT');
      return res.send(cached);
    }

    const validCategories = ['widget', 'template', 'icon', 'banner', 'gif', 'all'];
    
    if (!validCategories.includes(category)) {
      return res.status(404).send('Category not found');
    }
    
    // Set category title
    const categoryTitles = {
      widget: 'The Widget Graveyard',
      template: 'The Template Crypt',
      icon: 'The Icon Vault',
      banner: 'The Banner Keep',
      gif: 'The GIF Dungeon',
      all: 'All Categories'
    };
    
    // Create category feed
    const feed = new Feed({
      title: `Wirebase Scrapyard - ${categoryTitles[category]}`,
      description: `Latest submissions to the ${categoryTitles[category]} on Wirebase`,
      id: `https://wirebase.example.com/scrapyard/category/${category}`,
      link: `https://wirebase.example.com/scrapyard/category/${category}`,
      language: 'en',
      image: 'https://wirebase.example.com/images/wirebase-logo.svg',
      favicon: 'https://wirebase.example.com/favicon.ico',
      copyright: `All rights reserved ${new Date().getFullYear()}, Wirebase`,
      updated: new Date(),
      author: {
        name: 'Wirebase',
        link: 'https://wirebase.example.com/'
      }
    });
    
    // Query for items
    const query = category === 'all' ? {} : { category: category };
    
    // Get recent items
    const items = await ScrapyardItem.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('creator', 'username displayName');
    
    // Add items to feed
    items.forEach(item => {
      feed.addItem({
        title: item.title,
        id: `https://wirebase.example.com/scrapyard/item/${item._id}`,
        link: `https://wirebase.example.com/scrapyard/item/${item._id}`,
        description: item.description,
        content: item.description,
        author: [
          {
            name: item.creator.displayName,
            link: `https://wirebase.example.com/profile/${item.creator.username}`
          }
        ],
        date: item.createdAt,
        image: item.previewImage
      });
    });
    
    const output = buildFeedOutput(feed, format);
    cache.set(cacheKey, output, 300);
    res.set('Content-Type', getContentType(format));
    res.set('X-Cache', 'MISS');
    res.send(output);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating feed');
  }
});

// Feed subscription page (HTML)
router.get('/subscribe', (req, res) => {
  res.render('feed/subscribe', {
    title: 'Subscribe to Feeds - Wirebase',
    pageTheme: 'dark-dungeon'
  });
});

module.exports = router;