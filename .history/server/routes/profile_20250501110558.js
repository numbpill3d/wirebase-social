const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ScrapyardItem = require('../models/ScrapyardItem');
const Feed = require('feed').Feed;

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view this resource');
  res.redirect('/users/login');
};

// User's own profile page
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Find the user with their streetpass visitors populated
    const user = await User.findById(req.user._id)
      .populate({
        path: 'streetpassVisitors.user',
        select: 'username customGlyph avatar'
      });
    
    // Get recent visitors
    const visitors = user.streetpassVisitors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
    
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
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error loading your profile',
      theme: 'broken-window'
    });
  }
});

// View another user's profile
router.get('/:username', async (req, res) => {
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
    const isOwner = req.isAuthenticated() && req.user._id.toString() === profileUser._id.toString();
    
    // Record a visit if authenticated and not the profile owner
    if (req.isAuthenticated() && !isOwner) {
      // Check if there's already a recent visit (within 1 hour)
      const recentVisit = profileUser.streetpassVisitors.find(v => 
        v.user.toString() === req.user._id.toString() && 
        ((new Date()) - v.timestamp) < 60 * 60 * 1000
      );
      
      if (!recentVisit && profileUser.streetpassEnabled) {
        // Add current user to profile's visitors
        profileUser.streetpassVisitors.push({
          user: req.user._id,
          timestamp: new Date(),
          emote: '👋' // Default emote
        });
        
        await profileUser.save();
      }
    }
    
    // Get user's items in the Scrapyard
    const userItems = await ScrapyardItem.find({ creator: profileUser._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .catch(err => {
        console.error('Failed to fetch user items:', err);
        return []; // Return empty array instead of failing
      });
    
    // Populate streetpass visitors with error handling
    try {
      await profileUser.populate({
        path: 'streetpassVisitors.user',
        select: 'username customGlyph avatar'
      });
    } catch (err) {
      console.error('Failed to populate visitors:', err);
      profileUser.streetpassVisitors = [];
    }
    
    // Get recent visitors
    const visitors = profileUser.streetpassVisitors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
    
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
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error loading this profile',
      theme: 'broken-window'
    });
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
router.post('/edit/html', ensureAuthenticated, async (req, res) => {
  try {
    const { profileHtml } = req.body;
    
    // Update the user's profile HTML
    const user = await User.findById(req.user._id);
    user.profileHtml = profileHtml;
    await user.save();
    
    req.flash('success_msg', 'Profile HTML updated successfully');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error saving your profile HTML',
      theme: 'broken-window'
    });
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
router.post('/edit/css', ensureAuthenticated, async (req, res) => {
  try {
    const { profileCss } = req.body;
    
    // Update the user's profile CSS
    const user = await User.findById(req.user._id);
    user.profileCss = profileCss;
    await user.save();
    
    req.flash('success_msg', 'Profile CSS updated successfully');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'There was an error saving your profile CSS',
      theme: 'broken-window'
    });
  }
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
router.get('/:username/feed', async (req, res) => {
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
    res.status(500).send('Error generating feed');
  }
});

// Update streetpass emote
router.post('/:username/streetpass/emote', ensureAuthenticated, async (req, res) => {
  try {
    const { emote } = req.body;
    const profileUser = await User.findOne({ username: req.params.username });
    
    if (!profileUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find the visitor entry and update the emote
    const visitorIndex = profileUser.streetpassVisitors.findIndex(
      v => v.user.toString() === req.user._id.toString()
    );
    
    if (visitorIndex !== -1) {
      profileUser.streetpassVisitors[visitorIndex].emote = emote;
      await profileUser.save();
      return res.json({ success: true });
    } else {
      return res.status(400).json({ error: 'No visit found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
