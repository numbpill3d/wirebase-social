// Enhanced minimal server with support for scrapyard and forum
const logger = require("./server/utils/logger");
const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

const PORT = process.env.PORT || 3002; // Changed port to avoid conflicts

// In-memory data store for scrapyard items
const scrapyardItems = [
  {
    id: '1',
    title: 'Retro Terminal Widget',
    description: 'A cyberpunk-inspired terminal widget for your site',
    creator: { username: 'wiremaster', displayName: 'Wire Master', customGlyph: '⚡' },
    category: 'widget',
    content: '<div class="retro-terminal">wirebase@city:~$ _</div>',
    previewImage: '/images/laincore/usernode_glitch.png',
    votes: { upvotes: 15, downvotes: 2 },
    tags: ['retro', 'terminal', 'cyberpunk'],
    usageCount: 42,
    featured: true,
    createdAt: new Date('2025-05-01')
  },
  {
    id: '2',
    title: 'Glitch Banner',
    description: 'Animated glitch effect banner for your profile',
    creator: { username: 'pixeldust', displayName: 'Pixel Dust', customGlyph: '✨' },
    category: 'banner',
    content: '<div class="glitch-banner">WIREBASE</div>',
    previewImage: '/images/laincore/lain-noise.svg',
    votes: { upvotes: 23, downvotes: 1 },
    tags: ['glitch', 'animation', 'banner'],
    usageCount: 37,
    featured: true,
    createdAt: new Date('2025-05-10')
  },
  {
    id: '3',
    title: 'Neon Icon Pack',
    description: 'Set of 10 neon-styled icons for your digital underground presence',
    creator: { username: 'neonhacker', displayName: 'Neon Hacker', customGlyph: '🔮' },
    category: 'icon',
    previewImage: '/images/laincore/default-avatar.svg',
    votes: { upvotes: 18, downvotes: 3 },
    tags: ['neon', 'icons', 'pack'],
    usageCount: 29,
    featured: false,
    createdAt: new Date('2025-05-12')
  },
  {
    id: '4',
    title: 'Wireframe Template',
    description: 'Minimalist wireframe template with cyberpunk accents',
    creator: { username: 'gridmaster', displayName: 'Grid Master', customGlyph: '📐' },
    category: 'template',
    previewImage: '/images/laincore/lain-city.svg',
    votes: { upvotes: 12, downvotes: 2 },
    tags: ['wireframe', 'minimal', 'template'],
    usageCount: 19,
    featured: false,
    createdAt: new Date('2025-05-14')
  },
  {
    id: '5',
    title: 'Digital Rain Animation',
    description: 'Matrix-inspired digital rain animation for your site background',
    creator: { username: 'coderain', displayName: 'Code Rain', customGlyph: '☔' },
    category: 'gif',
    previewImage: '/images/laincore/lain-hallway.svg',
    votes: { upvotes: 31, downvotes: 4 },
    tags: ['matrix', 'animation', 'background'],
    usageCount: 53,
    featured: true,
    createdAt: new Date('2025-05-08')
  }
];

// In-memory data store for forum threads
const forumThreads = [
  {
    id: '1',
    title: 'Welcome to the Wirebase Assembly',
    category: 'general',
    content:
      'Welcome to the forum! Share your ideas and connect with other digital ' +
      'underground dwellers.',
    creator: { username: 'admin', displayName: 'Admin', customGlyph: '👁️' },
    createdAt: new Date('2025-05-01'),
    replies: [
      {
        id: '1-1',
        content: 'Glad to be here!',
        creator: { username: 'wiremaster', displayName: 'Wire Master', customGlyph: '⚡' },
        createdAt: new Date('2025-05-01')
      }
    ]
  },
  {
    id: '2',
    title: 'Best practices for cyberpunk web design',
    category: 'creative',
    content: 'What are your favorite techniques for achieving that perfect cyberpunk aesthetic?',
    creator: { username: 'neonhacker', displayName: 'Neon Hacker', customGlyph: '🔮' },
    createdAt: new Date('2025-05-10'),
    replies: [
      {
        id: '2-1',
        content: 'I love using scanlines and glitch effects!',
        creator: { username: 'pixeldust', displayName: 'Pixel Dust', customGlyph: '✨' },
        createdAt: new Date('2025-05-10')
      }
    ]
  }
];

