/**
 * Database seeding script for Wirebase
 * Populates the database with initial demo data
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../server/models/User');
const ScrapyardItem = require('../server/models/ScrapyardItem');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wirebase', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB for seeding'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Demo users data
const users = [
  {
    username: 'DungeonMaster',
    email: 'master@wirebase.com',
    password: 'password123',
    displayName: 'Dungeon Master',
    customGlyph: '🧙',
    statusMessage: 'Keeper of the code realm',
    profileHtml: `<div class="dungeon-master-profile">
      <h1>Welcome to the Dungeon</h1>
      <p>I am the keeper of ancient code secrets.</p>
      <div class="torch-container">
        <div class="torch left"></div>
        <div class="torch right"></div>
      </div>
      <p>Explore my chamber of digital wonders.</p>
    </div>`,
    profileCss: `.dungeon-master-profile {
      background-color: #1a0c2e;
      border: 3px solid #ffd700;
      padding: 20px;
      text-align: center;
      position: relative;
    }
    .dungeon-master-profile h1 {
      color: #ffd700;
      font-family: 'MedievalSharp', cursive;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
    }
    .torch-container {
      display: flex;
      justify-content: space-between;
      margin: 20px 0;
    }`,
    lootTokens: 500,
    role: 'admin',
    badges: [
      {
        name: 'Founder',
        icon: '👑',
        description: 'One of the founding members of Wirebase'
      },
      {
        name: 'Code Wizard',
        icon: '🧙',
        description: 'Expert coder and HTML wizard'
      }
    ]
  },
  {
    username: 'PixelKnight',
    email: 'knight@wirebase.com',
    password: 'password123',
    displayName: 'Pixel Knight',
    customGlyph: '⚔️',
    statusMessage: 'Defender of pixel perfection',
    profileHtml: `<div class="knight-profile">
      <div class="banner">
        <h1>Pixel Knight's Keep</h1>
      </div>
      <div class="knight-content">
        <p>I quest for the perfect pixel art and retro aesthetics.</p>
        <div class="pixel-showcase">
          <div class="pixel-art sword"></div>
          <div class="pixel-art shield"></div>
          <div class="pixel-art potion"></div>
        </div>
      </div>
    </div>`,
    profileCss: `.knight-profile {
      background-color: #2a3340;
      font-family: 'VT323', monospace;
    }
    .banner {
      background-color: #4b2883;
      padding: 10px;
      text-align: center;
      border-bottom: 3px solid #ffd700;
    }
    .knight-content {
      padding: 20px;
      text-align: center;
    }
    .pixel-showcase {
      display: flex;
      justify-content: space-around;
      margin-top: 20px;
    }
    .pixel-art {
      width: 50px;
      height: 50px;
      image-rendering: pixelated;
      background-size: contain;
    }
    .sword { background-color: silver; }
    .shield { background-color: #4b2883; }
    .potion { background-color: #ff7f00; }`,
    lootTokens: 350
  },
  {
    username: 'RetroQueen',
    email: 'queen@wirebase.com',
    password: 'password123',
    displayName: 'Retro Queen',
    customGlyph: '👑',
    statusMessage: 'Windows 98 forever!',
    profileHtml: `<div class="retro-profile">
      <div class="window-98">
        <div class="window-header">
          <span>RetroQueen.exe</span>
          <div class="window-controls">
            <span>_</span>
            <span>□</span>
            <span>×</span>
          </div>
        </div>
        <div class="window-content">
          <h1>Welcome to my 90s paradise!</h1>
          <p>This page is best viewed in Internet Explorer 5 at 800x600 resolution.</p>
          <marquee>Windows 98 was the peak of computing!</marquee>
          <div class="visitor-counter">
            <span>Visitors: 12,345</span>
          </div>
        </div>
      </div>
    </div>`,
    profileCss: `.retro-profile {
      font-family: 'MS Sans Serif', Tahoma, sans-serif;
    }
    .window-98 {
      background-color: #c0c0c0;
      border: 2px solid;
      border-color: #ffffff #808080 #808080 #ffffff;
      margin: 20px;
    }
    .window-header {
      background-color: #000080;
      color: white;
      padding: 3px 5px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
    }
    .window-controls {
      display: flex;
      gap: 2px;
    }
    .window-controls span {
      width: 16px;
      height: 14px;
      background-color: #c0c0c0;
      border: 1px solid;
      border-color: #ffffff #808080 #808080 #ffffff;
      text-align: center;
      line-height: 14px;
    }
    .window-content {
      padding: 10px;
    }
    .visitor-counter {
      background-color: #000;
      color: #0f0;
      font-family: 'VT323', monospace;
      padding: 5px 10px;
      display: inline-block;
      margin-top: 10px;
    }`,
    lootTokens: 280
  }
];

// Sample Scrapyard items
const scrapyardItems = [
  {
    title: 'Visitor Counter Widget',
    description: 'A retro Windows 98-style visitor counter that keeps track of profile visitors. Includes medieval fantasy styling.',
    category: 'widget',
    content: `<div class="visitor-counter">
      <div class="counter-header">Dungeon Visitors</div>
      <div class="counter-display">
        <span class="count" id="visitorCount">0</span>
      </div>
    </div>
    <script>
      (function() {
        const count = localStorage.getItem('visitorCount') || 0;
        const newCount = parseInt(count) + 1;
        document.getElementById('visitorCount').textContent = newCount;
        localStorage.setItem('visitorCount', newCount);
      })();
    </script>
    <style>
      .visitor-counter {
        background-color: #2a1a41;
        border: 2px solid #ffd700;
        padding: 5px;
        width: 150px;
        font-family: 'VT323', monospace;
      }
      .counter-header {
        background-color: #4b2883;
        color: #ffd700;
        text-align: center;
        padding: 3px;
        font-weight: bold;
      }
      .counter-display {
        background-color: #000;
        color: #0f0;
        padding: 5px;
        text-align: center;
        font-size: 1.2rem;
      }
    </style>`,
    previewImage: '/images/defaults/widget-preview.png',
    tags: ['counter', 'visitors', 'widget', 'retro'],
    price: 10
  },
  {
    title: 'Medieval Dungeon Template',
    description: 'A full-page HTML/CSS template with medieval dungeon aesthetics. Features stone textures, torches, and gothic styling.',
    category: 'template',
    content: `<div class="dungeon-template">
      <header class="dungeon-header">
        <h1>{{username}}'s Dungeon</h1>
        <div class="torch left"></div>
        <div class="torch right"></div>
      </header>
      <main class="dungeon-content">
        <section class="about-section">
          <h2>About the Keeper</h2>
          <p>Welcome to my dungeon realm. Here you'll find my personal treasures and artifacts.</p>
        </section>
        <section class="showcase-section">
          <h2>Artifacts</h2>
          <div class="artifacts-grid">
            <div class="artifact">Item 1</div>
            <div class="artifact">Item 2</div>
            <div class="artifact">Item 3</div>
          </div>
        </section>
      </main>
      <footer class="dungeon-footer">
        <p>© {{currentYear}} {{username}} - All rights reserved</p>
      </footer>
    </div>
    <style>
      .dungeon-template {
        background-color: #1a0c2e;
        color: #fff;
        font-family: 'MedievalSharp', cursive;
        max-width: 800px;
        margin: 0 auto;
        border: 3px solid #4b2883;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.7);
      }
      .dungeon-header {
        background-color: #2a1a41;
        padding: 20px;
        text-align: center;
        border-bottom: 2px solid #ffd700;
        position: relative;
      }
      .dungeon-header h1 {
        color: #ffd700;
        margin: 0;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
      }
      .torch {
        width: 10px;
        height: 20px;
        background-color: #ff7f00;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
      }
      .torch.left {
        left: 20px;
      }
      .torch.right {
        right: 20px;
      }
      .torch::before {
        content: '';
        position: absolute;
        width: 20px;
        height: 30px;
        background: radial-gradient(ellipse at center bottom, #ff7f00 0%, #ff9933 30%, rgba(255, 127, 0, 0) 70%);
        top: -25px;
        left: -5px;
      }
      .dungeon-content {
        padding: 20px;
      }
      .dungeon-content h2 {
        color: #ffd700;
        border-bottom: 1px solid #4b2883;
        padding-bottom: 5px;
      }
      .artifacts-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 20px;
      }
      .artifact {
        background-color: #2a1a41;
        padding: 15px;
        text-align: center;
        border: 1px solid #4b2883;
      }
      .dungeon-footer {
        background-color: #2a1a41;
        text-align: center;
        padding: 10px;
        border-top: 2px solid #4b2883;
        font-size: 0.9rem;
        color: #9075bb;
      }
    </style>`,
    previewImage: '/images/defaults/template-preview.png',
    tags: ['template', 'medieval', 'dungeon', 'gothic'],
    price: 50
  },
  {
    title: 'Windows 98 Icon Set',
    description: 'A collection of Windows 98-styled icons for your profile. Includes classic desktop icons reimagined with a fantasy twist.',
    category: 'icon',
    content: `<div class="icon-set">
      <div class="icon" title="My Computer">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGESURBVFhH7ZU9TsNAEIXfbgiSA6RJQ4OUgoYrpEtFxw3SkII7UHEBKiQukIYqFRQ0/NSRDGLe2jOJZZxgexVLfNKTJzuz8+ZtbFcTUXQjvQ/0GU5V0JPQoxDflcd5EcYbIeY+CB2FuPY5WAnTWBcuHYlkEX9aYYyx8lqz/dHAp31LqFkJ67xwIlkYJ8KvW55V9z3kBDYlmqXxlb0Ys4UDTkLm9BYuTAMG5dISG13rDV3rBYTm4KTr6DUHgp5wUjwHCH0K9EWjGUEP+6xkTuEaSsKgDEzCUX+h/ckYcTnfOjjlIhJ6xlGIX6G3MM+IA8ib0ONfwbWwiWshxRsn4x5HQUQ/v0IbHlnCfhNuxS/+NZwKRyCKoTLfZnxLOZfySziR3EB+E+q8HO7DNsZ7PJ2VzFcoifvQvA+a57Bv4kfO+Uxo3qOxnjnnROIbKSH55qViHLQ15xO4D+dLoeZF2IY3IZ35b/AQzsGceb8XuhW2ZXoXzr8JUzSaPzxZpJT+AHTzR1HGgy+tAAAAAElFTkSuQmCC" alt="My Computer" class="pixel-image">
        <span>My Computer</span>
      </div>
      <div class="icon" title="My Documents">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFMSURBVFhH7ZY9TsNAEIV3Q0HFIfizIZQ0XIEGqjoukYYUdEAlcoDQcYh0SBRUUECRAokCMZ7d0Xode9YbIkXikyyd0Y7fvBlbu5a6F3GvBn2BUxV0L/QgxHdFnIswPgkxj0LoUYhrn5O1MIm14dKRiI7c2QoTNpeXmq5Pcj7sW0LlWljnhRPRwnwF++ddjpWdj5wA5kQzNb6qkXO+EjZOQub0Vk5YPVR3kS8mDQVt4kM0lrMzQVt40Y0gDHjUL7jfGGOD/7Zwo0XCz0KfQiNhPDyykrWEaygJQ+XhCk4y0kJKWG3hVlThChOi8PjcgWvkBBR6Vp6wH4Ss4KzLYBOdL0KthW0m7sQf/jWcCx+AHPbz0LwP97/xGWc+E5r30VRnnAjeCBNSnXnFDNg35RO4D+dLoeZlaMMnIZ35b/Aazrma9XqXL6x1GuUHGCNGKTVpULsAAAAASUVORK5CYII=" alt="My Documents" class="pixel-image">
        <span>My Scrolls</span>
      </div>
      <div class="icon" title="Recycle Bin">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAIfSURBVFhH7ZY7TwJBFIVnl04KH4nRaKKJPBofjY1aWWFjYWer/8BCCxv/gYWFHRYW2mhsbHwUGuMLjfERYzQxvmJ0dnfG2V0QF5bbLXeSk2FnOHPnu3d2h5iblqS+LCyYiODJOZZMWXbewFq3iMXeRrFUyrMaJIFRnPEljVcTFVr+OhaLHTnHlGVHTyA1BuUc53g2QYx+5HbmyxgwakGpseVcV8AYU7QG5hGUcSzsY9pmDLEOlUxZdvQETiLpQYMl/FPkb92kKxz9Ev8LgWXNJV/F2YfGfIAaCIcVCmXg5aF1qGTKsqMn0EHxNYEPx0MtXxOrNWE1gSObxNwkdEIl1YQvSgJBNPUQOjI1gVubxGkBOqGSasIXJQGvTAhN3UVUiZ/NsFgsF5c5Oy9e6QhEYrRkqqOIyoTOA1SJ5+eyRXQJKFULprw6L15pAg/VLZrIrZkDuHJBHXjxF2xSYt0JtDXxrqsXV0fUpuZV4h0JtDTReZMl+KnQZJl4WwJNTbTgJSf0hbNJalfxtgSazrxZUCXe2IgqcXs55b2Zos4mVMxRE9/Wnck73pJA4MybRUSJm1dH1KbmVeItCQSaeQv9InFXAt9+R9lbGVOlc/lCvh73Ih4t4c0J4J/EjN+4u3hTAvgnceM37i4eTIC7JPnxPHX3SxlXvLiCRzkHcbzH8e83eSQGEjE8nvZikDiLe/FnB8Qbj/8k8gmPl8/PfwKsNQAAAABJRU5ErkJggg==" alt="Potion Bin" class="pixel-image">
        <span>Potion Bin</span>
      </div>
      <!-- Add more icons as needed -->
    </div>
    <style>
      .icon-set {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
      }
      .icon {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 70px;
        text-align: center;
      }
      .icon img {
        width: 32px;
        height: 32px;
        margin-bottom: 5px;
        image-rendering: pixelated;
      }
      .icon span {
        font-family: 'MS Sans Serif', Tahoma, sans-serif;
        font-size: 11px;
        color: #000;
      }
    </style>`,
    previewImage: '/images/defaults/icon-preview.png',
    tags: ['icons', 'windows98', 'pixel', 'retro'],
    price: 15
  },
  {
    title: 'Medieval Banner',
    description: 'A decorative medieval-style banner for your profile header. Features a castle silhouette and coat of arms.',
    category: 'banner',
    content: `<div class="medieval-banner">
      <div class="banner-content">
        <div class="banner-shield"></div>
        <h1 class="banner-title">{{username}}</h1>
        <div class="banner-shield"></div>
      </div>
    </div>
    <style>
      .medieval-banner {
        background-color: #4b2883;
        background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4wYTEyg5ZQA4CgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAFklEQVQI12P8//8/AwgwMjKCCQYiAABVuwQzOt7GRwAAAABJRU5ErkJggg==');
        height: 100px;
        border-top: 3px solid #ffd700;
        border-bottom: 3px solid #ffd700;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        overflow: hidden;
      }
      .medieval-banner::before,
      .medieval-banner::after {
        content: '';
        position: absolute;
        width: 50px;
        height: 100%;
        background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAALvSURBVGhD7ZlNi41RGIDPORgzRGYWRGbBQspCSlnYoBQLC9lYKQtlp5QdWSiZnQ1loWShLPwAGystlJIFG0LIcJlhxsz4mPH4POe8c+65593ce+937nwsPPXU+zjnvOe87/m6dzpT/E1kavoNFvq70KvQm9B7Lr5PFrEtCxPNQ9C1Sm9CRyPfNNKn0EvQaqV7oX3yt8CRTiR8CPs3dBA6CFXuheOr0PUxI8rvo1DPwGqCwvtL0Jcgx3t429+Vx/w/bNiObFD6FkpjrkOvhzLq+nU2XkcOI7dEF0JJb8OfUfPOxuPIJuQH6DRUuSMRoez9uh0R6TYj3BnHKJGrn6Z0F+nPLGO2KN9DF5ELQpGpqSfKnBBr26d9wqUiTSCBMrxzMqpJ3QmPIBw9Djmlzgz2HST04KBu9Xhxkg/hHeLXlVCCWPkGBnO1wHenr3NIHYkvcA5WvMmdT9kL0B1avCCDvILRz0Z1OTvCVRW9oT1XGbzDxrRxcP4oDCEGxNjsK9fYpXyRsbRi5oSGvOPIXQb8v0PLcZKndF8X9u0xeOSuhOOLyCv7LOJVZK5+jk5BnTDLTnQn4/+OOIkYDccv73jd5A4FYtZRtrmGHWKRnE70Vc5hRD/sPAU3KmRH1iHXhb1Qv0aSRiKXs98qG4g9VRwJZ3H0EWHLxNl3sccSAQkdiXU4xjk3ynmiS+xRVqxF6OQdj5A5E6soFyMhfqkPRfodjlHGDQn/JhHSp7lB7sQe9o7+ZcMvK98VudLJuzcxwqQ1ttrIr92QVk8e7a3CjyPvI1dmFXtZRRHw66hWYbfSl6D9kTNb6HLUMhxU+DmOKoofR/jCrJQ+FvnGE/r0LvdQ5CwGv00fxlEZxLAFOYYV6D5oNXL9GaPQO9CzgcMvrdGtRR3ZZDTqxBR+aBudLPrBcMB+pfNbRY3MlMnJbyPtYKoYdTHZdDr/AJEAOogUt5y8AAAAAElFTkSuQmCC');
        background-size: contain;
        top: 0;
      }
      .medieval-banner::before {
        left: 0;
      }
      .medieval-banner::after {
        right: 0;
        transform: scaleX(-1);
      }
      .banner-content {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .banner-shield {
        width: 40px;
        height: 50px;
        background-color: #ffd700;
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      }
      .banner-title {
        color: #ffd700;
        font-family: 'MedievalSharp', cursive;
        font-size: 2rem;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        margin: 0;
      }
    </style>`,
    previewImage: '/images/defaults/banner-preview.png',
    tags: ['banner', 'medieval', 'header', 'decoration'],
    price: 25
  },
  {
    title: 'Animated Torch GIF',
    description: 'An animated torch effect to light up your dungeon. Perfect for adding atmosphere to your profile.',
    category: 'gif',
    content: `<div class="torch-container">
      <div class="animated-torch"></div>
    </div>
    <style>
      .torch-container {
        display: inline-block;
      }
      .animated-torch {
        width: 30px;
        height: 60px;
        background-color: #4b2883;
        position: relative;
      }
      .animated-torch::before {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        background-color: #ff7f00;
        border-radius: 50% 50% 0 50%;
        top: -15px;
        left: 5px;
        transform-origin: center bottom;
        animation: flicker 3s infinite alternate;
      }
      @keyframes flicker {
        0%, 100% { 
          transform: rotate(-5deg) scale(1);
          opacity: 1;
          box-shadow: 0 0 20px #ff7f00, 0 0 30px #ff9933, 0 0 40px #ffcc00;
        }
        25% { 
          transform: rotate(5deg) scale(1.1);
          opacity: 0.8;
          box-shadow: 0 0 25px #ff7f00, 0 0 35px #ff9933, 0 0 45px #ffcc00;
        }
        50% { 
          transform: rotate(-2deg) scale(0.9);
          opacity: 0.9;
          box-shadow: 0 0 15px #ff7f00, 0 0 25px #ff9933, 0 0 35px #ffcc00;
        }
        75% { 
          transform: rotate(2deg) scale(1.05);
          opacity: 0.8;
          box-shadow: 0 0 20px #ff7f00, 0 0 30px #ff9933, 0 0 40px #ffcc00;
        }
      }
    </style>`,
    previewImage: '/images/defaults/gif-preview.png',
    tags: ['gif', 'animation', 'torch', 'fire'],
    price: 20
  }
];

// Seed database
async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await ScrapyardItem.deleteMany({});
    
    console.log('Database cleared');
    
    // Add users
    const createdUsers = {};
    
    for (const userData of users) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      const savedUser = await user.save();
      createdUsers[userData.username] = savedUser;
      
      console.log(`Created user: ${userData.username}`);
    }
    
    // Add scrapyard items
    for (const itemData of scrapyardItems) {
      // Assign random creator
      const creatorUsername = users[Math.floor(Math.random() * users.length)].username;
      
      // Create item
      const item = new ScrapyardItem({
        ...itemData,
        creator: createdUsers[creatorUsername]._id
      });
      
      await item.save();
      console.log(`Created scrapyard item: ${itemData.title}`);
    }
    
    // Add some streetpass visits between users
    const userIds = Object.values(createdUsers).map(user => user._id);
    
    for (const username in createdUsers) {
      const user = createdUsers[username];
      const visitors = userIds.filter(id => !id.equals(user._id));
      
      // Add 1-3 random visitors to each user
      const numVisitors = Math.floor(Math.random() * 3) + 1;
      const visitorEmotes = ['👋', '👍', '🔥', '🧙', '⚔️', '🛡️', '💎'];
      
      for (let i = 0; i < numVisitors; i++) {
        const visitorId = visitors[Math.floor(Math.random() * visitors.length)];
        const randomEmote = visitorEmotes[Math.floor(Math.random() * visitorEmotes.length)];
        
        user.streetpassVisitors.push({
          user: visitorId,
          timestamp: new Date(),
          emote: randomEmote
        });
      }
      
      await user.save();
      console.log(`Added streetpass visitors to ${username}`);
    }
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();