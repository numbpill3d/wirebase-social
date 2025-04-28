class LoadingState {
  constructor(element) {
    this.element = element;
    this.originalContent = element.innerHTML;
    this.loadingSpinner = this.createSpinner();
    this.timeoutId = null;
    this.startTime = null;
  }

  createSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner medieval-loader';
    spinner.innerHTML = `
      <div class="torch-loader"></div>
      <div class="loading-text">Summoning Content</div>
    `;
    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-label', 'Loading');
    return spinner;
  }

  start(timeout = 30000) {
    this.startTime = Date.now();
    this.element.setAttribute('aria-busy', 'true');
    this.element.appendChild(this.loadingSpinner);
    this.element.classList.add('is-loading');

    // Set timeout for long-running operations
    this.timeoutId = setTimeout(() => {
      this.error('The quest took too long to complete');
    }, timeout);
  }

  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    const minLoadTime = 500;
    const elapsed = Date.now() - this.startTime;
    
    if (elapsed < minLoadTime) {
      setTimeout(() => this.completeStop(), minLoadTime - elapsed);
    } else {
      this.completeStop();
    }
  }

  completeStop() {
    this.element.removeAttribute('aria-busy');
    this.loadingSpinner.remove();
    this.element.classList.remove('is-loading');
  }

  error(message) {
    this.stop();
    this.element.setAttribute('aria-invalid', 'true');
    this.element.setAttribute('aria-errormessage', message);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message medieval-error';
    errorElement.textContent = message;
    this.element.appendChild(errorElement);
  }
}

// Usage example
const loadingStates = new Map();

document.querySelectorAll('[data-loading]').forEach(element => {
  loadingStates.set(element, new LoadingState(element));
});
