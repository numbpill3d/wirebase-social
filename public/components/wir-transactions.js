/**
 * WIR Transactions Component
 * A UI component for displaying WIR transaction history
 */
class WIRTransactions extends HTMLElement {
  constructor() {
    super();
    this.userId = this.getAttribute('user-id');
    this.limit = parseInt(this.getAttribute('limit') || '10');
    this.page = parseInt(this.getAttribute('page') || '1');
    this.transactions = [];
    this.totalTransactions = 0;
    this.isLoading = false;
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  static get observedAttributes() {
    return ['user-id', 'limit', 'page'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'user-id') {
      this.userId = newValue;
    } else if (name === 'limit') {
      this.limit = parseInt(newValue || '10');
    } else if (name === 'page') {
      this.page = parseInt(newValue || '1');
    }

    if (oldValue !== newValue && this.isConnected) {
      this.loadTransactions();
    }
  }

  connectedCallback() {
    this.loadTransactions();
    this.addEventListeners();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: 'MS Sans Serif', Arial, sans-serif;
        }
        
        .transactions-container {
          background: #c0c0c0;
          border: 2px solid;
          border-color: #ffffff #808080 #808080 #ffffff;
          padding: 10px;
          margin: 10px 0;
          box-shadow: 1px 1px 0 0 #000;
        }
        
        .transactions-title {
          background: linear-gradient(90deg, #000080, #1084d0);
          color: white;
          padding: 2px 5px;
          margin: -10px -10px 10px -10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .transactions-title .icon {
          margin-right: 5px;
        }
        
        .transactions-list {
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #808080;
          background: white;
          padding: 5px;
        }
        
        .transaction {
          padding: 8px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .transaction:last-child {
          border-bottom: none;
        }
        
        .transaction-icon {
          font-size: 1.2em;
          min-width: 24px;
          text-align: center;
        }
        
        .transaction-details {
          flex-grow: 1;
        }
        
        .transaction-type {
          font-weight: bold;
          font-size: 0.9em;
        }
        
        .transaction-notes {
          font-size: 0.8em;
          color: #606060;
          margin-top: 2px;
        }
        
        .transaction-date {
          font-size: 0.8em;
          color: #808080;
        }
        
        .transaction-amount {
          font-weight: bold;
        }
        
        .transaction-amount.positive {
          color: #008000;
        }
        
        .transaction-amount.negative {
          color: #ff0000;
        }
        
        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        }
        
        .pagination-info {
          font-size: 0.8em;
          color: #606060;
        }
        
        .pagination-controls {
          display: flex;
          gap: 5px;
        }
        
        button {
          padding: 3px 8px;
          background: #c0c0c0;
          border: 2px solid;
          border-color: #ffffff #808080 #808080 #ffffff;
          cursor: pointer;
          font-family: 'MS Sans Serif', Arial, sans-serif;
          font-size: 12px;
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        button:active:not(:disabled) {
          border-color: #808080 #ffffff #ffffff #808080;
        }
        
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          color: #808080;
        }
        
        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #808080;
          border-radius: 50%;
          border-top-color: transparent;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }
        
        .empty-state {
          padding: 20px;
          text-align: center;
          color: #808080;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      
      <div class="transactions-container">
        <div class="transactions-title">
          <span><span class="icon">📜</span> Transaction History</span>
        </div>
        
        <div class="transactions-list" id="transactions-list">
          <div class="loading" id="loading">
            <span class="loading-spinner"></span>
            <span>Loading transactions...</span>
          </div>
        </div>
        
        <div class="pagination">
          <div class="pagination-info" id="pagination-info">
            Showing 0-0 of 0 transactions
          </div>
          <div class="pagination-controls">
            <button id="prev-page" disabled>&lt; Previous</button>
            <button id="next-page" disabled>Next &gt;</button>
          </div>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    const prevButton = this.shadowRoot.getElementById('prev-page');
    const nextButton = this.shadowRoot.getElementById('next-page');

    prevButton.addEventListener('click', this.handlePrevPage.bind(this));
    nextButton.addEventListener('click', this.handleNextPage.bind(this));
  }

  removeEventListeners() {
    const prevButton = this.shadowRoot.getElementById('prev-page');
    const nextButton = this.shadowRoot.getElementById('next-page');

    prevButton.removeEventListener('click', this.handlePrevPage.bind(this));
    nextButton.removeEventListener('click', this.handleNextPage.bind(this));
  }

  handlePrevPage() {
    if (this.page > 1) {
      this.page--;
      this.setAttribute('page', this.page.toString());
    }
  }

  handleNextPage() {
    const totalPages = Math.ceil(this.totalTransactions / this.limit);
    if (this.page < totalPages) {
      this.page++;
      this.setAttribute('page', this.page.toString());
    }
  }

  async loadTransactions() {
    if (!this.userId) return;

    this.isLoading = true;
    this.updateLoadingState();

    try {
      const offset = (this.page - 1) * this.limit;
      const url =
          `/api/market/wir/transactions?userId=${this.userId}` +
          `&limit=${this.limit}&offset=${offset}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to load transactions: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        this.transactions = data.transactions;
        this.totalTransactions = data.total;
        this.renderTransactions();
        this.updatePagination();
      } else {
        throw new Error(data.message || 'Failed to load transactions');
      }
    } catch (error) {
      console.error('Error loading WIR transactions:', error);
      this.renderError(error.message);
    } finally {
      this.isLoading = false;
      this.updateLoadingState();
    }
  }

  updateLoadingState() {
    const loadingElement = this.shadowRoot.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = this.isLoading ? 'flex' : 'none';
    }
  }

  renderTransactions() {
    const transactionsList = this.shadowRoot.getElementById('transactions-list');

    if (this.transactions.length === 0) {
      transactionsList.innerHTML = `
        <div class="empty-state">
          No transactions found
        </div>
      `;
      return;
    }

    let html = '';

    this.transactions.forEach(transaction => {
      const isPositive = transaction.amount > 0;
      const icon = this.getTransactionIcon(transaction.transactionType, isPositive);
      const formattedDate = new Date(transaction.createdAt).toLocaleString();

      html += `
        <div class="transaction">
          <div class="transaction-icon">${icon}</div>
          <div class="transaction-details">
          <div class="transaction-type">
            ${this.formatTransactionType(transaction.transactionType)}
          </div>
            <div class="transaction-notes">${transaction.notes || ''}</div>
            <div class="transaction-date">${formattedDate}</div>
          </div>
          <div class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
            ${isPositive ? '+' : '-'}${Math.abs(transaction.amount)} WIR
          </div>
        </div>
      `;
    });

    transactionsList.innerHTML = html;
  }

  renderError(message) {
    const transactionsList = this.shadowRoot.getElementById('transactions-list');

    transactionsList.innerHTML = `
      <div class="empty-state">
        Error: ${message}
      </div>
    `;
  }

  updatePagination() {
    const paginationInfo = this.shadowRoot.getElementById('pagination-info');
    const prevButton = this.shadowRoot.getElementById('prev-page');
    const nextButton = this.shadowRoot.getElementById('next-page');

    const totalPages = Math.ceil(this.totalTransactions / this.limit);
    const start = (this.page - 1) * this.limit + 1;
    const end = Math.min(start + this.limit - 1, this.totalTransactions);

    paginationInfo.textContent =
      `Showing ${this.totalTransactions > 0 ? start : 0}-${end} of ${
        this.totalTransactions
      } transactions`;

    prevButton.disabled = this.page <= 1;
    nextButton.disabled = this.page >= totalPages;
  }

  getTransactionIcon(type, isPositive) {
    switch (type) {
    case 'purchase':
      return '🛒';
    case 'sale':
      return '💰';
    case 'transfer':
      return isPositive ? '📥' : '📤';
    case 'reward':
      return '🏆';
    case 'listing_fee':
      return '📋';
    case 'featured_fee':
      return '⭐';
    case 'loot_to_wir_conversion':
      return '🔄';
    case 'wir_to_loot_conversion':
      return '🔄';
    default:
      return '💱';
    }
  }

  formatTransactionType(type) {
    switch (type) {
    case 'purchase':
      return 'Purchase';
    case 'sale':
      return 'Sale';
    case 'transfer':
      return 'Transfer';
    case 'reward':
      return 'Reward';
    case 'listing_fee':
      return 'Listing Fee';
    case 'featured_fee':
      return 'Featured Fee';
    case 'loot_to_wir_conversion':
      return 'Loot to WIR Conversion';
    case 'wir_to_loot_conversion':
      return 'WIR to Loot Conversion';
    default:
      return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  }
}

// Register the custom element
customElements.define('wir-transactions', WIRTransactions);
