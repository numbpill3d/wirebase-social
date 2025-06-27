const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ScrapyardItem = require('../models/ScrapyardItem');
const Streetpass = require('../models/Streetpass');
const Feed = require('feed').Feed;
const { supabase } = require('../utils/database');

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view this resource');
  res.redirect('/users/login');
};

// User's own profile page
router.get('/', ensureAuthenticated, async (req, res, next) => {
  try {
    // Find the user
    const user = await User.findById(req.user.id);

    // Get recent visitors using Streetpass model
    const visitors = await Streetpass.getVisitors(user.id, 10);
    
    // User's items in the Scrapyard
    const userItems = await ScrapyardItem.find({ creator: user._id })
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.render('profile/profile', {
      title: `${user.displayName} - Wirebase Profile`,
      user,
      visitors,
      userItems,
      isOwner: true,
      pageTheme: 'dark-dungeon'
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// View another user's profile
router.get('/:username', async (req, res, next) => {
  try {
    // Find the user by username
    const profileUser = await User.findOne({ username: req.params.username });
    
    if (!profileUser) {
      return res.status(404).render('error', {
        title: '404 - User Not Found',
        errorCode: 404,
        message: 'The user you are looking for does not exist.',
        theme: 'dark-dungeon'
      });
    }
    
    // Check if the current user is the owner
    const isOwner = req.isAuthenticated() && req.user.id === profileUser.id;
    
    // Record a visit if authenticated and not the profile owner
    if (req.isAuthenticated() && !isOwner && profileUser.streetpassEnabled) {
      await Streetpass.recordVisit(req.user.id, profileUser.id, '👋');
    }
    
    // Get user's items in the Scrapyard
    const userItems = await ScrapyardItem.find({ creator: profileUser._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .catch(err => {
        console.error('Failed to fetch user items:', err);
        return []; // Return empty array instead of failing
      });
    
    // Get recent visitors via Streetpass model
    const visitors = await Streetpass.getVisitors(profileUser.id, 10);
    
    res.render('profile/view', {
      title: `${profileUser.displayName} - Wirebase Profile`,
      profileUser,
      visitors,
      userItems,
      isOwner,
      pageTheme: 'dark-dungeon'
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Edit profile HTML/CSS
router.get('/edit/html', ensureAuthenticated, (req, res) => {
  res.render('profile/edit-html', {
    title: 'Edit Profile HTML - Wirebase',
    user: req.user,
    pageTheme: 'retro-windows'
  });
});

// Save profile HTML
router.post('/edit/html', ensureAuthenticated, async (req, res, next) => {
  try {
    const { profileHtml } = req.body;
    
    // Update the user's profile HTML
    const updated = await User.findByIdAndUpdate(req.user.id, { profileHtml });
    if (updated) {
      req.user = { ...req.user, ...updated };
    }
    
    req.flash('success_msg', 'Profile HTML updated successfully');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Edit profile CSS
router.get('/edit/css', ensureAuthenticated, (req, res) => {
  res.render('profile/edit-css', {
    title: 'Edit Profile CSS - Wirebase',
    user: req.user,
    pageTheme: 'retro-windows'
  });
});

// Save profile CSS
router.post('/edit/css', ensureAuthenticated, async (req, res, next) => {
  try {
    const { profileCss } = req.body;
    
    // Update the user's profile CSS
    const updated = await User.findByIdAndUpdate(req.user.id, { profileCss });
    if (updated) {
      req.user = { ...req.user, ...updated };
    }
    
    req.flash('success_msg', 'Profile CSS updated successfully');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Edit theme
router.get('/edit/theme', ensureAuthenticated, (req, res) => {
  res.render('profile/edit-theme', {
    title: 'Edit Theme - Wirebase',
    currentTheme: req.session.theme || 'dark-dungeon',
    pageTheme: 'retro-windows'
  });
});

// Save theme selection
router.post('/edit/theme', ensureAuthenticated, (req, res) => {
  const { theme } = req.body;
  req.session.theme = theme;
  req.flash('success_msg', 'Theme updated successfully');
  res.redirect('/profile');
});

// Terminal mode for profile editing
router.get('/terminal', ensureAuthenticated, (req, res) => {
  res.render('profile/terminal', {
    title: 'Terminal Mode - Wirebase',
    user: req.user,
    pageTheme: 'terminal'
  });
});

// RSS feed for user profile
router.get('/:username/feed', async (req, res, next) => {
  try {
    // Find the user by username
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).send('User not found');
    }
    
    // Find user's items in the Scrapyard
    const userItems = await ScrapyardItem.find({ creator: user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    // Create feed
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
    
    // Add items to feed
    userItems.forEach(item => {
      feed.addItem({
        title: item.title,
        id: `https://wirebase.example.com/scrapyard/items/${item._id}`,
        link: `https://wirebase.example.com/scrapyard/items/${item._id}`,
        description: item.description,
        content: item.content,
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
    
    // Set content type and send feed
    res.set('Content-Type', 'application/rss+xml');
    res.send(feed.rss2());
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Update streetpass emote
router.post('/:username/streetpass/emote', ensureAuthenticated, async (req, res, next) => {
  try {
    const { emote } = req.body;
    const profileUser = await User.findOne({ username: req.params.username });
    
    if (!profileUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find the visit record and update the emote using Supabase
    const { data: visit, error } = await supabase
      .from('streetpass_visits')
      .select('id')
      .eq('visitor_id', req.user.id)
      .eq('profile_id', profileUser.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (visit) {
      await Streetpass.updateEmote(visit.id, emote);
      return res.json({ success: true });
    } else {
      return res.status(400).json({ error: 'No visit found' });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
