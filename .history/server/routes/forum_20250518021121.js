const express = require('express');
const router = express.Router();
const Thread = require('../models/Thread');
const Reply = require('../models/Reply');
const { cache } = require('../utils/performance');

// Authentication middleware
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view this resource');
  res.redirect('/users/login');
};

// Forum home page
router.get('/', async (req, res) => {
  try {
    // Get recent threads
    const recentThreads = await Thread.getRecent(10);

    // Get categories (in a real app, we would fetch from database)
    const categories = [
      { name: 'general', description: 'General discussion about Wirebase', icon: '💬' },
      { name: 'tech', description: 'Technical discussions and help', icon: '💻' },
      { name: 'creative', description: 'Share your creative projects and ideas', icon: '🎨' },
      { name: 'meta', description: 'Discussions about the forum itself', icon: '🔄' }
    ];

    res.render('forum/index', {
      title: 'Assembly - Wirebase',
      pageDescription: 'Join the discussion in the Wirebase Assembly forum',
      pageTheme: 'dark-dungeon',
      recentThreads,
      categories,
      additionalStyles: ['/css/forum.css'],
      additionalScripts: [
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js',
        '/js/forum.js'
      ]
    });
  } catch (err) {
    console.error('Forum error:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error loading the forum',
      theme: 'broken-window'
    });
  }
});

// Forum categories
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    // Validate category against database
    const { data: categoryData, error: categoryError } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('name', category)
      .single();

    if (categoryError || !categoryData) {
      return res.status(404).render('error', {
        title: '404 - Category Not Found',
        errorCode: 404,
        message: 'The category you are looking for does not exist.',
        theme: 'dark-dungeon'
      });
    }

    // Get threads for this category
    const { threads, total } = await Thread.getByCategory(category, limit, offset);

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page + 1,
      prevPage: page - 1
    };

    // Use category info from database
    const categoryInfo = {
      name: categoryData.name,
      description: categoryData.description || `Discussions in the ${category} category`,
      icon: categoryData.icon || '📝'
    };

    res.render('forum/category', {
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} - Assembly - Wirebase`,
      category,
      categoryInfo,
      threads,
      pagination,
      pageDescription: `Discussions in the ${category} category`,
      pageTheme: 'dark-dungeon',
      additionalStyles: ['/css/forum.css'],
      additionalScripts: [
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js',
        '/js/forum.js'
      ]
    });
  } catch (err) {
    console.error('Forum category error:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error loading this category',
      theme: 'broken-window'
    });
  }
});

// View thread
router.get('/thread/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get thread from database
    const thread = await Thread.getById(id);

    if (!thread) {
      return res.status(404).render('error', {
        title: '404 - Thread Not Found',
        errorCode: 404,
        message: 'The thread you are looking for does not exist.',
        theme: 'dark-dungeon'
      });
    }

    // Increment view count (in a real app, we would do this)
    // await Thread.incrementViews(id);

    res.render('forum/thread', {
      title: `${thread.title} - Assembly - Wirebase`,
      thread,
      pageDescription: 'Forum thread discussion',
      pageTheme: 'dark-dungeon',
      additionalStyles: ['/css/forum.css'],
      additionalScripts: [
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js',
        '/js/forum.js'
      ]
    });
  } catch (err) {
    console.error('Forum thread error:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error loading this thread',
      theme: 'broken-window'
    });
  }
});

// Create new thread (requires authentication)
router.get('/new', ensureAuthenticated, async (req, res) => {
  try {
    // Get category from query parameter if provided
    const category = req.query.category || '';

    // Get categories from database for the dropdown
    const { data: categories, error: categoriesError } = await supabase
      .from('forum_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (categoriesError) throw categoriesError;

    res.render('forum/new-thread', {
      title: 'New Thread - Assembly - Wirebase',
      pageDescription: 'Create a new discussion thread',
      pageTheme: 'dark-dungeon',
      formData: { category },
      categories,
      additionalStyles: ['/css/forum.css'],
      additionalScripts: [
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js',
        '/js/forum.js'
      ]
    });
  } catch (err) {
    console.error('New thread form error:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error loading the new thread form',
      theme: 'broken-window'
    });
  }
});

// Post new thread (requires authentication)
router.post('/new', ensureAuthenticated, async (req, res) => {
  try {
    const { title, category, content, tags } = req.body;
    const errors = [];

    // Validate input
    if (!title || !category || !content) {
      errors.push({ msg: 'Please fill in all fields' });
    }

    if (title && title.length > 100) {
      errors.push({ msg: 'Title cannot exceed 100 characters' });
    }

    // Validate category against database
    const { data: categoryData, error: categoryError } = await supabase
      .from('forum_categories')
      .select('name')
      .eq('name', category)
      .single();

    if (categoryError || !categoryData) {
      errors.push({ msg: 'Invalid category' });
    }

    if (errors.length > 0) {
      return res.render('forum/new-thread', {
        title: 'New Thread - Assembly - Wirebase',
        errors,
        formData: { title, category, content, tags },
        pageTheme: 'dark-dungeon',
        additionalStyles: ['/css/forum.css'],
        additionalScripts: [
          'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js',
          '/js/forum.js'
        ]
      });
    }

    // Process tags if provided
    const processedTags = tags ?
      tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) :
      [];

    // Create the thread
    const result = await Thread.create({
      title,
      content,
      category,
      creatorId: req.user.id,
      tags: processedTags
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create thread');
    }

    req.flash('success_msg', 'Thread created successfully');
    res.redirect(`/forum/thread/${result.threadId}`);
  } catch (err) {
    console.error('New thread error:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error creating your thread',
      theme: 'broken-window'
    });
  }
});

// Post reply to thread (requires authentication)
router.post('/thread/:id/reply', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Validate input
    if (!content) {
      req.flash('error_msg', 'Reply content cannot be empty');
      return res.redirect(`/forum/thread/${id}`);
    }

    // Check if thread exists
    const thread = await Thread.getById(id);
    if (!thread) {
      req.flash('error_msg', 'Thread not found');
      return res.redirect('/forum');
    }

    // Check if thread is locked
    if (thread.isLocked) {
      req.flash('error_msg', 'This thread is locked and cannot receive new replies');
      return res.redirect(`/forum/thread/${id}`);
    }

    // Add the reply
    const result = await Reply.create({
      threadId: id,
      content,
      creatorId: req.user.id
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to post reply');
    }

    req.flash('success_msg', 'Reply posted successfully');
    res.redirect(`/forum/thread/${id}`);
  } catch (err) {
    console.error('Post reply error:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error posting your reply',
      theme: 'broken-window'
    });
  }
});

module.exports = router;