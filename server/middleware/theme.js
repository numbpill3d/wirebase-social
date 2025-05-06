// Theme middleware to ensure consistency
const themeMiddleware = (req, res, next) => {
  // Get theme from user preferences if logged in
  if (req.user && req.user.preferences && req.user.preferences.theme) {
    res.locals.pageTheme = req.user.preferences.theme;
  } 
  // Get theme from session if set
  else if (req.session.theme) {
    res.locals.pageTheme = req.session.theme;
  } 
  // Fall back to default theme from environment
  else {
    res.locals.pageTheme = process.env.DEFAULT_THEME || 'dark-dungeon';
  }
  
  next();
};

module.exports = themeMiddleware;