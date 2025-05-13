const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const ScrapyardItem = require('../models/ScrapyardItem');

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view this resource');
  res.redirect('/users/login');
};

// Set up file storage for uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const category = req.body.category || 'widget';
    const dir = path.join(__dirname, '../../public/uploads/scrapyard', category);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept specific file types based on category
  const allowedTypes = {
    widget: ['.js', '.html'],
    template: ['.html', '.css'],
    icon: ['.png', '.svg', '.ico', '.jpg', '.jpeg', '.gif'],
    banner: ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
    gif: ['.gif']
  };

  const category = req.body.category || 'widget';
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes[category] && allowedTypes[category].includes(ext)) {
    return cb(null, true);
  }

  cb(new Error(`Invalid file type for ${category}. Allowed types: ${allowedTypes[category].join(', ')}`));
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Helper functions for fetching items
const getTopItems = async (limit = 8) => {
  try {
    const items = await ScrapyardItem.find()
      .sort({ usageCount: -1, createdAt: -1 })
      .limit(limit)
      .populate('creator', 'username displayName avatar customGlyph');

    return { rows: items };
  } catch (error) {
    console.error('Error getting top items:', error);
    return { rows: [] };
  }
};

const getRecentItems = async (limit = 12) => {
  try {
    const categories = ['widget', 'template', 'icon', 'banner', 'gif'];
    const recentItems = {};

    for (const category of categories) {
      recentItems[category] = await ScrapyardItem.find({ category })
        .sort({ createdAt: -1 })
        .limit(Math.ceil(limit / categories.length))
        .populate('creator', 'username displayName avatar customGlyph');
    }

    return recentItems;
  } catch (error) {
    console.error('Error getting recent items:', error);
    return {};
  }
};

const getFeaturedItems = async (limit = 6) => {
  try {
    return await ScrapyardItem.find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('creator', 'username displayName avatar customGlyph');
  } catch (error) {
    console.error('Error getting featured items:', error);
    return [];
  }
};

// Main Scrapyard marketplace page
router.get('/', async (req, res, next) => {
  try {
    const [topItems, recentItems, featuredItems] = await Promise.all([
      getTopItems(8),
      getRecentItems(12),
      getFeaturedItems(6)
    ]);

    res.render('scrapyard/index', {
      title: 'The Scrapyard - Wirebase',
      topItems: topItems.rows,
      recentItems,
      featuredItems,
      pageTheme: res.locals.pageTheme
    });
  } catch (err) {
    console.error('Scrapyard error:', err);
    // Use consistent error handling
    next(new Error('Failed to load Scrapyard: ' + err.message));
  }
});

// View specific category
router.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const validCategories = ['widget', 'template', 'icon', 'banner', 'gif'];

    if (!validCategories.includes(category)) {
      return res.status(404).render('error', {
        title: '404 - Category Not Found',
        errorCode: 404,
        message: 'The category you are looking for does not exist.',
        theme: 'dark-dungeon'
      });
    }

    // Set category title
    const categoryTitles = {
      widget: 'Abandoned Processes',
      template: 'Dead Shells',
      icon: 'Data Fragments',
      banner: 'Signal Echoes',
      gif: 'Visual Artifacts'
    };

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    // Sorting
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      popular: { usageCount: -1, createdAt: -1 },
      votes: { 'votes.upvotes': -1, createdAt: -1 }
    };

    const sort = sortOptions[req.query.sort] || sortOptions.newest;

    // Query items
    const items = await ScrapyardItem.find({ category })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('creator', 'username displayName avatar customGlyph');

    // Count total items for pagination
    const total = await ScrapyardItem.countDocuments({ category });
    const totalPages = Math.ceil(total / limit);

    res.render('scrapyard/category', {
      title: `${categoryTitles[category]} - Wirebase`,
      category,
      categoryTitle: categoryTitles[category],
      items,
      pagination: {
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      sort: req.query.sort || 'newest',
      pageTheme: 'dark-dungeon'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error loading this category',
      theme: 'broken-window'
    });
  }
});

// View a specific item
router.get('/item/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await ScrapyardItem.findById(id)
      .populate('creator', 'username displayName avatar customGlyph statusMessage')
      .populate('comments.user', 'username displayName avatar customGlyph');

    if (!item) {
      return res.status(404).render('error', {
        title: '404 - Item Not Found',
        errorCode: 404,
        message: 'The item you are looking for does not exist.',
        theme: 'dark-dungeon'
      });
    }

    // Check if user has voted
    let userVote = null;
    if (req.isAuthenticated()) {
      if (item.votes.upvotes.includes(req.user._id)) {
        userVote = 'up';
      } else if (item.votes.downvotes.includes(req.user._id)) {
        userVote = 'down';
      }
    }

    // Increment view count
    await ScrapyardItem.findByIdAndUpdate(req.params.id, { $inc: { usageCount: 1 } });

    // Get similar items
    const similarItems = await ScrapyardItem.find({
      category: item.category,
      _id: { $ne: item._id }
    })
    .sort({ createdAt: -1 })
    .limit(4)
    .populate('creator', 'username displayName');

    res.render('scrapyard/item', {
      title: `${item.title} - Wirebase Scrapyard`,
      item,
      userVote,
      similarItems,
      pageTheme: 'dark-dungeon'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error loading this item',
      theme: 'broken-window'
    });
  }
});

// Submit a new item page
router.get('/submit', ensureAuthenticated, (_, res) => {
  res.render('scrapyard/submit', {
    title: 'Submit to Scrapyard - Wirebase',
    pageTheme: 'dark-dungeon'
  });
});

