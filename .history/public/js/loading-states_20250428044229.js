class LoadingState {
  constructor(element) {
    this.element = element;
    this.originalContent = element.innerHTML;
    this.loadingSpinner = this.createSpinner();
  }

  createSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-label', 'Loading');
    return spinner;
  }

  start() {
    this.element.setAttribute('aria-busy', 'true');
    this.element.appendChild(this.loadingSpinner);
    this.element.classList.add('is-loading');
  }

  stop() {
    this.element.removeAttribute('aria-busy');
    this.loadingSpinner.remove();
    this.element.classList.remove('is-loading');
  }

  error(message) {
    this.stop();
    this.element.setAttribute('aria-invalid', 'true');
    this.element.setAttribute('aria-errormessage', message);
    // Add error styling
  }
}

// Usage example
const loadingStates = new Map();

document.querySelectorAll('[data-loading]').forEach(element => {
  loadingStates.set(element, new LoadingState(element));
});