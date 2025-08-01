const express = require('express');
const router = express.Router();
const { Feed } = require('feed');
const User = require('../models/User');
const ScrapyardItem = require('../models/ScrapyardItem');
const { cache } = require('../utils/performance');
const { supabase } = require('../utils/database');

// Base URL for generating feed links
const SITE_URL = process.env.SITE_URL || 'https://wirebase.example.com';

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
router.get('/', async (req, res, next) => {
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
      id: `${SITE_URL}/`,
      link: `${SITE_URL}/`,
      language: 'en',
      image: `${SITE_URL}/images/wirebase-logo.svg`,
      favicon: `${SITE_URL}/favicon.ico`,
      copyright: `All rights reserved ${new Date().getFullYear()}, Wirebase`,
      updated: new Date(),
      author: {
        name: 'Wirebase',
        link: `${SITE_URL}/`
      }
    });

    // Get recent updates - both users and items
    const [recentUsers, itemsRes] = await Promise.all([
      User.find()
        .sort({ lastActive: -1 })
        .limit(20)
        .select('username displayName avatar customGlyph statusMessage lastActive'),
      supabase
        .from('scrapyard_items')
        .select(`
          *,
          creator:creator (
            id, username, display_name, avatar, custom_glyph
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    if (itemsRes.error) {
        // Log the original error for debugging (optional, ensure logs are secure)
        console.error('Supabase error in feed:', itemsRes.error);

        // Throw a sanitized error to avoid leaking sensitive details
        const err = new Error('Failed to fetch recent items.');
        err.status = 500;
        throw err;
    }
    const recentItems = (itemsRes.data || []).map(item => ScrapyardItem.formatItem(item));

    // Add recent user updates to feed
    recentUsers.forEach(user => {
      feed.addItem({
        title: `${user.displayName} updated their profile`,
        id: `${SITE_URL}/profile/${user.username}#${user.lastActive.getTime()}`,
        link: `${SITE_URL}/profile/${user.username}`,
        description: user.statusMessage || `${user.displayName} made changes to their profile`,
        content: `<p>${user.statusMessage || `${user.displayName} made changes to their profile`}</p>
                 <p>Visit their profile to see the latest updates and use the Streetpass widget to leave an impression.</p>`,
        author: [
          {
            name: user.displayName,
            link: `${SITE_URL}/profile/${user.username}`
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
        id: `${SITE_URL}/scrapyard/item/${item._id}`,
        link: `${SITE_URL}/scrapyard/item/${item._id}`,
        description: item.description,
        content: `<p>${item.description}</p>
                 <p>Created by <a href="${SITE_URL}/profile/${item.creator.username}">${item.creator.displayName}</a>.</p>
                 <p>Visit the <a href="${SITE_URL}/scrapyard/item/${item._id}">Scrapyard</a> to view and use this item.</p>`,
        author: [
          {
            name: item.creator.displayName,
            link: `${SITE_URL}/profile/${item.creator.username}`
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
    next(err);
  }
});

// User-specific feed
router.get('/user/:username', async (req, res, next) => {
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
      id: `${SITE_URL}/profile/${user.username}`,
      link: `${SITE_URL}/profile/${user.username}`,
      language: 'en',
      image: user.avatar,
      favicon: `${SITE_URL}/favicon.ico`,
      copyright: `All rights reserved ${new Date().getFullYear()}, ${user.displayName}`,
      updated: user.lastActive,
      author: {
        name: user.displayName,
        link: `${SITE_URL}/profile/${user.username}`
      }
    });
    
    // Get user's items in the Scrapyard
    const userItems = await ScrapyardItem.find(
      { creator: user._id },
      { sort: { createdAt: -1 }, limit: 20 }
    );
    
    // Add items to feed
    userItems.forEach(item => {
      feed.addItem({
        title: `New ${item.category} in the Scrapyard: ${item.title}`,
        id: `${SITE_URL}/scrapyard/item/${item._id}`,
        link: `${SITE_URL}/scrapyard/item/${item._id}`,
        description: item.description,
        content: item.description,
        author: [
          {
            name: user.displayName,
            link: `${SITE_URL}/profile/${user.username}`
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
    next(err);
  }
});

// Category-specific feed for Scrapyard
router.get('/scrapyard/:category', async (req, res, next) => {
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
      id: `${SITE_URL}/scrapyard/category/${category}`,
      link: `${SITE_URL}/scrapyard/category/${category}`,
      language: 'en',
      image: `${SITE_URL}/images/wirebase-logo.svg`,
      favicon: `${SITE_URL}/favicon.ico`,
      copyright: `All rights reserved ${new Date().getFullYear()}, Wirebase`,
      updated: new Date(),
      author: {
        name: 'Wirebase',
        link: `${SITE_URL}/`
      }
    });
    
    // Build query for items
    let itemQuery = supabase
      .from('scrapyard_items')
      .select(`
        *,
        creator:creator (
          id, username, display_name, avatar, custom_glyph
        )
      `)
      .order('created_at', { ascending: false })
      .limit(30);

    if (category !== 'all') {
      itemQuery = itemQuery.eq('category', category);
    }

    const { data, error } = await itemQuery;
    if (error) throw error;
    const items = (data || []).map(item => ScrapyardItem.formatItem(item));

    // Add items to feed
    items.forEach(item => {
      feed.addItem({
        title: item.title,
        id: `${SITE_URL}/scrapyard/item/${item._id}`,
        link: `${SITE_URL}/scrapyard/item/${item._id}`,
        description: item.description,
        content: item.description,
        author: [
          {
            name: item.creator.displayName,
            link: `${SITE_URL}/profile/${item.creator.username}`
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
    next(err);
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
