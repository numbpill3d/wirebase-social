# Wirebase Code Style Guide

This document outlines the coding standards and best practices for the Wirebase project.

## JavaScript

### General Guidelines

- Use ES6+ features where appropriate
- Use `const` for variables that don't change, `let` for variables that do
- Avoid using `var`
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility
- Add JSDoc comments for functions and complex code blocks
- Use async/await for asynchronous code instead of callbacks or promise chains

### Formatting

- Use 2 spaces for indentation
- Use semicolons at the end of statements
- Use single quotes for strings
- Keep line length under 100 characters
- Add a space after keywords like `if`, `for`, `while`, etc.
- Add spaces around operators (`=`, `+`, `-`, etc.)
- No trailing whitespace
- End files with a newline

### Example

```javascript
/**
 * Fetches a user by ID
 * @param {string} userId - The user ID to fetch
 * @returns {Promise<Object>} - The user object
 */
const fetchUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
    
    return data;
  } catch (err) {
    console.error('Error in fetchUserById:', err);
    throw err;
  }
};
```

### Error Handling

- Always use try/catch blocks for async functions
- Log errors with meaningful context
- Return appropriate error responses
- Don't swallow errors without handling them

### Imports and Exports

- Group imports by type (built-in, external, internal)
- Sort imports alphabetically within groups
- Use named exports for utility functions
- Use default exports for main components or classes

## CSS

### General Guidelines

- Use CSS custom properties (variables) for colors, spacing, etc.
- Use meaningful class names
- Follow BEM (Block, Element, Modifier) naming convention
- Use responsive design principles
- Add comments for complex selectors or rules

### Formatting

- Use 2 spaces for indentation
- One selector per line
- One property per line
- Use lowercase for selectors and properties
- Use shorthand properties where appropriate
- Group related properties together

### Example

```css
/* User profile card component */
.profile-card {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-medium);
  background-color: var(--card-bg);
  border: 2px solid var(--win98-border-dark);
}

.profile-card__header {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-small);
}

.profile-card__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: var(--spacing-small);
}

/* Media query for mobile devices */
@media (max-width: var(--mobile)) {
  .profile-card {
    padding: var(--spacing-small);
  }
}
```

## HTML (Handlebars Templates)

### General Guidelines

- Use semantic HTML elements
- Include appropriate ARIA attributes for accessibility
- Keep templates focused on presentation, not logic
- Use partials for reusable components
- Add comments for complex template sections

### Formatting

- Use 2 spaces for indentation
- Use lowercase for element names and attributes
- Use double quotes for attribute values
- Close all tags properly
- Keep line length under 100 characters

### Example

```handlebars
{{!-- User profile card --}}
<article class="profile-card" role="region" aria-labelledby="profile-title">
  <header class="profile-card__header">
    <img 
      src="{{user.avatar}}" 
      alt="{{user.displayName}}'s avatar" 
      class="profile-card__avatar"
    >
    <h2 id="profile-title" class="profile-card__title">{{user.displayName}}</h2>
  </header>
  
  <div class="profile-card__content">
    {{#if user.statusMessage}}
      <p class="profile-card__status">{{user.statusMessage}}</p>
    {{/if}}
    
    <div class="profile-card__stats">
      <span class="profile-card__stat">
        <i class="icon icon-followers" aria-hidden="true"></i>
        {{user.followers.length}} followers
      </span>
      <span class="profile-card__stat">
        <i class="icon icon-posts" aria-hidden="true"></i>
        {{user.posts.length}} posts
      </span>
    </div>
  </div>
  
  <footer class="profile-card__footer">
    {{#if isCurrentUser}}
      <a href="/profile/edit" class="win98-button">Edit Profile</a>
    {{else}}
      <button class="win98-button follow-button" data-user-id="{{user.id}}">
        {{#if isFollowing}}Unfollow{{else}}Follow{{/if}}
      </button>
    {{/if}}
  </footer>
</article>
```

## Testing

### General Guidelines

- Write tests for all new features
- Aim for high test coverage
- Test both success and failure cases
- Use descriptive test names
- Keep tests independent of each other
- Mock external dependencies

### Example

```javascript
describe('User Model', () => {
  describe('findByUsername', () => {
    it('should return a user when given a valid username', async () => {
      // Arrange
      const mockUser = { id: '123', username: 'testuser' };
      jest.spyOn(supabase, 'from').mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
      }));
      
      // Act
      const result = await User.findByUsername('testuser');
      
      // Assert
      expect(result).toEqual(mockUser);
    });
    
    it('should throw an error when user is not found', async () => {
      // Arrange
      jest.spyOn(supabase, 'from').mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'User not found' } })
      }));
      
      // Act & Assert
      await expect(User.findByUsername('nonexistent')).rejects.toThrow('User not found');
    });
  });
});
```

## Git Workflow

### Commit Messages

- Use the imperative mood ("Add feature" not "Added feature")
- Start with a capital letter
- Keep the first line under 50 characters
- Add more detailed explanation in the body if needed
- Reference issue numbers when applicable

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/feature-name`: For new features
- `bugfix/bug-description`: For bug fixes
- `hotfix/issue-description`: For urgent production fixes

### Pull Requests

- Keep PRs focused on a single feature or fix
- Include a clear description of changes
- Reference related issues
- Ensure all tests pass
- Request code reviews from team members
