/**
 * WIR Transfer Component
 * A UI component for transferring WIR to other users
 */
class WIRTransfer extends HTMLElement {
  constructor() {
    super();
    this.wirBalance = parseInt(this.getAttribute('wir-balance') || '0');
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  static get observedAttributes() {
    return ['wir-balance'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'wir-balance') {
      this.wirBalance = parseInt(newValue || '0');
      this.updateBalance();
    }
  }

  connectedCallback() {
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
          background: #c0c0c0;
          border: 2px solid;
          border-color: #ffffff #808080 #808080 #ffffff;
          padding: 10px;
          margin: 10px 0;
          box-shadow: 1px 1px 0 0 #000;
        }
        
        .transfer-title {
          background: linear-gradient(90deg, #000080, #1084d0);
          color: white;
          padding: 2px 5px;
          margin: -10px -10px 10px -10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .transfer-title .icon {
          margin-right: 5px;
        }
        
        .balance {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          padding: 5px;
          background: #f0f0f0;
          border: 1px solid #808080;
        }
        
        .balance-icon {
          margin-right: 5px;
          font-size: 1.2em;
        }
        
        .transfer-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .form-row {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        label {
          font-size: 14px;
        }
        
        input[type="text"],
        input[type="number"],
        textarea {
          padding: 5px;
          border: 1px solid #808080;
          background: white;
          font-family: 'MS Sans Serif', Arial, sans-serif;
        }
        
        textarea {
          resize: vertical;
          min-height: 60px;
        }
        
        button {
          padding: 5px 10px;
          background: #c0c0c0;
          border: 2px solid;
          border-color: #ffffff #808080 #808080 #ffffff;
          cursor: pointer;
          font-family: 'MS Sans Serif', Arial, sans-serif;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          align-self: flex-start;
          margin-top: 5px;
        }
        
        button:active {
          border-color: #808080 #ffffff #ffffff #808080;
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .error-message {
          color: #ff0000;
          font-size: 12px;
          margin-top: 5px;
          display: none;
        }
        
        .success-message {
          color: #008000;
          font-size: 12px;
          margin-top: 5px;
          display: none;
        }
        
        .loading {
          display: none;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #808080;
        }
        
        .loading-spinner {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid #808080;
          border-radius: 50%;
          border-top-color: transparent;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      
      <div class="transfer">
        <div class="transfer-title">
          <span><span class="icon">📤</span> Transfer WIR</span>
        </div>
        
        <div class="balance">
          <span class="balance-icon">💰</span>
          <span>Your WIR Balance: <strong id="wir-balance">${this.wirBalance}</strong></span>
        </div>
        
        <div class="transfer-form">
          <div class="form-row">
            <label for="receiver">Recipient Username:</label>
            <input type="text" id="receiver" placeholder="Enter username">
          </div>
          
          <div class="form-row">
            <label for="amount">Amount:</label>
            <input type="number" id="amount" min="1" value="10" placeholder="Amount">
          </div>
          
          <div class="form-row">
            <label for="notes">Notes (optional):</label>
            <textarea id="notes" placeholder="Add a message to the recipient"></textarea>
          </div>
          
          <button id="transfer-button">
            <span class="button-icon">📤</span>
            <span>Transfer WIR</span>
          </button>
          
          <div class="loading" id="loading">
            <span class="loading-spinner"></span>
            <span>Processing transfer...</span>
          </div>
          
          <div class="error-message" id="error-message"></div>
          <div class="success-message" id="success-message"></div>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    const transferButton = this.shadowRoot.getElementById('transfer-button');
    transferButton.addEventListener('click', this.handleTransfer.bind(this));
  }

  removeEventListeners() {
    const transferButton = this.shadowRoot.getElementById('transfer-button');
    transferButton.removeEventListener('click', this.handleTransfer.bind(this));
  }

  updateBalance() {
    const wirBalanceElement = this.shadowRoot.getElementById('wir-balance');
    
    if (wirBalanceElement) {
      wirBalanceElement.textContent = this.wirBalance;
    }
  }

  async handleTransfer() {
    const receiverInput = this.shadowRoot.getElementById('receiver');
    const amountInput = this.shadowRoot.getElementById('amount');
    const notesInput = this.shadowRoot.getElementById('notes');
    
    const receiverUsername = receiverInput.value.trim();
    const amount = parseInt(amountInput.value);
    const notes = notesInput.value.trim();
    
    const errorMessage = this.shadowRoot.getElementById('error-message');
    const successMessage = this.shadowRoot.getElementById('success-message');
    const loading = this.shadowRoot.getElementById('loading');
    const transferButton = this.shadowRoot.getElementById('transfer-button');
    
    // Reset messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    
    // Validate input
    if (!receiverUsername) {
      errorMessage.textContent = 'Please enter a recipient username';
      errorMessage.style.display = 'block';
      return;
    }
    
    if (!amount || isNaN(amount) || amount < 1) {
      errorMessage.textContent = 'Please enter a valid amount (minimum 1)';
      errorMessage.style.display = 'block';
      return;
    }
    
    if (amount > this.wirBalance) {
      errorMessage.textContent = 'Insufficient WIR balance';
      errorMessage.style.display = 'block';
      return;
    }
    
    // Show loading and disable button
    loading.style.display = 'flex';
    transferButton.disabled = true;
    
    try {
      // Call the API to transfer WIR
      const response = await fetch('/api/market/wir/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverUsername,
          amount,
          notes
        })
      });
      
      const result = await response.json();
      
      // Hide loading
      loading.style.display = 'none';
      transferButton.disabled = false;
      
      if (result.success) {
        // Update balance
        this.wirBalance = result.newBalance;
        this.updateBalance();
        
        // Show success message
        successMessage.textContent = result.message || `Successfully transferred ${amount} WIR to ${receiverUsername}`;
        successMessage.style.display = 'block';
        
        // Clear form
        receiverInput.value = '';
        amountInput.value = '10';
        notesInput.value = '';
        
        // Dispatch event
        this.dispatchEvent(new CustomEvent('transfer-complete', {
          detail: {
            receiverUsername,
            amount,
            newBalance: result.newBalance
          }
        }));
      } else {
        // Show error message
        errorMessage.textContent = result.message || 'Transfer failed';
        errorMessage.style.display = 'block';
      }
    } catch (error) {
      console.error('Error transferring WIR:', error);
      
      // Hide loading
      loading.style.display = 'none';
      transferButton.disabled = false;
      
      // Show error message
      errorMessage.textContent = 'An error occurred during transfer';
      errorMessage.style.display = 'block';
    }
  }
}

// Register the custom element
customElements.define('wir-transfer', WIRTransfer);
