/**
 * @jest-environment jsdom
 */
const { initializeNotifications, showNotification } = require('../public/js/vivid-market');

describe('Vivid Market Notifications', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('initializeNotifications creates a container', () => {
    initializeNotifications();
    const container = document.querySelector('.notification-container');
    expect(container).not.toBeNull();
  });

  test('showNotification appends a toast', () => {
    jest.useFakeTimers();
    initializeNotifications();
    showNotification('Test', 'success');

    const container = document.querySelector('.notification-container');
    expect(container.children.length).toBe(1);

    const toast = container.firstElementChild;
    expect(toast.textContent).toBe('Test');
    expect(toast.classList.contains('success')).toBe(true);

    jest.advanceTimersByTime(20);
    expect(toast.classList.contains('show')).toBe(true);

    jest.useRealTimers();
  });
});
