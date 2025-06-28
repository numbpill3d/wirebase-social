/**
 * @jest-environment jsdom
 */

describe('vivid-market notifications', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.resetModules();
  });

  const loadScript = () => {
    const fs = require('fs');
    const path = require('path');
    const script = fs.readFileSync(path.join(__dirname, '../public/js/vivid-market.js'), 'utf8');
    window.eval(script);
  };

  test('initializeNotifications creates container', () => {
    loadScript();
    window.initializeNotifications();
    const container = document.querySelector('.toast-container');
    expect(container).not.toBeNull();
  });

  test('showNotification adds and removes toast', () => {
    jest.useFakeTimers();
    loadScript();
    window.initializeNotifications();

    window.showNotification('Hello', 'success');
    let toast = document.querySelector('.toast-container .notification');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toBe('Hello');

    // Fast-forward time
    jest.runAllTimers();

    toast = document.querySelector('.toast-container .notification');
    expect(toast).toBeNull();
  });
});
