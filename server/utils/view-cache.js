const NodeCache = require('node-cache');
const viewCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 60 
});

const cacheableViews = ['about', 'faq', 'terms', 'privacy'];

const viewCacheMiddleware = (req, res, next) => {
  const originalRender = res.render;
  
  res.render = function(view, options, callback) {
    const isCacheable = cacheableViews.includes(view) && 
                       req.method === 'GET' && 
                       !req.user;
                       
    if (!isCacheable) {
      return originalRender.call(this, view, options, callback);
    }
    
    const cacheKey = `view:${view}:${JSON.stringify(options)}`;
    const cached = viewCache.get(cacheKey);
    
    if (cached) {
      return res.send(cached);
    }
    
    originalRender.call(this, view, options, (err, html) => {
      if (!err) {
        viewCache.set(cacheKey, html);
      }
      res.send(html);
    });
  };
  
  next();
};

module.exports = viewCacheMiddleware;
