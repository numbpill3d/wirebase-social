const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../models/User');
const { ensureAuthenticated } = require('../utils/auth-helpers');

// Login page
router.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/profile');
  }
  const errorMsg = req.flash('error')[0] || req.flash('error_msg')[0];
  res.render('users/login', {
    title: 'Login - Wirebase',
    pageTheme: 'dark-dungeon',
    error_msg: errorMsg,
    email: req.flash('email')[0]
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
router.post('/register', async (req, res, next) => {
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

  if (username && !/^[a-zA-Z0-9_-]+$/u.test(username)) {
    errors.push({ msg: 'Username can only contain letters, numbers, underscores, and hyphens' });
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
    next(err);
  }
});

// Handle login process
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      req.flash('error_msg', info && info.message ? info.message : 'Invalid credentials');
      req.flash('email', req.body.email);
      return res.redirect('/users/login');
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) { return next(loginErr); }
      return res.redirect('/profile');
    });
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
router.post('/forgot-password', async (req, res, next) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ email });
    
    // Don't reveal if user exists or not for security
    req.flash('success_msg', 'If an account with that email exists, a password reset link has been sent');
    res.redirect('/users/login');
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Account settings page
router.get('/settings', ensureAuthenticated, (req, res) => {
  res.render('users/settings', {
    title: 'Account Settings - Wirebase',
    user: req.user,
    displayName: req.user.displayName,
    email: req.user.email,
    customGlyph: req.user.customGlyph,
    statusMessage: req.user.statusMessage,
    pageTheme: 'dark-dungeon'
  });
});

// Update account settings
router.post('/settings', ensureAuthenticated, async (req, res, next) => {
  const { displayName, email, statusMessage, customGlyph } = req.body;
  const errors = [];

  // Validate inputs
  if (displayName && displayName.length < 3) {
    errors.push({ msg: 'Display name must be at least 3 characters' });
  }

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push({ msg: 'Please enter a valid email address' });
  }

  if (customGlyph && customGlyph.length > 2) {
    errors.push({ msg: 'Custom glyph must be at most 2 characters' });
  }

  // Check if new email already exists
  if (email && email !== req.user.email) {
    const existing = await User.findOne({ email });
    if (existing) {
      errors.push({ msg: 'Email is already registered' });
    }
  }

  if (errors.length > 0) {
    return res.render('users/settings', {
      title: 'Account Settings - Wirebase',
      user: req.user,
      errors,
      displayName,
      email,
      customGlyph,
      statusMessage,
      pageTheme: 'dark-dungeon'
    });
  }

  try {
    const updateData = {
      displayName: displayName || req.user.displayName,
      email: email || req.user.email,
      statusMessage: statusMessage || req.user.statusMessage
    };

    if (customGlyph) {
      updateData.customGlyph = customGlyph;
    }

    await User.findByIdAndUpdate(req.user.id, updateData);

    req.flash('success_msg', 'Account settings updated');
    res.redirect('/users/settings');
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Change password
router.post('/change-password', ensureAuthenticated, async (req, res, next) => {
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
    next(err);
  }
});

module.exports = router;