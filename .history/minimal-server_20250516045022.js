// Enhanced minimal server with support for scrapyard and forum
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

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
   content: 'Welcome to the forum! Share your ideas and connect with other digital underground dwellers.',
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

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to send HTML with basic layout
function sendHTML(res, content, title = 'Wirebase') {
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
 res.send(html);
}

// Routes
app.get('/', (req, res) => {
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
});

// Scrapyard routes
app.get('/scrapyard', (req, res) => {
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
});

app.get('/scrapyard/category/:category', (req, res) => {
 const { category } = req.params;
 const validCategories = ['widget', 'template', 'icon', 'banner', 'gif'];
 
 if (!validCategories.includes(category)) {
   return res.status(404).send('Category not found');
 }
 
 const categoryTitles = {
   widget: 'Abandoned Processes',
   template: 'Dead Shells',
   icon: 'Data Fragments',
   banner: 'Signal Echoes',
   gif: 'Visual Artifacts'
 };
 
 const items = scrapyardItems.filter(item => item.category === category);
 
 const content = `
   <div class="page-header">
     <h1>${categoryTitles[category]}</h1>
     <p>Browse ${categoryTitles[category]} in the Scrapyard</p>
   </div>
   <div class="asset-grid">
     ${items.map(item => `
       <div class="asset-card">
         <img src="${item.previewImage}" alt="${item.title}">
         <h3>${item.title}</h3>
         <p>${item.description}</p>
         <div class="asset-meta">
           <span>By ${item.creator.displayName}</span>
         </div>
         <a href="/scrapyard/item/${item.id}" class="view-button">View</a>
       </div>
     `).join('')}
   </div>
 `;
 
 sendHTML(res, content, `${categoryTitles[category]} - Wirebase`);
});

app.get('/scrapyard/item/:id', (req, res) => {
 const { id } = req.params;
 const item = scrapyardItems.find(item => item.id === id);
 
 if (!item) {
   return res.status(404).send('Item not found');
 }
 
 const content = `
   <div class="item-view">
     <div class="item-header">
       <h1>${item.title}</h1>
       <div class="item-meta">
         <span>Category: ${item.category}</span>
         <span>By: ${item.creator.displayName}</span>
         <span>Uses: ${item.usageCount}</span>
       </div>
     </div>
     <div class="item-content">
       <div class="item-preview">
         <img src="${item.previewImage}" alt="${item.title}">
       </div>
       <div class="item-details">
         <h2>Description</h2>
         <p>${item.description}</p>
         <div class="item-tags">
           ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
         </div>
         <div class="item-votes">
           <span>Upvotes: ${item.votes.upvotes}</span>
           <span>Downvotes: ${item.votes.downvotes}</span>
         </div>
         <button class="use-button">Use This Asset</button>
       </div>
     </div>
   </div>
 `;
 
 sendHTML(res, content, `${item.title} - Wirebase`);
});

// Forum routes
app.get('/forum', (req, res) => {
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
});

app.get('/forum/category/:category', (req, res) => {
 const { category } = req.params;
 const validCategories = ['general', 'tech', 'creative', 'meta'];
 
 if (!validCategories.includes(category)) {
   return res.status(404).send('Category not found');
 }
 
 const threads = forumThreads.filter(thread => thread.category === category);
 
 const content = `
   <div class="page-header">
     <h1>${category.charAt(0).toUpperCase() + category.slice(1)}</h1>
     <p>Discussions in the ${category} category</p>
   </div>
   <div class="thread-list">
     ${threads.map(thread => `
       <div class="thread-card">
         <h3><a href="/forum/thread/${thread.id}">${thread.title}</a></h3>
         <div class="thread-meta">
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
 
 sendHTML(res, content, `${category} - Assembly - Wirebase`);
});

app.get('/forum/thread/:id', (req, res) => {
 const { id } = req.params;
 const thread = forumThreads.find(thread => thread.id === id);
 
 if (!thread) {
   return res.status(404).send('Thread not found');
 }
 
 const content = `
   <div class="thread-view">
     <div class="thread-header">
       <h1>${thread.title}</h1>
       <div class="thread-meta">
         <span>Category: ${thread.category}</span>
         <span>By: ${thread.creator.displayName}</span>
       </div>
     </div>
     <div class="post">
       <div class="post-header">
         <span class="post-author">${thread.creator.displayName} ${thread.creator.customGlyph}</span>
         <span class="post-date">${thread.createdAt.toLocaleDateString()}</span>
       </div>
       <div class="post-content">
         ${thread.content}
       </div>
     </div>
     <div class="replies">
       <h2>Replies</h2>
       ${thread.replies.map(reply => `
         <div class="post">
           <div class="post-header">
             <span class="post-author">${reply.creator.displayName} ${reply.creator.customGlyph}</span>
             <span class="post-date">${reply.createdAt.toLocaleDateString()}</span>
           </div>
           <div class="post-content">
             ${reply.content}
           </div>
         </div>
       `).join('')}
     </div>
     <div class="reply-form">
       <h3>Post a Reply</h3>
       <form action="/forum/thread/${thread.id}/reply" method="post">
         <textarea name="content" placeholder="Your reply..."></textarea>
         <button type="submit">Post Reply</button>
       </form>
     </div>
   </div>
 `;
 
 sendHTML(res, content, `${thread.title} - Wirebase`);
});

// Feed route
app.get('/feed', (req, res) => {
 const content = `
   <div class="page-header">
     <h1>Feed</h1>
     <p>Latest updates from the Wirebase community</p>
   </div>
   <div class="feed-items">
     ${[...scrapyardItems, ...forumThreads].sort((a, b) => b.createdAt - a.createdAt).map(item => {
       if (item.category && ['widget', 'template', 'icon', 'banner', 'gif'].includes(item.category)) {
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
                 <p>${item.content.substring(0, 100)}${item.content.length > 100 ? '...' : ''}</p>
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
});

// Profile route
app.get('/profile', (req, res) => {
 const content = `
   <div class="page-header">
     <h1>Profile</h1>
     <p>Your digital identity in the underground</p>
   </div>
   <div class="profile-view">
     <div class="profile-header">
       <img src="/images/laincore/default-avatar.svg" alt="Profile Avatar" class="profile-avatar">
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
});

// Handle 404
app.use((req, res) => {
 const content = `
   <div class="error-page">
     <h1>404</h1>
     <p>Page not found</p>
     <a href="/" class="button">Return Home</a>
   </div>
 `;
 
 sendHTML(res, content, '404 - Wirebase');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Enhanced minimal server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the site`);
});
