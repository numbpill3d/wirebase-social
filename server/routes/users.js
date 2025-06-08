const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../models/User');

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view this resource');
  res.redirect('/users/login');
};

// Login page
router.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/profile');
  }
  res.render('users/login', {
    title: 'Login - Wirebase',
    pageTheme: 'dark-dungeon'
  });
});

// Register page
router.get('/register', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/profile');
  }
  res.render('users/register', {
    title: 'Register - Wirebase',
    pageTheme: 'dark-dungeon'
  });
});

// Handle user registration
router.post('/register', async (req, res) => {
  const { username, email, password, password2, displayName, customGlyph, statusMessage } = req.body;
  const errors = [];

  // Check required fields
  if (!username || !email || !password || !password2) {
    errors.push({ msg: 'Please fill in all required fields' });
  }

  // Check if passwords match
  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  // Check password length
  if (password && password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  // Check username format and length
  if (username && (username.length < 3 || username.length > 20)) {
    errors.push({ msg: 'Username must be between 3 and 20 characters' });
  }

  if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push({ msg: 'Username can only contain letters, numbers, underscores, and hyphens' });
  }

  // Validate email format
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ msg: 'Invalid email address' });
  }

  // Validate custom glyph
  if (customGlyph && customGlyph.length > 2) {
    errors.push({ msg: 'Custom glyph must be at most 2 characters' });
  }

  // If there are errors, render the register page with errors
  if (errors.length > 0) {
    return res.render('users/register', {
      title: 'Register - Wirebase',
      errors,
      username,
      email,
      displayName,
      customGlyph,
      statusMessage,
      pageTheme: 'dark-dungeon'
    });
  }

  try {
    // Check if user with email or username already exists
    const emailExists = await User.findOne({ email: email });
    const usernameExists = await User.findOne({ username: username });

    if (emailExists) {
      errors.push({ msg: 'Email is already registered' });
    }

    if (usernameExists) {
      errors.push({ msg: 'Username is already taken' });
    }

    if (errors.length > 0) {
      return res.render('users/register', {
        title: 'Register - Wirebase',
        errors,
        username,
        email,
        displayName,
        customGlyph,
        statusMessage,
        pageTheme: 'dark-dungeon'
      });
    }

    // Create new user with Supabase
    await User.create({
      username,
      email,
      password,
      displayName: displayName || username,
      customGlyph: customGlyph || '⚔️',
      statusMessage: statusMessage || 'Just joined Wirebase'
    });
    // Note: Password hashing is handled in User.create()

    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/users/login');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'Registration error occurred',
      theme: 'broken-window'
    });
  }
});

// Handle login process
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Logout route
router.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });
});

// Password reset request page
router.get('/forgot-password', (req, res) => {
  res.render('users/forgot-password', {
    title: 'Forgot Password - Wirebase',
    pageTheme: 'dark-dungeon'
  });
});

// Handle password reset request
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ email });
    
    // Don't reveal if user exists or not for security
    req.flash('success_msg', 'If an account with that email exists, a password reset link has been sent');
    res.redirect('/users/login');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'Error processing password reset',
      theme: 'broken-window'
    });
  }
});

// Account settings page
router.get('/settings', ensureAuthenticated, (req, res) => {
  res.render('users/settings', {
    title: 'Account Settings - Wirebase',
    user: req.user,
    pageTheme: 'dark-dungeon'
  });
});

// Update account settings
router.post('/settings', ensureAuthenticated, async (req, res) => {
  const { displayName, email, statusMessage, customGlyph } = req.body;
  
  try {
    // Prepare update data
    const updateData = {
      displayName: displayName || req.user.displayName,
      email: email || req.user.email,
      statusMessage: statusMessage || req.user.statusMessage
    };
    
    if (customGlyph && customGlyph.length <= 2) {
      updateData.customGlyph = customGlyph;
    }
    
    // Use Supabase method to update
    await User.findByIdAndUpdate(req.user.id, updateData);
    
    req.flash('success_msg', 'Account settings updated');
    res.redirect('/users/settings');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'Error updating account settings',
      theme: 'broken-window'
    });
  }
});

// Change password
router.post('/change-password', ensureAuthenticated, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const errors = [];
  
  // Check password match
  if (newPassword !== confirmPassword) {
    errors.push({ msg: 'New passwords do not match' });
  }
  
  // Check password length
  if (newPassword.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }
  
  if (errors.length > 0) {
    return res.render('users/settings', {
      title: 'Account Settings - Wirebase',
      user: req.user,
      errors,
      pageTheme: 'dark-dungeon'
    });
  }
  
  try {
    // Get user with password for verification
    const user = await User.findByIdWithPassword(req.user.id);
    
    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      errors.push({ msg: 'Current password is incorrect' });
      return res.render('users/settings', {
        title: 'Account Settings - Wirebase',
        user: req.user,
        errors,
        pageTheme: 'dark-dungeon'
      });
    }
    
    // Update with new password - hashing will be handled by the User model
    await User.findByIdAndUpdate(req.user.id, { password: newPassword });
    
    req.flash('success_msg', 'Password updated successfully');
    res.redirect('/users/settings');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      errorCode: 500,
      message: 'Error updating password',
      theme: 'broken-window'
    });
  }
});

module.exports = router;