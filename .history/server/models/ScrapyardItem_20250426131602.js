const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for items in the Scrapyard marketplace
const ScrapyardItemSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['widget', 'template', 'icon', 'banner', 'gif'],
    default: 'widget'
  },
  content: {
    type: String,
    required: true
  },
  previewImage: {
    type: String,
    default: function() {
      // Default preview based on category
      switch(this.category) {
        case 'widget':
          return '/images/defaults/widget-preview.png';
        case 'template':
          return '/images/defaults/template-preview.png';
        case 'icon':
          return '/images/defaults/icon-preview.png';
        case 'banner':
          return '/images/defaults/banner-preview.png';
        case 'gif':
          return '/images/defaults/gif-preview.png';
        default:
          return '/images/defaults/default-preview.png';
      }
    }
  },
  votes: {
    upvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    downvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  price: {
    type: Number,
    default: 0, // Free by default
    min: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  usageCount: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  comments: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for category name mapping
ScrapyardItemSchema.virtual('categoryName').get(function() {
  const categoryMap = {
    'widget': 'Widget Graveyard',
    'template': 'Template Crypt',
    'icon': 'Icon Vault',
    'banner': 'Banner Keep',
    'gif': 'GIF Dungeon'
  };
  
  return categoryMap[this.category] || 'Unknown Category';
});

// Method to calculate vote score
ScrapyardItemSchema.methods.getVoteScore = function() {
  return this.votes.upvotes.length - this.votes.downvotes.length;
};

// Pre-save hook to update the updatedAt timestamp
ScrapyardItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to record a usage of this item
ScrapyardItemSchema.methods.recordUsage = function() {
  this.usageCount += 1;
  return this.save();
};

// Create the ScrapyardItem model
const ScrapyardItem = mongoose.model('ScrapyardItem', ScrapyardItemSchema);

module.exports = ScrapyardItem;