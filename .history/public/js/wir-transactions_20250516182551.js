/**
 * WIR Transactions JavaScript
 * Handles client-side functionality for WIR currency transactions
 */

document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const transferButton = document.getElementById('transfer-wir-button');
  const convertButton = document.getElementById('convert-wir-button');
  const earnWirButton = document.getElementById('earn-wir-button');
  const convertLootButton = document.getElementById('convert-loot-button');
  const transferModal = document.getElementById('transfer-modal');
  const convertModal = document.getElementById('convert-modal');
  const earnModal = document.getElementById('earn-modal');
  const closeButtons = document.querySelectorAll('.close-modal');
  const transferForm = document.getElementById('transfer-form');
  const convertForm = document.getElementById('convert-form');
  const transactionFilter = document.getElementById('transaction-filter');
  const transactionList = document.querySelector('.transaction-list');
  const transactionItems = document.querySelectorAll('.transaction-item');

  // Notification system
  const showNotification = function(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', function() {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
  }

  // Modal functionality
  if (transferButton) {
    transferButton.addEventListener('click', function() {
      transferModal.style.display = 'block';
    });
  }

  if (convertButton) {
    convertButton.addEventListener('click', function() {
      // Set the active tab to Loot to WIR by default
      document.querySelector('.conversion-tab[data-direction="lootToWir"]').classList.add('active');
      document.querySelector('.conversion-tab[data-direction="wirToLoot"]').classList.remove('active');
      document.getElementById('loot-to-wir-form').style.display = 'block';
      document.getElementById('wir-to-loot-form').style.display = 'none';
      document.getElementById('conversion-direction').value = 'lootToWir';

      convertModal.style.display = 'block';
    });
  }

  if (earnWirButton) {
    earnWirButton.addEventListener('click', function() {
      earnModal.style.display = 'block';
    });
  }

  if (convertLootButton) {
    convertLootButton.addEventListener('click', function() {
      // Set the active tab to Loot to WIR
      document.querySelector('.conversion-tab[data-direction="lootToWir"]').classList.add('active');
      document.querySelector('.conversion-tab[data-direction="wirToLoot"]').classList.remove('active');
      document.getElementById('loot-to-wir-form').style.display = 'block';
      document.getElementById('wir-to-loot-form').style.display = 'none';
      document.getElementById('conversion-direction').value = 'lootToWir';

      convertModal.style.display = 'block';
    });
  }

  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
      });
    });
  });

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === transferModal) {
      transferModal.style.display = 'none';
    }
    if (event.target === convertModal) {
      convertModal.style.display = 'none';
    }
  });

  // Conversion tabs
  const conversionTabs = document.querySelectorAll('.conversion-tab');
  conversionTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const direction = this.getAttribute('data-direction');

      // Update active tab
      document.querySelectorAll('.conversion-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      // Show/hide appropriate form
      if (direction === 'lootToWir') {
        document.getElementById('loot-to-wir-form').style.display = 'block';
        document.getElementById('wir-to-loot-form').style.display = 'none';
        document.getElementById('conversion-direction').value = 'lootToWir';
      } else {
        document.getElementById('loot-to-wir-form').style.display = 'none';
        document.getElementById('wir-to-loot-form').style.display = 'block';
        document.getElementById('conversion-direction').value = 'wirToLoot';
      }
    });
  });

  // Real-time conversion calculations
  const lootAmount = document.getElementById('loot-amount');
  const wirAmount = document.getElementById('wir-amount');

  if (lootAmount) {
    lootAmount.addEventListener('input', function() {
      const amount = parseInt(this.value) || 0;
      const lootToWirResult = document.getElementById('loot-to-wir-result');
      const newLootBalance = document.getElementById('new-loot-balance');
      const newWirBalanceLoot = document.getElementById('new-wir-balance-loot');

      if (lootToWirResult) {
        lootToWirResult.textContent = `${amount} WIR`;
      }

      const userLootBalance = parseInt(document.getElementById('user-loot-balance').value);
      const userWirBalance = parseInt(document.getElementById('user-wir-balance').value);

      if (newLootBalance) {
        newLootBalance.textContent = `${userLootBalance - amount} Loot`;
      }
      if (newWirBalanceLoot) {
        newWirBalanceLoot.textContent = `${userWirBalance + amount} WIR`;
      }
    });
  }

  if (wirAmount) {
    wirAmount.addEventListener('input', function() {
      const amount = parseInt(this.value) || 0;
      const wirToLootResult = document.getElementById('wir-to-loot-result');
      const newWirBalance = document.getElementById('new-wir-balance');
      const newLootBalanceWir = document.getElementById('new-loot-balance-wir');

      if (wirToLootResult) {
        wirToLootResult.textContent = `${amount} Loot`;
      }

      const userLootBalance = parseInt(document.getElementById('user-loot-balance').value);
      const userWirBalance = parseInt(document.getElementById('user-wir-balance').value);

      if (newWirBalance) {
        newWirBalance.textContent = `${userWirBalance - amount} WIR`;
      }
      if (newLootBalanceWir) {
        newLootBalanceWir.textContent = `${userLootBalance + amount} Loot`;
      }
    });
  }

  // Transfer form submission
  if (transferForm) {
    transferForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const formData = {
        receiverUsername: document.getElementById('receiver-username').value,
        amount: parseInt(document.getElementById('transfer-amount').value),
        notes: document.getElementById('transfer-notes').value
      };

      fetch('/market/wir/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showNotification('Transfer successful!', 'success');
          transferModal.style.display = 'none';

          // Update balance display
          document.querySelector('.user-stat .stat-value').textContent = data.newBalance;

          // Reload page after a delay to show the new transaction
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          showNotification(data.message || 'Transfer failed', 'error');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred during transfer', 'error');
      });
    });
  }

  // Convert form submission
  if (convertForm) {
    convertForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const direction = document.getElementById('conversion-direction').value;
      const amount = direction === 'lootToWir'
        ? parseInt(document.getElementById('loot-amount').value)
        : parseInt(document.getElementById('wir-amount').value);

      const formData = {
        direction,
        amount
      };

      fetch('/market/wir/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showNotification('Conversion successful!', 'success');
          convertModal.style.display = 'none';

          // Update balance displays
          document.querySelectorAll('.user-stat .stat-value')[0].textContent = data.newWirBalance;
          document.querySelectorAll('.user-stat .stat-value')[1].textContent = data.newLootBalance;

          // Reload page after a delay to show the new transaction
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          showNotification(data.message || 'Conversion failed', 'error');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred during conversion', 'error');
      });
    });
  }

  // Transaction filtering
  if (transactionFilter) {
    transactionFilter.addEventListener('change', function() {
      const type = this.value;

      if (type === 'all') {
        transactionItems.forEach(item => {
          item.style.display = 'flex';
        });
      } else {
        transactionItems.forEach(item => {
          if (item.classList.contains(`type-${type}`)) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      }
    });
  }
});
