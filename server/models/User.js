const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// User schema for Wirebase
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: {
    type: String,
    trim: true,
    default: function() {
      return this.username;
    }
  },
  profileHtml: {
    type: String,
    default: '<div class="profile-default">Welcome to my Wirebase profile!</div>'
  },
  profileCss: {
    type: String,
    default: '.profile-default { padding: 20px; border: 2px solid #8a2be2; background-color: #2a1a41; color: #ffd700; font-family: "MS Sans Serif", sans-serif; text-align: center; }'
  },
  avatar: {
    type: String,
    default: '/images/default-avatar.png'
  },
  customGlyph: {
    type: String,
    default: '⚔️'
  },
  statusMessage: {
    type: String,
    default: 'Just joined Wirebase',
    maxlength: 100
  },
  statusIcon: {
    type: String,
    enum: ['online', 'away', 'busy', 'offline', 'unknown'],
    default: 'online'
  },
  lootTokens: {
    type: Number,
    default: 10
  },
  badges: [{
    name: String,
    icon: String,
    description: String,
    dateAwarded: {
      type: Date,
      default: Date.now
    }
  }],
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  streetpassVisitors: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    emote: {
      type: String,
      default: '👋'
    }
  }],
  streetpassEnabled: {
    type: Boolean,
    default: true
  },
  customEmotes: [{
    code: String,
    icon: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  }
});

// Create a virtual property for the user's full profile URL
UserSchema.virtual('profileUrl').get(function() {
  return `/profile/${this.username}`;
});

// Method to update last active timestamp
UserSchema.methods.updateActivity = function() {
  this.lastActive = Date.now();
  return this.save();
};

// Create the User model
const User = mongoose.model('User', UserSchema);

module.exports = User;