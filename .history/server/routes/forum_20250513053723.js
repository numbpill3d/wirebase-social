const express = require('express');
const router = express.Router();

// Authentication middleware
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view this resource');
  res.redirect('/users/login');
};

// Forum home page
router.get('/', (req, res) => {
  try {
    res.render('forum/index', {
      title: 'Assembly - Wirebase',
      pageDescription: 'Join the discussion in the Wirebase Assembly forum',
      pageTheme: 'dark-dungeon'
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
      pageTheme: 'dark-dungeon'
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
