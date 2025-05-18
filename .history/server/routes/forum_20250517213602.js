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
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;

    // Validate category
    const validCategories = ['general', 'tech', 'creative', 'meta'];
    if (!validCategories.includes(category)) {
      return res.status(404).render('error', {
        title: '404 - Category Not Found',
        errorCode: 404,
        message: 'The category you are looking for does not exist.',
        theme: 'dark-dungeon'
      });
    }

    res.render('forum/category', {
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} - Assembly - Wirebase`,
      category,
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
router.get('/thread/:id', (req, res) => {
  try {
    const { id } = req.params;

    // In a real app, we would fetch the thread from the database
    // For now, we'll just render a placeholder

    res.render('forum/thread', {
      title: 'Thread - Assembly - Wirebase',
      threadId: id,
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
router.get('/new', ensureAuthenticated, (req, res) => {
  res.render('forum/new-thread', {
    title: 'New Thread - Assembly - Wirebase',
    pageDescription: 'Create a new discussion thread',
    pageTheme: 'dark-dungeon',
    additionalStyles: ['/css/forum.css'],
    additionalScripts: [
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js',
      '/js/forum.js'
    ]
  });
});

// Post new thread (requires authentication)
router.post('/new', ensureAuthenticated, (req, res) => {
  try {
    const { title, category, content } = req.body;
    const errors = [];

    // Validate input
    if (!title || !category || !content) {
      errors.push({ msg: 'Please fill in all fields' });
    }

    if (title && title.length > 100) {
      errors.push({ msg: 'Title cannot exceed 100 characters' });
    }

    if (errors.length > 0) {
      return res.render('forum/new-thread', {
        title: 'New Thread - Assembly - Wirebase',
        errors,
        formData: { title, category, content },
        pageTheme: 'dark-dungeon',
        additionalStyles: ['/css/forum.css'],
        additionalScripts: [
          'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js',
          '/js/forum.js'
        ]
      });
    }

    // In a real app, we would save the thread to the database
    // For now, we'll just redirect to the forum home

    req.flash('success_msg', 'Thread created successfully');
    res.redirect('/forum');
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
router.post('/thread/:id/reply', ensureAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Validate input
    if (!content) {
      req.flash('error_msg', 'Reply content cannot be empty');
      return res.redirect(`/forum/thread/${id}`);
    }

    // In a real app, we would save the reply to the database
    // For now, we'll just redirect back to the thread

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