// Helper function to send HTML with basic layout
function sendHTML(res, content, title = 'Wirebase') {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link rel="stylesheet" href="/css/main.css">
      <link rel="stylesheet" href="/css/scanlines.css">
      <link rel="stylesheet" href="/css/laincore.css">
    </head>
    <body class="dark-dungeon">
      <div class="scanlines"></div>
      <header>
        <nav>
          <a href="/" class="logo">WIREBASE</a>
          <div class="nav-links">
            <a href="/scrapyard">Scrapyard</a>
            <a href="/forum">Assembly</a>
            <a href="/feed">Feed</a>
            <a href="/profile">Profile</a>
          </div>
        </nav>
      </header>
      <main>
        ${content}
      </main>
      <footer>
        <p>Wirebase &copy; 2025 - Digital Underground</p>
      </footer>
    </body>
    </html>
  `;
  res.end(html);
}

// Create server
const server = http.createServer((req, res) => {
  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Log all requests
  if (process.env.DEBUG) logger.debug(`Request: ${req.method} ${pathname}`);

  // Special case for favicon
  if (req.method === 'GET' && pathname === '/favicon.ico') {
    const filePath = path.join(__dirname, 'public', 'favicon.ico');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        logger.error('Favicon not found:', err.message);
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { 'Content-Type': 'image/x-icon' });
      res.end(content);
    });
    return;
  }

  // Serve static files
  if (req.method === 'GET' && (pathname.startsWith('/css/') ||
      pathname.startsWith('/js/') ||
      pathname.startsWith('/images/'))) {
    const filePath = path.join(__dirname, 'public', pathname);
    logger.debug('Attempting to serve static file:', filePath);
    const extname = path.extname(filePath);

    const contentTypeMap = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };

    const contentType = contentTypeMap[extname] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        logger.error('Error reading static file:', err.message);
        res.writeHead(404);
        res.end('File not found');
        return;
      }
logger.debug('Successfully served static file:', pathname);

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
    return;
  }

  // Handle routes
  if (req.method === 'GET') {
    // Home route
    if (pathname === '/' || pathname === '/index.html') {
      const content = `
        <div class="hero">
          <h1>Welcome to Wirebase</h1>
          <p>Your digital underground sanctuary</p>
        </div>
        <div class="featured-section">
          <h2>Featured Assets</h2>
          <div class="asset-grid">
            ${scrapyardItems.filter(item => item.featured).map(item => `
              <div class="asset-card">
                <img src="${item.previewImage}" alt="${item.title}">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="asset-meta">
                  <span>${item.category}</span>
                  <span>By ${item.creator.displayName}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      sendHTML(res, content, 'Wirebase - Digital Underground');
    }

    // Scrapyard routes
    else if (pathname === '/scrapyard') {
      const content = `
        <div class="page-header">
          <h1>The Scrapyard</h1>
          <p>Community-led horde of website graphics and assets</p>
        </div>
        <div class="categories">
          <a href="/scrapyard/category/widget" class="category-card">Abandoned Processes</a>
          <a href="/scrapyard/category/template" class="category-card">Dead Shells</a>
          <a href="/scrapyard/category/icon" class="category-card">Data Fragments</a>
          <a href="/scrapyard/category/banner" class="category-card">Signal Echoes</a>
          <a href="/scrapyard/category/gif" class="category-card">Visual Artifacts</a>
        </div>
        <div class="asset-section">
          <h2>Recent Additions</h2>
          <div class="asset-grid">
            ${scrapyardItems.sort((a, b) => b.createdAt - a.createdAt).map(item => `
              <div class="asset-card">
                <img src="${item.previewImage}" alt="${item.title}">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="asset-meta">
                  <span>${item.category}</span>
                  <span>By ${item.creator.displayName}</span>
                </div>
                <a href="/scrapyard/item/${item.id}" class="view-button">View</a>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      sendHTML(res, content, 'The Scrapyard - Wirebase');
    }

    // Forum routes
    else if (pathname === '/forum') {
      const content = `
        <div class="page-header">
          <h1>Assembly</h1>
          <p>Join the discussion in the Wirebase community</p>
        </div>
        <div class="categories">
          <a href="/forum/category/general" class="category-card">General</a>
          <a href="/forum/category/tech" class="category-card">Tech</a>
          <a href="/forum/category/creative" class="category-card">Creative</a>
          <a href="/forum/category/meta" class="category-card">Meta</a>
        </div>
        <div class="thread-list">
          <h2>Recent Threads</h2>
          ${forumThreads.sort((a, b) => b.createdAt - a.createdAt).map(thread => `
            <div class="thread-card">
              <h3><a href="/forum/thread/${thread.id}">${thread.title}</a></h3>
              <div class="thread-meta">
                <span>Category: ${thread.category}</span>
                <span>By: ${thread.creator.displayName}</span>
                <span>Replies: ${thread.replies.length}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="new-thread">
          <a href="/forum/new" class="button">New Thread</a>
        </div>
      `;
      sendHTML(res, content, 'Assembly - Wirebase');
    }

    // Feed route
    else if (pathname === '/feed') {
      const content = `
        <div class="page-header">
          <h1>Feed</h1>
          <p>Latest updates from the Wirebase community</p>
        </div>
        <div class="feed-items">
          ${[...scrapyardItems, ...forumThreads]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(item => {
      if (
        item.category &&
          ['widget', 'template', 'icon', 'banner', 'gif'].includes(
            item.category
          )
      ) {
      // Scrapyard item
        return `
                <div class="feed-item">
                  <div class="feed-item-header">
                    <span class="feed-item-type">New Scrapyard Item</span>
                    <span class="feed-item-date">${item.createdAt.toLocaleDateString()}</span>
                  </div>
                  <div class="feed-item-content">
                    <img src="${item.previewImage}" alt="${item.title}" class="feed-item-image">
                    <div class="feed-item-details">
                      <h3><a href="/scrapyard/item/${item.id}">${item.title}</a></h3>
                      <p>${item.description}</p>
                      <div class="feed-item-meta">
                        <span>By: ${item.creator.displayName}</span>
                        <span>Category: ${item.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              `;
      } else {
      // Forum thread
        return `
                <div class="feed-item">
                  <div class="feed-item-header">
                    <span class="feed-item-type">New Forum Thread</span>
                    <span class="feed-item-date">${item.createdAt.toLocaleDateString()}</span>
                  </div>
                  <div class="feed-item-content">
                    <div class="feed-item-details">
                      <h3><a href="/forum/thread/${item.id}">${item.title}</a></h3>
                      <p>
                        ${item.content.substring(0, 100)}
                        ${item.content.length > 100 ? '...' : ''}
                      </p>
                      <div class="feed-item-meta">
                        <span>By: ${item.creator.displayName}</span>
                        <span>Category: ${item.category}</span>
                        <span>Replies: ${item.replies.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              `;
      }
    }).join('')}
        </div>
      `;
      sendHTML(res, content, 'Feed - Wirebase');
    }

    // Profile route
    else if (pathname === '/profile') {
      const content = `
        <div class="page-header">
          <h1>Profile</h1>
          <p>Your digital identity in the underground</p>
        </div>
        <div class="profile-view">
          <div class="profile-header">
            <img
              src="/images/laincore/default-avatar.svg"
              alt="Profile Avatar"
              class="profile-avatar"
            >
            <div class="profile-info">
              <h2>Demo User <span class="custom-glyph">👁️</span></h2>
              <p class="status-message">Exploring the digital underground</p>
            </div>
          </div>
          <div class="profile-content">
            <div class="profile-section">
              <h3>Your Assets</h3>
              <div class="asset-grid small">
                ${scrapyardItems.slice(0, 3).map(item => `
                  <div class="asset-card">
                    <img src="${item.previewImage}" alt="${item.title}">
                    <h4>${item.title}</h4>
                    <a href="/scrapyard/item/${item.id}" class="view-button">View</a>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="profile-section">
              <h3>Recent Activity</h3>
              <div class="activity-list">
                <div class="activity-item">
                  <span class="activity-type">Upvoted</span>
                  <span class="activity-content">Retro Terminal Widget</span>
                  <span class="activity-date">Today</span>
                </div>
                <div class="activity-item">
                  <span class="activity-type">Replied to</span>
                  <span class="activity-content">Welcome to the Wirebase Assembly</span>
                  <span class="activity-date">Yesterday</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      sendHTML(res, content, 'Profile - Wirebase');
    }

    // 404 for all other routes
    else {
      const content = `
        <div class="error-page">
          <h1>404</h1>
          <p>Page not found</p>
          <a href="/" class="button">Return Home</a>
        </div>
      `;

      res.writeHead(404, { 'Content-Type': 'text/html' });
      sendHTML(res, content, '404 - Wirebase');
    }
  }
});

// Start the server
server.listen(PORT, () => {
  logger.info(`Enhanced minimal server running on port ${PORT}`);
  logger.info(`Visit http://localhost:${PORT} to view the site`);
});