// Submit a new item
router.post('/submit', ensureAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const { title, description, category, price, tags } = req.body;
    const errors = [];

    // Validation
    if (!title || !description || !category) {
      errors.push({ msg: 'Please fill in all required fields' });
    }

    if (title && title.length > 100) {
      errors.push({ msg: 'Title cannot exceed 100 characters' });
    }

    if (description && description.length > 500) {
      errors.push({ msg: 'Description cannot exceed 500 characters' });
    }

    // Process file or direct content
    let content = req.body.content || '';
    let previewImage = req.body.previewImage || '';

    if (req.file) {
      // For binary files, store the path
      const relativePath = `/uploads/scrapyard/${category}/${req.file.filename}`;

      if (['icon', 'banner', 'gif'].includes(category)) {
        previewImage = relativePath;
        content = relativePath;
      } else {
        // For text files, read content
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (['.js', '.html', '.css'].includes(ext)) {
          content = fs.readFileSync(req.file.path, 'utf8');
        } else {
          content = relativePath;
        }
      }
    }

    if (!content && !req.file) {
      errors.push({ msg: 'Please provide content or upload a file' });
    }

    if (errors.length > 0) {
      return res.render('scrapyard/submit', {
        title: 'Submit to Scrapyard - Wirebase',
        errors,
        title,
        description,
        category,
        price,
        tags,
        content,
        pageTheme: 'dark-dungeon'
      });
    }

    // Process tags
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    // Create new item with proper validation
    const newItem = new ScrapyardItem({
      title: title.trim(),
      description: description.trim(),
      creator: req.user._id,
      category: category,
      content: content,
      previewImage: previewImage || null,
      price: Number(price) || 0,
      tags: tagArray
    });

    // Validate the model before saving
    const validationError = newItem.validateSync();
    if (validationError) {
      const errors = Object.values(validationError.errors).map(err => err.message);
      return res.render('scrapyard/submit', {
        title: 'Submit to Scrapyard - Wirebase',
        errors,
        title,
        description,
        category,
        price,
        tags,
        content,
        pageTheme: 'dark-dungeon'
      });
    }

    await newItem.save();

    // Award user with loot tokens for submitting content
    const lootTokens = {
      widget: 5,
      template: 10,
      icon: 3,
      banner: 7,
      gif: 5
    };

    // Add validation and error handling
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: {
          lootTokens: lootTokens[category] || 5,
          totalSubmissions: 1
        }
      },
      {
        new: true,
        runValidators: true
      }
    ).catch(err => {
      console.error('Failed to award tokens:', err);
      // Continue execution but log the error
    });

    req.flash('success_msg', `Item submitted successfully! You earned ${lootTokens[category] || 5} loot tokens.`);
    res.redirect(`/scrapyard/item/${newItem._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error submitting your item',
      theme: 'broken-window'
    });
  }
});

// Vote on an item
router.post('/item/:id/vote', ensureAuthenticated, async (req, res) => {
  try {
    const { vote } = req.body;
    const itemId = req.params.id;

    if (!['up', 'down', 'none'].includes(vote)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    const item = await ScrapyardItem.findById(itemId);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Remove existing votes first
    item.votes.upvotes = item.votes.upvotes.filter(id => id.toString() !== req.user._id.toString());
    item.votes.downvotes = item.votes.downvotes.filter(id => id.toString() !== req.user._id.toString());

    // Add new vote
    if (vote === 'up') {
      item.votes.upvotes.push(req.user._id);
    } else if (vote === 'down') {
      item.votes.downvotes.push(req.user._id);
    }

    await item.save();

    // Calculate new vote score
    const upvotes = item.votes.upvotes.length;
    const downvotes = item.votes.downvotes.length;

    res.json({
      success: true,
      upvotes,
      downvotes,
      score: upvotes - downvotes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a comment to an item
router.post('/item/:id/comment', ensureAuthenticated, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      req.flash('error_msg', 'Comment cannot be empty');
      return res.redirect(`/scrapyard/item/${req.params.id}`);
    }

    if (text.length > 300) {
      req.flash('error_msg', 'Comment cannot exceed 300 characters');
      return res.redirect(`/scrapyard/item/${req.params.id}`);
    }

    const item = await ScrapyardItem.findById(req.params.id);

    if (!item) {
      return res.status(404).render('error', {
        title: '404 - Item Not Found',
        errorCode: 404,
        message: 'The item you are looking for does not exist.',
        theme: 'dark-dungeon'
      });
    }

    item.comments.push({
      user: req.user._id,
      text: text.trim()
    });

    await item.save();

    req.flash('success_msg', 'Comment added successfully');
    res.redirect(`/scrapyard/item/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error adding your comment',
      theme: 'broken-window'
    });
  }
});

// Search the Scrapyard
router.get('/search', async (req, res, next) => {
  try {
    const { q = '', category = 'all' } = req.query;
    const query = q;

    if (!query) {
      return res.redirect('/scrapyard');
    }

    // Build search filter
    const filter = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    };

    if (category !== 'all') {
      filter.category = category;
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    // Execute search
    const items = await ScrapyardItem.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'username displayName avatar customGlyph');

    // Count total results for pagination
    const total = await ScrapyardItem.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.render('scrapyard/search', {
      title: `Search: ${query} - Wirebase Scrapyard`,
      query,
      category,
      items,
      total,
      pagination: {
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      pageTheme: 'dark-dungeon'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error processing your search',
      theme: 'broken-window'
    });
  }
});

// Download/Use counter
router.post('/item/:id/download', async (req, res, next) => {
  try {
    const { id } = req.params;
    // Increment download count
    await ScrapyardItem.findByIdAndUpdate(id, { $inc: { downloads: 1 } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
