/**
 * Passport configuration for authentication
 */
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Find user by email
        const user = await User.findOne({ email: email });
        
        // Check if user exists
        if (!user) {
          return done(null, false, { message: 'That email is not registered' });
        }
        
        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        });
      } catch (err) {
        console.error(err);
        return done(err);
      }
    })
  );
  
  // Serialize user for the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from the session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      // Don't expose password to client
      if (user) {
        delete user.password;
      }
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};