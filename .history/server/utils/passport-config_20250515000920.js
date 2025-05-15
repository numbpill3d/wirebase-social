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
        // Find user by email with password for authentication
        const user = await User.findOneWithPassword({ email: email });

        // Check if user exists
        if (!user) {
          return done(null, false, { message: 'That email is not registered' });
        }

        // Match password using async/await for better error handling
        try {
          const isMatch = await bcrypt.compare(password, user.password);

          if (isMatch) {
            // Remove password before passing to done
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;
            return done(null, userWithoutPassword);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        } catch (bcryptErr) {
          console.error('Password comparison error:', bcryptErr);
          return done(bcryptErr);
        }
      } catch (err) {
        console.error('Authentication error:', err);
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
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      console.error('Deserialize user error:', err);
      done(err, null);
    }
  });
};