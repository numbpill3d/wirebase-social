/**
 * WIR Converter Component
 * A UI component for converting between WIR and Loot tokens
 */
class WIRConverter extends HTMLElement {
  constructor() {
    super();
    this.wirBalance = parseInt(this.getAttribute('wir-balance') || '0');
    this.lootBalance = parseInt(this.getAttribute('loot-balance') || '0');
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  static get observedAttributes() {
    return ['wir-balance', 'loot-balance'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'wir-balance') {
      this.wirBalance = parseInt(newValue || '0');
    } else if (name === 'loot-balance') {
      this.lootBalance = parseInt(newValue || '0');
    }
    this.updateBalances();
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
        
        .converter-title {
          background: linear-gradient(90deg, #000080, #1084d0);
          color: white;
          padding: 2px 5px;
          margin: -10px -10px 10px -10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .converter-title .icon {
          margin-right: 5px;
        }
        
        .balances {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 5px;
          background: #f0f0f0;
          border: 1px solid #808080;
        }
        
        .balance {
          display: flex;
          align-items: center;
        }
        
        .balance-icon {
          margin-right: 5px;
          font-size: 1.2em;
        }
        
        .converter-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .form-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .direction-selector {
          display: flex;
          gap: 5px;
        }
        
        .radio-container {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        input[type="number"] {
          padding: 5px;
          border: 1px solid #808080;
          background: white;
          width: 100px;
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
        }
        
        button:active {
          border-color: #808080 #ffffff #ffffff #808080;
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
      
      <div class="converter">
        <div class="converter-title">
          <span><span class="icon">💱</span> Currency Converter</span>
        </div>
        
        <div class="balances">
          <div class="balance">
            <span class="balance-icon">💰</span>
            <span>WIR: <strong id="wir-balance">${this.wirBalance}</strong></span>
          </div>
          <div class="balance">
            <span class="balance-icon">🏆</span>
            <span>Loot: <strong id="loot-balance">${this.lootBalance}</strong></span>
          </div>
        </div>
        
        <div class="converter-form">
          <div class="form-row direction-selector">
            <div class="radio-container">
              <input type="radio" id="loot-to-wir" name="direction" value="lootToWir" checked>
              <label for="loot-to-wir">Loot → WIR</label>
            </div>
            <div class="radio-container">
              <input type="radio" id="wir-to-loot" name="direction" value="wirToLoot">
              <label for="wir-to-loot">WIR → Loot</label>
            </div>
          </div>
          
          <div class="form-row">
            <input type="number" id="amount" min="1" value="10" placeholder="Amount">
            <button id="convert-button">
              <span class="button-icon">💱</span>
              <span>Convert</span>
            </button>
          </div>
          
          <div class="loading" id="loading">
            <span class="loading-spinner"></span>
            <span>Processing...</span>
          </div>
          
          <div class="error-message" id="error-message"></div>
          <div class="success-message" id="success-message"></div>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    const convertButton = this.shadowRoot.getElementById('convert-button');
    convertButton.addEventListener('click', this.handleConvert.bind(this));
  }

  removeEventListeners() {
    const convertButton = this.shadowRoot.getElementById('convert-button');
    convertButton.removeEventListener('click', this.handleConvert.bind(this));
  }

  updateBalances() {
    const wirBalanceElement = this.shadowRoot.getElementById('wir-balance');
    const lootBalanceElement = this.shadowRoot.getElementById('loot-balance');

    if (wirBalanceElement) {
      wirBalanceElement.textContent = this.wirBalance;
    }

    if (lootBalanceElement) {
      lootBalanceElement.textContent = this.lootBalance;
    }
  }

  async handleConvert() {
    const amountInput = this.shadowRoot.getElementById('amount');
    const amount = parseInt(amountInput.value);
    const directionInput = this.shadowRoot.querySelector('input[name="direction"]:checked');
    const direction = directionInput.value;

    const errorMessage = this.shadowRoot.getElementById('error-message');
    const successMessage = this.shadowRoot.getElementById('success-message');
    const loading = this.shadowRoot.getElementById('loading');

    // Reset messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Validate input
    if (!amount || isNaN(amount) || amount < 1) {
      errorMessage.textContent = 'Please enter a valid amount (minimum 1)';
      errorMessage.style.display = 'block';
      return;
    }

    // Check balances
    if (direction === 'lootToWir' && amount > this.lootBalance) {
      errorMessage.textContent = 'Insufficient Loot tokens';
      errorMessage.style.display = 'block';
      return;
    }

    if (direction === 'wirToLoot' && amount > this.wirBalance) {
      errorMessage.textContent = 'Insufficient WIR balance';
      errorMessage.style.display = 'block';
      return;
    }

    // Show loading
    loading.style.display = 'flex';

    try {
      // Call the API to convert currency
      const response = await fetch('/api/market/wir/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          direction,
          amount
        })
      });

      const result = await response.json();

      // Hide loading
      loading.style.display = 'none';

      if (result.success) {
        // Update balances
        this.wirBalance = result.newWirBalance;
        this.lootBalance = result.newLootBalance;
        this.updateBalances();

        // Show success message
        successMessage.textContent =
          `Successfully converted ${amount} ${
            direction === 'lootToWir' ? 'Loot to WIR' : 'WIR to Loot'
          }`;
        successMessage.style.display = 'block';

        // Dispatch event
        this.dispatchEvent(new CustomEvent('conversion-complete', {
          detail: {
            direction,
            amount,
            newWirBalance: result.newWirBalance,
            newLootBalance: result.newLootBalance
          }
        }));
      } else {
        // Show error message
        errorMessage.textContent = result.message || 'Conversion failed';
        errorMessage.style.display = 'block';
      }
    } catch (error) {
      console.error('Error converting currency:', error);

      // Hide loading
      loading.style.display = 'none';

      // Show error message
      errorMessage.textContent = 'An error occurred during conversion';
      errorMessage.style.display = 'block';
    }
  }
}

// Register the custom element
customElements.define('wir-converter', WIRConverter);
